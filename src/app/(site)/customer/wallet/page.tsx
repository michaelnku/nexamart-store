"use client";

import WalletDashboard from "@/components/wallet/WalletDashboard";

export default function CustomerWalletPage() {
  return (
    <div className="bg-white dark:bg-neutral-950">
      <WalletDashboard role="buyer" />
    </div>
  );
}
