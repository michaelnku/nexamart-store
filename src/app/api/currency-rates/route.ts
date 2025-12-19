import { NextResponse } from "next/server";

const FALLBACK_RATES = {
  USD: 1,
  NGN: 1500,
  GBP: 0.78,
  EUR: 0.92,
  KES: 145,
  ZAR: 18.5,
  CAD: 1.36,
};

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD", {
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 12 },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch currency rates" },
        { status: 500 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      base: "USD",
      rates: {
        USD: 1,
        ...data.rates,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("Currency API timed out, using fallback rates");
    } else {
      console.error("Currency API fetch failed:", error);
    }

    return NextResponse.json({
      base: "USD",
      rates: FALLBACK_RATES,
      fallback: true,
    });
  }
}
