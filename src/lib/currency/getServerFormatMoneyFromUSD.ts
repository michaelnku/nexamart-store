import { cache } from "react";
import { cookies } from "next/headers";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

import { convertFromUSD } from "./convertFromUSD";
import {
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY,
  isSupportedCurrency,
} from "./currencyConfig";
import { formatMoney } from "./formatMoney";
import { getCurrencyRates } from "./rates";

const getPreferredCurrency = cache(async () => {
  const cookieStore = await cookies();
  const cookieCurrency = cookieStore.get(CURRENCY_COOKIE_NAME)?.value;

  if (isSupportedCurrency(cookieCurrency)) {
    return cookieCurrency;
  }

  const userId = await CurrentUserId();
  if (!userId) {
    return DEFAULT_CURRENCY;
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId },
    select: { currency: true },
  });

  return isSupportedCurrency(preference?.currency)
    ? preference.currency
    : DEFAULT_CURRENCY;
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
