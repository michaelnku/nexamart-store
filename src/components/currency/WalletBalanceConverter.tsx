"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import { useCurrencyStore } from "@/stores/useCurrencyStore";

type Props = {
  usdBalance: number;
};

export function WalletBalanceConverter({ usdBalance }: Props) {
  const { currency } = useCurrencyStore();
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
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
              {formatMoneyFromUSD(usdBalance)}
            </span>
          </div>
          {currency !== "USD" && (
            <p className="text-xs text-muted-foreground">
              {formatBaseUSD(usdBalance)} USD
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
  const { currency } = useCurrencyStore();
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
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
              {formatMoneyFromUSD(usdBalance)}
            </span>
          </div>
          {currency !== "USD" && (
            <p className="text-xs text-muted-foreground">
              {formatBaseUSD(usdBalance)} USD
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
