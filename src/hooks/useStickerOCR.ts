/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { extractStickerCodeFromText } from '../utils/stickerCodeValidator';

interface OCRResult {
  code: string | null;
  rawText: string;
  confidence: number;
}

type OCRMode = 'normal' | 'zoom' | 'wide' | 'auto';

interface ROIConfig {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}

interface OCRAttempt {
  mode: 'normal' | 'zoom' | 'wide';
  threshold: number;
  invert?: boolean;
}

const ROI_BY_MODE: Record<'normal' | 'zoom' | 'wide', ROIConfig> = {
  normal: { x: 0.68, y: 0.01, w: 0.29, h: 0.15, scale: 2 },
  zoom: { x: 0.73, y: 0.005, w: 0.24, h: 0.12, scale: 3 },
  // Wider fallback in case the printed code is a bit more centered than expected.
  wide: { x: 0.6, y: 0, w: 0.38, h: 0.2, scale: 2 }
};

const AUTO_ATTEMPTS: OCRAttempt[] = [
  // Tight zoom first: in practice it gives the most reliable read on real stickers.
  { mode: 'zoom', threshold: 140 },
  { mode: 'normal', threshold: 150 },
  { mode: 'wide', threshold: 145 },
  { mode: 'zoom', threshold: 130, invert: true },
  { mode: 'wide', threshold: 140, invert: true }
];

let tesseractWorker: any = null;

const getWorker = async () => {
  if (tesseractWorker) return tesseractWorker;

  const tesseract = await import('tesseract.js');
  tesseractWorker = await tesseract.createWorker('eng');
  await tesseractWorker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    tessedit_pageseg_mode: '7',
    preserve_interword_spaces: '0'
  });
  return tesseractWorker;
};

const preprocessTopRightRegion = (
  sourceCanvas: HTMLCanvasElement,
  mode: 'normal' | 'zoom' | 'wide',
  threshold: number,
  invert = false
): HTMLCanvasElement => {
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return sourceCanvas;

  const roi = ROI_BY_MODE[mode];

  const sx = Math.floor(sourceCanvas.width * roi.x);
  const sy = Math.floor(sourceCanvas.height * roi.y);
  const sw = Math.floor(sourceCanvas.width * roi.w);
  const sh = Math.floor(sourceCanvas.height * roi.h);

  cropCanvas.width = sw * roi.scale;
  cropCanvas.height = sh * roi.scale;
  cropCtx.imageSmoothingEnabled = false;
  cropCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, cropCanvas.width, cropCanvas.height);

  const imageData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    let value = gray > threshold ? 255 : 0;
    if (invert) value = 255 - value;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  cropCtx.putImageData(imageData, 0, 0);
  return cropCanvas;
};

export const useStickerOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognizeFromCanvas = useCallback(async (canvas: HTMLCanvasElement, mode: OCRMode = 'auto'): Promise<OCRResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const worker = await getWorker();
      const attempts: OCRAttempt[] = mode === 'auto'
        ? AUTO_ATTEMPTS
        : [{ mode, threshold: mode === 'zoom' ? 140 : 150 }];

      const results: OCRResult[] = [];

      for (const attempt of attempts) {
        const roiCanvas = preprocessTopRightRegion(canvas, attempt.mode, attempt.threshold, Boolean(attempt.invert));

        const { data } = await worker.recognize(roiCanvas);

        const rawText = data?.text || '';
        const confidence = data?.confidence || 0;
        const code = extractStickerCodeFromText(rawText);

        const currentResult: OCRResult = {
          code,
          rawText,
          confidence
        };

        results.push(currentResult);
      }

      const validResults = results.filter((r) => Boolean(r.code));
      if (validResults.length > 0) {
        return validResults.sort((a, b) => b.confidence - a.confidence)[0];
      }

      if (results.length > 0) {
        return results.sort((a, b) => b.confidence - a.confidence)[0];
      }

      return {
        code: null,
        rawText: '',
        confidence: 0
      };
    } catch (err) {
      setError('No pudimos leer la figurita. Probá de nuevo con más luz.');
      return {
        code: null,
        rawText: '',
        confidence: 0
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    error,
    recognizeFromCanvas
  };
};
