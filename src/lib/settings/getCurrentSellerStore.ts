import { CurrentUser } from "@/lib/currentUser";
import { mapStoreMedia, storeMediaInclude } from "@/lib/media-views";
import { prisma } from "@/lib/prisma";

export async function getCurrentSellerStore() {
  const user = await CurrentUser();
  if (!user || user.role !== "SELLER") return null;

  const store = await prisma.store.findUnique({
    where: { userId: user.id },
    include: storeMediaInclude,
  });

  return store ? mapStoreMedia(store) : null;
}
