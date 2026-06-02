/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapPin, Send, Sparkles, PencilLine, UserRoundPlus, UserRoundCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { getStickerNameAndTeam } from '../../stickerData';
import { buildStickerReportLinesForCodes } from '../../utils/stickerReport';
import { getProfileDisplayName } from '../../utils/userProfile';
import { MatchCandidate } from './types';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M13.601 2.326A7.854 7.854 0 0 0 8.01 0C3.701 0 .193 3.498.193 7.8c0 1.375.359 2.717 1.04 3.904L0 16l4.41-1.229a7.83 7.83 0 0 0 3.6.868h.003c4.308 0 7.816-3.499 7.816-7.8a7.75 7.75 0 0 0-2.228-5.513zm-5.59 11.997h-.002a6.53 6.53 0 0 1-3.33-.91l-.24-.143-2.615.728.698-2.545-.156-.262a6.47 6.47 0 0 1-.995-3.44c.001-3.57 2.92-6.475 6.512-6.475 1.74.001 3.375.674 4.604 1.897a6.42 6.42 0 0 1 1.908 4.58c-.001 3.57-2.922 6.47-6.515 6.47zm3.572-4.878c-.196-.098-1.163-.573-1.343-.638-.18-.065-.311-.098-.442.098-.13.196-.507.638-.622.769-.114.13-.229.147-.425.049-.196-.098-.827-.302-1.576-.964-.583-.517-.977-1.154-1.092-1.35-.114-.196-.012-.302.086-.4.088-.088.196-.228.294-.343a1.33 1.33 0 0 0 .196-.327c.065-.13.033-.245-.016-.343-.049-.098-.442-1.06-.605-1.452-.159-.38-.32-.329-.442-.335a7.77 7.77 0 0 0-.376-.007c-.13 0-.343.049-.523.245-.18.196-.687.67-.687 1.633 0 .964.704 1.896.802 2.027.098.13 1.388 2.112 3.361 2.962.47.203.836.324 1.123.415.472.15.902.129 1.242.078.379-.057 1.163-.475 1.327-.933.163-.458.163-.85.114-.933-.049-.082-.18-.13-.376-.229z" />
  </svg>
);

interface MatchCardProps {
  match: MatchCandidate;
  isFriend: boolean;
  onToggleFriend: () => void;
  onProposeTrade: (userId: string, offered: string[], requested: string[]) => Promise<void> | void;
  onOpenManualTrade: (match: MatchCandidate) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, isFriend, onToggleFriend, onProposeTrade, onOpenManualTrade }) => {
  const handleShareOfferedByWhatsApp = () => {
    const firstName = (match.profile.name || '').trim().split(/\s+/)[0] || '';
    const greeting = firstName ? `Hola ${firstName}!` : 'Hola!';
    const inviteLine = '¿Todavía no usás RepeClub? Sumate gratis y completá el álbum más fácil 😎⚽ https://repeclub.digital/app';

    let messageBody: string;
    if (match.offered.length === 0) {
      messageBody = `${greeting} No tengo repes que a vos te falten por ahora, pero seguimos atentos.\n\n${inviteLine}`;
    } else {
      const lines = buildStickerReportLinesForCodes(match.offered);
      messageBody = `${greeting} Estas figus son las repes que tengo yo y que a vos te faltan:\n\n${lines.join('\n')}\n\n${inviteLine}`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageBody)}`;
    window.location.assign(whatsappUrl);
  };

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

      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          {match.profile.photoURL ? (
            <img
              src={match.profile.photoURL}
              alt={getProfileDisplayName(match.profile)}
              className="w-10 h-10 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-slate-100 text-slate-700 font-extrabold rounded-2xl flex items-center justify-center text-sm border border-slate-250 flex-shrink-0">
              {getProfileDisplayName(match.profile).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-extrabold text-slate-900 text-xs truncate">{getProfileDisplayName(match.profile)}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 font-semibold truncate">
              <MapPin className="w-3 h-3 text-sky-600 flex-shrink-0" />
              <span>{match.profile.location || 'Argentina'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onToggleFriend}
          aria-pressed={isFriend}
          aria-label={isFriend ? `Quitar a ${getProfileDisplayName(match.profile)} de amigos` : `Marcar a ${getProfileDisplayName(match.profile)} como amigo`}
          className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black transition-all border ${
            isFriend
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
          }`}
        >
          {isFriend ? <UserRoundCheck className="w-3 h-3" /> : <UserRoundPlus className="w-3 h-3" />}
          <span className="hidden sm:inline">{isFriend ? 'Amigo' : 'Agregar'}</span>
        </button>
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

        <button
          onClick={handleShareOfferedByWhatsApp}
          disabled={match.offered.length === 0}
          title={
            match.offered.length === 0
              ? 'No tenés repes que a esta persona le falten'
              : 'Compartir por WhatsApp las repes que le podés dar'
          }
          aria-label="Compartir por WhatsApp las repes que le podés dar"
          className="w-full sm:col-span-2 py-2.5 rounded-[1.25rem] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 bg-emerald-500 text-white hover:bg-emerald-400 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          <WhatsAppIcon className="w-3.5 h-3.5" />
          Mandar mis repes por WhatsApp
        </button>
      </div>
    </motion.div>
  );
};
