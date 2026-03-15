"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import { activateBuyerWalletAction } from "@/actions/wallet/wallet";
import { createWalletTopUpSession } from "@/actions/wallet/createWalletTopUpSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function getWalletTransactionTypeLabel(tx: WalletTransaction) {
  if (tx.type === "SELLER_PAYOUT") {
    return tx.status === "PENDING"
      ? "Revenue Earnings Queue"
      : "Revenue Earnings";
  }

  if (tx.type === "RIDER_PAYOUT") {
    return tx.status === "PENDING"
      ? "Delivery Earnings Queue"
      : "Delivery Earnings";
  }

  if (tx.type === "ORDER_PAYMENT") {
    return "Order Payment";
  }

  if (tx.type === "WITHDRAWAL") {
    return "Withdrawal";
  }

  if (tx.type === "DEPOSIT") {
    return "Wallet Top Up";
  }

  return formatTxType(tx.type).replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTransactionDate(tx: WalletTransaction) {
  return tx.activityAt ?? tx.createdAt;
}

function getWalletTransactionStatusLabel(tx: WalletTransaction) {
  const isPayout = tx.type === "SELLER_PAYOUT" || tx.type === "RIDER_PAYOUT";

  if (tx.status === "PENDING" && isPayout) {
    return "Pending release";
  }

  if (tx.status === "SUCCESS" && isPayout) {
    return "Paid";
  }

  if (tx.status === "CANCELLED") {
    return "Cancelled";
  }

  return formatStatus(tx.status);
}

