import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CheckoutPage() {
  const userId = await CurrentUserId();
  if (!userId)
    return (
      <p className="min-h-full p-10 text-center text-slate-600 dark:text-zinc-400">
        Login to continue
      </p>
    );

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
              store: {
                select: {
                  id: true,
                  shippingRatePerMile: true,
                },
              },
            },
          },
          variant: true,
        },
      },
    },
  });

  const address = await prisma.address.findFirst({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  if (!cart)
    return (
      <div className="min-h-full space-y-4 px-4 py-24 text-center">
        <p className="text-gray-500 dark:text-zinc-400">Your cart is empty.</p>
        <Button asChild variant="outline">
          <Link href="/customer/order/history">View Orders</Link>
        </Button>
      </div>
    );

  return <CheckoutSummary cart={cart} address={address} />;
}
