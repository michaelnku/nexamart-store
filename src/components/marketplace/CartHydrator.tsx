"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/useCartstore";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { getCart } from "@/actions/auth/cart";

export function CartHydrator() {
  const { data: user } = useCurrentUserQuery();
  const setCart = useCartStore((s) => s.sync);

  useEffect(() => {
    if (!user?.id) return;

    const loadCart = async () => {
      const cart = await getCart(user.id);
      setCart(cart?.items ?? []);
    };

    loadCart();
  }, [user?.id, setCart]);

  return null;
}
