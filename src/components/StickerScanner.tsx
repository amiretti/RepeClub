/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Check, Undo2, AlertTriangle } from 'lucide-react';
import { useStickerOCR } from '../hooks/useStickerOCR';
import { isValidStickerCode } from '../utils/stickerCodeValidator';

type ScanState = 'starting' | 'scanning' | 'previewing' | 'countdown' | 'adding' | 'success';

const AUTO_CONFIRM_KEY = 'repeclub.scanner.autoConfirm';
const COUNTDOWN_MS = 1200;
const CLOSE_AFTER_SUCCESS_MS = 8000;
const SCAN_INTERVAL_MS = 350;
const PREVIEW_MAX_AGE_MS = 1500;
const FALLBACK_AUTO_EVERY = 4;
const STARTUP_DELAY_MS = 200;
const SUCCESS_DISPLAY_MS = 700;

interface StickerScannerProps {
  open: boolean;
  onClose: () => void;
  onConfirmCode: (code: string) => Promise<void> | void;
}

const readAutoConfirmPref = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const v = window.localStorage.getItem(AUTO_CONFIRM_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
};

const writeAutoConfirmPref = (v: boolean) => {
  try {
    window.localStorage.setItem(AUTO_CONFIRM_KEY, v ? '1' : '0');
  } catch {
    // ignore
  }
};

const detectReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const triggerHaptic = () => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  } catch {
    // ignore
  }
};

