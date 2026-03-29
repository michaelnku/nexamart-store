"use server";

import { CurrentUser } from "@/lib/currentUser";
import {
  requireBuyerUserContext,
  requireRiderUserContext,
  requireSellerUserContext,
} from "@/lib/wallet/actions/walletAction.auth";
import { activateBuyerWalletFlow } from "@/lib/wallet/actions/activateBuyerWalletFlow";
import { loadBuyerWalletView } from "@/lib/wallet/actions/loadBuyerWalletView";
import { loadRiderWalletView } from "@/lib/wallet/actions/loadRiderWalletView";
import { loadSellerWalletView } from "@/lib/wallet/actions/loadSellerWalletView";
import { runBuyerWalletCredit } from "@/lib/wallet/actions/runBuyerWalletCredit";
import { runBuyerWalletDebit } from "@/lib/wallet/actions/runBuyerWalletDebit";
import type { ActivateBuyerWalletResult } from "@/lib/wallet/actions/walletAction.types";

export type { ActivateBuyerWalletResult };

export async function getBuyerWalletAction() {
  const { userId } = await requireBuyerUserContext();
  return loadBuyerWalletView(userId);
}

export async function activateBuyerWalletAction(): Promise<ActivateBuyerWalletResult> {
  const currentUser = await CurrentUser();
  return activateBuyerWalletFlow(currentUser ?? { id: null });
}

export async function creditBuyerWalletAction(
  userId: string,
  amount: number,
  description?: string,
  reference?: string,
) {
  return runBuyerWalletCredit(userId, amount, description, reference);
}

export async function debitBuyerWalletAction(
  userId: string,
  amount: number,
  description?: string,
  reference?: string,
) {
  return runBuyerWalletDebit(userId, amount, description, reference);
}

export const getSellerWalletAction = async () => {
  const auth = await requireSellerUserContext();
  if ("error" in auth) return { error: "Forbidden" };

  return loadSellerWalletView(auth.user);
};

export const getRiderWalletAction = async () => {
  const auth = await requireRiderUserContext();
  if ("error" in auth) return { error: "Forbidden" };

  return loadRiderWalletView(auth.user);
};
