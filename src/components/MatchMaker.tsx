/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle } from 'lucide-react';
import { MatchTabs } from './matchmaker/MatchTabs';
import { MatchFilters } from './matchmaker/MatchFilters';
import { MatchCard } from './matchmaker/MatchCard';
import { TradeCard } from './matchmaker/TradeCard';
import { ManualTradeModal } from './matchmaker/ManualTradeModal';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { useTradeActions } from '../hooks/useTradeActions';
import { MatchCandidate } from './matchmaker/types';
import { getProfileDisplayName } from '../utils/userProfile';

export const MatchMaker: React.FC = () => {
  const {
    currentUser,
    inventory,
    allUsers,
    friendIds,
    trades,
    createTradeOffer,
    updateTradeStatus,
    addFriend,
    removeFriend,
    isFriend
  } = useApp();

  const [activeTab, setActiveTab] = useState<'match' | 'trades'>('match');
  const [searchFiguCode, setSearchFiguCode] = useState('');
  const [searchNickname, setSearchNickname] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showOnlyFriends, setShowOnlyFriends] = useState(false);
  const [manualTradeMatch, setManualTradeMatch] = useState<MatchCandidate | null>(null);
  const [tradeFeedback, setTradeFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const showTradeFeedback = (message: string) => {
    setTradeFeedback(message);
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setTradeFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const filteredMatchesByFigure = useMatchmaking({
    currentUser,
    allUsers,
    inventory,
    locationFilter,
    searchFiguCode,
    searchNickname,
    friendIds
  });

  const friendIdSet = useMemo(() => new Set(friendIds), [friendIds]);
  const friendMatchCount = useMemo(
    () => filteredMatchesByFigure.filter((match) => friendIdSet.has(match.profile.uid)).length,
    [filteredMatchesByFigure, friendIdSet]
  );
  const visibleMatches = useMemo(
    () => (showOnlyFriends ? filteredMatchesByFigure.filter((match) => friendIdSet.has(match.profile.uid)) : filteredMatchesByFigure),
    [filteredMatchesByFigure, showOnlyFriends, friendIdSet]
  );
  const { proposeAutoTrade } = useTradeActions({
    createTradeOffer,
    onAutoTradeSent: () => {
      showTradeFeedback('🎯 Canje automático enviado. Ahora queda esperar respuesta.');
    }
  });

  const getTradeUserDisplayName = (userId: string, fallbackName?: string) => {
    const cleanedFallback = fallbackName?.trim();
    if (cleanedFallback) return cleanedFallback;

    if (currentUser && currentUser.uid === userId) {
      return getProfileDisplayName(currentUser) || currentUser.name;
    }

    const profile = allUsers.find((user) => user.profile.uid === userId)?.profile;
    return getProfileDisplayName(profile) || profile?.name || 'Colega figu';
  };

  const handleSubmitManualTrade = async (receiverId: string, offered: string[], requested: string[]) => {
    await createTradeOffer(receiverId, offered, requested, 'manual');
    showTradeFeedback('🧠 Canje personalizado enviado. Ahora queda esperar respuesta.');
  };

  return (
    <section aria-labelledby="matchmaker-title" className="space-y-4 w-full px-4 pb-6">
      <h2 id="matchmaker-title" className="sr-only">Canjes y propuestas</h2>

      {tradeFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800"
        >
          {tradeFeedback}
        </div>
      )}
      
      {/* Tab select buttons */}
      <MatchTabs
        activeTab={activeTab}
        pendingIncomingCount={trades.filter(t => t.status === 'pending' && t.receiverId === currentUser?.uid).length}
        onChangeTab={setActiveTab}
      />

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

          <MatchFilters
            searchFiguCode={searchFiguCode}
            searchNickname={searchNickname}
            locationFilter={locationFilter}
            onSearchFiguCodeChange={setSearchFiguCode}
            onSearchNicknameChange={setSearchNickname}
            onLocationFilterChange={setLocationFilter}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-1.5 flex gap-1" role="group" aria-label="Filtro rápido de contactos">
            <button
              type="button"
              onClick={() => setShowOnlyFriends(false)}
              aria-pressed={!showOnlyFriends}
              className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black transition-colors ${
                !showOnlyFriends ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos ({filteredMatchesByFigure.length})
            </button>
            <button
              type="button"
              onClick={() => setShowOnlyFriends(true)}
              aria-pressed={showOnlyFriends}
              className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black transition-colors ${
                showOnlyFriends ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Solo amigos ({friendMatchCount})
            </button>
          </div>

          {/* Matches Directory */}
          <div className="space-y-3">
            {visibleMatches.length === 0 ? (
              <div className="py-12 bg-white border border-dashed border-slate-200 rounded-3xl text-center text-sm text-slate-400 px-4">
                {showOnlyFriends
                  ? '⭐ Todavía no tenés amigos con coincidencias en este filtro. Probá cambiar a "Todos" o marcar más amigos.'
                  : '🧩 Todavía no hay coincidencias para mostrar. Cargá más figus y volvé a probar cuando haya más coleccionistas en línea.'}
              </div>
            ) : (
              visibleMatches.map((match) => (
                <MatchCard
                  key={match.profile.uid}
                  match={match}
                  isFriend={isFriend(match.profile.uid)}
                  currentUserDisplayName={getProfileDisplayName(currentUser) || currentUser?.name}
                  onToggleFriend={() => {
                    if (isFriend(match.profile.uid)) {
                      removeFriend(match.profile.uid);
                    } else {
                      addFriend(match.profile.uid);
                    }
                  }}
                  onProposeTrade={proposeAutoTrade}
                  onOpenManualTrade={setManualTradeMatch}
                />
              ))
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
            trades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                currentUserId={currentUser?.uid}
                getUserDisplayName={getTradeUserDisplayName}
                onUpdateTradeStatus={updateTradeStatus}
              />
            ))
          )}
        </div>
      )}

      <ManualTradeModal
        open={!!manualTradeMatch}
        match={manualTradeMatch}
        onClose={() => setManualTradeMatch(null)}
        onSubmit={handleSubmitManualTrade}
      />

    </section>
  );
};
