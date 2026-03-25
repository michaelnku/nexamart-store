"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";
import { normalizePhoneToE164 } from "@/lib/otp/phone";
import { addressSchema, addressSchemaType } from "@/lib/zodValidation";
import { geocodeAddress } from "@/lib/shipping/mapboxGeocode";

export async function createAddressAction(values: addressSchemaType) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid address data" };
  }

  try {
    const normalizedPhone = normalizePhoneToE164(values.phone);

    const coordinates = await geocodeAddress({
      street: values.street,
      city: values.city,
      state: values.state ?? undefined,
      country: values.country ?? "",
    });

    if (values.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label: values.label,

        fullName: values.fullName,
        phone: normalizedPhone,
        street: values.street,
        city: values.city,
        state: values.state,
        country: values.country ?? "",
        postalCode: values.postalCode ?? "",
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        isDefault: values.isDefault ?? false,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/checkout");

    return { success: true, address };
  } catch (error) {
    console.error("CREATE ADDRESS ERROR:", error);
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("invalid") ||
        error.message.toLowerCase().includes("geocode"))
    ) {
      return { error: "Please select a valid address from suggestions." };
    }
    return { error: "Failed to create address" };
  }
}

export async function updateAddressAction(
  addressId: string,
  values: addressSchemaType,
) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid address data" };
  }

  try {
    const normalizedPhone = normalizePhoneToE164(values.phone);

    const coordinates = await geocodeAddress({
      street: values.street,
      city: values.city,
      state: values.state ?? undefined,
      country: values.country ?? "",
    });

    if (values.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: {
        id: addressId,
        userId,
      },
      data: {
        label: values.label,

        fullName: values.fullName,
        phone: normalizedPhone,
        street: values.street,
        city: values.city,
        state: values.state,
        country: values.country ?? "",
        postalCode: values.postalCode ?? "",
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        isDefault: values.isDefault ?? false,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/checkout");

    return { success: true, address };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("invalid") ||
        error.message.toLowerCase().includes("geocode"))
    ) {
      return { error: "Please select a valid address from suggestions." };
    }
    return { error: "Failed to update address" };
  }
}

export async function deleteAddressAction(addressId: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const deleted = await prisma.address.delete({
      where: {
        id: addressId,
        userId,
      },
    });

    if (deleted.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });

      if (next) {
        await prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    revalidatePath("/settings");
    revalidatePath("/checkout");

    return { success: true };
  } catch {
    return { error: "Failed to delete address" };
  }
}

export async function setDefaultAddressAction(addressId: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addressId, userId },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/settings");
    revalidatePath("/checkout");

    return { success: true };
  } catch {
    return { error: "Failed to set default address" };
  }
}

export async function getUserAddressesAction() {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized", addresses: [] as const };

  try {
    const addresses = await prisma.address.findMany({
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

    return { success: true, addresses };
  } catch {
    return { error: "Failed to load addresses", addresses: [] as const };
  }
}
