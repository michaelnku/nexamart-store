"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type CurrencyStore = {
  currency: string;
  rates: Record<string, number>;
  setCurrency: (currency: string) => void;
  setRates: (rates: Record<string, number>) => void;
};

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: "USD",
      rates: {},

      setCurrency: (currency) => set({ currency }),
      setRates: (rates) => set({ rates }),
    }),
    {
      name: "currency-store",
    }
  )
);
