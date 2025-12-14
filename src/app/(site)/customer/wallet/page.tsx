"use client";

import { CustomerWalletSkeleton } from "@/components/skeletons/WalletSkeleton";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/getCurrentUser";
import { useBuyerWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export default function CustomerWalletPage() {
  const { data: wallet, isPending, error } = useBuyerWallet();
  const user = useCurrentUser();

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

  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: wallet.currency || "USD",
  }).format(wallet.balance || 0);

  return (
    <main className="max-w-4xl mx-auto px-4 py-4 space-y-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Wallet</h1>
          <p className="text-sm text-gray-500">
            Hello, {user?.name?.split(" ")[0]}
          </p>
        </div>

        <div className="flex gap-2">
          <Button className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white px-6">
            Fund Wallet
          </Button>
          <Button variant="outline" className="px-6">
            Withdraw
          </Button>
        </div>
      </header>

      {/* BALANCE SUMMARY */}
      <section className="bg-white border shadow-sm rounded-xl p-6 space-y-4">
        <p className="text-sm font-medium text-gray-600 uppercase">
          Available Balance
        </p>
        <p className="text-4xl font-bold text-[var(--brand-blue)]">
          {formattedBalance}
        </p>
        <p className="text-xs text-gray-500">
          Use your wallet for faster refunds and seamless checkout.
        </p>
        <div className="flex gap-3 pt-3">
          <div className="flex items-center gap-2 text-gray-600">
            <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">
              {
                wallet.transactions.filter((t: any) =>
                  ["DEPOSIT", "REFUND", "EARNING"].includes(t.type)
                ).length
              }{" "}
              credits
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <ArrowUpCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">
              {
                wallet.transactions.filter((t: any) =>
                  ["ORDER_PAYMENT", "WITHDRAWAL"].includes(t.type)
                ).length
              }{" "}
              debits
            </span>
          </div>
        </div>
      </section>

      {/* TRANSACTION HISTORY */}
      <section className="bg-white border shadow-sm rounded-xl overflow-hidden">
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
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Details</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                  <th className="px-4 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {wallet.transactions.map((tx: any) => {
                  const isCredit = ["DEPOSIT", "REFUND", "EARNING"].includes(
                    tx.type
                  );
                  const date = new Date(tx.createdAt).toLocaleString("en-NG", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const amount = new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: wallet.currency,
                  }).format(tx.amount);

                  return (
                    <tr key={tx.id} className="border-t">
                      <td className="px-4 py-2">{date}</td>
                      <td className="px-4 py-2">
                        {tx.description || tx.type.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-2 capitalize">
                        {tx.type.toLowerCase().replace(/_/g, " ")}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2 text-right font-semibold",
                          isCredit ? "text-emerald-600" : "text-red-500"
                        )}
                      >
                        {isCredit ? "+" : "-"}
                        {amount}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium",
                            tx.status === "SUCCESS" &&
                              "bg-emerald-50 text-emerald-600",
                            tx.status === "PENDING" &&
                              "bg-amber-50 text-amber-600",
                            tx.status === "FAILED" && "bg-red-50 text-red-500"
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
