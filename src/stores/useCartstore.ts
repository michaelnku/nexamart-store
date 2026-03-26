import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type VariantId = string | null;

type CartItem = {
  id?: string;
  productId: string;
  quantity: number;
  variantId: VariantId;
  selectionFingerprint?: string;
};

type CartState = {
  items: CartItem[];

  add: (
    productId: string,
    variantId: VariantId,
    selectionFingerprint?: string,
  ) => void;

  change: (cartItemId: string, delta: number) => void;

  remove: (cartItemId: string) => void;

  sync: (items: CartItem[]) => void;

  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (productId, variantId, selectionFingerprint = "") =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === productId &&
              i.variantId === variantId &&
              (i.selectionFingerprint ?? "") === selectionFingerprint,
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === productId &&
                i.variantId === variantId &&
                (i.selectionFingerprint ?? "") === selectionFingerprint
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { productId, variantId, selectionFingerprint, quantity: 1 },
            ],
          };
        }),

      change: (cartItemId, delta) =>
        set((state) => {
          const updated = state.items
            .map((i) => (i.id === cartItemId ? { ...i, quantity: i.quantity + delta } : i))
            .filter((i) => i.quantity > 0);

          return { items: updated };
        }),

      remove: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== cartItemId),
        })),

      sync: (items) => set({ items }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cart-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
