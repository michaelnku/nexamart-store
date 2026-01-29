"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";
import { addressSchema, addressSchemaType } from "@/lib/zodValidation";

export async function createAddressAction(values: addressSchemaType) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid address data" };
  }

  try {
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
        phone: values.phone,
        street: values.street,
        city: values.city,
        state: values.state,
        country: values.country ?? "",
        postalCode: values.postalCode ?? "",
        isDefault: values.isDefault ?? false,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/checkout");

    return { success: true, address };
  } catch (error) {
    console.error("CREATE ADDRESS ERROR:", error);
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
        phone: values.phone,
        street: values.street,
        city: values.city,
        state: values.state,
        country: values.country ?? "",
        postalCode: values.postalCode ?? "",
        isDefault: values.isDefault ?? false,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/checkout");

    return { success: true, address };
  } catch {
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
