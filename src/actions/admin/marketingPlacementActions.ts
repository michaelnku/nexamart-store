"use server";

import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/lib/audit/service";
import { CurrentUser } from "@/lib/currentUser";
import {
  createFeaturedProductPlacement,
  createFeaturedStorePlacement,
  deleteFeaturedProductPlacement,
  deleteFeaturedStorePlacement,
  featuredProductPlacementInputSchema,
  featuredStorePlacementInputSchema,
  moveFeaturedProductPlacement,
  moveFeaturedStorePlacement,
  toggleFeaturedProductPlacement,
  toggleFeaturedStorePlacement,
  updateFeaturedProductPlacement,
  updateFeaturedStorePlacement,
} from "@/lib/services/admin/adminMarketingPlacementService";

async function ensureAdmin() {
  const user = await CurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized access" } as const;
  }

  return { user } as const;
}

function revalidateMarketingPlacementRoutes() {
  revalidatePath("/");
  revalidatePath("/marketplace/dashboard/admin/marketing");
}

export async function createFeaturedStorePlacementAction(input: unknown) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = featuredStorePlacementInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid featured store placement.",
    };
  }

  try {
    const placement = await createFeaturedStorePlacement(parsed.data);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_STORE_PLACEMENT_CREATED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: placement.id,
      summary: `Created featured store placement for ${placement.store.name}.`,
      metadata: {
        campaignId: placement.campaignId,
        storeId: placement.store.id,
        slot: placement.slot,
      },
    });

    revalidateMarketingPlacementRoutes();
    return { success: true, placement };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create featured store placement.",
    };
  }
}

export async function updateFeaturedStorePlacementAction(
  id: string,
  input: unknown,
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = featuredStorePlacementInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid featured store placement.",
    };
  }

  try {
    const placement = await updateFeaturedStorePlacement(id, parsed.data);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_STORE_PLACEMENT_UPDATED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: placement.id,
      summary: `Updated featured store placement for ${placement.store.name}.`,
      metadata: {
        campaignId: placement.campaignId,
        storeId: placement.store.id,
        slot: placement.slot,
        isEnabled: placement.isEnabled,
      },
    });

    revalidateMarketingPlacementRoutes();
    return { success: true, placement };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update featured store placement.",
    };
  }
}

export async function deleteFeaturedStorePlacementAction(id: string) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  try {
    await deleteFeaturedStorePlacement(id);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_STORE_PLACEMENT_DELETED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: id,
      summary: "Deleted featured store placement.",
    });

    revalidateMarketingPlacementRoutes();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete featured store placement.",
    };
  }
}

export async function toggleFeaturedStorePlacementAction(
  id: string,
  isEnabled: boolean,
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  try {
    const placement = await toggleFeaturedStorePlacement(id, isEnabled);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_STORE_PLACEMENT_STATUS_CHANGED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: placement.id,
      summary: `${isEnabled ? "Enabled" : "Disabled"} featured store placement for ${placement.store.name}.`,
      metadata: {
        campaignId: placement.campaignId,
        storeId: placement.store.id,
        slot: placement.slot,
        isEnabled,
      },
    });

    revalidateMarketingPlacementRoutes();
    return { success: true, placement };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update featured store placement state.",
    };
  }
}

export async function moveFeaturedStorePlacementAction(
  id: string,
  direction: "up" | "down",
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  try {
    await moveFeaturedStorePlacement(id, direction);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_STORE_PLACEMENT_REORDERED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: id,
      summary: `Moved featured store placement ${direction}.`,
      metadata: {
        direction,
      },
    });

    revalidateMarketingPlacementRoutes();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to reorder featured store placement.",
    };
  }
}

export async function createFeaturedProductPlacementAction(input: unknown) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = featuredProductPlacementInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Invalid featured product placement.",
    };
  }

  try {
    const placement = await createFeaturedProductPlacement(parsed.data);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_PRODUCT_PLACEMENT_CREATED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: placement.id,
      summary: `Created featured product placement for ${placement.product.name}.`,
      metadata: {
        campaignId: placement.campaignId,
        productId: placement.product.id,
        slot: placement.slot,
      },
    });

    revalidateMarketingPlacementRoutes();
    return { success: true, placement };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create featured product placement.",
    };
  }
}

export async function updateFeaturedProductPlacementAction(
  id: string,
  input: unknown,
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = featuredProductPlacementInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Invalid featured product placement.",
    };
  }

  try {
    const placement = await updateFeaturedProductPlacement(id, parsed.data);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_PRODUCT_PLACEMENT_UPDATED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: placement.id,
      summary: `Updated featured product placement for ${placement.product.name}.`,
      metadata: {
        campaignId: placement.campaignId,
        productId: placement.product.id,
        slot: placement.slot,
        isEnabled: placement.isEnabled,
      },
    });

    revalidateMarketingPlacementRoutes();
    return { success: true, placement };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update featured product placement.",
    };
  }
}

export async function deleteFeaturedProductPlacementAction(id: string) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  try {
    await deleteFeaturedProductPlacement(id);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_PRODUCT_PLACEMENT_DELETED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: id,
      summary: "Deleted featured product placement.",
    });

    revalidateMarketingPlacementRoutes();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete featured product placement.",
    };
  }
}

export async function toggleFeaturedProductPlacementAction(
  id: string,
  isEnabled: boolean,
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  try {
    const placement = await toggleFeaturedProductPlacement(id, isEnabled);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_PRODUCT_PLACEMENT_STATUS_CHANGED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: placement.id,
      summary: `${isEnabled ? "Enabled" : "Disabled"} featured product placement for ${placement.product.name}.`,
      metadata: {
        campaignId: placement.campaignId,
        productId: placement.product.id,
        slot: placement.slot,
        isEnabled,
      },
    });

    revalidateMarketingPlacementRoutes();
    return { success: true, placement };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update featured product placement state.",
    };
  }
}

export async function moveFeaturedProductPlacementAction(
  id: string,
  direction: "up" | "down",
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  try {
    await moveFeaturedProductPlacement(id, direction);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "FEATURED_PRODUCT_PLACEMENT_REORDERED",
      targetEntityType: "MARKETING_PLACEMENT",
      targetEntityId: id,
      summary: `Moved featured product placement ${direction}.`,
      metadata: {
        direction,
      },
    });

    revalidateMarketingPlacementRoutes();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to reorder featured product placement.",
    };
  }
}
