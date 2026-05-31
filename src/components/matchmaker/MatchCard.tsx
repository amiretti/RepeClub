/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapPin, Send, Sparkles, PencilLine } from 'lucide-react';
import { motion } from 'motion/react';
import { getStickerNameAndTeam } from '../../stickerData';
import { MatchCandidate } from './types';

interface MatchCardProps {
  match: MatchCandidate;
  onProposeTrade: (userId: string, offered: string[], requested: string[]) => Promise<void> | void;
  onOpenManualTrade: (match: MatchCandidate) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onProposeTrade, onOpenManualTrade }) => {
  return (
    <motion.div
      layout
      className={`bg-white rounded-3xl p-5 border transition-all shadow-sm relative overflow-hidden ${
        match.isDoubleMatch ? 'border-amber-300 ring-2 ring-amber-100/50' : 'border-slate-200'
      }`}
    >
      {match.isDoubleMatch && (
        <span className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-yellow-500 text-white font-black text-[9px] px-3.5 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
          <Sparkles className="w-3 h-3 animate-spin" />
          Súper Canje
        </span>
      )}

      <div className="flex items-center gap-3">
        {match.profile.photoURL ? (
          <img
            src={match.profile.photoURL}
            alt={match.profile.name}
            className="w-10 h-10 rounded-2xl object-cover border border-slate-100"
          />
        ) : (
          <div className="w-10 h-10 bg-slate-100 text-slate-700 font-extrabold rounded-2xl flex items-center justify-center text-sm border border-slate-250">
            {match.profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-extrabold text-slate-900 text-xs">{match.profile.name}</p>
          <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 font-semibold">
            <MapPin className="w-3 h-3 text-sky-600 flex-shrink-0" />
            <span>{match.profile.location || 'Argentina'}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 border-t border-slate-150 pt-3">
        <div>
          <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1 tracking-wider">Te puede dar ({match.requested.length})</span>
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
            {match.requested.slice(0, 10).map(code => {
              const name = getStickerNameAndTeam(code).name;
              return (
                <span key={code} title={name} className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-100 rounded-lg px-2 py-0.5 cursor-help">
                  {code}
                </span>
              );
            })}
            {match.requested.length > 10 && (
              <span className="text-[9px] text-slate-400 font-bold self-center">
                +{match.requested.length - 10} más
              </span>
            )}
            {match.requested.length === 0 && (
              <span className="text-[10px] font-medium text-slate-400 italic">Nada por ahora</span>
            )}
          </div>
        </div>

        <div className="border-l border-slate-150 pl-3">
          <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1 tracking-wider">Le podés dar ({match.offered.length})</span>
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
            {match.offered.slice(0, 10).map(code => {
              const name = getStickerNameAndTeam(code).name;
              return (
                <span key={code} title={name} className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2 py-0.5 cursor-help">
                  {code}
                </span>
              );
            })}
            {match.offered.length > 10 && (
              <span className="text-[9px] text-slate-400 font-bold self-center">
                +{match.offered.length - 10} más
              </span>
            )}
            {match.offered.length === 0 && (
              <span className="text-[10px] font-medium text-slate-400 italic">Nada por ahora</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          onClick={() => onProposeTrade(match.profile.uid, match.offered, match.requested)}
          className={`w-full py-2.5 rounded-[1.25rem] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 ${
            match.isDoubleMatch
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:brightness-105'
              : 'bg-sky-600 hover:bg-sky-700 text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Enviar automático
        </button>

        <button
          onClick={() => onOpenManualTrade(match)}
          className="w-full py-2.5 rounded-[1.25rem] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
        >
          <PencilLine className="w-3.5 h-3.5" />
          Armar canje
        </button>
      </div>
    </motion.div>
  );
};
