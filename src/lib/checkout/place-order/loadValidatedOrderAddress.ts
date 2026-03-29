import "server-only";

import { prisma } from "@/lib/prisma";
import type { DeliveryType } from "@/generated/prisma/client";
import type { ValidatedOrderAddress } from "./placeOrder.types";

export async function loadValidatedOrderAddress({
  addressId,
  userId,
  deliveryType,
}: {
  addressId: string;
  userId: string;
  deliveryType: DeliveryType;
}): Promise<
  | { address: ValidatedOrderAddress; error?: never }
  | { error: string; address?: never }
> {
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
  });

  if (!address) {
    return { error: "Invalid address" };
  }

  const isPickupDelivery =
    deliveryType === "STORE_PICKUP" || deliveryType === "STATION_PICKUP";

  if (
    !isPickupDelivery &&
    (address.latitude == null || address.longitude == null)
  ) {
    return {
      error: "Selected address is missing coordinates. Please update address.",
    };
  }

  return { address };
}

