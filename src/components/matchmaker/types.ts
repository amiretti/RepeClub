/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../../types';

export interface MatchCandidate {
  profile: UserProfile;
  offered: string[];
  requested: string[];
  isDoubleMatch: boolean;
}
