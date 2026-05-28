/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trophy, Compass } from 'lucide-react';
import { Header } from './Header';
import { AlbumGrid } from './AlbumGrid';
import { MatchMaker } from './MatchMaker';

interface AppShellProps {
  activeTab: 'album' | 'canjes';
  setActiveTab: (tab: 'album' | 'canjes') => void;
  liveAnnouncement: string;
  appAlert: string | null;
}

export const AppShell: React.FC<AppShellProps> = ({ activeTab, setActiveTab, liveAnnouncement, appAlert }) => {
  return (
    <div id="main_app_layout" className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-xl border-x border-slate-200">
      <p className="sr-only" aria-live="polite">{liveAnnouncement}</p>
      {appAlert && (
        <div role="alert" aria-live="assertive" className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
          {appAlert}
        </div>
      )}

      <Header />

      <main id="app_content_scroller" className="flex-1 overflow-y-auto py-4" aria-label={activeTab === 'album' ? 'Colección de figuritas' : 'Canjes y propuestas'}>
        {activeTab === 'album' ? <AlbumGrid /> : <MatchMaker />}
      </main>

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
};
