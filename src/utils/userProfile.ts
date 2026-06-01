/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';

export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const ALLOWED_SEARCH_RADII_KM = [1, 2, 3, 5, 10, 15, 25, 100] as const;

export const getProfileDisplayName = (profile: UserProfile | null | undefined): string => {
  if (!profile) return '';
  return profile.nickname?.trim() || profile.name;
};

export const normalizeUserProfile = (profile: Partial<UserProfile> & Pick<UserProfile, 'uid' | 'name' | 'email' | 'updatedAt'>): UserProfile => {
  const searchRadiusKm = profile.searchRadiusKm && ALLOWED_SEARCH_RADII_KM.includes(profile.searchRadiusKm as typeof ALLOWED_SEARCH_RADII_KM[number])
    ? profile.searchRadiusKm
    : DEFAULT_SEARCH_RADIUS_KM;

  return {
    uid: profile.uid,
    name: profile.name,
    nickname: profile.nickname?.trim() || profile.name,
    email: profile.email,
    photoURL: profile.photoURL ?? null,
    location: profile.location ?? '',
    searchRadiusKm,
    locationPlaceId: profile.locationPlaceId ?? null,
    locationLat: typeof profile.locationLat === 'number' ? profile.locationLat : null,
    locationLng: typeof profile.locationLng === 'number' ? profile.locationLng : null,
    updatedAt: profile.updatedAt
  };
};
