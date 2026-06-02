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

// Deletreado en español: "hache a i" → "h a i" → "hai"
const SPELL_LETTERS: Record<string, string> = {
  a: 'a', be: 'b', ve: 'v', uve: 'v', ce: 'c', de: 'd', e: 'e', efe: 'f',
  ge: 'g', hache: 'h', ache: 'h', i: 'i', jota: 'j', ka: 'k', ele: 'l',
  eme: 'm', ene: 'n', enie: 'n', o: 'o', pe: 'p', cu: 'q', ku: 'q',
  ere: 'r', erre: 'r', ese: 's', te: 't', u: 'u', equis: 'x', ex: 'x',
  ye: 'y', zeta: 'z', ceta: 'z'
};

// Palabras que el reconocedor en español confunde con prefijos de selecciones.
// Mapean a un prefijo concreto del catálogo.
const PREFIX_ALIASES: Record<string, string> = {
  // USA — en Argentina se lee "usa" y Chrome transcribe formas del verbo "usar".
  usa: 'usa', usar: 'usa', usado: 'usa', usada: 'usa', usan: 'usa',
  uso: 'usa', usaron: 'usa', usaba: 'usa', usé: 'usa', use: 'usa',
  // Variantes habituales para prefijos que suenan a palabras comunes.
  pan: 'pan', pang: 'pan', pana: 'pan',
  argentina: 'arg', arg: 'arg',
  brasil: 'bra', brazil: 'bra', bra: 'bra',
  mexico: 'mex', méjico: 'mex', mex: 'mex', mes: 'mex',
  haiti: 'hai', hai: 'hai', hay: 'hai', ay: 'hai', ahi: 'hai',
  tunez: 'tun', tun: 'tun', tune: 'tun', tunis: 'tun',
  canada: 'can', can: 'can', cane: 'can', cana: 'can', cann: 'can',
  escocia: 'sco', esco: 'sco', escocía: 'sco', escocés: 'sco', escoces: 'sco', escocesa: 'sco',
  marruecos: 'mar', marrocos: 'mar', marrueco: 'mar', marroco: 'mar', mar: 'mar', mas: 'mar',
  suiza: 'sui', zui: 'sui', sui: 'sui', suisse: 'sui',
  korea: 'kor', corea: 'kor', cor: 'kor',
  qatar: 'qat', catar: 'qat', cat: 'qat', kat: 'qat',
  paraguay: 'par', paraguai: 'par', paragua: 'par', paraguaí: 'par', para: 'par', paro: 'par',
  civ: 'civ', costa: 'civ', marfil: 'civ', marfilia: 'civ', marfilio: 'civ', marfilío: 'civ', siv: 'civ', sib: 'civ', cib: 'civ',
  suecia: 'swe', sue: 'swe', sueco: 'swe', sueca: 'swe',
  belgica: 'bel', bel: 'bel', belga: 'bel', vel: 'bel', velga: 'bel',
  egipto: 'egy', egipcio: 'egy', egipcia: 'egy', egypto: 'egy', jipto: 'egy', egi: 'egy', eji: 'egy',
  españa: 'esp', espania: 'esp', españo: 'esp', espana: 'esp', espano: 'esp', esp: 'esp', espa: 'esp', espe: 'esp',
  senegal: 'sen', senegalés: 'sen', senegalesa: 'sen', senega: 'sen', sena: 'sen', cena: 'sen', cen: 'sen',
  ghana: 'gha', gana: 'gha', ganá: 'gha', gan: 'gha', ganaá: 'gha', ga: 'gha'
};

/**
 * Convierte una transcripción de voz en un código de figu si parece serlo,
 * o si no, devuelve el texto normalizado para usar como búsqueda libre.
 *
 * Ejemplos:
 *   "pan dieciséis"   → "PAN16"
 *   "argentina 3"     → "ARGENTINA 3"  (texto libre)
 *   "arg tres"        → "ARG3"
 *   "hache a i ocho"  → "HAI8"
 *   "messi"           → "MESSI"
 */
