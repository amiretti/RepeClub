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
        <p className="text-[11px] leading-relaxed text-center text-slate-500 max-w-xs mx-auto px-1">
          Al ingresar aceptás los{' '}
          <a
            href="/terminos/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-800 underline decoration-blue-700 underline-offset-2 hover:text-blue-900"
          >
            Términos y Condiciones
          </a>
          . RepeClub facilita el contacto entre coleccionistas y no participa en los encuentros ni en los canjes presenciales.
        </p>

        <button
          id="google_signin_btn"
          onClick={signIn}
          disabled={authInProgress}
          aria-label="Iniciar sesión con Google"
          className="w-full py-4 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed text-slate-800 font-semibold rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/70 ring-1 ring-slate-100 transition-all flex items-center justify-center gap-3 text-sm"
        >
          {authInProgress ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-sky-600" aria-hidden="true" />
              <span>Conectando con Google...</span>
            </>
          ) : (
            <>
              <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Google">
                  <path
                    fill="#EA4335"
                    d="M12 11.636V8.727h10.909c.109.509.182 1.127.182 1.818 0 6.655-4.473 11.455-11.091 11.455C5.673 22 1 17.327 1 11.5S5.673 1 12 1c3.055 0 5.618 1.127 7.436 2.982l-2.036 2.036C16.2 4.909 14.345 4.145 12 4.145c-4.182 0-7.536 3.363-7.536 7.536s3.354 7.536 7.536 7.536c4.836 0 6.655-3.473 6.945-5.273H12z"
                  />
                  <path
                    fill="#34A853"
                    d="M1 6.764l2.391 1.754C4.673 5.964 8.055 3.6 12 3.6c2.345 0 4.2.764 5.4 1.909l2.036-2.036C17.618 1.618 15.055.491 12 .491 7.527.491 3.645 3.045 1.727 6.764z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 23c3 0 5.527-.982 7.382-2.673l-2.709-2.218c-.982.691-2.245 1.127-4.673 1.127-4.145 0-7.491-3.327-7.473-7.455L2.109 13.6C3.991 18.173 7.855 23 12 23z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.091 10.545c0-.691-.073-1.309-.182-1.818H12v3.091h6.945c-.291 1.8-1.309 3.327-2.909 4.364l2.709 2.218c2.473-2.291 4.346-5.673 4.346-9.855z"
                  />
                </svg>
              </span>
              <span>Continuar con Google</span>
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
        <p id="onboarding_legal_desc" className="text-[10px] leading-relaxed text-center text-slate-500 max-w-xs mx-auto">
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
          <br />
          <a
            href="/terminos/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-800 underline decoration-blue-700 underline-offset-2 hover:text-blue-900"
          >
            Términos y Condiciones
          </a>
          .
        </p>
      </footer>
    </main>
  );
};
