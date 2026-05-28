/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { AlbumGrid } from './components/AlbumGrid';
import { MatchMaker } from './components/MatchMaker';
import { Trophy, HelpCircle, Flame, Star, Compass, Loader2 } from 'lucide-react';

function AppContent() {
  const { currentUser, signIn, loading, authInProgress } = useApp();
  const [activeTab, setActiveTab] = useState<'album' | 'canjes'>('album');
  const [liveAnnouncement, setLiveAnnouncement] = useState('Estás en colección');
  const [appAlert, setAppAlert] = useState<string | null>(null);

  useEffect(() => {
    const onAppError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message || 'Uy, pasó algo inesperado.';
      setAppAlert(message);
    };

    window.addEventListener('app-error', onAppError as EventListener);
    return () => {
      window.removeEventListener('app-error', onAppError as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!appAlert) return;
    const timerId = window.setTimeout(() => setAppAlert(null), 6000);
    return () => window.clearTimeout(timerId);
  }, [appAlert]);

  useEffect(() => {
    setLiveAnnouncement(activeTab === 'album' ? 'Estás en colección' : 'Estás en canjes');
  }, [activeTab]);

  if (loading) {
    return (
      <div id="app_loading_screen" role="status" aria-live="polite" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-sky-600 animate-spin" />
        <p className="mt-4 text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">
          Abriendo sobre de figus...
        </p>
      </div>
    );
  }

  // ONBOARDING / LANDING PAGE: If no user is authenticated
  if (!currentUser) {
    return (
      <main id="landing_screen" className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-6 max-w-md mx-auto relative overflow-hidden">
        
        {/* Ambient sparkles background decor */}
        <div className="absolute top-10 left-10 text-4xl opacity-10 animate-pulse select-none">✨</div>
        <div className="absolute bottom-40 right-10 text-5xl opacity-10 animate-bounce select-none">⚽</div>

        {/* Brand Header */}
        <div id="landing_brand" className="text-center mt-6">
          <img
            src="/logo-repeclub.svg"
            alt="Logo de RepeClub"
            className="w-32 h-32 mx-auto rounded-3xl shadow-xl shadow-slate-200"
          />
          <p className="text-[10px] font-bold text-sky-600 mt-4 uppercase tracking-widest bg-sky-50 px-2.5 py-0.5 rounded-full inline-block">
            Control y canje al toque
          </p>
          <p className="text-sm text-slate-500 max-w-xs mx-auto mt-3 font-medium leading-relaxed">
            Juntá tus figus, marcá tus repes y encontrá gente de tu zona para canjear. Fácil, rápido y sin vueltas.
          </p>
        </div>

        {/* Sticker mock packet layout design */}
        <div id="onboarding_packet_card" className="my-8 p-6 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 rounded-[2rem] shadow-2xl relative border-4 border-white overflow-hidden transform hover:-rotate-1 transition-transform">
          <div className="absolute top-0 right-0 bg-sky-600 text-white font-black text-[10px] px-3.5 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-sm">
            PREMIUM
          </div>
          <p className="text-xs font-extrabold text-blue-200 uppercase tracking-widest mt-2 leading-none">RepeClub 2026</p>
          <h2 className="text-xl font-black text-white tracking-tight mt-2">
            ¡Llená tu álbum!
          </h2>
          <div className="flex gap-2.5 mt-4">
            <div className="bg-white/10 flex-1 p-2.5 rounded-2xl text-center border border-white/15">
              <span className="text-lg block">🇲🇽</span>
              <span className="text-[10px] font-mono font-extrabold text-blue-200">MEX10</span>
            </div>
            <div className="bg-white/10 flex-1 p-2.5 rounded-2xl text-center border border-white/15">
              <span className="text-lg block">🇦🇷</span>
              <span className="text-[10px] font-mono font-extrabold text-blue-200">ARG10</span>
            </div>
            <div className="bg-sky-600 flex-1 p-2.5 rounded-2xl text-center border border-sky-500">
              <span className="text-lg block">🇧🇷</span>
              <span className="text-[10px] font-mono font-extrabold text-white">BRA10</span>
            </div>
          </div>
          <p className="text-[9px] text-blue-200/80 font-semibold mt-4 text-center">
            🚀 Con tecnología de auto-coincidencia inteligente de canjes
          </p>
        </div>

        {/* Login Action Buttons Column */}
        <div id="landing_actions_container" className="space-y-3">
          <button
            id="google_signin_btn"
            onClick={signIn}
            disabled={authInProgress}
            aria-label="Iniciar sesión con Google"
            className="w-full py-4.5 px-4 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl shadow-xl shadow-sky-300/60 ring-2 ring-sky-200/70 transition-all flex items-center justify-center gap-3 text-sm"
          >
            {authInProgress ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span>Iniciando sesión con Google...</span>
              </>
            ) : (
              <>
                <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.3 14.7 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.8S6.8 21.2 12 21.2c6.9 0 9.1-4.8 9.1-7.2 0-.5 0-.9-.1-1.3H12z"/>
                    <path fill="#4285F4" d="M21.1 12.7c0-.5 0-.9-.1-1.3H12v2.7h5.5c-.3 1.4-1.1 2.6-2.3 3.4l3.5 2.7c2-1.9 3.1-4.6 3.1-7.5z"/>
                    <path fill="#FBBC05" d="M6 14.2c-.2-.6-.4-1.3-.4-2s.1-1.3.4-2L2.5 7.5C1.9 8.7 1.6 10 1.6 11.8s.3 3.1.9 4.3L6 14.2z"/>
                    <path fill="#34A853" d="M12 21.2c2.7 0 5-.9 6.6-2.5l-3.5-2.7c-.9.6-2.1 1-3.1 1-3.3 0-6-2.7-6-6 0-.7.1-1.4.4-2L2.5 7.5C1.9 8.7 1.6 10 1.6 11.8 1.6 17 6.8 21.2 12 21.2z"/>
                  </svg>
                </span>
                <span>Iniciá sesión con Google y guardá tu progreso</span>
              </>
            )}
          </button>

          <p id="onboarding_legal_desc" className="text-[10px] text-center text-slate-400 max-w-xs mx-auto">
            Hecho con pasión y <span className="heartbeat" aria-hidden="true">🩵</span> por{' '}
            <a
              href="https://harvi.digital"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sky-600 hover:text-sky-700 underline decoration-sky-300 underline-offset-2"
            >
              Harvi
            </a>
            .
          </p>
        </div>

      </main>
    );
  }

  // MAIN COLLECTION VIEW
  return (
    <div id="main_app_layout" className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-xl border-x border-slate-200">
      <p className="sr-only" aria-live="polite">{liveAnnouncement}</p>
      {appAlert && (
        <div role="alert" aria-live="assertive" className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
          {appAlert}
        </div>
      )}
      
      {/* Top sticky customized header component */}
      <Header />

      {/* Primary scrollable views container */}
      <main id="app_content_scroller" className="flex-1 overflow-y-auto py-4" aria-label={activeTab === 'album' ? 'Colección de figuritas' : 'Canjes y propuestas'}>
        {activeTab === 'album' ? <AlbumGrid /> : <MatchMaker />}
      </main>

      {/* Persistent Bottom navigation menu */}
      <nav id="bottom_nav_bar" aria-label="Navegación principal" className="sticky bottom-0 bg-white border-t border-slate-200 shadow-lg px-6 py-2.5 flex justify-around">
        <button
          id="tab_nav_album"
          onClick={() => setActiveTab('album')}
          aria-current={activeTab === 'album' ? 'page' : undefined}
          aria-label="Ir a colección"
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all active:scale-95 ${
            activeTab === 'album' ? 'text-sky-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold">Colección</span>
        </button>

        <button
          id="tab_nav_canjes"
          onClick={() => setActiveTab('canjes')}
          aria-current={activeTab === 'canjes' ? 'page' : undefined}
          aria-label="Ir a canjes"
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all active:scale-95 ${
            activeTab === 'canjes' ? 'text-sky-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold">Canjes</span>
        </button>
      </nav>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
