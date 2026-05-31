/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
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
    searchFiguCode
  });
  const { proposeAutoTrade } = useTradeActions({
    createTradeOffer,
    onAutoTradeSent: () => {
      showTradeFeedback('🎯 Canje automático enviado. Ahora queda esperar respuesta.');
    }
  });

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
            locationFilter={locationFilter}
            onSearchFiguCodeChange={setSearchFiguCode}
            onLocationFilterChange={setLocationFilter}
          />

          {/* Matches Directory */}
          <div className="space-y-3">
            {filteredMatchesByFigure.length === 0 ? (
              <div className="py-12 bg-white border border-dashed border-slate-200 rounded-3xl text-center text-sm text-slate-400 px-4">
                🧩 Todavía no hay coincidencias para mostrar. Cargá más figus y volvé a probar cuando haya más coleccionistas en línea.
              </div>
            ) : (
              filteredMatchesByFigure.map((match) => (
                <MatchCard
                  key={match.profile.uid}
                  match={match}
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
