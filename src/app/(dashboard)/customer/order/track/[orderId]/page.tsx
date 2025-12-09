import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { DeliveryStatus, OrderStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";

/* Currency symbol helper */
const currencySymbol = (code: string | null) => {
  if (!code) return "";
  const map: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return map[code] ?? code;
};

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function TrackOrderPage(props: Props) {
  const { orderId } = await props.params;
  const userId = await CurrentUserId();

  if (!userId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-600">
          Please{" "}
          <Link href="/login" className="text-blue-600 underline">
            login
          </Link>{" "}
          to view this order.
        </p>
      </main>
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
      delivery: {
        include: {
          rider: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <p className="text-red-500">Order not found or unauthorized.</p>
      </main>
    );
  }

  const delivery = order.delivery;
  const symbol = currencySymbol(order.items[0]?.product.currency ?? "NGN");

  /* Order status badge colors */
  const statusColors: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-500",
    PROCESSING: "bg-blue-500",
    SHIPPED: "bg-purple-500",
    IN_TRANSIT: "bg-orange-500",
    DELIVERED: "bg-green-600",
    CANCELLED: "bg-red-600",
    RETURNED: "bg-red-500",
  };

  /* Timeline mapping */
  const stepIndexFromStatus = (s: DeliveryStatus | undefined) => {
    switch (s) {
      case "PENDING":
        return 0;
      case "ASSIGNED":
        return 1;
      case "IN_TRANSIT":
        return 2;
      case "DELIVERED":
      case "CANCELLED":
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = stepIndexFromStatus(delivery?.status);

  const isPickup = order.deliveryType === "STORE_PICKUP";

  const steps = [
    {
      label: isPickup ? "Order Ready for Pickup" : "Order Placed",
      desc: isPickup
        ? "Your order will be available for pickup soon"
        : "We've received your order",
      icon: <Package className="w-4 h-4" />,
    },
    {
      label: isPickup ? "Available for Pickup" : "Rider Assigned",
      desc: isPickup
        ? "You can pick up your order soon"
        : "A rider has accepted the delivery",
      icon: <Truck className="w-4 h-4" />,
    },
    {
      label: isPickup ? "Picked Up by Customer" : "On the Way",
      desc: isPickup
        ? "Order collected from pickup point"
        : "Your package is currently in transit",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: isPickup
        ? "Completed"
        : delivery?.status === "CANCELLED"
        ? "Delivery Cancelled"
        : "Delivered",
      desc: isPickup
        ? "Pickup completed"
        : delivery?.status === "CANCELLED"
        ? "This delivery was cancelled"
        : "Your package has arrived",
      icon: isPickup ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : delivery?.status === "CANCELLED" ? (
        <XCircle className="w-4 h-4" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      ),
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-10">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#3c9ee0]" />
            Track Delivery
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Order ID:{" "}
            <span className="font-mono tracking-wide text-gray-800">
              {order.id}
            </span>
          </p>
        </div>

        <Badge
          className={`${
            statusColors[order.status]
          } px-3 py-1 rounded-full text-xs font-semibold capitalize`}
        >
          {order.status.replaceAll("_", " ")}
        </Badge>
      </header>

      {/* SUMMARY SECTION */}
      <section className="grid gap-5 lg:grid-cols-[2.2fr,1.3fr]">
        {/* LEFT — PRODUCT SUMMARY */}
        <div className="border rounded-xl p-4 sm:p-5 bg-white shadow-sm flex gap-4 items-start">
          <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
            <Image
              src={
                order.items[0].product.images[0]?.imageUrl ?? "/placeholder.png"
              }
              alt="Product"
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 space-y-1 min-w-0">
            <p className="font-medium text-[15px] line-clamp-2">
              {order.items[0].product.name}
            </p>
            <p className="text-sm text-gray-500">
              {order.items.length} item{order.items.length > 1 && "s"} •{" "}
              {symbol}
              {order.totalAmount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              Placed on{" "}
              {order.createdAt.toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* RIGHT — DELIVERY DETAIL */}
        <div className="border rounded-xl p-4 sm:p-5 bg-white shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <MapPin className="w-4 h-4 text-[#3c9ee0]" /> Delivery Address
          </div>
          <p className="text-sm text-gray-700">
            {order.deliveryAddress ?? "—"}
          </p>

          <div className="text-xs text-gray-700 space-y-1 pt-2">
            <p>
              Payment:{" "}
              <span className="font-semibold text-[#3c9ee0]">
                {order.paymentMethod?.replaceAll("_", " ") ?? "-"}
              </span>
            </p>
            <p>
              Type:{" "}
              <span className="font-semibold text-[#3c9ee0]">
                {order.deliveryType.replace("_", " ")}
              </span>
            </p>
            <p>
              Shipping Fee:{" "}
              <span className="font-semibold text-[#3c9ee0]">
                {symbol}
                {order.shippingFee.toLocaleString()}
              </span>
            </p>
          </div>

          {delivery?.rider && (
            <div className="pt-3 border-t text-xs space-y-1">
              <p className="font-semibold text-sm">Assigned Rider</p>
              <p>{delivery.rider.name}</p>
              <p className="text-gray-500">{delivery.rider.email}</p>
            </div>
          )}
        </div>
      </section>

      {/* DELIVERY TIMELINE */}
      <section className="border rounded-xl p-5 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#3c9ee0]" /> Delivery Progress
        </h2>

        <ol className="relative ml-4 border-l border-gray-200 space-y-6">
          {steps.map((step, index) => {
            const completed = index < currentStep;
            const active = index === currentStep;
            return (
              <li key={index} className="ml-5 space-y-1">
                <span
                  className={`absolute -left-[11px] flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs transition ${
                    completed
                      ? "bg-[#3c9ee0] border-[#3c9ee0] text-white"
                      : active
                      ? "bg-[#318bc4] border-[#318bc4] text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {step.icon}
                  <span
                    className={`text-sm font-medium ${
                      completed || active ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row gap-3">
        <Link href={`/customer/order/${order.id}`} className="w-full">
          <Button
            variant="outline"
            className="w-full border-[#3c9ee0] text-[#3c9ee0] hover:bg-[#3c9ee0]/10 font-semibold"
          >
            View full order details
          </Button>
        </Link>
        <Link href="/" className="w-full">
          <Button className="w-full bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-semibold">
            Continue shopping
          </Button>
        </Link>
      </section>
    </main>
  );
}
