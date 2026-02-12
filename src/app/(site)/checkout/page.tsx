import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";

export default async function CheckoutPage() {
  const userId = await CurrentUserId();
  if (!userId)
    return <p className="text-center p-10 min-h-screen">Login to continue</p>;

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
    orderBy: { createdAt: "desc" },
  });

  if (!cart)
    return <p className="text-center p-10 min-h-screen">Your cart is empty.</p>;

  return <CheckoutSummary cart={cart} address={address} />;
}
