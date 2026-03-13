import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminReferralsPage() {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/marketplace/dashboard");

  const [referrals, rewardsSum] = await Promise.all([
    prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        referrer: { select: { id: true, email: true, name: true } },
        referred: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.referralReward.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
  ]);

  const total = referrals.length;
  const qualified = referrals.filter((r) => r.status === "QUALIFIED").length;
  const rewarded = referrals.filter((r) => r.status === "REWARDED").length;
  const totalPaid = rewardsSum._sum.amount ?? 0;

  return (
    <main className="max-w-full space-y-6 overflow-x-hidden text-slate-950 dark:text-zinc-100">
      <div>
        <h1 className="md:text-3xl text-lg sm:text-xl font-bold">
          Referrals
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Track referral activity and reward performance.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-xl font-semibold">{total}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Qualified</div>
            <div className="text-xl font-semibold">{qualified}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Rewarded</div>
            <div className="text-xl font-semibold">{rewarded}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total paid</div>
            <div className="text-xl font-semibold">${totalPaid}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:border-zinc-800 dark:bg-neutral-950">
        <CardHeader>
          <CardTitle>Referral Activity</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border text-sm dark:border-zinc-800">
            <thead className="bg-gray-100 dark:bg-zinc-900">
              <tr>
                <th className="border p-3 text-left dark:border-zinc-800">Referrer</th>
                <th className="border p-3 text-left dark:border-zinc-800">Referred</th>
                <th className="border p-3 text-left dark:border-zinc-800">Status</th>
                <th className="border p-3 text-left dark:border-zinc-800">Created</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/70">
                  <td className="border p-3 dark:border-zinc-800">
                    {r.referrer.name ?? "—"} ({r.referrer.email})
                  </td>
                  <td className="border p-3 dark:border-zinc-800">
                    {r.referred.name ?? "—"} ({r.referred.email})
                  </td>
                  <td className="border p-3 dark:border-zinc-800">{r.status}</td>
                  <td className="border p-3 dark:border-zinc-800">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-gray-500 dark:text-zinc-400"
                  >
                    No referrals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
