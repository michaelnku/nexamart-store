"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CustomerWalletSkeleton } from "@/components/skeletons/WalletSkeleton";
import { Button } from "@/components/ui/button";
import { useBuyerWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { WalletTransactionType } from "@/lib/types";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { WalletBalanceConverter } from "@/components/currency/WalletBalanceConverter";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { createWalletTopUpSession } from "@/actions/wallet/createWalletTopUpSession";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const CREDIT_TYPES: WalletTransactionType[] = ["DEPOSIT", "REFUND", "EARNING"];

const DEBIT_TYPES: WalletTransactionType[] = [
  "ORDER_PAYMENT",
  "WITHDRAWAL",
  "SELLER_PAYOUT",
];

export default function CustomerWalletPage() {
  const searchParams = useSearchParams();
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const { data: wallet, isPending, error, refetch } = useBuyerWallet();
  const { data: user } = useCurrentUserQuery();
  const [isFunding, setIsFunding] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [fundDialogOpen, setFundDialogOpen] = useState(false);

  useEffect(() => {
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
  }, [refetch, searchParams]);

  async function handleFundWallet() {
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
  }

  if (isPending) return <CustomerWalletSkeleton />;

  if (error || !wallet) {
    return (
      <div className="px-4 md:px-8 py-8">
        <p className="text-red-500 text-sm">
          Could not load wallet. Please refresh the page.
        </p>
      </div>
    );
  }

  const creditCount = wallet.transactions.filter((t) =>
    CREDIT_TYPES.includes(t.type),
  ).length;

  const debitCount = wallet.transactions.filter((t) =>
    DEBIT_TYPES.includes(t.type),
  ).length;

  return (
    <main className="max-w-4xl mx-auto  px-4 py-4 space-y-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Wallet</h1>
          <p className="text-sm text-gray-500">
            Hello, {user?.name?.split(" ")[0] || user?.username}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white px-6"
            onClick={() => setFundDialogOpen(true)}
          >
            Fund Wallet
          </Button>
          <Button variant="outline" className="px-6">
            Withdraw
          </Button>
        </div>
      </header>

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
              className="text-sm font-medium "
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
            <p className="text-xs text-muted-foreground">
              Minimum $1, maximum $10,000.
            </p>
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
              className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
              disabled={isFunding || amount <= 0}
              onClick={handleFundWallet}
            >
              {isFunding ? "Redirecting..." : "Top Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BALANCE SUMMARY */}
      <section className="bg-white dark:bg-neutral-950 border shadow-sm rounded-xl p-6 space-y-4">
        <WalletBalanceConverter usdBalance={wallet.balance} />

        <p className="text-xs text-gray-500">
          Use your wallet for faster refunds and seamless checkout.
        </p>

        <div className="flex gap-6 pt-3">
          <div className="flex items-center gap-2 text-gray-600">
            <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">{creditCount} credits</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <ArrowUpCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">{debitCount} debits</span>
          </div>
        </div>
      </section>

      {/* TRANSACTION HISTORY */}
      <section className="bg-white dark:bg-neutral-950 border shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <p className="font-semibold text-sm">Transaction History</p>
          <p className="text-xs text-gray-500">
            Latest {wallet.transactions.length} activities
          </p>
        </div>

        {wallet.transactions.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-500 text-sm">
            No wallet activity yet.
            <br /> Refunds and payments will show here.
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Details</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">Status</th>
                </tr>
              </thead>

              <tbody>
                {wallet.transactions.map((tx) => {
                  const isCredit = CREDIT_TYPES.includes(tx.type);

                  const date = new Date(tx.createdAt).toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={tx.id} className="border-t">
                      <td className="px-4 py-2">{date}</td>

                      <td className="px-4 py-2">
                        {tx.description ??
                          tx.type.toLowerCase().replace(/_/g, " ")}
                      </td>

                      <td className="px-4 py-2 capitalize">
                        {tx.type.toLowerCase().replace(/_/g, " ")}
                      </td>

                      <td
                        className={cn(
                          "px-4 py-2 text-right font-semibold",
                          isCredit ? "text-emerald-600" : "text-red-500",
                        )}
                      >
                        {isCredit ? "+" : "-"}
                        {formatMoneyFromUSD(tx.amount)}
                      </td>

                      <td className="px-4 py-2 text-right">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-[2px] text-[11px] font-medium",
                            tx.status === "SUCCESS" &&
                              "bg-emerald-50 text-emerald-600",
                            tx.status === "PENDING" &&
                              "bg-amber-50 text-amber-600",
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
        )}
      </section>
    </main>
  );
}
