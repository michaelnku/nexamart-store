"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { addressSchemaType } from "@/lib/zodValidation";
import {
  clearExistingDefaultAddress,
  createUserAddress,
  deleteUserAddress,
  findNextDefaultAddress,
  getUserAddresses,
  markAddressAsDefault,
  setUserDefaultAddress,
  updateUserAddress,
} from "@/lib/address/addressPersistence";
import type {
  AddressMutationResult as AddressMutationResultType,
  AddressSimpleResult as AddressSimpleResultType,
  UserAddressesResult as UserAddressesResultType,
} from "@/lib/address/address.types";
import { geocodeAddressInput } from "@/lib/address/geocodeAddressInput";
import { mapAddressActionError } from "@/lib/address/mapAddressActionError";
import { normalizeAddressInput } from "@/lib/address/normalizeAddressInput";
import { revalidateAddressPaths } from "@/lib/address/revalidateAddressPaths";
import { validateAddressInput } from "@/lib/address/validateAddressInput";

export async function createAddressAction(
  values: addressSchemaType,
): Promise<AddressMutationResultType> {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const parsed = validateAddressInput(values);
  if (!parsed.success) {
    return { error: "Invalid address data" };
  }

  try {
    const normalizedValues = normalizeAddressInput(values);
    const coordinates = await geocodeAddressInput(values);

    if (normalizedValues.isDefault) {
      await clearExistingDefaultAddress(userId);
    }

    const address = await createUserAddress({
      userId,
      values: normalizedValues,
      coordinates,
    });

    revalidateAddressPaths();

    return { success: true, address };
  } catch (error) {
    console.error("CREATE ADDRESS ERROR:", error);
    return mapAddressActionError(error, "Failed to create address");
  }
}

export async function updateAddressAction(
  addressId: string,
  values: addressSchemaType,
): Promise<AddressMutationResultType> {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const parsed = validateAddressInput(values);
  if (!parsed.success) {
    return { error: "Invalid address data" };
  }

  try {
    const normalizedValues = normalizeAddressInput(values);
    const coordinates = await geocodeAddressInput(values);

    if (normalizedValues.isDefault) {
      await clearExistingDefaultAddress(userId);
    }

    const address = await updateUserAddress({
      addressId,
      userId,
      values: normalizedValues,
      coordinates,
    });

    revalidateAddressPaths();

    return { success: true, address };
  } catch (error) {
    return mapAddressActionError(error, "Failed to update address");
  }
}

export async function deleteAddressAction(
  addressId: string,
): Promise<AddressSimpleResultType> {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const deleted = await deleteUserAddress({ addressId, userId });

    if (deleted.isDefault) {
      const next = await findNextDefaultAddress(userId);

      if (next) {
        await markAddressAsDefault({ addressId: next.id, userId });
      }
    }

    revalidateAddressPaths();

    return { success: true };
  } catch {
    return { error: "Failed to delete address" };
  }
}

export async function setDefaultAddressAction(
  addressId: string,
): Promise<AddressSimpleResultType> {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    await setUserDefaultAddress({ addressId, userId });

    revalidateAddressPaths();

    return { success: true };
  } catch {
    return { error: "Failed to set default address" };
  }
}

export async function getUserAddressesAction(): Promise<UserAddressesResultType> {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized", addresses: [] as const };

  try {
    const addresses = await getUserAddresses(userId);

    return { success: true, addresses };
  } catch {
    return { error: "Failed to load addresses", addresses: [] as const };
  }
}
