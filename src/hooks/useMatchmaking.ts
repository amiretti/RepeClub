/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { STICKER_NAMES } from '../stickerData';
import { UserProfile } from '../types';
import { MatchCandidate } from '../components/matchmaker/types';

interface UseMatchmakingParams {
  currentUser: UserProfile | null;
  allUsers: { profile: UserProfile; stickers: { [code: string]: number } }[];
  inventory: { [code: string]: number };
  locationFilter: string;
  searchFiguCode: string;
}

export const useMatchmaking = ({
  currentUser,
  allUsers,
  inventory,
  locationFilter,
  searchFiguCode
}: UseMatchmakingParams): MatchCandidate[] => {
  const matches = useMemo(() => {
    if (!currentUser) return [];

    const list: MatchCandidate[] = [];

    allUsers.forEach(({ profile, stickers }) => {
      if (profile.uid === currentUser.uid) return;

      if (locationFilter.trim() !== '') {
        const userLocLower = (profile.location || '').toLowerCase();
        if (!userLocLower.includes(locationFilter.toLowerCase().trim())) {
          return;
        }
      }

      const offered: string[] = [];
      const requested: string[] = [];

      Object.keys(stickers).forEach((code) => {
        const otherCount = stickers[code] || 0;
        const myCount = inventory[code] || 0;

        if (otherCount >= 2 && myCount === 0) {
          requested.push(code);
        }
      });

      Object.keys(inventory).forEach((code) => {
        const myCount = inventory[code] || 0;
        const otherCount = stickers[code] || 0;

        if (myCount >= 2 && otherCount === 0) {
          offered.push(code);
        }
      });

      if (offered.length > 0 || requested.length > 0) {
        list.push({
          profile,
          offered,
          requested,
          isDoubleMatch: offered.length > 0 && requested.length > 0
        });
      }
    });

    return list.sort((a, b) => {
      if (a.isDoubleMatch !== b.isDoubleMatch) {
        return a.isDoubleMatch ? -1 : 1;
      }
      return (b.offered.length + b.requested.length) - (a.offered.length + a.requested.length);
    });
  }, [currentUser, allUsers, inventory, locationFilter]);

  return useMemo(() => {
    if (searchFiguCode.trim() === '') return matches;

    const searchLower = searchFiguCode.toLowerCase().trim();
    const matchedCodes: string[] = [searchFiguCode.toUpperCase().trim()];

    Object.keys(STICKER_NAMES).forEach((code) => {
      const details = STICKER_NAMES[code];
      const nameMatch = details.name.toLowerCase().includes(searchLower);
      const teamMatch = details.team.toLowerCase().includes(searchLower);
      const codeMatch = code.toLowerCase().includes(searchLower);

      if ((nameMatch || teamMatch || codeMatch) && !matchedCodes.includes(code)) {
        matchedCodes.push(code);
      }
    });

    return matches.filter((match) => {
      return matchedCodes.some((code) => match.requested.includes(code) || match.offered.includes(code));
    });
  }, [matches, searchFiguCode]);
};
