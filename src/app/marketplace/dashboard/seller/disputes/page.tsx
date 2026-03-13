import Link from "next/link";

import DisputeReasonLabel from "@/components/disputes/DisputeReasonLabel";
import DisputeStatusBadge from "@/components/disputes/DisputeStatusBadge";
import { Button } from "@/components/ui/button";
import { CurrentUser } from "@/lib/currentUser";
import { SellerDisputeListItemDTO } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export default async function SellerDisputesPage() {
  const user = await CurrentUser();
  if (!user) {
    return <p>Unauthorized</p>;
  }

  const disputes = await prisma.dispute.findMany({
    where: {
      disputeSellerGroupImpacts: {
        some: {
          sellerGroup: {
            sellerId: user.id,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          isFoodOrder: true,
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      disputeSellerGroupImpacts: {
        where: {
          sellerGroup: {
            sellerId: user.id,
          },
        },
        include: {
          sellerGroup: {
            include: {
              seller: { select: { name: true } },
              store: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const items: SellerDisputeListItemDTO[] = disputes.map((dispute) => ({
    id: dispute.id,
    orderId: dispute.orderId,
    customerName: dispute.order.customer.name,
    customerEmail: dispute.order.customer.email,
    status: dispute.status,
    reason: dispute.reason,
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString(),
    refundAmount: dispute.refundAmount,
    affectedAmount: dispute.disputeSellerGroupImpacts.reduce(
      (sum, impact) => sum + Number(impact.refundAmount),
      0,
    ),
    isFoodOrder: dispute.order.isFoodOrder,
    impactedGroups: dispute.disputeSellerGroupImpacts.map((impact) => ({
      id: impact.id,
      sellerGroupId: impact.sellerGroupId,
      refundAmount: impact.refundAmount,
      sellerName: impact.sellerGroup.seller.name,
      storeName: impact.sellerGroup.store.name,
    })),
  }));

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold"> Disputes Overview </h1>
        <p className="text-sm text-muted-foreground">
          Review customer disputes that affect your orders and payouts.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          No disputes are currently attached to your orders.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-muted/40 dark:border-zinc-800 dark:bg-zinc-900/80">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4">Affected Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200 dark:border-zinc-800">
                  <td className="p-4 font-medium">{item.orderId}</td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">
                        {item.customerName ?? "Customer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.customerEmail}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <DisputeReasonLabel reason={item.reason} />
                  </td>
                  <td className="p-4">
                    <DisputeStatusBadge status={item.status} />
                  </td>
                  <td className="p-4">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-medium">
                    ${item.affectedAmount.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/marketplace/dashboard/seller/disputes/${item.id}`}
                    >
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
