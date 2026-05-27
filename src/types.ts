/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  location: string;
  updatedAt: string;
}

export interface UserStickerInventory {
  userId: string;
  stickers: { [code: string]: number }; // code -> count (0: don't have, 1: have 0 repeats, >=2: have with repeats)
  updatedAt: string;
}

export interface TradeOffer {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  offeredStickers: string[]; // Codes of stickers offered
  requestedStickers: string[]; // Codes of stickers requested
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'trade_incoming' | 'trade_update';
  tradeId: string;
  read: boolean;
  createdAt: string;
}

export interface TeamGroup {
  code: string;
  name: string;
  flag: string;
  startNum: number;
  endNum: number;
}
