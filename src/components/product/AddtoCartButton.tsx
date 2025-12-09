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
};

const AddToCartControl = ({ productId, variantId = null }: Props) => {
  const [isPending, startTransition] = useTransition();

  const toastCart = useCartToast();

  const qty = useCartStore(
    (s) =>
      s.items.find(
        (i) => i.productId === productId && i.variantId === variantId
      )?.quantity ?? 0
  );

  const add = useCartStore((s) => s.add);
  const change = useCartStore((s) => s.change);
  const remove = useCartStore((s) => s.remove);

  const addItem = () => {
    add(productId, variantId);

    startTransition(async () => {
      const res = await addToCartAction(productId, variantId, 1);
      if (res?.success) toastCart.added();
      if (res?.success) useCartStore.getState().sync(res.items);
      if (res?.error) toastCart.error(res.error);
    });
  };

  const increase = () => {
    change(productId, variantId, +1);
    startTransition(async () => {
      await updateQuantityAction(productId, variantId, +1);
      toastCart.updated();
    });
  };

  const decrease = () => {
    if (qty <= 1) {
      remove(productId, variantId);

      startTransition(async () => {
        await removeFromCartAction(productId, variantId);
        toastCart.removed();
      });

      return;
    }

    change(productId, variantId, -1);

    startTransition(async () => {
      await updateQuantityAction(productId, variantId, -1);
      toastCart.updated();
    });
  };
  /* -------- INITIAL STATE — ADD BUTTON -------- */
  if (qty === 0)
    return (
      <Button
        onClick={addItem}
        disabled={isPending}
        className="w-full h-11 rounded-lg font-semibold flex items-center justify-center gap-2 
        bg-brand hover:bg-brand-hover text-white shadow-md transition disabled:opacity-50"
      >
        <ShoppingBag className="w-4 h-4" />
        Add to Cart
      </Button>
    );

  /* -------- CART ACTIVE — QTY COUNTER -------- */
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
        disabled={isPending}
        className="h-9 w-9 flex items-center justify-center rounded-lg text-[20px] font-bold
        bg-brand hover:bg-brand-hover text-white transition"
      >
        +
      </Button>
    </div>
  );
};
export default AddToCartControl;
