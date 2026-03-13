import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import ReferralCodeCard from "../../_components/ReferralCodeCard";
import ReferralEarningsCard from "../../_components/ReferralEarningsCard";
import { Card, CardContent } from "@/components/ui/card";

export default async function ReferralsPage() {
  const user = await CurrentUser();
  if (!user) return null;

  const referralCode = await prisma.referralCode.findUnique({
    where: { userId: user.id },
    select: { code: true },
  });

  const [referrals, rewardSum] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        referred: { select: { email: true, name: true } },
      },
    }),
    prisma.referralReward.aggregate({
      where: { beneficiaryId: user.id, role: "REFERRER", status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  const stats = {
    total: referrals.length,
    qualified: referrals.filter((r) => r.status === "QUALIFIED").length,
    rewarded: referrals.filter((r) => r.status === "REWARDED").length,
    earned: rewardSum._sum.amount ?? 0,
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-6 text-slate-950 dark:text-zinc-100">
      <div>
        <h1 className="text-2xl font-semibold">Referrals</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Invite friends and earn bonuses when they place their first order.
        </p>
      </div>

      {referralCode?.code && (
        <ReferralCodeCard code={referralCode.code} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total referred</div>
            <div className="text-xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Qualified</div>
            <div className="text-xl font-semibold">{stats.qualified}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-zinc-800 dark:bg-neutral-950">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Rewarded</div>
            <div className="text-xl font-semibold">{stats.rewarded}</div>
          </CardContent>
        </Card>
        <ReferralEarningsCard usdAmount={stats.earned} />
      </div>

      <Card className="dark:border-zinc-800 dark:bg-neutral-950">
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full border text-sm dark:border-zinc-800">
            <thead className="bg-gray-100 dark:bg-zinc-900">
              <tr>
                <th className="border p-3 text-left dark:border-zinc-800">Friends</th>
                <th className="border p-3 text-left dark:border-zinc-800">Email</th>
                <th className="border p-3 text-left dark:border-zinc-800">Status</th>
                <th className="border p-3 text-left dark:border-zinc-800">Joined</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/70">
                  <td className="p-3 border">{r.referred.name ?? "—"}</td>
                  <td className="border p-3 dark:border-zinc-800">{r.referred.email}</td>
                  <td className="border p-3 dark:border-zinc-800">{r.status}</td>
                  <td className="border p-3 dark:border-zinc-800">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {referrals.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500 dark:text-zinc-400">
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
