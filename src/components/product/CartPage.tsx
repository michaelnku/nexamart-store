"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  updateQuantityAction,
  removeFromCartAction,
} from "@/actions/auth/cart";
import { useCartStore } from "@/stores/CartStore";
import { FullCart } from "@/lib/types";

interface Props {
  cart: FullCart;
}

/* Currency symbol resolver */
const currencySymbol = (currency: string | null | undefined) => {
  const map: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return currency && map[currency] ? map[currency] : "";
};

const CartPage = ({ cart }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { change, remove } = useCartStore();

  // subtotal based on item currency
  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.basePrice;
    return sum + price * item.quantity;
  }, 0);

  const currency = cart.items[0]?.product.currency ?? "USD";
  const symbol = currencySymbol(currency);

  const increase = (productId: string, variantId: string | null) => {
    change(productId, +1);
    startTransition(async () => {
      await updateQuantityAction(productId, variantId, +1);
    });
  };

  const decrease = (
    productId: string,
    variantId: string | null,
    qty: number
  ) => {
    if (qty <= 1) {
      remove(productId);
      startTransition(async () => {
        await removeFromCartAction(productId);
      });
      return;
    }
    change(productId, -1);
    startTransition(async () => {
      await updateQuantityAction(productId, variantId, -1);
    });
  };

  const removeItem = (productId: string, variantId: string | null) => {
    remove(productId);
    startTransition(async () => {
      await removeFromCartAction(productId, variantId);
    });
  };

  const handleCheckout = () => {
    startTransition(() => {
      router.push("/checkout");
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-black">
        Cart
        <span className="text-[#3c9ee0] px-2">({cart.items.length})</span>
      </h1>

      {cart.items.length === 0 ? (
        <div className="text-center py-36">
          <p className="text-muted-foreground mb-4 text-lg">
            Your cart is empty. Start shopping 🛒
          </p>
          <Button
            onClick={() => router.push("/products")}
            className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CART LIST */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => {
              const price = item.variant?.price ?? item.product.basePrice;
              const totalPrice = item.quantity * price;

              return (
                <Card
                  key={item.id}
                  className="p-4 sm:p-5 hover:shadow-md rounded-xl transition-all border border-gray-200"
                >
                  <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
                    {/* IMAGE + DETAILS */}
                    <div className="flex gap-4 w-full">
                      <Image
                        src={
                          item.product.images[0]?.imageUrl || "/placeholder.png"
                        }
                        alt={item.product.name}
                        width={110}
                        height={110}
                        className="rounded-md object-cover flex-shrink-0"
                      />

                      <div className="flex flex-col justify-between w-full">
                        <p className="font-medium text-[15px] leading-snug text-black">
                          {item.product.name}
                        </p>

                        {item.variant && (
                          <p className="text-xs text-gray-500">
                            {item.variant.color &&
                              `Color: ${item.variant.color} `}
                            {item.variant.size &&
                              `• Size: ${item.variant.size}`}
                          </p>
                        )}

                        {/* Remove */}
                        <button
                          onClick={() =>
                            removeItem(item.productId, item.variantId)
                          }
                          className="flex items-center text-xs text-red-500 hover:underline gap-1 mt-1"
                        >
                          <Trash2 size={14} /> Remove
                        </button>

                        {/* Mobile Price */}
                        <p className="font-semibold text-[var(--brand-blue)] text-base sm:hidden mt-1">
                          {symbol}
                          {totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* PRICE + QTY CONTROLS */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                      {/* Desktop Price */}
                      <p className="hidden sm:block text-lg font-semibold text-[var(--brand-blue)]">
                        {symbol}
                        {totalPrice.toLocaleString()}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-md bg-white shadow-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            decrease(
                              item.productId,
                              item.variantId,
                              item.quantity
                            )
                          }
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="px-3 font-semibold select-none text-black">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            increase(item.productId, item.variantId)
                          }
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ORDER SUMMARY */}
          <Card className="sticky top-24 p-6 h-fit rounded-xl border border-[var(--brand-blue)] shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-4 text-black">
              Order Summary
            </h2>

            <div className="space-y-3 text-[15px]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-medium">
                  {symbol}
                  {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-medium text-gray-600">
                  Calculated at checkout
                </span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold text-black">
                <span>Total</span>
                <span>
                  {symbol}
                  {subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-5 py-6 text-[16px] font-semibold rounded-lg bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white shadow-sm"
              onClick={handleCheckout}
              disabled={pending}
            >
              {pending ? "Processing..." : "Proceed to Checkout"}
            </Button>
          </Card>
        </div>
      )}
    </main>
  );
};

export default CartPage;
