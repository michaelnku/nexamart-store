"use client";

import { useEffect, useState } from "react";

import { convertToUSD } from "@/lib/currency/convertToUSD";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currency/currencyConfig";
import { useCurrencyStore } from "@/stores/useCurrencyStore";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  onUSDChange: (usd: number) => void;
};

export function PriceConverter({ onUSDChange }: Props) {
  const { currency, rates, ratesLoaded } = useCurrencyStore();
  const [localAmount, setLocalAmount] = useState("");
  const [localCurrency, setLocalCurrency] = useState<SupportedCurrency>(currency);
  const [usdAmount, setUsdAmount] = useState<number | null>(null);

  useEffect(() => {
    setLocalCurrency(currency);
  }, [currency]);

  const syncUSDValue = (value: string, nextCurrency: SupportedCurrency) => {
    const num = Number(value);

    if (!value || Number.isNaN(num)) {
      setUsdAmount(null);
      return;
    }

    const usd = convertToUSD(num, nextCurrency, rates, ratesLoaded);
    setUsdAmount(usd);
    onUSDChange(usd);
  };

  return (
    <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
      <p className="text-sm font-medium">
        Price Converter (for your convenience)
      </p>

      <div className="flex flex-col gap-3">
        <Select
          value={localCurrency}
          onValueChange={(value) => {
            const nextCurrency = value as SupportedCurrency;
            setLocalCurrency(nextCurrency);
            syncUSDValue(localAmount, nextCurrency);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((supportedCurrency) => (
              <SelectItem key={supportedCurrency} value={supportedCurrency}>
                {supportedCurrency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          step="0.01"
          placeholder="Local price"
          className="focus-visible:ring-[var(--brand-blue)]"
          value={localAmount}
          onChange={(event) => {
            const nextValue = event.target.value;
            setLocalAmount(nextValue);
            syncUSDValue(nextValue, localCurrency);
          }}
        />

        <Input
          disabled
          value={usdAmount === null ? "" : usdAmount.toFixed(2)}
          placeholder="Auto -> USD"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Final price will be saved in USD
      </p>
    </div>
  );
}
