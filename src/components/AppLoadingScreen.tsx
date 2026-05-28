/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loader2 } from 'lucide-react';

export const AppLoadingScreen: React.FC = () => {
  return (
    <div id="app_loading_screen" role="status" aria-live="polite" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="w-12 h-12 text-sky-600 animate-spin" />
      <p className="mt-4 text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">
        Abriendo sobre de figus...
      </p>
    </div>
  );
};
