"use client";

import { toast } from "sonner";

export const useCartToast = () => ({
  added: (name?: string) =>
    toast.success(name ? `${name} added to cart` : "Added to cart"),

  removed: (name?: string) =>
    toast.success(name ? `${name} removed from cart` : "Removed from cart"),

  updated: () => toast.info("Quantity updated"),

  error: (msg?: string) =>
    toast.error(msg ?? "Something went wrong while updating cart"),
});