function getWalletTransactionStatusTone(status: WalletTransaction["status"]) {
  if (status === "SUCCESS") return "bg-emerald-50 text-emerald-600";
  if (status === "PENDING") return "bg-amber-50 text-amber-600";
  if (status === "FAILED") return "bg-red-50 text-red-500";
  if (status === "CANCELLED") return "bg-slate-100 text-slate-600";
  return "bg-slate-100 text-slate-600";
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
    <>
      <div className="space-y-3 p-4 sm:hidden">
        {transactions.map((tx) => {
          const isCredit = creditTypes.includes(tx.type);
          const date = new Date(getTransactionDate(tx)).toLocaleString(
            "en-US",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          );

          return (
            <div key={tx.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {tx.description ?? formatTxType(tx.type)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{date}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-2 py-[2px] text-[11px] font-medium",
                    getWalletTransactionStatusTone(tx.status),
                  )}
                >
                  {getWalletTransactionStatusLabel(tx)}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-xs text-gray-500">
                  {getWalletTransactionTypeLabel(tx)}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCredit ? "text-emerald-600" : "text-red-500",
                  )}
                >
                  {isCredit ? "+" : "-"}
                  {formatMoneyFromUSD(tx.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 dark:bg-neutral-800">
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
              const date = new Date(getTransactionDate(tx)).toLocaleString(
                "en-US",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );

              return (
                <tr key={tx.id} className="border-t">
                  <td className="whitespace-nowrap p-3">{date}</td>
                  <td className="max-w-[260px] truncate p-3">
                    {tx.description ?? formatTxType(tx.type)}
                  </td>
                  <td className="whitespace-nowrap p-3 font-medium text-slate-700 dark:text-slate-200">
                    {getWalletTransactionTypeLabel(tx)}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap p-3 text-right font-semibold",
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
                        getWalletTransactionStatusTone(tx.status),
                      )}
                    >
                      {getWalletTransactionStatusLabel(tx)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InactiveBuyerWalletState({
  balance,
  onActivate,
  isActivating,
}: {
  balance: number;
  onActivate: () => void;
  isActivating: boolean;
}) {
  const hasPendingFunds = balance > 0;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-3 py-4 sm:space-y-8 sm:px-4 sm:py-6">
      <section className="relative overflow-hidden rounded-[24px] border border-sky-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.35),_transparent_40%),linear-gradient(135deg,_#07111f,_#10375f_55%,_#1d6fa5)] p-4 text-white shadow-[0_24px_80px_-32px_rgba(3,105,161,0.75)] sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-10">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_65%)] lg:block" />
        <div className="relative grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,360px)] lg:items-center lg:gap-8">
          <div className="space-y-4 sm:space-y-5">
            <Badge className="w-fit border-white/20 bg-white/10 text-white hover:bg-white/10">
              Wallet activation
            </Badge>
            <div className="space-y-2 sm:space-y-3">
              <h1 className="max-w-2xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Unlock faster checkout, instant wallet payments, and smooth
                refunds.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-sky-50/85 sm:text-base">
                Activate your NexaMart Wallet once to save your Stripe customer
                profile and start using wallet payments across checkout and
                refunds.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <Sparkles className="mb-3 h-5 w-5 text-sky-200" />
                <p className="font-medium">Faster checkout</p>
                <p className="mt-1 text-xs text-sky-50/80">
                  Pay from wallet balance in seconds.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <CreditCard className="mb-3 h-5 w-5 text-sky-200" />
                <p className="font-medium">Top up anytime</p>
                <p className="mt-1 text-xs text-sky-50/80">
                  Add funds securely through Stripe Checkout.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur sm:col-span-2 lg:col-span-1">
                <ShieldCheck className="mb-3 h-5 w-5 text-sky-200" />
                <p className="font-medium">Refund-ready</p>
                <p className="mt-1 text-xs text-sky-50/80">
                  Keep refunds available inside your wallet.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="w-full bg-white text-slate-950 hover:bg-sky-50 sm:min-w-[180px] sm:w-auto"
                disabled={isActivating}
                onClick={onActivate}
              >
                {isActivating ? "Activating..." : "Activate Wallet"}
              </Button>
              <p className="max-w-md text-xs leading-5 text-sky-50/80">
                One-time activation. Your wallet stays linked to your NexaMart
                account.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden border-white/15 bg-white/10 py-0 text-white shadow-none backdrop-blur">
            <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl">
                Why activate now
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-sky-50/75">
                Activation prepares your wallet for live use without changing
                ledger history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-5 sm:pb-6">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-100/70">
                  Wallet balance
                </p>
                <div className="mt-2">
                  <WalletBalanceConverter usdBalance={balance} />
                </div>
                <p className="mt-2 text-xs leading-5 text-sky-50/75">
                  {hasPendingFunds
                    ? "Existing wallet funds become usable immediately after activation."
                    : "Your balance stays synced from ledger entries after activation."}
                </p>
              </div>

              <div className="space-y-3 text-sm text-sky-50/85">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>
                    Reuse refunds for future orders without manual reloads.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>
                    Keep Stripe customer details linked to your account once.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>
                    Continue using the same ledger-backed wallet architecture.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

export default function WalletDashboard({ role }: WalletDashboardProps) {
  const roleConfig = WALLET_ROLE_CONFIG[role];
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const {
    data: wallet,
    isLoading,
    isPending,
    isError,
    refetch,
  } = useWallet(role);
  const { data: user } = useCurrentUserQuery();

  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [isActivating, startActivationTransition] = useTransition();
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

  const handleActivateWallet = () => {
    startActivationTransition(async () => {
      try {
        const result = await activateBuyerWalletAction();

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["wallet"] }),
          queryClient.invalidateQueries({ queryKey: ["wallet", "buyer"] }),
        ]);

        await refetch();
        router.refresh();

        toast.success(
          result.code === "ALREADY_ACTIVE"
            ? "Wallet is already active."
            : "Wallet activated successfully.",
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to activate wallet.";
        toast.error(message);
      }
    });
  };

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

  if (role === "buyer" && wallet.status !== "ACTIVE") {
    return (
      <InactiveBuyerWalletState
        balance={wallet.balance}
        onActivate={handleActivateWallet}
        isActivating={isActivating}
      />
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
  const showFundingActions = roleConfig.canFund && wallet.status === "ACTIVE";
  const showWithdrawalHistory = !roleConfig.canFund;
  const withdrawHref = roleConfig.withdrawRoute;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:space-y-8 sm:px-4 sm:py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-semibold">Wallet</h1>
            <Badge
              variant="outline"
              className="border-emerald-200 text-emerald-700"
            >
              Active
            </Badge>
          </div>
          <p className="text-sm text-gray-500">Hello, {greeting}</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {showFundingActions && (
            <>
              <Button
                className="w-full bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)] sm:w-auto"
                onClick={() => setFundDialogOpen(true)}
              >
                Fund Wallet
              </Button>
              {withdrawHref ? (
                <Link href={withdrawHref} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">
                    {roleConfig.withdrawLabel}
                  </Button>
                </Link>
              ) : null}
            </>
          )}
          {!showFundingActions && withdrawHref ? (
            <Link href={withdrawHref} className="w-full sm:w-auto">
              <Button className="w-full bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)] sm:w-auto">
                {roleConfig.withdrawLabel}
                <ArrowUpRight size={16} className="ml-2" />
              </Button>
            </Link>
          ) : null}
        </div>
      </header>

      {showFundingActions ? (
        <section className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-950 sm:p-6">
          <WalletBalanceConverter usdBalance={wallet.balance} />
          <p className="pt-3 text-xs text-gray-500">
            Use your wallet for faster refunds and seamless checkout.
          </p>
          <div className="flex flex-wrap gap-3 pt-3 text-sm text-gray-600 sm:gap-6">
            <span>{creditCount} credits</span>
            <span>{debitCount} debits</span>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-2xl bg-gradient-to-br from-[#3c9ee0] to-[#2d7bb3] p-4 text-white shadow-xl sm:p-6 md:p-8">
            <SellerWalletBalanceConverter usdBalance={wallet.balance} />
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Pending Earnings</p>
                <Clock size={18} className="text-gray-400" />
              </div>
              <h2 className="mt-2 break-words text-2xl font-semibold text-[var(--brand-blue)] sm:text-3xl">
                {formatMoneyFromUSD(wallet.pending)}
              </h2>
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Total Earnings</p>
                <TrendingUp size={18} className="text-gray-400" />
              </div>
              <h2 className="mt-2 break-words text-2xl font-semibold text-[var(--brand-blue)] sm:text-3xl">
                {formatMoneyFromUSD(wallet.totalEarnings)}
              </h2>
            </div>
          </section>
        </>
      )}

      <section className="rounded-xl border bg-white shadow-sm dark:bg-neutral-950">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <p className="text-xs text-gray-500">
            {visibleTransactions.length} items
          </p>
        </div>
        <TransactionTable
          transactions={visibleTransactions}
          creditTypes={roleConfig.credits}
          formatMoneyFromUSD={formatMoneyFromUSD}
        />
      </section>

      {showWithdrawalHistory && (
        <section className="rounded-xl border bg-white shadow-sm dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3 border-b p-4 sm:p-5">
            <h2 className="text-lg font-semibold">Withdrawal History</h2>
            <WalletIcon size={18} className="text-gray-400" />
          </div>
          {wallet.withdrawals.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              No withdrawals yet
            </p>
          ) : (
            <>
              <div className="space-y-3 p-4 sm:hidden">
                {wallet.withdrawals.map((w) => (
                  <div key={w.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--brand-blue)]">
                          {formatMoneyFromUSD(w.amount)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(w.createdAt).toDateString()}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {formatStatus(w.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 dark:bg-neutral-800">
                    <tr>
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Amount</th>
                      <th className="p-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.withdrawals.map((w) => (
                      <tr key={w.id} className="border-t">
                        <td className="whitespace-nowrap p-4">
                          {new Date(w.createdAt).toDateString()}
                        </td>
                        <td className="whitespace-nowrap p-4 font-medium text-[var(--brand-blue)]">
                          {formatMoneyFromUSD(w.amount)}
                        </td>
                        <td className="p-4">{formatStatus(w.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
            <label
              className="text-sm font-medium"
              htmlFor="wallet-topup-amount"
            >
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
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isFunding}
              onClick={() => setFundDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)] sm:w-auto"
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
