"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import { useCurrencyStore } from "@/stores/useCurrencyStore";

type Props = {
  usdAmount: number;
};

export default function ReferralEarningsCard({ usdAmount }: Props) {
  const { currency } = useCurrencyStore();
  const formatMoneyFromUSD = useFormatMoneyFromUSD();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">Earnings</div>

        <div className="text-xl font-semibold">{formatMoneyFromUSD(usdAmount)}</div>
        {currency !== "USD" && (
          <div className="text-xs text-muted-foreground">
            {formatBaseUSD(usdAmount)} USD
          </div>
        )}
      </CardContent>
    </Card>
  );
}
