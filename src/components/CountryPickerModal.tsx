/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { FlagIcon } from './FlagIcon';
import { TeamGroup } from '../types';

interface CountryPickerModalProps {
  open: boolean;
  onClose: () => void;
  groups: TeamGroup[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

const normalize = (s: string): string =>
  s
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  open,
  onClose,
  groups,
  selectedCode,
  onSelect
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
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

  const { specials, teams } = useMemo(() => {
    const q = normalize(query);
    const matches = (g: TeamGroup) =>
      q === '' ||
      normalize(g.name).includes(q) ||
      normalize(g.code).includes(q);

    const specialsList: TeamGroup[] = [];
    const teamsList: TeamGroup[] = [];

    for (const g of groups) {
      if (!matches(g)) continue;
      if (g.code === '00' || g.code.includes('-') || g.code === 'CC') {
        specialsList.push(g);
      } else {
        teamsList.push(g);
      }
    }

    teamsList.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return { specials: specialsList, teams: teamsList };
  }, [groups, query]);

  const totalResults = specials.length + teams.length;

  if (!open) return null;

  const handlePick = (code: string) => {
    onSelect(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-sky-600 font-black">Buscar</p>
              <h3 className="text-sm font-black text-slate-900">Elegí un país o sección</h3>
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

        <div className="p-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribí: arg, brasil, japón…"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {totalResults === 0
              ? 'No encontramos países con ese nombre.'
              : `${totalResults} ${totalResults === 1 ? 'resultado' : 'resultados'}`}
          </p>
        </div>

        <div className="px-4 pb-4 overflow-y-auto">
          {specials.length > 0 && (
            <section className="mb-3">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 px-1">
                Especiales
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {specials.map((g) => {
                  const isSelected = g.code === selectedCode;
                  return (
                    <button
                      key={g.code}
                      type="button"
                      onClick={() => handlePick(g.code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-100'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FlagIcon emoji={g.flag} label={g.name} />
                      <span className="flex-1 truncate">{g.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {teams.length > 0 && (
            <section>
              <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 px-1">
                Países (A-Z)
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {teams.map((g) => {
                  const isSelected = g.code === selectedCode;
                  return (
                    <button
                      key={g.code}
                      type="button"
                      onClick={() => handlePick(g.code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-100'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FlagIcon emoji={g.flag} label={g.name} />
                      <span className="flex-1 truncate">{g.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {totalResults === 0 && (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
              🔍 Probá con otro nombre. También funciona con el código (ARG, BRA, JPN…).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
