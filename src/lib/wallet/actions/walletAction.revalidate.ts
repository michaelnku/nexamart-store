import { revalidatePath } from "next/cache";
import { BUYER_WALLET_REVALIDATE_PATHS } from "./walletAction.constants";

export function revalidateBuyerWalletPaths() {
  for (const path of BUYER_WALLET_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

