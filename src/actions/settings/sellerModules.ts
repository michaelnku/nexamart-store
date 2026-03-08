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

async function updateSellerStoreInternal(
  patch: Partial<{
    name: string;
    description: string;
    location: string;
    address: string | null;
    tagline: string | null;
    logo: string | null;
    logoKey: string | null;
    bannerImage: string | null;
    bannerKey: string | null;
    isActive: boolean;
    emailNotificationsEnabled: boolean;
  }>,
) {
  const store = await getCurrentSellerStoreForUpdate();

  const has = <K extends keyof typeof patch>(key: K) =>
    Object.prototype.hasOwnProperty.call(patch, key);

  const result = await UpdateStoreAction({
    id: store.id,
    name: has("name") ? (patch.name ?? store.name) : store.name,
    description: has("description")
      ? (patch.description ?? "")
      : (store.description ?? ""),
    location: has("location") ? (patch.location ?? "") : (store.location ?? ""),
    address: has("address")
      ? (patch.address ?? undefined)
      : (store.address ?? undefined),
    tagline: has("tagline")
      ? (patch.tagline ?? undefined)
      : (store.tagline ?? undefined),
    type: store.type,
    fulfillmentType: store.fulfillmentType,
    logo: has("logo") ? (patch.logo ?? undefined) : (store.logo ?? undefined),
    logoKey: has("logoKey")
      ? (patch.logoKey ?? undefined)
      : (store.logoKey ?? undefined),
    bannerImage: has("bannerImage")
      ? (patch.bannerImage ?? undefined)
      : (store.bannerImage ?? undefined),
    bannerKey: has("bannerKey")
      ? (patch.bannerKey ?? undefined)
      : (store.bannerKey ?? undefined),
    isActive: patch.isActive ?? store.isActive,
    emailNotificationsEnabled:
      patch.emailNotificationsEnabled ?? store.emailNotificationsEnabled,
  });

  if (result?.error) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/seller");
  revalidatePath("/settings/seller/store");
  revalidatePath("/settings/seller/storefront");
  revalidatePath("/settings/seller/preferences");
}

export async function updateSellerProfileModule(formData: FormData) {
  await updateSellerStoreInternal({
    name: formData.get("name")?.toString().trim() || undefined,
    description: formData.get("description")?.toString() || undefined,
    location: formData.get("location")?.toString().trim() || undefined,
    address: formData.get("address")?.toString().trim() || undefined,
  });
}

export async function updateSellerStorefrontModule(formData: FormData) {
  const taglineValue = formData.get("tagline")?.toString();
  const logoValue = formData.get("logo")?.toString();
  const logoKeyValue = formData.get("logoKey")?.toString();
  const bannerValue = formData.get("bannerImage")?.toString();
  const bannerKeyValue = formData.get("bannerKey")?.toString();

  const normalizeOptional = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : null;
  };

  await updateSellerStoreInternal({
    tagline: normalizeOptional(taglineValue),
    logo: normalizeOptional(logoValue),
    logoKey: normalizeOptional(logoKeyValue),
    bannerImage: normalizeOptional(bannerValue),
    bannerKey: normalizeOptional(bannerKeyValue),
  });
}

export async function updateSellerPreferencesModule(formData: FormData) {
  await updateSellerStoreInternal({
    isActive: formData.get("isActive") === "on",
    emailNotificationsEnabled:
      formData.get("emailNotificationsEnabled") === "on",
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
