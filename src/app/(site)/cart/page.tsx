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

  if (!cart) {
    return (
      <div className="text-center py-36 min-h-screen max-w-3xl mx-auto dark:bg-neutral-900 ">
        <p className="text-muted-foreground mb-4 text-lg dark:text-gray-400">
          Your cart is empty. Start shopping 🛒
        </p>
      </div>
    );
  }

  const hasFood = cart.items.some((i) => i.product.store?.type === "FOOD");
  const hasNonFood = cart.items.some((i) => i.product.store?.type !== "FOOD");
  const mixedCart = hasFood && hasNonFood;

  return <CartPage cart={cart} mixedCart={mixedCart} />;
}
