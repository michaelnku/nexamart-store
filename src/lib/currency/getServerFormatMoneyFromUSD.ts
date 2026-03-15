import { cache } from "react";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

import { convertFromUSD } from "./convertFromUSD";
import { formatMoney } from "./formatMoney";
import { getCurrencyRates } from "./rates";

const getPreferredCurrency = cache(async () => {
  const userId = await CurrentUserId();
  if (!userId) {
    return "USD";
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId },
    select: { currency: true },
  });

  return preference?.currency ?? "USD";
});

export const getServerFormatMoneyFromUSD = cache(async () => {
  const [currency, { rates }] = await Promise.all([
    getPreferredCurrency(),
    getCurrencyRates(),
  ]);

  return (amountUSD: number) => {
    const convertedAmount = convertFromUSD(amountUSD, currency, rates, true);
    return formatMoney(convertedAmount, currency);
  };
});
