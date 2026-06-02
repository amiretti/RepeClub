/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, AlertTriangle, Package } from 'lucide-react';
import { STICKER_NAMES } from '../stickerData';

interface BatchAddModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (codes: string[]) => Promise<void> | void;
  inventory: Record<string, number>;
}

interface ParsedToken {
  raw: string;
  code: string;
  valid: boolean;
}

const tokenize = (input: string): string[] => {
  return input
    .split(/[\s,;\n\r\t]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
};

const parseTokens = (input: string): ParsedToken[] => {
  return tokenize(input).map((raw) => {
    const code = raw.toUpperCase();
    const valid = Object.prototype.hasOwnProperty.call(STICKER_NAMES, code);
    return { raw, code, valid };
  });
};

export const BatchAddModal: React.FC<BatchAddModalProps> = ({ open, onClose, onConfirm, inventory }) => {
  const [text, setText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setText('');
      setSubmitting(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const tokens = useMemo(() => parseTokens(text), [text]);

  const validTokens = useMemo(() => tokens.filter((t) => t.valid), [tokens]);
  const invalidTokens = useMemo(() => tokens.filter((t) => !t.valid), [tokens]);

  const summary = useMemo(() => {
    const newOnes: string[] = [];
    const repeats: string[] = [];
    const seenInBatch: Record<string, number> = {};
    for (const token of validTokens) {
      const already = inventory[token.code] || 0;
      const inBatch = seenInBatch[token.code] || 0;
      if (already + inBatch === 0) {
        newOnes.push(token.code);
      } else {
        repeats.push(token.code);
      }
      seenInBatch[token.code] = inBatch + 1;
    }
    return { newOnes, repeats };
  }, [validTokens, inventory]);

  const handleConfirm = async () => {
    if (validTokens.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(validTokens.map((t) => t.code));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-[1px] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)]">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-black">Paquete</p>
              <h3 className="text-sm font-black text-slate-900">Agregar varias figus</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            Pegá los códigos separados por espacio, coma o salto de línea. Ej: <span className="font-mono font-bold text-slate-800">ARG3 BRA7 PAN16 FWC9</span>
          </p>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ARG3 BRA7 PAN16…"
            rows={4}
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 text-slate-900 px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {tokens.length > 0 && (
            <div className="space-y-2">
              {validTokens.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-black">Listas para sumar</p>
                    <span className="text-[10px] font-bold text-emerald-700">{validTokens.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {validTokens.map((t, i) => {
                      const already = inventory[t.code] || 0;
                      return (
                        <span
                          key={`${t.code}-${i}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            already > 0
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-white text-emerald-700 border-emerald-200'
                          }`}
                          title={STICKER_NAMES[t.code]?.name}
                        >
                          <Check className="w-3 h-3" />
                          {t.code}
                          {already > 0 && <span className="text-[9px] opacity-70">repe</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {invalidTokens.length > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-rose-700 font-black">No reconocidas</p>
                    <span className="text-[10px] font-bold text-rose-700">{invalidTokens.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {invalidTokens.map((t, i) => (
                      <span
                        key={`${t.raw}-${i}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-rose-700 border border-rose-200"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {t.raw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {validTokens.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                  Vas a sumar <strong className="text-slate-900">{validTokens.length}</strong> figus:&nbsp;
                  <span className="text-emerald-700 font-bold">{summary.newOnes.length} nuevas</span>
                  {summary.repeats.length > 0 && (
                    <>
                      {' '}y <span className="text-amber-700 font-bold">{summary.repeats.length} repes</span>
                    </>
                  )}
                  .
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={validTokens.length === 0 || submitting}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm"
          >
            {submitting ? 'Sumando…' : validTokens.length === 0 ? 'Sumar' : `Sumar ${validTokens.length}`}
          </button>
        </div>
      </div>
    </div>
  );
};
