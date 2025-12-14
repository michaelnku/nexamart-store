import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import CartPage from "@/components/product/CartPage";

export default async function page() {
  const userId = await CurrentUserId();

  if (!userId) {
    return (
      <div className="p-6 min-h-screen text-center">
        <p>You are not logged in</p>
      </div>
    );
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              currency: true,
              images: true,
            },
          },
          variant: {
            select: {
              id: true,
              price: true,
              color: true,
              size: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen py-16 text-center">
        <p>Your cart is empty</p>
      </div>
    );
  }

  return <CartPage cart={cart} />;
}
