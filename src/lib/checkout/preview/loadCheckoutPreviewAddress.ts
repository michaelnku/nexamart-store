import "server-only";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const checkoutPreviewAddressSelect =
  Prisma.validator<Prisma.AddressSelect>()({
    id: true,
    latitude: true,
    longitude: true,
  });

export type CheckoutPreviewAddress = Prisma.AddressGetPayload<{
  select: typeof checkoutPreviewAddressSelect;
}>;

export async function loadCheckoutPreviewAddress({
  addressId,
  userId,
}: {
  addressId: string;
  userId: string;
}): Promise<CheckoutPreviewAddress | null> {
  return prisma.address.findFirst({
    where: { id: addressId, userId },
    select: checkoutPreviewAddressSelect,
  });
}
