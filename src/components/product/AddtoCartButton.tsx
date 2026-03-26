"use client";

import { useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "../ui/button";
import { useCartStore } from "@/stores/useCartstore";
import { useCartToast } from "@/hooks/useCartToast";
import {
  addToCartAction,
  updateQuantityAction,
  removeFromCartAction,
} from "@/actions/auth/cart";
import type { FoodSelectedOptionInput } from "@/lib/types";

type Props = {
  productId: string;
  variantId: string | null;
  selectionFingerprint?: string;
  selectedOptions?: FoodSelectedOptionInput[];
  availableStock?: number | null;
  isOrderable?: boolean;
};

const AddToCartControl = ({
  productId,
  variantId = null,
  selectionFingerprint = "",
  selectedOptions = [],
  availableStock = null,
  isOrderable = true,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const toastCart = useCartToast();

  const cartItem = useCartStore((state) =>
    state.items.find(
      (item) =>
        item.productId === productId &&
        item.variantId === variantId &&
        (item.selectionFingerprint ?? "") === selectionFingerprint,
    ),
  );
  const qty = cartItem?.quantity ?? 0;

  const atStockLimit = availableStock != null && availableStock > 0 && qty >= availableStock;
  const isOutOfStock =
    !isOrderable || (availableStock != null && availableStock <= 0);

  const addItem = () => {
    startTransition(async () => {
      const res = await addToCartAction(productId, variantId, 1, selectedOptions);
      if (res?.success) toastCart.added();
      if (res?.success) useCartStore.getState().sync(res.items);
      if (res?.error) toastCart.error(res.error);
    });
  };

  const increase = () => {
    startTransition(async () => {
      if (!cartItem?.id) return;
      const res = await updateQuantityAction(cartItem.id, 1);
      if (res?.success) {
        useCartStore.getState().sync(res.items);
        toastCart.updated();
      }
      if (res?.error) toastCart.error(res.error);
    });
  };

  const decrease = () => {
    if (qty <= 1) {
      startTransition(async () => {
        if (!cartItem?.id) return;
        const res = await removeFromCartAction(cartItem.id);
        if (res?.ok) {
          useCartStore.getState().sync(res.items);
          toastCart.removed();
        }
        if (!res?.ok) toastCart.error();
      });

      return;
    }

    startTransition(async () => {
      if (!cartItem?.id) return;
      const res = await updateQuantityAction(cartItem.id, -1);
      if (res?.success) {
        useCartStore.getState().sync(res.items);
        toastCart.updated();
      }
      if (res?.error) toastCart.error(res.error);
    });
  };

  if (isOutOfStock) {
    return (
      <Button
        disabled
        className="h-11 w-full rounded-lg bg-gray-200 font-semibold text-gray-600 shadow-none hover:bg-gray-200"
      >
        OUT OF STOCK
      </Button>
    );
  }

  if (qty === 0) {
    return (
      <Button
        onClick={addItem}
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand font-semibold text-white shadow-md transition hover:bg-brand-hover disabled:opacity-50"
      >
        <ShoppingBag className="h-4 w-4" />
        Cart
      </Button>
    );
  }

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-[11rem] items-center justify-between">
        <Button
          onClick={decrease}
          disabled={isPending}
          aria-label="Decrease quantity"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-[20px] font-bold text-brand transition hover:bg-brand hover:text-white"
        >
          -
        </Button>

        <span className="min-w-[2.5rem] text-center text-base font-semibold text-gray-800">
          {qty}
        </span>

        <Button
          onClick={increase}
          disabled={isPending || atStockLimit}
          aria-label="Increase quantity"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-[20px] font-bold text-white transition hover:bg-brand-hover"
        >
          +
        </Button>
      </div>
    </div>
  );
};

export default AddToCartControl;
