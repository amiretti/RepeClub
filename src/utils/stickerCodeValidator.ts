/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { STICKER_NAMES } from '../stickerData';

const VALID_CODES = new Set(Object.keys(STICKER_NAMES));

const OCR_CHAR_FIXES: Record<string, string> = {
  O: '0',
  I: '1',
  L: '1',
  S: '5',
  Z: '2',
  B: '8'
};

const normalizeRawToken = (raw: string): string => {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

const splitPrefixAndNumeric = (token: string): { prefix: string; numeric: string } | null => {
  const match = token.match(/^([A-Z]{2,3})([A-Z0-9]{1,2})$/);
  if (!match) return null;
  return { prefix: match[1], numeric: match[2] };
};

const normalizeNumericPart = (numeric: string): string => {
  const chars = numeric
    .split('')
    .map((ch) => OCR_CHAR_FIXES[ch] || ch)
    .join('');

  return chars.replace(/[^0-9]/g, '');
};

export const extractStickerCodeFromText = (rawText: string): string | null => {
  const upper = rawText.toUpperCase();

  // Try friendly tokenization first
  const roughTokens = upper
    .replace(/\n/g, ' ')
    .split(/\s+/)
    .map((t) => normalizeRawToken(t))
    .filter(Boolean);

  // Build extra candidates by joining adjacent tokens (e.g. "PAN" + "16")
  const candidates = new Set<string>(roughTokens);
  for (let i = 0; i < roughTokens.length - 1; i++) {
    candidates.add(`${roughTokens[i]}${roughTokens[i + 1]}`);
  }

  // Also include fully compacted text for difficult OCR outputs
  const compact = normalizeRawToken(upper);
  if (compact.length >= 3) {
    for (let i = 0; i <= compact.length - 3; i++) {
      for (let len = 3; len <= 5 && i + len <= compact.length; len++) {
        candidates.add(compact.slice(i, i + len));
      }
    }
  }

  for (const candidate of candidates) {
    const parts = splitPrefixAndNumeric(candidate);
    if (!parts) continue;

    const numeric = normalizeNumericPart(parts.numeric);
    if (!numeric) continue;

    const normalized = `${parts.prefix}${String(Number(numeric))}`;
    if (VALID_CODES.has(normalized)) {
      return normalized;
    }
  }

  return null;
};

export const isValidStickerCode = (code: string): boolean => {
  return VALID_CODES.has(code.toUpperCase().trim());
};
