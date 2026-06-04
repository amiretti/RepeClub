/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { X, Send, Search } from 'lucide-react';
import { MatchCandidate } from './types';
import { getStickerNameAndTeam } from '../../stickerData';

interface ManualTradeModalProps {
  match: MatchCandidate | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (receiverId: string, offered: string[], requested: string[]) => Promise<void> | void;
}

export const ManualTradeModal: React.FC<ManualTradeModalProps> = ({
  match,
  open,
  onClose,
  onSubmit
}) => {
  const [selectedOffered, setSelectedOffered] = useState<string[]>([]);
  const [selectedRequested, setSelectedRequested] = useState<string[]>([]);
  const [offeredQuery, setOfferedQuery] = useState('');
  const [requestedQuery, setRequestedQuery] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const orderedOffered = useMemo(() => [...(match?.offered || [])].sort(), [match?.offered]);
  const orderedRequested = useMemo(() => [...(match?.requested || [])].sort(), [match?.requested]);

  useEffect(() => {
    if (!open) return;
    setOfferedQuery('');
    setRequestedQuery('');
  }, [open, match?.profile.uid]);

  const filteredOffered = useMemo(() => {
    const normalizedQuery = offeredQuery.trim().toLowerCase();
    if (!normalizedQuery) return orderedOffered;
    return orderedOffered.filter((code) => {
      const label = getStickerNameAndTeam(code).name.toLowerCase();
      return code.toLowerCase().includes(normalizedQuery) || label.includes(normalizedQuery);
    });
  }, [orderedOffered, offeredQuery]);

  const filteredRequested = useMemo(() => {
    const normalizedQuery = requestedQuery.trim().toLowerCase();
    if (!normalizedQuery) return orderedRequested;
    return orderedRequested.filter((code) => {
      const label = getStickerNameAndTeam(code).name.toLowerCase();
      return code.toLowerCase().includes(normalizedQuery) || label.includes(normalizedQuery);
    });
  }, [orderedRequested, requestedQuery]);

  if (!open || !match) {
    return null;
  }

  const toggleSelection = (
    code: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(code)) {
      setList((prev) => prev.filter((item) => item !== code));
      return;
    }
    setList((prev) => [...prev, code]);
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (selectedOffered.length === 0 || selectedRequested.length === 0) {
      setSubmitError('Elegí al menos una figu para dar y una para pedir.');
      return;
    }

    await onSubmit(match.profile.uid, selectedOffered, selectedRequested);
    setSelectedOffered([]);
    setSelectedRequested([]);
    onClose();
  };

  const handleClose = () => {
    setSubmitError(null);
    setSelectedOffered([]);
    setSelectedRequested([]);
    setOfferedQuery('');
    setRequestedQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[1px] p-4 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Canje personalizado</p>
            <p className="text-sm font-extrabold text-slate-900 mt-1">Con {match.profile.name}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Armá exactamente qué le ofrecés y qué le pedís.</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            aria-label="Cerrar canje personalizado"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Le ofrecés ({selectedOffered.length})</p>
            <p className="text-[10px] text-blue-700/80 mt-0.5">Tus repetidas que a la otra persona le faltan.</p>
            <label className="mt-2 flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2 py-1.5">
              <Search className="w-3 h-3 text-blue-500" />
              <input
                value={offeredQuery}
                onChange={(event) => setOfferedQuery(event.target.value)}
                placeholder="Buscar código o nombre"
                className="w-full bg-transparent text-[11px] text-blue-900 placeholder:text-blue-300 outline-none"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
              {orderedOffered.length === 0 && (
                <span className="text-[11px] text-slate-400 italic">No hay figus para ofrecer en este match.</span>
              )}
              {orderedOffered.length > 0 && filteredOffered.length === 0 && (
                <span className="text-[11px] text-slate-400 italic">No hay coincidencias para tu búsqueda.</span>
              )}
              {filteredOffered.map((code) => {
                const isSelected = selectedOffered.includes(code);
                const label = getStickerNameAndTeam(code).name;
                return (
                  <button
                    key={code}
                    onClick={() => toggleSelection(code, selectedOffered, setSelectedOffered)}
                    title={label}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-sky-700">Le pedís ({selectedRequested.length})</p>
            <p className="text-[10px] text-sky-700/80 mt-0.5">Sus repetidas que a vos te faltan.</p>
            <label className="mt-2 flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-2 py-1.5">
              <Search className="w-3 h-3 text-sky-500" />
              <input
                value={requestedQuery}
                onChange={(event) => setRequestedQuery(event.target.value)}
                placeholder="Buscar código o nombre"
                className="w-full bg-transparent text-[11px] text-sky-900 placeholder:text-sky-300 outline-none"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
              {orderedRequested.length === 0 && (
                <span className="text-[11px] text-slate-400 italic">No tiene figus que te falten en este match.</span>
              )}
              {orderedRequested.length > 0 && filteredRequested.length === 0 && (
                <span className="text-[11px] text-slate-400 italic">No hay coincidencias para tu búsqueda.</span>
              )}
              {filteredRequested.map((code) => {
                const isSelected = selectedRequested.includes(code);
                const label = getStickerNameAndTeam(code).name;
                return (
                  <button
                    key={code}
                    onClick={() => toggleSelection(code, selectedRequested, setSelectedRequested)}
                    title={label}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          {submitError && (
            <p className="text-[11px] text-red-600 font-semibold mb-2">{submitError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Volver
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-black hover:bg-sky-700 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar propuesta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
