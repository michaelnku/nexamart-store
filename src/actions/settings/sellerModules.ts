"use server";

import { deleteStoreAction, UpdateStoreAction } from "@/actions/auth/store";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getCurrentSellerStoreForUpdate() {
  const user = await CurrentUser();
  if (!user || user.role !== "SELLER") {
    throw new Error("Unauthorized");
  }

  const store = await prisma.store.findUnique({
    where: { userId: user.id },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  return store;
}

async function updateSellerStoreFields(
  patch: Partial<{
    name: string;
    description: string;
    location: string;
    address: string | null;
    tagline: string | null;
    logo: string | null;
    bannerImage: string | null;
    isActive: boolean;
    emailNotificationsEnabled: boolean;
  }>,
) {
  const store = await getCurrentSellerStoreForUpdate();

  const result = await UpdateStoreAction({
    id: store.id,
    name: patch.name ?? store.name,
    description: patch.description ?? (store.description ?? ""),
    location: patch.location ?? (store.location ?? ""),
    address: patch.address ?? (store.address ?? undefined),
    tagline: patch.tagline ?? (store.tagline ?? undefined),
    type: store.type,
    fulfillmentType: store.fulfillmentType,
    logo: patch.logo ?? (store.logo ?? undefined),
    logoKey: store.logoKey ?? undefined,
    bannerImage: patch.bannerImage ?? (store.bannerImage ?? undefined),
    bannerKey: store.bannerKey ?? undefined,
    isActive: patch.isActive ?? store.isActive,
    emailNotificationsEnabled:
      patch.emailNotificationsEnabled ?? store.emailNotificationsEnabled,
  });

  if (result?.error) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/seller");
  revalidatePath("/settings/seller/profile");
  revalidatePath("/settings/seller/storefront");
  revalidatePath("/settings/seller/preferences");
}

export async function updateSellerProfileModule(formData: FormData) {
  await updateSellerStoreFields({
    name: formData.get("name")?.toString().trim() || undefined,
    description: formData.get("description")?.toString() || undefined,
    location: formData.get("location")?.toString().trim() || undefined,
    address: formData.get("address")?.toString().trim() || undefined,
  });
}

export async function updateSellerStorefrontModule(formData: FormData) {
  await updateSellerStoreFields({
    tagline: formData.get("tagline")?.toString() || undefined,
    logo: formData.get("logo")?.toString() || undefined,
    bannerImage: formData.get("bannerImage")?.toString() || undefined,
  });
}

export async function updateSellerPreferencesModule(formData: FormData) {
  await updateSellerStoreFields({
    isActive: formData.get("isActive") === "on",
    emailNotificationsEnabled: formData.get("emailNotificationsEnabled") === "on",
  });
}

export async function deleteSellerStoreModule(formData: FormData) {
  const confirmation = formData.get("confirmation")?.toString().trim();
  if (confirmation !== "DELETE MY STORE") {
    throw new Error('Type "DELETE MY STORE" to continue.');
  }

  const store = await getCurrentSellerStoreForUpdate();
  const result = await deleteStoreAction(store.id);
  if (result?.error) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/seller");
}
