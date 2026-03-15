const FALLBACK_RATES = {
  USD: 1,
  NGN: 1500,
  GBP: 0.78,
  EUR: 0.92,
  KES: 145,
  ZAR: 18.5,
  CAD: 1.36,
};

export async function getCurrencyRates() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 12 },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error("Failed to fetch currency rates");
    }

    const data = await res.json();

    return {
      base: "USD" as const,
      rates: {
        ...FALLBACK_RATES,
        ...data.rates,
      } satisfies Record<string, number>,
      fallback: false,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("Currency API timed out, using fallback rates");
    } else {
      console.error("Currency API fetch failed:", error);
    }

    return {
      base: "USD" as const,
      rates: FALLBACK_RATES,
      fallback: true,
    };
  }
}

export { FALLBACK_RATES };
