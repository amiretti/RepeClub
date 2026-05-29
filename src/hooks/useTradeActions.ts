/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface UseTradeActionsParams {
  createTradeOffer: (receiverId: string, offered: string[], requested: string[]) => Promise<void>;
}

export const useTradeActions = ({ createTradeOffer }: UseTradeActionsParams) => {
  const proposeAutoTrade = async (userId: string, offered: string[], requested: string[]) => {
    // Keep trade proposals concise to avoid noisy requests.
    const offeredSubset = offered.slice(0, 5);
    const requestedSubset = requested.slice(0, 5);

    await createTradeOffer(userId, offeredSubset, requestedSubset);
    alert('🎯 ¡Listo! Mandamos la propuesta de canje. Ahora queda esperar que te la acepten.');
  };

  return {
    proposeAutoTrade
  };
};
