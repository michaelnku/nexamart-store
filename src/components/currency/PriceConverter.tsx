"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useCurrencyStore } from "@/stores/useCurrencyStore";
import { useState } from "react";

type Props = {
  onUSDChange: (usd: number) => void;
};

const currencies = ["USD", "NGN", "GBP", "EUR", "KES", "ZAR", "CAD"];

export function PriceConverter({ onUSDChange }: Props) {
  const { currency, setCurrency, convertToUSD } = useCurrencyStore();
  const [localAmount, setLocalAmount] = useState("");
  const [usdAmount, setUsdAmount] = useState<number | null>(null);

  const handleChange = (value: string) => {
    setLocalAmount(value);
    const num = Number(value);

    if (!isNaN(num)) {
      const usd = convertToUSD(num);
      setUsdAmount(usd);
      onUSDChange(usd);
    } else setUsdAmount(null);
  };

  return (
    <div className="space-y-3 border rounded-xl p-4 bg-muted/40">
      <p className="text-sm font-medium">
        Price Converter (for your convenience)
      </p>

      <div className="flex flex-col gap-3">
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Local price"
          className="focus-visible:ring-[var(--brand-blue)]"
          value={localAmount}
          onChange={(e) => handleChange(e.target.value)}
        />

        <Input disabled value={usdAmount ?? ""} placeholder="Auto → USD" />
      </div>

      <p className="text-xs text-muted-foreground">
        Final price will be saved in USD
      </p>
    </div>
  );
}
