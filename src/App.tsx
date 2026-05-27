/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { AlbumGrid } from './components/AlbumGrid';
import { MatchMaker } from './components/MatchMaker';
import { Trophy, HelpCircle, Flame, Star, Compass, Loader2 } from 'lucide-react';

function AppContent() {
  const { currentUser, signIn, loading } = useApp();
  const [activeTab, setActiveTab] = useState<'album' | 'canjes'>('album');

  if (loading) {
    return (
      <div id="app_loading_screen" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-sky-600 animate-spin" />
        <p className="mt-4 text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">
          Abriendo paquete de figuritas...
        </p>
      </div>
    );
  }

  // ONBOARDING / LANDING PAGE: If no user is authenticated or guest has not bypassed
  if (!currentUser) {
    return (
      <div id="landing_screen" className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-6 max-w-md mx-auto relative overflow-hidden">
        
        {/* Ambient sparkles background decor */}
        <div className="absolute top-10 left-10 text-4xl opacity-10 animate-pulse select-none">✨</div>
        <div className="absolute bottom-40 right-10 text-5xl opacity-10 animate-bounce select-none">⚽</div>

        {/* Brand Header */}
        <div id="landing_brand" className="text-center mt-6">
          <div className="w-20 h-20 bg-sky-600 rounded-3xl mx-auto flex items-center justify-center text-white font-extrabold text-4xl shadow-xl shadow-sky-200 rotate-6 border-4 border-white">
            26
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-6 uppercase">
            Repe<span className="text-sky-600">Club</span>
          </h1>
          <p className="text-[10px] font-bold text-sky-600 mt-1 uppercase tracking-widest bg-sky-50 px-2.5 py-0.5 rounded-full inline-block">
            Control & Canje Bento
          </p>
          <p className="text-sm text-slate-500 max-w-xs mx-auto mt-3 font-medium leading-relaxed">
            Consigue tus figuritas, marca tus repetidas y encuentra amigos de tu localidad para cambiarlas. ¡Rápido e intuitivo para chicos!
          </p>
        </div>

        {/* Sticker mock packet layout design */}
        <div id="onboarding_packet_card" className="my-8 p-6 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 rounded-[2rem] shadow-2xl relative border-4 border-white overflow-hidden transform hover:-rotate-1 transition-transform">
          <div className="absolute top-0 right-0 bg-sky-600 text-white font-black text-[10px] px-3.5 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-sm">
            PREMIUM
          </div>
          <p className="text-xs font-extrabold text-blue-200 uppercase tracking-widest mt-2 leading-none">RepeClub 2026</p>
          <h2 className="text-xl font-black text-white tracking-tight mt-2">
            ¡Llena tu Álbum!
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
            className="w-full py-4 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-sky-200 transition-all flex items-center justify-center gap-2 text-sm"
          >
            🏆 Iniciar sesión para guardar en la Nube
          </button>

          <button
            id="guest_bypass_btn"
            onClick={signIn} // Guest signIn just sets default local guest user
            className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 font-bold rounded-2xl transition-all text-xs text-center"
          >
            Probar como Invitado (Modo local 📂)
          </button>
          
          <p id="onboarding_legal_desc" className="text-[10px] text-center text-slate-400 max-w-xs mx-auto">
            Hecho para coleccionistas. Las figuritas se basan en la planilla oficial de control de IDEASPARAIMPRIMIR.COM.
          </p>
        </div>

      </div>
    );
  }

  // MAIN COLLECTION VIEW
  return (
    <div id="main_app_layout" className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-xl border-x border-slate-200">
      
      {/* Top sticky customized header component */}
      <Header />

      {/* Primary scrollable views container */}
      <main id="app_content_scroller" className="flex-1 overflow-y-auto py-4">
        {activeTab === 'album' ? <AlbumGrid /> : <MatchMaker />}
      </main>

      {/* Persistent Bottom navigation menu */}
      <nav id="bottom_nav_bar" className="sticky bottom-0 bg-white border-t border-slate-200 shadow-lg px-6 py-2.5 flex justify-around">
        <button
          id="tab_nav_album"
          onClick={() => setActiveTab('album')}
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
