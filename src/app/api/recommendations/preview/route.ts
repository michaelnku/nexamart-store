import { auth } from "@/auth/auth";
import { getRecommendedProducts } from "@/lib/recommendations/getRecommendedProducts";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const recentIds = (searchParams.get("recentIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const products = await getRecommendedProducts(userId, { recentIds });
  return NextResponse.json(products);
}
