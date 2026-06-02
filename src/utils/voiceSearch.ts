/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const NUMBER_WORDS: Record<string, number> = {
  cero: 0,
  uno: 1, una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16, dieciséis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiuno: 21, veintiuna: 21,
  veintidos: 22, veintidós: 22,
  veintitres: 23, veintitrés: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26, veintiséis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
  treinta: 30
};

const stripAccents = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Convierte una transcripción de voz en un código de figu si parece serlo,
 * o si no, devuelve el texto normalizado para usar como búsqueda libre.
 *
 * Ejemplos:
 *   "pan dieciséis" → "PAN16"
 *   "argentina 3"   → "ARGENTINA 3"  (lo deja para fuzzy search por nombre)
 *   "arg tres"      → "ARG3"
 *   "messi"         → "MESSI"
 */
export const interpretVoiceTranscript = (transcript: string): string => {
  if (!transcript) return '';

  const cleaned = stripAccents(transcript.toLowerCase().trim()).replace(/[.,;!?]/g, '');
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  // Reemplazar palabras-número por dígitos
  const normalized = tokens.map((t) => {
    if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, t)) {
      return String(NUMBER_WORDS[t]);
    }
    return t;
  });

  // Si quedó letras + número (ej: "pan 16" o "arg 3"), juntarlos en un código.
  if (normalized.length === 2) {
    const [a, b] = normalized;
    if (/^[a-z]{2,4}$/.test(a) && /^\d{1,2}$/.test(b)) {
      return `${a.toUpperCase()}${b}`;
    }
  }

  // Caso "fwc 9" puede llegar como "f w c 9" o "efe doble u ce 9" — fallback simple:
  // si hay tokens monocaracter consecutivos, los pegamos.
  const merged: string[] = [];
  let buffer = '';
  for (const t of normalized) {
    if (/^[a-z]$/.test(t)) {
      buffer += t;
    } else {
      if (buffer) {
        merged.push(buffer);
        buffer = '';
      }
      merged.push(t);
    }
  }
  if (buffer) merged.push(buffer);

  if (merged.length === 2) {
    const [a, b] = merged;
    if (/^[a-z]{2,4}$/.test(a) && /^\d{1,2}$/.test(b)) {
      return `${a.toUpperCase()}${b}`;
    }
  }

  // No parece código → devolvemos texto plano para búsqueda libre.
  return normalized.join(' ').toUpperCase();
};

/**
 * Devuelve la implementación nativa de SpeechRecognition (o null si no hay).
 */
export const getSpeechRecognitionCtor = (): any | null => {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export const isVoiceSearchSupported = (): boolean => getSpeechRecognitionCtor() !== null;
