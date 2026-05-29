/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { Trophy, Compass, Bell, LogOut, MapPin } from 'lucide-react';
import { Header } from './Header';
import { AlbumGrid } from './AlbumGrid';
import { MatchMaker } from './MatchMaker';
import { useApp } from '../context/AppContext';
import { NotificationsPanel } from './header/NotificationsPanel';

interface AppShellProps {
  activeTab: 'album' | 'canjes';
  setActiveTab: (tab: 'album' | 'canjes') => void;
  liveAnnouncement: string;
  appAlert: string | null;
}

export const AppShell: React.FC<AppShellProps> = ({ activeTab, setActiveTab, liveAnnouncement, appAlert }) => {
  const { currentUser, notifications, signOut, clearNotification, markAllNotificationsAsRead } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <div id="main_app_layout" className="min-h-screen lg:h-screen bg-slate-50 flex flex-col lg:flex-row lg:overflow-hidden">
      <p className="sr-only" aria-live="polite">{liveAnnouncement}</p>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-64 bg-white border-r border-slate-200 flex-shrink-0">

        {/* Brand */}
        <div className="px-5 py-6 border-b border-slate-100">
          <img src="/logo-repeclub.svg" alt="Logo de RepeClub" className="w-12 h-12 rounded-2xl shadow-lg shadow-slate-200" />
          <p className="text-sm font-black text-slate-800 mt-3 tracking-tight leading-none">RepeClub</p>
          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mt-0.5">2026</p>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Secciones">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 pb-2">Secciones</p>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sky-50 border border-sky-100">
            <Trophy className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span className="text-xs font-extrabold text-sky-700">Colección</span>
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500">
            <Compass className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-extrabold">Canjes</span>
          </div>

          {/* Notifications */}
          <div className="pt-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 pb-2">Actividad</p>
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(prev => !prev);
                  if (unreadNotifs.length > 0) markAllNotificationsAsRead();
                }}
                aria-label="Notificaciones"
                aria-expanded={notifOpen}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold focus:outline-none"
              >
                <Bell className="w-4 h-4 flex-shrink-0" />
                <span>Notificaciones</span>
                {unreadNotifs.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>
              <NotificationsPanel
                open={notifOpen}
                panelRef={notifPanelRef}
                notifications={notifications}
                onClose={() => setNotifOpen(false)}
                onClearNotification={clearNotification}
                panelClassName="absolute left-full top-0 ml-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden py-2 z-50"
              />
            </div>
          </div>
        </nav>

        {/* Profile section at bottom */}
        {currentUser && (
          <div className="border-t border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover border border-sky-100 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 bg-amber-400 text-white font-extrabold rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-800 truncate">{currentUser.name}</p>
                {currentUser.location && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold truncate">
                    <MapPin className="w-3 h-3 text-sky-500 flex-shrink-0" />
                    {currentUser.location}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-xs font-bold focus:outline-none"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden">

        {/* Mobile-only header (hidden on lg+) */}
        <Header />

        {appAlert && (
          <div role="alert" aria-live="assertive" className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
            {appAlert}
          </div>
        )}

        {/* Mobile: show only the active tab */}
        <main
          id="app_content_scroller"
          className="flex-1 overflow-y-auto py-4 lg:hidden"
          aria-label={activeTab === 'album' ? 'Colección de figuritas' : 'Canjes y propuestas'}
        >
          {activeTab === 'album' ? <AlbumGrid /> : <MatchMaker />}
        </main>

        {/* Desktop: two panels side by side, each with independent scroll */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          <main
            className="flex-1 overflow-y-auto py-6"
            aria-label="Colección de figuritas"
          >
            <AlbumGrid />
          </main>
          <aside
            className="w-[420px] xl:w-[460px] flex-shrink-0 overflow-y-auto py-6 bg-white border-l border-slate-200"
            aria-label="Canjes y propuestas"
          >
            <MatchMaker />
          </aside>
        </div>

        {/* Mobile bottom nav (hidden on lg+) */}
        <nav id="bottom_nav_bar" aria-label="Navegación principal" className="lg:hidden sticky bottom-0 bg-white border-t border-slate-200 shadow-lg px-6 py-2.5 flex justify-around">
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
    </div>
  );
};
