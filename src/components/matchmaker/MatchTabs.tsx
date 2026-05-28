/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Handshake, MessageSquare } from 'lucide-react';

interface MatchTabsProps {
  activeTab: 'match' | 'trades';
  pendingIncomingCount: number;
  onChangeTab: (tab: 'match' | 'trades') => void;
}

export const MatchTabs: React.FC<MatchTabsProps> = ({ activeTab, pendingIncomingCount, onChangeTab }) => {
  return (
    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
      <button
        onClick={() => onChangeTab('match')}
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
        onClick={() => onChangeTab('trades')}
        aria-pressed={activeTab === 'trades'}
        className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all relative ${
          activeTab === 'trades'
            ? 'bg-white shadow-xs text-slate-900'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <MessageSquare className="w-4 h-4 text-blue-500" />
        Propuestas
        {pendingIncomingCount > 0 && (
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping absolute top-2.5 right-6" />
        )}
      </button>
    </div>
  );
};
