"use client";

import { Button } from "@/components/ui/button";
import { useSellerWallet } from "@/hooks/useWallet";
import Link from "next/link";
import { WalletSkeleton } from "@/components/skeletons/WalletSkeleton";
import { useCurrentUserQuery } from "@/stores/useGetCurrentUserQuery";

export default function SellerWalletPage() {
  const { data: wallet, isLoading, isError } = useSellerWallet();
  const { data: user } = useCurrentUserQuery();

  if (isLoading) {
    return <WalletSkeleton />;
  }

  if (isError || wallet?.error)
    return (
      <p className="text-center text-red-600 py-40">Failed to load wallet</p>
    );

  const balance = wallet?.balance ?? 0;
  const pending = wallet?.pending ?? 0;
  const totalEarnings = wallet?.totalEarnings ?? 0;

  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: wallet?.currency || "USD",
  }).format(balance || 0);

  const formattedPending = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: wallet?.currency || "USD",
  }).format(pending || 0);

  const formattedEarnings = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: wallet?.currency || "USD",
  }).format(totalEarnings || 0);

  return (
    <main className="max-w-4xl mx-auto py-6 px-4 space-y-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Wallet</h1>
          <p className="text-sm text-gray-500">
            Hi, {user?.name?.split(" ")[0] || user?.username}
          </p>
        </div>

        <Link href="/market-place/dashboard/seller/wallet/withdraw">
          <Button className="bg-[#3c9ee0] hover:bg-[#318bc4] shadow px-6">
            Withdraw Funds
          </Button>
        </Link>
      </div>

      {/* BALANCE SUMMARY*/}
      <section className="grid md:grid-cols-3 gap-6">
        {/* Available */}
        <div className="border rounded-xl shadow-sm p-5 bg-white dark:bg-neutral-950 hover:shadow-md transition-all">
          <p className="text-sm text-gray-500">Available Balance</p>
          <h2 className="text-3xl font-bold text-[#3c9ee0] mt-2">
            {formattedBalance}
          </h2>
          <p className="text-xs text-gray-400 mt-1">Ready for withdrawal</p>
        </div>

        {/* Pending */}
        <div className="border rounded-xl shadow-sm p-5 bg-white hover:shadow-md transition-all">
          <p className="text-sm text-gray-500">Pending</p>
          <h2 className="text-2xl font-semibold mt-2">{formattedPending}</h2>
          <p className="text-xs text-gray-400 mt-1">
            Earnings not yet released
          </p>
        </div>

        {/* Total Earnings */}
        <div className="border rounded-xl shadow-sm p-5 bg-white hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Earnings</p>
            <h2 className="text-2xl font-semibold mt-2">{formattedEarnings}</h2>
          </div>
          <p className="text-xs text-gray-400">Lifetime earnings</p>
        </div>
      </section>

      {/* PROGRESS BAR */}
      <section className="bg-white border rounded-xl shadow-sm p-6">
        <p className="font-medium mb-2 text-sm">Earnings Progress</p>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#3c9ee0] transition-all"
            style={{
              width: `${
                wallet?.totalEarnings
                  ? (wallet.balance / wallet.totalEarnings) * 100
                  : 0
              }%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {pending > 0
            ? `${formattedPending} pending to be released`
            : "All earnings released 🎉"}
        </p>
      </section>

      {/* TRANSACTION HISTORY */}
      <section className="bg-white border rounded-xl shadow-sm">
        <h2 className="font-semibold text-lg p-4 border-b">
          Withdrawal History
        </h2>

        {!wallet?.withdrawals || wallet.withdrawals.length === 0 ? (
          <p className="text-gray-500 text-sm p-6 text-center">
            No withdrawals yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {wallet.withdrawals.map((w: any) => (
                  <tr
                    key={w.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-3">
                      {new Date(w.createdAt).toDateString()}
                    </td>
                    <td className="p-3">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: wallet.currency,
                      }).format(w.amount)}
                    </td>
                    <td
                      className={`p-3 font-medium ${
                        w.status === "COMPLETED"
                          ? "text-green-600"
                          : w.status === "PENDING"
                          ? "text-yellow-600"
                          : w.status === "REJECTED"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      {w.status
                        .replace("_", " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
