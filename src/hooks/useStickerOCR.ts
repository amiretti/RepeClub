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

type OCRMode = 'normal' | 'zoom';

let tesseractWorker: any = null;

const getWorker = async () => {
  if (tesseractWorker) return tesseractWorker;

  const tesseract = await import('tesseract.js');
  tesseractWorker = await tesseract.createWorker('eng');
  return tesseractWorker;
};

const preprocessTopRightRegion = (sourceCanvas: HTMLCanvasElement, mode: OCRMode): HTMLCanvasElement => {
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return sourceCanvas;

  // The sticker code lives in the top-right corner. We try a tighter crop first,
  // then allow an extra zoom pass from the UI when OCR confidence is low.
  const roi = mode === 'zoom'
    ? { x: 0.73, y: 0.005, w: 0.24, h: 0.12, scale: 3 }
    : { x: 0.68, y: 0.01, w: 0.29, h: 0.15, scale: 2 };

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
    const value = gray > 150 ? 255 : 0;
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

  const recognizeFromCanvas = useCallback(async (canvas: HTMLCanvasElement, mode: OCRMode = 'normal'): Promise<OCRResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const worker = await getWorker();
      const roiCanvas = preprocessTopRightRegion(canvas, mode);

      const { data } = await worker.recognize(roiCanvas, {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      });

      const rawText = data?.text || '';
      const confidence = data?.confidence || 0;
      const code = extractStickerCodeFromText(rawText);

      return {
        code,
        rawText,
        confidence
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
