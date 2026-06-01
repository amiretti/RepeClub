/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SPECIALS, TEAMS, getStickersForGroup } from '../catalog';

const REGIONAL_INDICATOR_START = 0x1f1e6;
const REGIONAL_INDICATOR_END = 0x1f1ff;

const WA_FLAG_FALLBACK_BY_TEAM_CODE: Record<string, string> = {
  ENG: '🇬🇧',
  SCO: '🇬🇧'
};

const isRegionalIndicatorFlag = (emoji: string): boolean => {
  const codePoints = Array.from(emoji).map((char) => char.codePointAt(0) || 0);
  return (
    codePoints.length === 2 &&
    codePoints.every((cp) => cp >= REGIONAL_INDICATOR_START && cp <= REGIONAL_INDICATOR_END)
  );
};

export interface ReportGroup {
  code: string;
  flag: string;
  stickers: string[];
}

const buildReportGroups = (): ReportGroup[] => {
  const fwcGroupA = SPECIALS.find((group) => group.code === 'FWC-A');
  const fwcGroupB = SPECIALS.find((group) => group.code === 'FWC-B');
  const ccGroup = SPECIALS.find((group) => group.code === 'CC');

  const fwcStickers = [
    ...(fwcGroupA ? getStickersForGroup(fwcGroupA) : []),
    ...(fwcGroupB ? getStickersForGroup(fwcGroupB) : [])
  ];

  const specialGroups: ReportGroup[] = [];

  if (fwcStickers.length > 0) {
    specialGroups.push({ code: 'FWC', flag: '⚽', stickers: fwcStickers });
  }

  if (ccGroup) {
    specialGroups.push({ code: ccGroup.code, flag: ccGroup.flag, stickers: getStickersForGroup(ccGroup) });
  }

  const teamReportGroups = TEAMS
    .filter((group) => !group.code.includes('-'))
    .map((group) => ({
      code: group.code,
      flag: group.flag,
      stickers: getStickersForGroup(group)
    }));

  return [...specialGroups, ...teamReportGroups];
};

const REPORT_GROUPS = buildReportGroups();

/**
 * Given a list of sticker codes, returns one line per country/group with
 * the codes that belong to that group, formatted for a WhatsApp message
 * (e.g. "- 🇦🇷: ARG1, ARG2"). Groups without matches are skipped.
 */
export const buildStickerReportLinesForCodes = (codes: string[]): string[] => {
  if (codes.length === 0) return [];

  const codeSet = new Set(codes);
  const lines: string[] = [];

  for (const group of REPORT_GROUPS) {
    const matchedCodes = group.stickers.filter((code) => codeSet.has(code));

    if (matchedCodes.length === 0) continue;

    const waFlag = isRegionalIndicatorFlag(group.flag)
      ? group.flag
      : WA_FLAG_FALLBACK_BY_TEAM_CODE[group.code] || group.flag || '';

    const countryLabel = waFlag || group.code;

    lines.push(`- ${countryLabel}: ${matchedCodes.join(', ')}`);
  }

  return lines;
};
