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
    <main className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="md:text-3xl text-lg sm:text-xl font-bold">
          Referrals
        </h1>
        <p className="text-sm text-gray-500">
          Track referral activity and reward performance.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-xl font-semibold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Qualified</div>
            <div className="text-xl font-semibold">{qualified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Rewarded</div>
            <div className="text-xl font-semibold">{rewarded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total paid</div>
            <div className="text-xl font-semibold">${totalPaid}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Activity</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border text-left">Referrer</th>
                <th className="p-3 border text-left">Referred</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-3 border">
                    {r.referrer.name ?? "—"} ({r.referrer.email})
                  </td>
                  <td className="p-3 border">
                    {r.referred.name ?? "—"} ({r.referred.email})
                  </td>
                  <td className="p-3 border">{r.status}</td>
                  <td className="p-3 border">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-gray-500"
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
