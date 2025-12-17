import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  acceptOrderAction,
  cancelOrderAction,
  shipOrderAction,
} from "@/actions/order/sellerOrderActions";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Truck, LucideIcon } from "lucide-react";
import { CurrentUser } from "@/lib/currentUser";
import { usePrice } from "@/lib/formatPrice";

type ActionResult =
  | { success: string; error?: never }
  | { error: string; success?: never };

type ActionButton = {
  label: string;
  Icon: LucideIcon;
  action: (sellerGroupId: string) => Promise<ActionResult>;
  variant: React.ComponentProps<typeof Button>["variant"];
};

export default async function SellerOrderDetails({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const user = await CurrentUser();
  if (!user) return "Unauthorized";

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      sellerGroups: {
        some: {
          sellerId: user.id,
        },
      },
    },
    include: {
      customer: true,
      rider: true,
      sellerGroups: {
        where: {
          sellerId: user.id,
        },
        include: {
          store: true,
          seller: true,
          items: {
            include: {
              product: { include: { images: true } },
              variant: true,
            },
          },
        },
      },
    },
  });

  if (!order) return "Order not found";

  const group = order.sellerGroups[0];
  if (!group) return "Seller group not found";

  const actionButtons = [
    group.status === "PENDING_PICKUP" && {
      label: "Accept Order",
      Icon: CheckCircle2,
      action: acceptOrderAction,
      variant: "default",
    },
    group.status === "PENDING_PICKUP" && {
      label: "Cancel Order",
      Icon: XCircle,
      action: cancelOrderAction,
      variant: "destructive",
    },
    group.status === "IN_TRANSIT_TO_HUB" && {
      label: "Mark as Shipped",
      Icon: Truck,
      action: shipOrderAction,
      variant: "default",
    },
  ].filter(Boolean) as ActionButton[];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      {/* TOP BAR */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order #{order.id.slice(-6)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            Store: <span className="font-medium">{group.store?.name}</span>
          </p>
        </div>

        <Badge className="px-4 py-1 text-sm capitalize">
          {group.status.replace("_", " ")}
        </Badge>
      </div>

      {/* CUSTOMER INFORMATION */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-lg">Buyer Information</h2>
        <p className="text-sm">{order.customer?.name}</p>
        <p className="text-sm">{order.customer?.email}</p>
        <p className="text-sm font-medium mt-2">Delivery Address</p>
        <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
      </div>

      {/* ITEMS */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-6">
        <h2 className="font-semibold text-lg">Items Purchased</h2>

        {group.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 pb-4 border-b last:border-none"
          >
            <div className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-100">
              <Image
                fill
                src={item.product.images[0]?.imageUrl ?? "/placeholder.png"}
                alt={item.product.name}
                className="object-cover"
              />
            </div>

            <div className="flex-1 space-y-1">
              <p className="font-medium">{item.product.name}</p>

              {item.variant && (
                <p className="text-sm text-gray-500">
                  {item.variant.color} {item.variant.size}
                </p>
              )}

              <p className="font-semibold text-gray-900 mt-1">
                {usePrice(item.price)} × {item.quantity}
              </p>
            </div>
          </div>
        ))}

        <div className="pt-4 flex justify-between font-bold text-lg">
          <span>Subtotal</span>
          <span>{usePrice(group.subtotal)}</span>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {actionButtons.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {actionButtons.map(({ label, Icon, action, variant }) => (
            <form
              key={label}
              action={async () => {
                "use server";
                const res = await action(group.id);
                toast[res.error ? "error" : "success"](
                  res.error || res.success
                );
              }}
            >
              <Button variant={variant} className="flex gap-2">
                <Icon className="w-4 h-4" /> {label}
              </Button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
