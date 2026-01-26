"use client";

import { useEffect } from "react";
import { clearUserCartAction } from "@/actions/checkout/clearCart";
import { useCartStore } from "@/stores/useCartstore";

export function ClearCartOnSuccess() {
  const clearLocalCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    async function clearCart() {
      try {
        await clearUserCartAction();
        clearLocalCart();
      } catch (err) {
        console.error("Failed to clear cart:", err);
      }
    }

    clearCart();
  }, []);

  return null;
}
