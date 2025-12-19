"use client";

import { useCurrencyStore } from "@/stores/useCurrencyStore";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type Props = {
  usdBalance: number;
};

export function WalletBalanceConverter({ usdBalance }: Props) {
  const { currency, convertFromUSD } = useCurrencyStore();

  const converted = convertFromUSD(usdBalance);

  const [showBalance, setShowBalnce] = useState(false);

  return (
    <div className="border rounded-xl p-4 bg-muted/40 space-y-1">
      <span className="inline-flex items-center gap-6">
        <p className="text-sm text-muted-foreground">Available Balance</p>
        <button
          className="text-[var(--brand-blue)]"
          onClick={() => setShowBalnce((prev) => !prev)}
        >
          {showBalance ? <Eye /> : <EyeOff />}
        </button>
      </span>

      {showBalance ? (
        <>
          <div className="flex items-baseline gap-2 ">
            <span className="text-2xl font-bold text-[var(--brand-blue)] transition-all duration-300">
              {converted.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-gray-500">
              {currency}
            </span>
          </div>
          {currency !== "USD" && (
            <p className="text-xs text-muted-foreground">
              ≈ ${usdBalance.toFixed(2)} USD
            </p>
          )}
        </>
      ) : (
        <p className="text-[var(--brand-blue)] font-bold text-2xl">******</p>
      )}
    </div>
  );
}
export function SellerWalletBalanceConverter({ usdBalance }: Props) {
  const { currency, convertFromUSD } = useCurrencyStore();

  const converted = convertFromUSD(usdBalance);

  const [showBalance, setShowBalnce] = useState(false);

  return (
    <div className="border rounded-xl p-4 bg-muted/40 space-y-1">
      <span className="inline-flex items-center gap-6">
        <p className="text-sm text-muted-foreground">Available Balance</p>
        <button
          className="text-[var(--brand-blue)]"
          onClick={() => setShowBalnce((prev) => !prev)}
        >
          {showBalance ? <Eye /> : <EyeOff />}
        </button>
      </span>

      {showBalance ? (
        <>
          <div className="flex items-baseline gap-2 ">
            <span className="text-2xl font-bold text-[var(--brand-blue)] transition-all duration-300">
              {converted.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-gray-500">
              {currency}
            </span>
          </div>
          {currency !== "USD" && (
            <p className="text-xs text-muted-foreground">
              ≈ ${usdBalance.toFixed(2)} USD
            </p>
          )}
        </>
      ) : (
        <p className="text-[var(--brand-blue)] font-bold text-2xl">******</p>
      )}
      <p className="text-xs text-gray-400 mt-1">Ready for withdrawal</p>
    </div>
  );
}