export const interpretVoiceTranscript = (transcript: string): string => {
  if (!transcript) return '';

  const cleaned = stripAccents(transcript.toLowerCase().trim()).replace(/[.,;!?]/g, '');
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  // 1) Palabras-número → dígitos. Letras deletreadas → letra suelta.
  //    Alias de prefijos (usa/usar/argentina/…) → prefijo del catálogo.
  const normalized = tokens.map((t) => {
    if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, t)) {
      return String(NUMBER_WORDS[t]);
    }
    if (Object.prototype.hasOwnProperty.call(PREFIX_ALIASES, t)) {
      return PREFIX_ALIASES[t];
    }
    if (Object.prototype.hasOwnProperty.call(SPELL_LETTERS, t)) {
      return SPELL_LETTERS[t];
    }
    return t;
  });

  // 2) Atajo: letras + número (ej: "pan 16" o "arg 3").
  if (normalized.length === 2) {
    const [a, b] = normalized;
    if (/^[a-z]{2,4}$/.test(a) && /^\d{1,2}$/.test(b)) {
      return `${a.toUpperCase()}${b}`;
    }
  }

  // 3) Pegar letras sueltas consecutivas: "h a i 8" → "hai 8".
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

  // 4) Sin patrón claro → devolvemos como texto libre para autocomplete.
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

// ---------------------------------------------------------------------------
// Fuzzy matching contra el catálogo real
// ---------------------------------------------------------------------------

/**
 * Distancia de edición clásica (inserciones, borrados y sustituciones).
 * Cadenas cortas — costo despreciable.
 */
const levenshtein = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

/**
 * Toma un texto candidato (ya pasado por `interpretVoiceTranscript`) y trata de
 * extraer una forma `LETRAS + NÚMERO`.
 */
const extractCodeShape = (text: string): { prefix: string; number: string } | null => {
  const compact = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const m = /^([A-Z]+)(\d{1,3})$/.exec(compact);
  if (m) return { prefix: m[1], number: m[2] };
  return null;
};

/**
 * Resultado del intento de match por voz.
 *  - `code` es no-nulo cuando logramos resolver el dictado a un código del catálogo.
 *  - `query` es el texto a poner en el buscador (código resuelto o texto libre).
 */
export interface VoiceMatchResult {
  code: string | null;
  query: string;
  confidence: 'exact' | 'fuzzy' | 'none';
}

/**
 * Achica el universo a los códigos válidos: prueba cada alternativa que devolvió
 * el reconocedor, primero buscando un match exacto y, si no, el prefijo más
 * cercano (distancia Levenshtein ≤ 2) que conserve el mismo número.
 */
export const matchVoiceToStickerCode = (
  alternatives: string[],
  validCodes: Set<string>
): VoiceMatchResult => {
  if (alternatives.length === 0) {
    return { code: null, query: '', confidence: 'none' };
  }

  // Set de prefijos válidos (ARG, BRA, FWC, PAN, TUN, HAI, ...)
  const prefixes = new Set<string>();
  for (const c of validCodes) {
    const m = /^([A-Z]+)\d+$/.exec(c);
    if (m) prefixes.add(m[1]);
  }
  const prefixList = Array.from(prefixes);

  const interpreted = alternatives.map((a) => interpretVoiceTranscript(a));

  // 1) Match exacto en cualquier alternativa
  for (const text of interpreted) {
    const shape = extractCodeShape(text);
    if (!shape) continue;
    const candidate = shape.prefix + shape.number;
    if (validCodes.has(candidate)) {
      return { code: candidate, query: candidate, confidence: 'exact' };
    }
  }

  // 2) Fuzzy match — el prefijo más parecido conservando el número
  let best: { code: string; score: number } | null = null;
  for (const text of interpreted) {
    const shape = extractCodeShape(text);
    if (!shape) continue;
    for (const p of prefixList) {
      const candidate = p + shape.number;
      if (!validCodes.has(candidate)) continue;
      const dist = levenshtein(shape.prefix, p);
      if (dist > 2) continue;
      // Penalizar también la diferencia de longitud para evitar prefijos demasiado distintos.
      const lengthPenalty = Math.abs(shape.prefix.length - p.length) * 0.4;
      const score = dist + lengthPenalty;
      if (!best || score < best.score) {
        best = { code: candidate, score };
      }
    }
  }

  if (best) {
    return { code: best.code, query: best.code, confidence: 'fuzzy' };
  }

  // 3) Sin match — devolvemos la mejor alternativa como búsqueda libre.
  return { code: null, query: interpreted[0] || '', confidence: 'none' };
};

