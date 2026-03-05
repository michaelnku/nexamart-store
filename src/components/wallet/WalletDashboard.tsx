"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpRight, Clock, TrendingUp, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SellerWalletBalanceConverter,
  WalletBalanceConverter,
} from "@/components/currency/WalletBalanceConverter";
import { WalletSkeleton } from "@/components/skeletons/WalletSkeleton";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { createWalletTopUpSession } from "@/actions/wallet/createWalletTopUpSession";
import { cn } from "@/lib/utils";
import { WalletTransaction, WalletTransactionType } from "@/lib/types";
import { useWallet } from "@/hooks/useWallet";
import { WalletRole } from "@/types/wallet";
import { WALLET_ROLE_CONFIG } from "@/lib/wallet/walletRoleConfig";

type WalletDashboardProps = {
  role: WalletRole;
};

function formatTxType(type: string) {
  return type.toLowerCase().replace(/_/g, " ");
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function TransactionTable({
  transactions,
  creditTypes,
  formatMoneyFromUSD,
}: {
  transactions: WalletTransaction[];
  creditTypes: WalletTransactionType[];
  formatMoneyFromUSD: (amount: number) => string;
}) {
  if (transactions.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-gray-500">
        No wallet activity yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-600">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Details</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-right">Amount</th>
            <th className="p-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isCredit = creditTypes.includes(tx.type);
            const date = new Date(tx.createdAt).toLocaleString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <tr key={tx.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{date}</td>
                <td className="p-3 max-w-[260px] truncate">
                  {tx.description ?? formatTxType(tx.type)}
                </td>
                <td className="p-3 capitalize whitespace-nowrap">{formatTxType(tx.type)}</td>
                <td
                  className={cn(
                    "p-3 text-right font-semibold whitespace-nowrap",
                    isCredit ? "text-emerald-600" : "text-red-500",
                  )}
                >
                  {isCredit ? "+" : "-"}
                  {formatMoneyFromUSD(tx.amount)}
                </td>
                <td className="p-3 text-right">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-[2px] text-[11px] font-medium",
                      tx.status === "SUCCESS" && "bg-emerald-50 text-emerald-600",
                      tx.status === "PENDING" && "bg-amber-50 text-amber-600",
                      tx.status === "FAILED" && "bg-red-50 text-red-500",
                    )}
                  >
                    {tx.status.toLowerCase()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function WalletDashboard({ role }: WalletDashboardProps) {
  const roleConfig = WALLET_ROLE_CONFIG[role];
  const searchParams = useSearchParams();
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const { data: wallet, isLoading, isPending, isError, refetch } = useWallet(role);
  const { data: user } = useCurrentUserQuery();

  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (!roleConfig.canFund) return;
    const topup = searchParams.get("topup");
    if (topup === "success") {
      void refetch();
      toast.success("Wallet funded successfully");
      setIsFunding(false);
      return;
    }
    if (topup === "cancel") {
      toast.error("Wallet funding was canceled");
      setIsFunding(false);
    }
  }, [roleConfig.canFund, refetch, searchParams]);

  const handleFundWallet = async () => {
    if (!Number.isFinite(amount) || amount < 1) {
      toast.error("Enter a valid top-up amount (minimum $1).");
      return;
    }

    try {
      setIsFunding(true);
      const checkoutUrl = await createWalletTopUpSession(amount);
      window.location.href = checkoutUrl;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to start wallet funding.";
      toast.error(message);
      setIsFunding(false);
    }
  };

  if (isLoading || isPending) return <WalletSkeleton role={role} />;
  if (isError || !wallet) {
    return (
      <p className="py-20 text-center text-red-600">Failed to load wallet</p>
    );
  }

  const greeting = user?.name?.split(" ")[0] || user?.username || "User";

  const visibleTransactions = wallet.transactions.filter((tx) =>
    roleConfig.visibleTypes.includes(tx.type),
  );
  const creditCount = visibleTransactions.filter((tx) =>
    roleConfig.credits.includes(tx.type),
  ).length;
  const debitCount = visibleTransactions.filter((tx) =>
    roleConfig.debits.includes(tx.type),
  ).length;

  const showFundingActions = roleConfig.canFund;
  const showWithdrawalHistory = !roleConfig.canFund;
  const withdrawHref = roleConfig.withdrawRoute;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Wallet</h1>
          <p className="text-sm text-gray-500">Hello, {greeting}</p>
        </div>

        <div className="flex gap-2">
          {showFundingActions && (
            <>
              <Button
                className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)]"
                onClick={() => setFundDialogOpen(true)}
              >
                Fund Wallet
              </Button>
              {withdrawHref ? (
                <Link href={withdrawHref}>
                  <Button variant="outline">{roleConfig.withdrawLabel}</Button>
                </Link>
              ) : (
                <Button variant="outline">{roleConfig.withdrawLabel}</Button>
              )}
            </>
          )}
          {withdrawHref && (
            <Link href={withdrawHref}>
              <Button className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)]">
                {roleConfig.withdrawLabel}
                <ArrowUpRight size={16} className="ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      {showFundingActions ? (
        <section className="rounded-xl border bg-white p-6 shadow-sm dark:bg-neutral-950">
          <WalletBalanceConverter usdBalance={wallet.balance} />
          <p className="pt-3 text-xs text-gray-500">
            Use your wallet for faster refunds and seamless checkout.
          </p>
          <div className="flex gap-6 pt-3 text-sm text-gray-600">
            <span>{creditCount} credits</span>
            <span>{debitCount} debits</span>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-2xl bg-gradient-to-br from-[#3c9ee0] to-[#2d7bb3] p-8 text-white shadow-xl">
            <SellerWalletBalanceConverter usdBalance={wallet.balance} />
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Pending Earnings</p>
                <Clock size={18} className="text-gray-400" />
              </div>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--brand-blue)]">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: wallet.currency,
                }).format(wallet.pending)}
              </h2>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Total Earnings</p>
                <TrendingUp size={18} className="text-gray-400" />
              </div>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--brand-blue)]">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: wallet.currency,
                }).format(wallet.totalEarnings)}
              </h2>
            </div>
          </section>
        </>
      )}

      <section className="rounded-xl border bg-white shadow-sm dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <p className="text-xs text-gray-500">{visibleTransactions.length} items</p>
        </div>
        <TransactionTable
          transactions={visibleTransactions}
          creditTypes={roleConfig.credits}
          formatMoneyFromUSD={formatMoneyFromUSD}
        />
      </section>

      {showWithdrawalHistory && (
        <section className="rounded-xl border bg-white shadow-sm dark:bg-neutral-950">
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="text-lg font-semibold">Withdrawal History</h2>
            <WalletIcon size={18} className="text-gray-400" />
          </div>
          {wallet.withdrawals.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              No withdrawals yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-600">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.withdrawals.map((w) => (
                    <tr key={w.id} className="border-t">
                      <td className="p-4 whitespace-nowrap">
                        {new Date(w.createdAt).toDateString()}
                      </td>
                      <td className="p-4 whitespace-nowrap font-medium text-[var(--brand-blue)]">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: wallet.currency,
                        }).format(w.amount)}
                      </td>
                      <td className="p-4">
                        {formatStatus(w.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fund Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount you want to add. You will be redirected to Stripe
              Checkout to complete payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="wallet-topup-amount">
              Amount (USD)
            </label>
            <Input
              id="wallet-topup-amount"
              type="number"
              min={1}
              step={1}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isFunding}
              onClick={() => setFundDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)]"
              disabled={isFunding || amount <= 0}
              onClick={handleFundWallet}
            >
              {isFunding ? "Redirecting..." : "Top Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
