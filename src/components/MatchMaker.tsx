/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, MapPin, Handshake, Send, Check, X, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TOTAL_STICKER_COUNT } from '../catalog';
import { getStickerNameAndTeam, STICKER_NAMES } from '../stickerData';

export const MatchMaker: React.FC = () => {
  const {
    currentUser,
    inventory,
    allUsers,
    trades,
    createTradeOffer,
    updateTradeStatus
  } = useApp();

  const [activeTab, setActiveTab] = useState<'match' | 'trades'>('match');
  const [searchFiguCode, setSearchFiguCode] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // 1. Calculate possible matches with each collector in the directory
  const matches = useMemo(() => {
    if (!currentUser) return [];

    const list: {
      profile: any;
      offered: string[]; // what current user can GIVE to other user
      requested: string[]; // what current user can ASK from other user
      isDoubleMatch: boolean;
    }[] = [];

    allUsers.forEach(({ profile, stickers }) => {
      if (profile.uid === currentUser.uid) return;

      // Filter by location if applied
      if (locationFilter.trim() !== '') {
        const userLocLower = (profile.location || '').toLowerCase();
        if (!userLocLower.includes(locationFilter.toLowerCase().trim())) {
          return;
        }
      }

      const offered: string[] = []; // duplicates of currentUser that other user lacks
      const requested: string[] = []; // duplicates of other user that currentUser lacks

      // Find what other user has duplicated and currentUser lacks
      Object.keys(stickers).forEach(code => {
        const otherCount = stickers[code] || 0;
        const myCount = inventory[code] || 0;
        
        if (otherCount >= 2 && myCount === 0) {
          requested.push(code);
        }
      });

      // Find what currentUser has duplicated and other user lacks
      Object.keys(inventory).forEach(code => {
        const myCount = inventory[code] || 0;
        const otherCount = stickers[code] || 0;

        if (myCount >= 2 && otherCount === 0) {
          offered.push(code);
        }
      });

      if (offered.length > 0 || requested.length > 0) {
        list.push({
          profile,
          offered,
          requested,
          isDoubleMatch: offered.length > 0 && requested.length > 0
        });
      }
    });

    // Sort: double matches first, then largest pool
    return list.sort((a, b) => {
      if (a.isDoubleMatch !== b.isDoubleMatch) {
         return a.isDoubleMatch ? -1 : 1;
      }
      return (b.offered.length + b.requested.length) - (a.offered.length + a.requested.length);
    });
  }, [currentUser, allUsers, inventory, locationFilter]);

  // 2. Filter matches when user specifically searches for a figure code, player name or team
  const filteredMatchesByFigure = useMemo(() => {
    if (searchFiguCode.trim() === '') return matches;
    const searchLower = searchFiguCode.toLowerCase().trim();
    
    // Look up matching codes in our dictionary
    const matchedCodes: string[] = [];
    const upperInput = searchFiguCode.toUpperCase().trim();
    matchedCodes.push(upperInput);

    Object.keys(STICKER_NAMES).forEach(code => {
      const details = STICKER_NAMES[code];
      const nameMatch = details.name.toLowerCase().includes(searchLower);
      const teamMatch = details.team.toLowerCase().includes(searchLower);
      const codeMatch = code.toLowerCase().includes(searchLower);

      if (nameMatch || teamMatch || codeMatch) {
        if (!matchedCodes.includes(code)) {
          matchedCodes.push(code);
        }
      }
    });

    return matches.filter(m => {
      // Keep only match entries where other user has any of these search items
      return matchedCodes.some(code => m.requested.includes(code) || m.offered.includes(code));
    });
  }, [matches, searchFiguCode]);

  // 3. Send automatic swap request
  const handleProposeTrade = async (userId: string, offered: string[], requested: string[]) => {
    // Select automatically up to 5 recommended stickers to offer and ask for clean kids interface
    const offeredSubset = offered.slice(0, 5);
    const requestedSubset = requested.slice(0, 5);
    await createTradeOffer(userId, offeredSubset, requestedSubset);
    alert('🎯 ¡Listo! Mandamos la propuesta de canje. Ahora queda esperar que te la acepten.');
  };

  return (
    <section aria-labelledby="matchmaker-title" className="space-y-4 max-w-md mx-auto px-4 pb-20">
      <h2 id="matchmaker-title" className="sr-only">Canjes y propuestas</h2>
      
      {/* Tab select buttons */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('match')}
          aria-pressed={activeTab === 'match'}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'match'
              ? 'bg-white shadow-xs text-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Handshake className="w-4 h-4 text-sky-500" />
          Buscar canjes
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          aria-pressed={activeTab === 'trades'}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'trades'
              ? 'bg-white shadow-xs text-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-blue-500" />
          Propuestas
          {trades.filter(t => t.status === 'pending' && t.receiverId === currentUser?.uid).length > 0 && (
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping absolute top-2.5 right-6" />
          )}
        </button>
      </div>

      {activeTab === 'match' ? (
        // MATCH FINDER VIEW
        <div className="space-y-4">
          
          {/* Quick instructions banner */}
          <div className="bg-sky-50 border border-sky-100 p-4 rounded-[1.5rem] flex items-start gap-2.5 text-xs text-sky-950 leading-normal">
            <AlertCircle className="w-4.5 h-4.5 text-sky-600 flex-shrink-0 mt-0.5" />
            <p className="font-semibold text-sky-900">
              Cruzamos tus <strong>faltantes</strong> y <strong>repetidas</strong> con gente de tu zona. Donde veas <span className="bg-sky-100 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-sky-800">Súper Canje</span>, metele canje directo.
            </p>
          </div>

          {/* Search boxes */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="search_figu_input" className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">Buscar Figu</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  id="search_figu_input"
                  type="text"
                  placeholder="Ej: ARG10"
                  value={searchFiguCode}
                  onChange={(e) => setSearchFiguCode(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-2 py-2.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="search_loc_input" className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">Zona</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  id="search_loc_input"
                  type="text"
                  placeholder="Ej: Palermo"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-2 py-2.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Matches Directory */}
          <div className="space-y-3">
            {filteredMatchesByFigure.length === 0 ? (
              <div className="py-12 bg-white border border-dashed border-slate-200 rounded-3xl text-center text-sm text-slate-400 px-4">
                🧩 Todavía no saltaron coincidencias. Seguí cargando tu álbum y van a aparecer.
              </div>
            ) : (
              filteredMatchesByFigure.map((match) => {
                const totalInvolved = match.offered.length + match.requested.length;

                return (
                  <motion.div
                    key={match.profile.uid}
                    layout
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-sm relative overflow-hidden ${
                      match.isDoubleMatch ? 'border-amber-300 ring-2 ring-amber-100/50' : 'border-slate-200'
                    }`}
                  >
                    {/* Double coincidences tag badge */}
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

                    {/* Stickers Match Specs List */}
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

                    {/* Submit Trade action trigger */}
                    <div className="mt-4">
                      <button
                        onClick={() => handleProposeTrade(match.profile.uid, match.offered, match.requested)}
                        className={`w-full py-2.5 rounded-[1.25rem] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                          match.isDoubleMatch
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:brightness-105'
                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Mandar canje automático
                      </button>
                    </div>

                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        // ACTIVE PROPOSALS LOG VIEW
        <div className="space-y-3">
          {trades.length === 0 ? (
            <div className="py-12 bg-white border border-dashed border-slate-200 rounded-3xl text-center text-sm text-slate-400">
              📊 Todavía no mandaste ni recibiste propuestas de canje.
            </div>
          ) : (
            trades.map((trade) => {
              const isSender = trade.senderId === currentUser?.uid;
              const roleLabel = isSender ? 'Vos ofrecés' : `${trade.senderName} ofrece`;
              const askLabel = isSender ? `${trade.receiverName} te da` : 'Vos le das';
              
              // status styles
              let statusColor = 'bg-slate-100 text-slate-600 border border-slate-200';
              let statusText = 'Pendiente';
              if (trade.status === 'accepted') {
                statusColor = 'bg-blue-50 text-blue-850 border border-blue-200';
                statusText = 'Aceptado (¡ya se sincronizó!)';
              } else if (trade.status === 'declined') {
                statusColor = 'bg-red-50 text-red-700 border border-red-150';
                statusText = 'No aceptado';
              } else if (trade.status === 'cancelled') {
                statusColor = 'bg-yellow-50 text-yellow-700 border border-yellow-150';
                statusText = 'Se canceló';
              }

              return (
                <div
                  key={trade.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3 bg-slate-50 -m-5 p-5 rounded-t-3xl border-b border-slate-150">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Canje con</p>
                      <p className="font-extrabold text-slate-850 text-xs mt-1">
                        {isSender ? trade.receiverName : trade.senderName}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Offered and Requested list blocks */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{roleLabel}</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {trade.offeredStickers.map(code => {
                          const name = getStickerNameAndTeam(code).name;
                          return (
                            <span key={code} title={name} className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-150 rounded-lg px-2 py-0.5 cursor-help">
                              {code}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-l border-slate-150 pl-3">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{askLabel}</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {trade.requestedStickers.map(code => {
                          const name = getStickerNameAndTeam(code).name;
                          return (
                            <span key={code} title={name} className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-150 rounded-lg px-2 py-0.5 cursor-help">
                              {code}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions depending on pending statuses */}
                  {trade.status === 'pending' && (
                    <div className="mt-4 pt-3 border-t border-slate-150 flex gap-2">
                      {!isSender ? (
                        <>
                          <button
                            onClick={() => updateTradeStatus(trade.id, 'accepted')}
                            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-md shadow-sky-100 flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Check className="w-4 h-4 text-white stroke-[3px]" />
                            Aceptar canje
                          </button>
                          <button
                            onClick={() => updateTradeStatus(trade.id, 'declined')}
                            aria-label="Rechazar canje"
                            className="px-3 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => updateTradeStatus(trade.id, 'cancelled')}
                          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-xs py-2.5 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancelar propuesta
                        </button>
                      )}
                    </div>
                  )}

                  {/* Swap success coordination note for children */}
                  {trade.status === 'accepted' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                      <p className="text-[10px] text-blue-800 font-semibold leading-normal text-center">
                        🎉 <strong>¡Canje sincronizado en tu álbum!</strong> Las figus ya se actualizaron en tu inventario. Ahora solo queda juntarse y cambiarlas en persona.
                      </p>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}

    </section>
  );
};
