"use client";

import { convertFromUSD as convertFromUSDValue } from "@/lib/currency/convertFromUSD";
import { convertToUSD as convertToUSDValue } from "@/lib/currency/convertToUSD";
import {
  DEFAULT_CURRENCY,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency/currencyConfig";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type CurrencyStore = {
  currency: SupportedCurrency;
  rates: Record<string, number>;
  ratesLoaded: boolean;

  setCurrency: (currency: SupportedCurrency) => void;
  setRates: (rates: Record<string, number>) => void;

  convertToUSD: (amount: number) => number;
  convertFromUSD: (amount: number) => number;
};

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: DEFAULT_CURRENCY,
      rates: { [DEFAULT_CURRENCY]: 1 },
      ratesLoaded: false,

      setCurrency: (currency) =>
        set({
          currency: isSupportedCurrency(currency) ? currency : DEFAULT_CURRENCY,
        }),

      setRates: (rates) =>
        set({
          rates: { [DEFAULT_CURRENCY]: 1, ...rates },
          ratesLoaded: true,
        }),

      convertFromUSD: (amount) => {
        const { currency, rates, ratesLoaded } = get();
        return convertFromUSDValue(amount, currency, rates, ratesLoaded);
      },

      convertToUSD: (amount) => {
        const { currency, rates, ratesLoaded } = get();
        return convertToUSDValue(amount, currency, rates, ratesLoaded);
      },
    }),
    {
      name: "currency-store",
      version: 4,
      migrate: (persistedState) => {
        const state = persistedState as Partial<CurrencyStore> | undefined;

        return {
          currency: isSupportedCurrency(state?.currency)
            ? state.currency
            : DEFAULT_CURRENCY,
          rates:
            state?.rates && typeof state.rates === "object"
              ? { [DEFAULT_CURRENCY]: 1, ...state.rates }
              : { [DEFAULT_CURRENCY]: 1 },
          ratesLoaded: Boolean(state?.ratesLoaded),
        };
      },
    }
  )
);
