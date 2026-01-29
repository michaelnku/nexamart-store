"use client";

import Link from "next/link";
import SettingsCard from "@/components/settings/SettingsCard";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { useBuyerWallet } from "@/hooks/useWallet";
import { WalletBalanceConverter } from "@/components/currency/WalletBalanceConverter";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { WalletTransactionType } from "@/lib/types";
import WalletSectionSkeleton from "@/components/skeletons/WalletSectionSkeleton";

const CREDIT_TYPES: WalletTransactionType[] = ["DEPOSIT", "REFUND", "EARNING"];
const DEBIT_TYPES: WalletTransactionType[] = [
  "ORDER_PAYMENT",
  "WITHDRAWAL",
  "SELLER_PAYOUT",
];

export default function WalletSection() {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const { data: wallet, isPending } = useBuyerWallet();

  if (isPending) return <WalletSectionSkeleton />;

  if (!wallet) {
    return (
      <SettingsCard title="Wallet">
        <p className="text-sm text-red-500">
          Unable to load wallet information.
        </p>
      </SettingsCard>
    );
  }

  const credits = wallet.transactions.filter((t) =>
    CREDIT_TYPES.includes(t.type),
  ).length;

  const debits = wallet.transactions.filter((t) =>
    DEBIT_TYPES.includes(t.type),
  ).length;

  const recentTx = wallet.transactions.slice(0, 3);

  return (
    <SettingsCard title="Wallet">
      <div className="space-y-5">
        {/* BALANCE */}
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-[#3c9ee0]" />
          <div>
            <p className="text-sm text-gray-500">Wallet Balance</p>
            <WalletBalanceConverter usdBalance={wallet.balance} />
          </div>
        </div>

        {/* STATS */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
            {credits} credits
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <ArrowUpCircle className="w-4 h-4 text-red-500" />
            {debits} debits
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        {recentTx.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Recent activity</p>

            {recentTx.map((tx) => {
              const isCredit = CREDIT_TYPES.includes(tx.type);

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 truncate">
                    {tx.description ?? tx.type.toLowerCase().replace(/_/g, " ")}
                  </span>

                  <span
                    className={`font-semibold ${
                      isCredit ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {isCredit ? "+" : "-"}
                    {formatMoneyFromUSD(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ACTION */}
        <Link href="/wallet">
          <Button
            variant="outline"
            className="w-full border-[#3c9ee0] text-[#3c9ee0] hover:bg-[#3c9ee0]/10"
          >
            View full wallet
          </Button>
        </Link>
      </div>
    </SettingsCard>
  );
}
