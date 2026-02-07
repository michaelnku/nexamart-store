"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useCurrencyStore } from "@/stores/useCurrencyStore";

type Props = {
  usdAmount: number;
};

export default function ReferralEarningsCard({ usdAmount }: Props) {
  const { currency, convertFromUSD } = useCurrencyStore();
  const converted = convertFromUSD(usdAmount);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">Earnings</div>

        <div className="text-xl font-semibold">
          {converted.toLocaleString()}{" "}
          <span className="text-sm font-medium text-gray-500">{currency}</span>
        </div>
        {currency !== "USD" && (
          <div className="text-xs text-muted-foreground">
            â‰ˆ ${usdAmount.toFixed(2)} USD
          </div>
        )}
      </CardContent>
    </Card>
  );
}
