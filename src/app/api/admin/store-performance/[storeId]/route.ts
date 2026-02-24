import { NextResponse } from "next/server";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { calculateStorePrepPerformance } from "@/lib/store/calculateStorePrepPerformance";

export async function GET(
  req: Request,
  context: { params: Promise<{ storeId: string }> },
) {
  const user = await CurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { storeId } = await context.params;
  if (!storeId) {
    return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const performance = await calculateStorePrepPerformance(storeId);
  return NextResponse.json(performance);
}
