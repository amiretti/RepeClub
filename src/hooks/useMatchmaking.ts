/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { STICKER_NAMES } from '../stickerData';
import { UserProfile } from '../types';
import { MatchCandidate } from '../components/matchmaker/types';

const haversineDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLng = toRad(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

interface UseMatchmakingParams {
  currentUser: UserProfile | null;
  allUsers: { profile: UserProfile; stickers: { [code: string]: number } }[];
  inventory: { [code: string]: number };
  locationFilter: string;
  searchFiguCode: string;
  searchNickname: string;
  friendIds: string[];
}

export const useMatchmaking = ({
  currentUser,
  allUsers,
  inventory,
  locationFilter,
  searchFiguCode,
  searchNickname,
  friendIds
}: UseMatchmakingParams): MatchCandidate[] => {
  const matches = useMemo(() => {
    if (!currentUser) return [];

    const list: MatchCandidate[] = [];

    allUsers.forEach(({ profile, stickers }) => {
      if (profile.uid === currentUser.uid) return;

      const maxRadius = currentUser.searchRadiusKm || 5;
      const hasCurrentCoords = typeof currentUser.locationLat === 'number' && typeof currentUser.locationLng === 'number';
      const hasOtherCoords = typeof profile.locationLat === 'number' && typeof profile.locationLng === 'number';

      if (hasCurrentCoords && hasOtherCoords) {
        const distanceKm = haversineDistanceKm(
          currentUser.locationLat as number,
          currentUser.locationLng as number,
          profile.locationLat as number,
          profile.locationLng as number
        );

        if (distanceKm > maxRadius) {
          return;
        }
      }

      if (locationFilter.trim() !== '') {
        const userLocLower = (profile.location || '').toLowerCase();
        if (!userLocLower.includes(locationFilter.toLowerCase().trim())) {
          return;
        }
      }

      if (searchNickname.trim() !== '') {
        const nickname = (profile.nickname || '').toLowerCase();
        const name = (profile.name || '').toLowerCase();
        const searchLower = searchNickname.toLowerCase().trim();
        if (!nickname.includes(searchLower) && !name.includes(searchLower)) {
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
  }, [currentUser, allUsers, inventory, locationFilter, searchNickname]);

  const matchesByFigure = useMemo(() => {
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

  return useMemo(() => {
    if (searchNickname.trim() !== '') {
      return matchesByFigure;
    }

    const friendIdSet = new Set(friendIds);
    const friends: MatchCandidate[] = [];
    const others: MatchCandidate[] = [];

    matchesByFigure.forEach((match) => {
      if (friendIdSet.has(match.profile.uid)) {
        friends.push(match);
      } else {
        others.push(match);
      }
    });

    const randomOthers = [...others];
    for (let i = randomOthers.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [randomOthers[i], randomOthers[randomIndex]] = [randomOthers[randomIndex], randomOthers[i]];
    }

    return [...friends, ...randomOthers.slice(0, 5)];
  }, [matchesByFigure, friendIds, searchNickname]);
};
