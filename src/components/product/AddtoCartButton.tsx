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

type Props = {
  productId: string;
  variantId: string | null;
  availableStock?: number;
};

const AddToCartControl = ({
  productId,
  variantId = null,
  availableStock = 0,
}: Props) => {
  const [isPending, startTransition] = useTransition();

  const toastCart = useCartToast();

  const qty = useCartStore(
    (s) =>
      s.items.find(
        (i) => i.productId === productId && i.variantId === variantId,
      )?.quantity ?? 0,
  );

  const atStockLimit = availableStock > 0 && qty >= availableStock;
  const isOutOfStock = availableStock <= 0;

  const addItem = () => {
    startTransition(async () => {
      const res = await addToCartAction(productId, variantId, 1);
      if (res?.success) toastCart.added();
      if (res?.success) useCartStore.getState().sync(res.items);
      if (res?.error) toastCart.error(res.error);
    });
  };

  const increase = () => {
    startTransition(async () => {
      const res = await updateQuantityAction(productId, variantId, +1);
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
        const res = await removeFromCartAction(productId, variantId);
        if (res?.success) {
          useCartStore.getState().sync(res.items);
          toastCart.removed();
        }
        if (res?.error) toastCart.error(res.error);
      });

      return;
    }

    startTransition(async () => {
      const res = await updateQuantityAction(productId, variantId, -1);
      if (res?.success) {
        useCartStore.getState().sync(res.items);
        toastCart.updated();
      }
      if (res?.error) toastCart.error(res.error);
    });
  };

  if (isOutOfStock)
    return (
      <Button
        disabled
        className="h-11 w-full rounded-lg bg-gray-200 font-semibold text-gray-600 shadow-none hover:bg-gray-200"
      >
        OUT OF STOCK
      </Button>
    );

  if (qty === 0)
    return (
      <Button
        onClick={addItem}
        disabled={isPending}
        className="w-full h-11 rounded-lg font-semibold flex items-center justify-center gap-2 
        bg-brand hover:bg-brand-hover text-white shadow-md transition disabled:opacity-50"
      >
        <ShoppingBag className="w-4 h-4" />
        Cart
      </Button>
    );

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={decrease}
        disabled={isPending}
        className="h-9 w-9 flex items-center justify-center rounded-lg text-[20px] font-bold 
        bg-brand-light hover:bg-brand text-brand hover:text-white transition"
      >
        −
      </Button>

      <span className="w-8 text-center font-semibold text-gray-800">{qty}</span>

      <Button
        onClick={increase}
        disabled={isPending || atStockLimit}
        className="h-9 w-9 flex items-center justify-center rounded-lg text-[20px] font-bold
        bg-brand hover:bg-brand-hover text-white transition"
      >
        +
      </Button>
    </div>
  );
};
export default AddToCartControl;