export const StickerScanner: React.FC<StickerScannerProps> = ({ open, onClose, onConfirmCode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Loop control
  const intervalRef = useRef<number | null>(null);
  const tickInFlightRef = useRef<boolean>(false);
  const failedScansRef = useRef<number>(0);
  const lastReadRef = useRef<{ code: string; ts: number } | null>(null);

  // State refs (so async closures see latest values)
  const stateRef = useRef<ScanState>('starting');
  const autoConfirmRef = useRef<boolean>(readAutoConfirmPref());

  // Timers
  const countdownTimerRef = useRef<number | null>(null);
  const countdownProgressRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

  // Forward-ref for the scan tick so setInterval always invokes the latest closure.
  const scanTickRef = useRef<() => Promise<void>>(async () => undefined);

  const [scanState, setScanStateInner] = useState<ScanState>('starting');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [lastAddedCode, setLastAddedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [autoConfirm, setAutoConfirm] = useState<boolean>(autoConfirmRef.current);
  const [reduceMotion] = useState<boolean>(detectReducedMotion);
  const [countdownProgress, setCountdownProgress] = useState<number>(0);

  const { recognizeFromCanvas } = useStickerOCR();

  const setScanState = useCallback((s: ScanState) => {
    stateRef.current = s;
    setScanStateInner(s);
  }, []);

  const stopLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (intervalRef.current !== null) return;
    intervalRef.current = window.setInterval(() => {
      void scanTickRef.current();
    }, SCAN_INTERVAL_MS);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (countdownProgressRef.current !== null) {
      window.clearInterval(countdownProgressRef.current);
      countdownProgressRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    if (video.readyState < 2 || video.videoWidth === 0) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, []);

  const finalizeAdd = useCallback(async (code: string) => {
    clearAllTimers();
    setScanState('adding');
    try {
      await onConfirmCode(code);
      setLastAddedCode(code);
      setScanState('success');
      successTimerRef.current = window.setTimeout(() => {
        setPendingCode(null);
        lastReadRef.current = null;
        failedScansRef.current = 0;
        setScanState('scanning');
        startLoop();
        // Auto-close window if user does nothing else.
        closeTimerRef.current = window.setTimeout(() => {
          onClose();
        }, CLOSE_AFTER_SUCCESS_MS);
      }, SUCCESS_DISPLAY_MS);
    } catch {
      setPendingCode(null);
      setScanState('scanning');
      startLoop();
    }
  }, [clearAllTimers, onClose, onConfirmCode, setScanState, startLoop]);

  const beginCountdown = useCallback((code: string) => {
    clearAllTimers();
    setPendingCode(code);
    setCountdownProgress(0);
    setScanState('countdown');
    triggerHaptic();
    stopLoop();

    const start = Date.now();
    countdownProgressRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      setCountdownProgress(Math.min(1, elapsed / COUNTDOWN_MS));
    }, 60);

    countdownTimerRef.current = window.setTimeout(() => {
      void finalizeAdd(code);
    }, COUNTDOWN_MS);
  }, [clearAllTimers, finalizeAdd, setScanState, stopLoop]);

  const handleConfirmedDetection = useCallback((code: string) => {
    if (autoConfirmRef.current) {
      beginCountdown(code);
    } else {
      stopLoop();
      setPendingCode(code);
      setScanState('previewing');
    }
  }, [beginCountdown, setScanState, stopLoop]);

  const handleCancelCountdown = useCallback(() => {
    clearAllTimers();
    setCountdownProgress(0);
    setPendingCode(null);
    lastReadRef.current = null;
    failedScansRef.current = 0;
    setScanState('scanning');
    startLoop();
  }, [clearAllTimers, setScanState, startLoop]);

  const handleManualConfirmDetected = useCallback(() => {
    if (!pendingCode) return;
    void finalizeAdd(pendingCode);
  }, [finalizeAdd, pendingCode]);

  const handleSubmitManualCode = useCallback(async () => {
    const normalized = manualCode.toUpperCase().trim();
    if (!isValidStickerCode(normalized)) return;
    clearAllTimers();
    stopLoop();
    setManualCode('');
    await finalizeAdd(normalized);
  }, [clearAllTimers, finalizeAdd, manualCode, stopLoop]);

  const handleToggleAutoConfirm = useCallback(() => {
    setAutoConfirm((prev) => {
      const next = !prev;
      autoConfirmRef.current = next;
      writeAutoConfirmPref(next);
      return next;
    });
  }, []);

  // Keep scanTick fresh on every relevant change.
  useEffect(() => {
    scanTickRef.current = async () => {
      if (tickInFlightRef.current) return;
      const current = stateRef.current;
      if (current !== 'scanning' && current !== 'previewing') return;
      if (typeof document !== 'undefined' && document.hidden) return;

      const canvas = captureFrame();
      if (!canvas) return;

      tickInFlightRef.current = true;
      try {
        const useFullAuto =
          failedScansRef.current > 0 && failedScansRef.current % FALLBACK_AUTO_EVERY === 0;
        const result = await recognizeFromCanvas(canvas, useFullAuto ? 'auto' : 'zoom');

        const stateNow = stateRef.current;
        if (stateNow !== 'scanning' && stateNow !== 'previewing') return;

        if (result.code) {
          // User is engaging again — cancel any pending auto-close.
          if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }

          const now = Date.now();
          const previous = lastReadRef.current;
          if (previous && previous.code === result.code && now - previous.ts <= PREVIEW_MAX_AGE_MS) {
            // Two consecutive matching reads — confirmed.
            lastReadRef.current = null;
            failedScansRef.current = 0;
            handleConfirmedDetection(result.code);
          } else {
            // First (or differing) read — show as previewing.
            lastReadRef.current = { code: result.code, ts: now };
            failedScansRef.current = 0;
            setPendingCode(result.code);
            if (stateNow === 'scanning') {
              setScanState('previewing');
            }
          }
        } else {
          failedScansRef.current += 1;
          const previous = lastReadRef.current;
          if (previous && Date.now() - previous.ts > PREVIEW_MAX_AGE_MS) {
            lastReadRef.current = null;
            if (stateRef.current === 'previewing') {
              setPendingCode(null);
              setScanState('scanning');
            }
          }
        }
      } catch {
        // Swallow OCR errors — keep the loop alive.
      } finally {
        tickInFlightRef.current = false;
      }
    };
  }, [captureFrame, handleConfirmedDetection, recognizeFromCanvas, setScanState]);

  // Camera lifecycle: start when modal opens, cleanup on close/unmount.
  useEffect(() => {
    if (!open) return;

    let active = true;
    setScanState('starting');
    setPermissionError(null);
    setPendingCode(null);
    setLastAddedCode(null);
    failedScansRef.current = 0;
    lastReadRef.current = null;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        try {
          const [track] = stream.getVideoTracks();
          const capabilities: any = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
          const advanced: MediaTrackConstraintSet[] = [];
          if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
            advanced.push({ focusMode: 'continuous' } as MediaTrackConstraintSet);
          }
          if (Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes('continuous')) {
            advanced.push({ exposureMode: 'continuous' } as MediaTrackConstraintSet);
          }
          if (Array.isArray(capabilities.whiteBalanceMode) && capabilities.whiteBalanceMode.includes('continuous')) {
            advanced.push({ whiteBalanceMode: 'continuous' } as MediaTrackConstraintSet);
          }
          if (advanced.length > 0) {
            await track.applyConstraints({ advanced } as MediaTrackConstraints).catch(() => undefined);
          }
        } catch {
          // best effort
        }

        await new Promise((r) => window.setTimeout(r, STARTUP_DELAY_MS));
        if (!active) return;
        setScanState('scanning');
        startLoop();
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          setPermissionError('No diste permiso para usar la cámara.');
        } else if (err?.name === 'NotFoundError') {
          setPermissionError('No encontramos cámara en este dispositivo.');
        } else {
          setPermissionError('No pudimos abrir la cámara.');
        }
      }
    };

    void start();

    return () => {
      active = false;
      stopLoop();
      clearAllTimers();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open, clearAllTimers, setScanState, startLoop, stopLoop]);

  // Pause loop when document is hidden, resume on visible.
  useEffect(() => {
    if (!open) return;
    const onVisibility = () => {
      if (document.hidden) {
        stopLoop();
      } else if (
        stateRef.current === 'scanning' ||
        stateRef.current === 'previewing'
      ) {
        startLoop();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [open, startLoop, stopLoop]);

  // Esc cancels countdown.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (stateRef.current === 'countdown') {
        e.preventDefault();
        handleCancelCountdown();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, handleCancelCountdown]);

  if (!open) return null;

  const liveText = (() => {
    if (permissionError) return permissionError;
    switch (scanState) {
      case 'starting':
        return 'Preparando cámara';
      case 'scanning':
        return lastAddedCode ? `${lastAddedCode} sumada. Buscando la próxima` : 'Buscando código';
      case 'previewing':
        return pendingCode ? `Detectado ${pendingCode}, verificando` : 'Verificando lectura';
      case 'countdown':
        return pendingCode ? `Detectado ${pendingCode}. Sumando en 1.2 segundos. Tocá Deshacer para cancelar.` : '';
      case 'adding':
        return pendingCode ? `Sumando ${pendingCode}` : 'Sumando';
      case 'success':
        return lastAddedCode ? `${lastAddedCode} sumada` : 'Figu sumada';
      default:
        return '';
    }
  })();

  const reticleClass = (() => {
    const base = 'absolute right-[5%] top-[1%] w-[24%] h-[12%] rounded-lg border-2 transition-colors';
    switch (scanState) {
      case 'starting':
        return `${base} border-slate-500/60`;
      case 'scanning':
        return `${base} border-emerald-400 ${reduceMotion ? '' : 'animate-pulse'}`;
      case 'previewing':
        return `${base} border-amber-400`;
      case 'countdown':
      case 'adding':
        return `${base} border-emerald-400 bg-emerald-400/10`;
      case 'success':
        return `${base} border-emerald-300 bg-emerald-300/20`;
      default:
        return `${base} border-emerald-400`;
    }
  })();

  const reticleLabel = (() => {
    switch (scanState) {
      case 'starting':
        return 'Preparando…';
      case 'scanning':
        return 'Buscando código';
      case 'previewing':
        return pendingCode ? `Detectado ${pendingCode}…` : 'Verificando…';
      case 'countdown':
        return pendingCode ? `Sumando ${pendingCode}` : 'Sumando…';
      case 'adding':
        return 'Sumando…';
      case 'success':
        return lastAddedCode ? `${lastAddedCode} sumada` : 'Sumada';
      default:
        return '';
    }
  })();

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-[1px] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)]">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-sky-300 font-black">Escáner</p>
            <h3 className="text-sm font-black text-white">Apuntá al código del dorso</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar escáner"
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <div role="status" aria-live="polite" className="sr-only">
            {liveText}
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
            <div className={reticleClass} aria-hidden="true" />
            <div className="absolute top-[1%] right-[31%] max-w-[60%] truncate text-[10px] font-bold text-emerald-100 bg-slate-900/80 px-2 py-0.5 rounded">
              {reticleLabel}
            </div>

            {scanState === 'success' && lastAddedCode && (
              <div className="absolute inset-x-0 bottom-3 mx-auto w-fit px-3 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {lastAddedCode} sumada
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {permissionError && (
            <div className="rounded-xl border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 flex items-start gap-2" role="alert">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}

          {scanState === 'countdown' && pendingCode && (
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] uppercase tracking-widest text-emerald-200 font-black">Sumando</p>
                <span className="text-2xl font-black text-white">{pendingCode}</span>
              </div>
              <div className="h-1.5 w-full bg-emerald-900/40 rounded-full overflow-hidden" aria-hidden="true">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${Math.round(countdownProgress * 100)}%` }}
                />
              </div>
              <button
                autoFocus
                onClick={handleCancelCountdown}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center gap-2 border border-slate-600"
              >
                <Undo2 className="w-4 h-4" />
                Deshacer
              </button>
            </div>
          )}

          {scanState === 'previewing' && !autoConfirm && pendingCode && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-emerald-200 font-black">Detectado</p>
              <p className="text-xl font-black text-white">{pendingCode}</p>
              <button
                onClick={handleManualConfirmDetected}
                className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirmar y sumar
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-100">Sumar automáticamente</p>
              <p className="text-[10px] text-slate-400">La figu se suma sola al detectarla.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoConfirm}
              aria-label="Sumar automáticamente"
              onClick={handleToggleAutoConfirm}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                autoConfirm ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  autoConfirm ? 'translate-x-5' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
            <label htmlFor="manualCodeInput" className="text-[10px] uppercase tracking-widest text-slate-300 font-black">
              Ingresar manual
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="manualCodeInput"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej: PAN16"
                inputMode="text"
                autoCapitalize="characters"
                className="flex-1 rounded-xl border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm uppercase"
              />
              <button
                onClick={handleSubmitManualCode}
                disabled={!isValidStickerCode(manualCode.toUpperCase().trim())}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm"
              >
                Sumar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
