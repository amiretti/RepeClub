/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, X } from 'lucide-react';
import { getStickerNameAndTeam } from '../../stickerData';
import { TradeOffer } from '../../types';

interface TradeCardProps {
  trade: TradeOffer;
  currentUserId?: string;
  getUserDisplayName?: (userId: string, fallbackName?: string) => string;
  onUpdateTradeStatus: (tradeId: string, status: 'accepted' | 'declined' | 'cancelled') => Promise<void> | void;
}

export const TradeCard: React.FC<TradeCardProps> = ({ trade, currentUserId, getUserDisplayName, onUpdateTradeStatus }) => {
  const isSender = trade.senderId === currentUserId;
  const tradeKind = trade.tradeType ?? 'auto';
  const senderDisplayName = getUserDisplayName?.(trade.senderId, trade.senderName) || trade.senderName?.trim() || 'Colega figu';
  const receiverDisplayName = getUserDisplayName?.(trade.receiverId, trade.receiverName) || trade.receiverName?.trim() || 'Colega figu';
  const roleLabel = isSender ? 'Vos ofrecés' : `${senderDisplayName} ofrece`;
  const askLabel = isSender ? `${receiverDisplayName} te da` : 'Vos le das';

  let statusColor = 'bg-slate-100 text-slate-700 border border-slate-200';
  let statusText = 'Pendiente';
  if (trade.status === 'accepted') {
    statusColor = 'bg-blue-50 text-blue-900 border border-blue-200';
    statusText = 'Sincronizado';
  } else if (trade.status === 'declined') {
    statusColor = 'bg-red-50 text-red-700 border border-red-200';
    statusText = 'No aceptado';
  } else if (trade.status === 'cancelled') {
    statusColor = 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    statusText = 'Cancelado';
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-3 bg-slate-50 -m-5 p-5 rounded-t-3xl border-b border-slate-200">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Canje con</p>
          <p className="font-extrabold text-slate-900 text-xs mt-1">
            {isSender ? receiverDisplayName : senderDisplayName}
          </p>
          <span className={`mt-1 inline-flex text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
            tradeKind === 'manual'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-cyan-100 text-cyan-700 border border-cyan-200'
          }`}>
            {tradeKind === 'manual' ? 'Personalizado' : 'Automático'}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-xl leading-none whitespace-nowrap shadow-xs ${statusColor}`}
          title={trade.status === 'accepted' ? 'Aceptado (ya se sincronizó)' : statusText}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
          {statusText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase">{roleLabel}</span>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {trade.offeredStickers.map(code => {
              const name = getStickerNameAndTeam(code).name;
              return (
                <span key={code} title={name} className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2 py-0.5 cursor-help">
                  {code}
                </span>
              );
            })}
          </div>
        </div>

        <div className="border-l border-slate-200 pl-3">
          <span className="text-[9px] text-slate-400 font-bold uppercase">{askLabel}</span>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {trade.requestedStickers.map(code => {
              const name = getStickerNameAndTeam(code).name;
              return (
                <span key={code} title={name} className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 rounded-lg px-2 py-0.5 cursor-help">
                  {code}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {trade.status === 'pending' && (
        <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
          {!isSender ? (
            <>
              <button
                onClick={() => onUpdateTradeStatus(trade.id, 'accepted')}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-md shadow-sky-100 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4 text-white stroke-[3px]" />
                Aceptar canje
              </button>
              <button
                onClick={() => onUpdateTradeStatus(trade.id, 'declined')}
                aria-label="Rechazar canje"
                className="px-3 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onUpdateTradeStatus(trade.id, 'cancelled')}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-xs py-2.5 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancelar propuesta
            </button>
          )}
        </div>
      )}

      {trade.status === 'accepted' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-[10px] text-blue-800 font-semibold leading-normal text-center">
            🎉 <strong>¡Canje sincronizado en tu álbum!</strong> Las figus ya se actualizaron en tu inventario. Ahora solo queda juntarse y cambiarlas en persona.
          </p>
        </div>
      )}
    </div>
  );
};
