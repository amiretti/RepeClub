/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface UseTradeActionsParams {
  createTradeOffer: (receiverId: string, offered: string[], requested: string[], tradeType?: 'auto' | 'manual') => Promise<void>;
  onAutoTradeSent?: () => void;
}

export const useTradeActions = ({ createTradeOffer, onAutoTradeSent }: UseTradeActionsParams) => {
  const proposeAutoTrade = async (userId: string, offered: string[], requested: string[]) => {
    // Keep trade proposals concise to avoid noisy requests.
    const offeredSubset = offered.slice(0, 5);
    const requestedSubset = requested.slice(0, 5);

    await createTradeOffer(userId, offeredSubset, requestedSubset, 'auto');
    onAutoTradeSent?.();
  };

  return {
    proposeAutoTrade
  };
};
