import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(`https://api.exchangerate.host/latest?base=USD`);
  const data = await res.json();

  return NextResponse.json({
    base: data.base,
    rates: data.rates,
  });
}
