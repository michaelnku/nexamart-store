import { NextResponse } from "next/server";
import { getCurrencyRates } from "@/lib/currency/rates";

//https://api.frankfurter.app/latest?from=USD

export async function GET() {
  return NextResponse.json(await getCurrencyRates());
}
