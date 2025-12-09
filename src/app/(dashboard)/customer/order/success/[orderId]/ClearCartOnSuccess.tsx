"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/CartStore";
import { clearUserCartAction } from "@/actions/checkout/clearCart";

export function ClearCartOnSuccess() {
  const clearLocalCart = useCartStore((s) => s.clear);

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
