import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import CartPage from "@/components/product/CartPage";

export default async function page() {
  const userId = await CurrentUserId();

  if (!userId) {
    return null;
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
              basePriceUSD: true,
              images: true,
              store: {
                select: {
                  type: true,
                },
              },
            },
          },
          variant: {
            select: {
              id: true,
              priceUSD: true,
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

  const hasFood = cart.items.some((i) => i.product.store?.type === "FOOD");
  const hasNonFood = cart.items.some((i) => i.product.store?.type !== "FOOD");
  const mixedCart = hasFood && hasNonFood;

  return <CartPage cart={cart} mixedCart={mixedCart} />;
}
