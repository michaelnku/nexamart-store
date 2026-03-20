import ReferralStatusBadge from "@/components/referrals/ReferralStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { isReferralAwaitingRewardStatus } from "@/lib/referrals/ui";
import { redirect } from "next/navigation";

export default async function AdminReferralsPage() {
  const user = await CurrentUser();
  if (!user || user.role !== UserRole.ADMIN) redirect("/marketplace/dashboard");

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

  const stats = {
    total: referrals.length,
    pendingQualification: referrals.filter(
      (referral) => referral.status === "PENDING_QUALIFICATION",
    ).length,
    awaitingReward: referrals.filter((referral) =>
      isReferralAwaitingRewardStatus(referral.status),
    ).length,
    rewarded: referrals.filter((referral) => referral.status === "REWARDED")
      .length,
    totalPaid: rewardsSum._sum.amount ?? 0,
  };

  return (
    <main className="max-w-full space-y-6 overflow-x-hidden text-slate-950 dark:text-zinc-100">
      <div>
        <h1 className="text-lg font-bold sm:text-xl md:text-3xl">Referrals</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Monitor referral qualification progress, payout backlog, and total
          treasury-funded rewards paid across both reward sides.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total referrals</div>
            <div className="text-xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">
              Pending qualification
            </div>
            <div className="text-xl font-semibold">
              {stats.pendingQualification}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Awaiting reward</div>
            <div className="text-xl font-semibold">{stats.awaitingReward}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Rewarded</div>
            <div className="text-xl font-semibold">{stats.rewarded}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total paid</div>
            <div className="text-xl font-semibold">${stats.totalPaid}</div>
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
                <th className="border p-3 text-left dark:border-zinc-800">
                  Referrer
                </th>
                <th className="border p-3 text-left dark:border-zinc-800">
                  Referred
                </th>
                <th className="border p-3 text-left dark:border-zinc-800">
                  Status
                </th>
                <th className="border p-3 text-left dark:border-zinc-800">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr
                  key={referral.id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-900/70"
                >
                  <td className="border p-3 dark:border-zinc-800">
                    {referral.referrer.name ?? "-"} ({referral.referrer.email})
                  </td>
                  <td className="border p-3 dark:border-zinc-800">
                    {referral.referred.name ?? "-"} ({referral.referred.email})
                  </td>
                  <td className="border p-3 dark:border-zinc-800">
                    <ReferralStatusBadge status={referral.status} />
                  </td>
                  <td className="border p-3 dark:border-zinc-800">
                    {new Date(referral.createdAt).toLocaleDateString()}
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
