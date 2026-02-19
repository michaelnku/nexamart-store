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
    <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Referrals</h1>
        <p className="text-sm text-gray-500">
          Invite friends and earn bonuses when they place their first order.
        </p>
      </div>

      {referralCode?.code && (
        <ReferralCodeCard code={referralCode.code} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total referred</div>
            <div className="text-xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Qualified</div>
            <div className="text-xl font-semibold">{stats.qualified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Rewarded</div>
            <div className="text-xl font-semibold">{stats.rewarded}</div>
          </CardContent>
        </Card>
        <ReferralEarningsCard usdAmount={stats.earned} />
      </div>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border text-left">Friends</th>
                <th className="p-3 border text-left">Email</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-3 border">{r.referred.name ?? "—"}</td>
                  <td className="p-3 border">{r.referred.email}</td>
                  <td className="p-3 border">{r.status}</td>
                  <td className="p-3 border">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {referrals.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
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
