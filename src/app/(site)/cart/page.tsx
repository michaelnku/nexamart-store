import CartPage from "@/components/product/CartPage";
import { CurrentUserId } from "@/lib/currentUser";
import {
  mapProductImagesToView,
  productImageWithAssetInclude,
} from "@/lib/product-images";
import { prisma } from "@/lib/prisma";

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
          cartItemSelectedOptions: {
            select: {
              id: true,
              optionGroupId: true,
              optionId: true,
              optionGroupName: true,
              optionName: true,
              priceDeltaUSD: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              basePriceUSD: true,
              isFoodProduct: true,
              images: {
                include: productImageWithAssetInclude,
              },
              store: {
                select: {
                  type: true,
                },
              },
              foodProductConfig: {
                select: {
                  inventoryMode: true,
                },
              },
            },
          },
          variant: {
            select: {
              id: true,
              priceUSD: true,
              stock: true,
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
      <div className="text-center py-36 min-h-full max-w-3xl mx-auto dark:bg-neutral-900 ">
        <p className="text-muted-foreground mb-4 text-lg dark:text-gray-400">
          Your cart is empty. Start shopping 🛒
        </p>
      </div>
    );
  }

  const normalizedCart = {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        images: mapProductImagesToView(item.product.images),
      },
    })),
  };

  const hasFood = normalizedCart.items.some(
    (item) => item.product.store?.type === "FOOD",
  );
  const hasNonFood = normalizedCart.items.some(
    (item) => item.product.store?.type !== "FOOD",
  );
  const mixedCart = hasFood && hasNonFood;

  return <CartPage cart={normalizedCart} mixedCart={mixedCart} />;
}
