/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loader2 } from 'lucide-react';
import { FlagIcon } from './FlagIcon';

interface LandingScreenProps {
  signIn: () => Promise<void>;
  authInProgress: boolean;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ signIn, authInProgress }) => {
  return (
    <main id="landing_screen" className="min-h-[100dvh] bg-slate-50 flex flex-col gap-4 py-4 px-5 max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-10 left-10 text-4xl opacity-10 animate-pulse select-none">✨</div>
      <div className="absolute bottom-40 right-10 text-5xl opacity-10 animate-bounce select-none">⚽</div>

      <div id="landing_brand" className="text-center mt-2">
        <img
          src="/logo-repeclub.svg"
          alt="Logo de RepeClub"
          className="w-24 h-24 mx-auto rounded-3xl shadow-xl shadow-slate-200"
        />
        <p className="text-[10px] font-bold text-sky-600 mt-4 uppercase tracking-widest bg-sky-50 px-2.5 py-0.5 rounded-full inline-block">
          Control y canje al toque
        </p>
        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2 font-medium leading-relaxed">
          Juntá tus figus, marcá tus repes y encontrá gente de tu zona para canjear. Fácil, rápido y sin vueltas.
        </p>
      </div>

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
      </div>

      <div id="onboarding_packet_card" className="my-1 p-4 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 rounded-[1.75rem] shadow-2xl relative border-4 border-white overflow-hidden transform hover:-rotate-1 transition-transform">
        <div className="absolute top-0 right-0 bg-sky-600 text-white font-black text-[9px] px-3 py-1 rounded-bl-2xl uppercase tracking-wider shadow-sm">
          PREMIUM
        </div>
        <p className="text-[11px] font-extrabold text-blue-200 uppercase tracking-widest mt-1 leading-none">RepeClub 2026</p>
        <h2 className="text-lg font-black text-white tracking-tight mt-2">
          ¡Llená tu álbum!
        </h2>
        <div className="flex gap-2 mt-3">
          <div className="bg-white/10 flex-1 p-2 rounded-2xl text-center border border-white/15 flex flex-col items-center">
            <FlagIcon emoji="🇲🇽" label="México" className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-mono font-extrabold text-blue-200">MEX10</span>
          </div>
          <div className="bg-sky-600 flex-1 p-2 rounded-2xl text-center border border-sky-500 flex flex-col items-center">
            <FlagIcon emoji="🇦🇷" label="Argentina" className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-mono font-extrabold text-white">ARG10</span>
          </div>
          <div className="bg-white/10 flex-1 p-2 rounded-2xl text-center border border-white/15 flex flex-col items-center">
            <FlagIcon emoji="🇧🇷" label="Brasil" className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-mono font-extrabold text-blue-200">BRA10</span>
          </div>
        </div>
        <p className="text-[9px] text-blue-200/80 font-semibold mt-3 text-center">
          🚀 Con tecnología de auto-coincidencia inteligente de canjes
        </p>
      </div>

      <footer className="mt-auto">
        <p id="onboarding_legal_desc" className="text-[10px] text-center text-slate-400 max-w-xs mx-auto">
          Hecho con pasión y <span className="heartbeat" aria-hidden="true">💚</span> por{' '}
          <a
            href="https://harvi.digital"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline decoration-[#cbdf4a] underline-offset-2"
          >
            <span className="text-[#cbdf4a]">HARVI</span>
          </a>
          .
        </p>
      </footer>
    </main>
  );
};
