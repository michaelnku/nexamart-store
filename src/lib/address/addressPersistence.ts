import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  GeocodedAddressCoordinates,
  NormalizedAddressInput,
} from "./address.types";

export async function clearExistingDefaultAddress(userId: string) {
  return prisma.address.updateMany({
    where: { userId },
    data: { isDefault: false },
  });
}

export async function createUserAddress({
  userId,
  values,
  coordinates,
}: {
  userId: string;
  values: NormalizedAddressInput;
  coordinates: GeocodedAddressCoordinates;
}) {
  return prisma.address.create({
    data: {
      userId,
      label: values.label,
      fullName: values.fullName,
      phone: values.phone,
      street: values.street,
      city: values.city,
      state: values.state,
      country: values.country,
      postalCode: values.postalCode,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      isDefault: values.isDefault,
    },
  });
}

export async function updateUserAddress({
  addressId,
  userId,
  values,
  coordinates,
}: {
  addressId: string;
  userId: string;
  values: NormalizedAddressInput;
  coordinates: GeocodedAddressCoordinates;
}) {
  return prisma.address.update({
    where: {
      id: addressId,
      userId,
    },
    data: {
      label: values.label,
      fullName: values.fullName,
      phone: values.phone,
      street: values.street,
      city: values.city,
      state: values.state,
      country: values.country,
      postalCode: values.postalCode,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      isDefault: values.isDefault,
    },
  });
}

export async function deleteUserAddress({
  addressId,
  userId,
}: {
  addressId: string;
  userId: string;
}) {
  return prisma.address.delete({
    where: {
      id: addressId,
      userId,
    },
  });
}

export async function findNextDefaultAddress(userId: string) {
  return prisma.address.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function markAddressAsDefault({
  addressId,
  userId,
}: {
  addressId: string;
  userId: string;
}) {
  return prisma.address.update({
    where: { id: addressId },
    data: { isDefault: true },
  });
}

export async function setUserDefaultAddress({
  addressId,
  userId,
}: {
  addressId: string;
  userId: string;
}) {
  return prisma.$transaction([
    prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId, userId },
      data: { isDefault: true },
    }),
  ]);
}

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      fullName: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      country: true,
      isDefault: true,
    },
  });
}
