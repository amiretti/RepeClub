/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, ScanLine, Check, AlertTriangle, ZoomIn } from 'lucide-react';
import { useStickerOCR } from '../hooks/useStickerOCR';
import { isValidStickerCode } from '../utils/stickerCodeValidator';

const MIN_CONFIDENCE_TO_SUGGEST_CONFIRM = 70;

interface StickerScannerProps {
  open: boolean;
  onClose: () => void;
  onConfirmCode: (code: string) => Promise<void> | void;
}

export const StickerScanner: React.FC<StickerScannerProps> = ({ open, onClose, onConfirmCode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [confidence, setConfidence] = useState<number>(0);
  const [lastScanMode, setLastScanMode] = useState<'normal' | 'zoom'>('normal');

  const { isProcessing, error, recognizeFromCanvas } = useStickerOCR();

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
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

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
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

    start();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  const handleCaptureAndRead = async (mode: 'normal' | 'zoom' = 'normal') => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const result = await recognizeFromCanvas(canvas, mode);
    setLastScanMode(mode);
    setDetectedCode(result.code);
    setRawText(result.rawText);
    setConfidence(result.confidence);
  };

  const handleConfirmDetected = async () => {
    if (!detectedCode) return;
    await onConfirmCode(detectedCode);
    setDetectedCode(null);
    setRawText('');
    setConfidence(0);
  };

  const handleConfirmManual = async () => {
    const normalized = manualCode.toUpperCase().trim();
    if (!isValidStickerCode(normalized)) return;

    await onConfirmCode(normalized);
    setManualCode('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-sky-300 font-black">Escáner</p>
            <h3 className="text-sm font-black text-white">Leé el código del dorso</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar escáner"
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-[3/4]">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
            <div className={`absolute right-[5%] border-2 border-emerald-400 rounded-lg shadow-[0_0_0_2px_rgba(16,185,129,0.25)] ${
              lastScanMode === 'zoom' ? 'top-[1%] w-[24%] h-[12%]' : 'top-[2%] w-[29%] h-[15%]'
            }`} />
            <div className="absolute top-[4%] right-[5%] text-[10px] font-bold text-emerald-200 bg-slate-900/70 px-2 py-0.5 rounded">
              {lastScanMode === 'zoom' ? 'Modo zoom activo' : 'Apuntá al código'}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {permissionError && (
            <div className="rounded-xl border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-600/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100">
              {error}
            </div>
          )}

          <button
            onClick={() => handleCaptureAndRead('normal')}
            disabled={isProcessing || Boolean(permissionError)}
            className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-black text-sm flex items-center justify-center gap-2"
          >
            {isProcessing ? <ScanLine className="w-4 h-4 animate-pulse" /> : <Camera className="w-4 h-4" />}
            {isProcessing ? 'Leyendo figurita...' : 'Capturar y leer'}
          </button>

          {!detectedCode && rawText && (
            <button
              onClick={() => handleCaptureAndRead('zoom')}
              disabled={isProcessing || Boolean(permissionError)}
              className="w-full py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 border border-slate-600"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Reintentar con más zoom
            </button>
          )}

          {detectedCode && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3">
              <p className="text-[10px] uppercase tracking-widest text-emerald-200 font-black">Código detectado</p>
              <p className="text-xl font-black text-white mt-1">{detectedCode}</p>
              <p className="text-[10px] text-emerald-100/80 mt-1">Confianza OCR: {Math.round(confidence)}%</p>
              {confidence >= MIN_CONFIDENCE_TO_SUGGEST_CONFIRM ? (
                <p className="text-[10px] text-emerald-100 mt-1">Lectura confiable. Podés confirmar.</p>
              ) : (
                <p className="text-[10px] text-amber-200 mt-1">Confianza baja. Revisá el código antes de confirmar.</p>
              )}
              <button
                onClick={handleConfirmDetected}
                className="mt-2 w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirmar y sumar
              </button>
              {confidence < MIN_CONFIDENCE_TO_SUGGEST_CONFIRM && (
                <button
                  onClick={() => handleCaptureAndRead('zoom')}
                  disabled={isProcessing || Boolean(permissionError)}
                  className="mt-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-600"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  Reintentar con más zoom
                </button>
              )}
            </div>
          )}

          {!detectedCode && rawText && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Texto leído</p>
              <p className="text-[11px] text-slate-200 mt-1 break-all">{rawText}</p>
            </div>
          )}

          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Ingresar manual</p>
            <div className="mt-2 flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej: PAN16"
                className="flex-1 rounded-xl border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm uppercase"
              />
              <button
                onClick={handleConfirmManual}
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
