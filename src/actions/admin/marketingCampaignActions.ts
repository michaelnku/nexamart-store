"use server";

import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/lib/audit/service";
import { CurrentUser } from "@/lib/currentUser";
import {
  archiveAdminMarketingCampaign,
  createAdminMarketingCampaign,
  getAdminMarketingCampaignById,
  listAdminMarketingCampaigns,
  marketingCampaignInputSchema,
  updateAdminMarketingCampaign,
} from "@/lib/services/admin/adminMarketingCampaignService";

async function ensureAdmin() {
  const user = await CurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized access" } as const;
  }

  return { user } as const;
}

function revalidateMarketingRoutes() {
  revalidatePath("/marketplace/dashboard/admin/marketing");
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function listMarketingCampaignsAction(params?: {
  includeArchived?: boolean;
}) {
  const auth = await ensureAdmin();

  if ("error" in auth) {
    throw new Error(auth.error);
  }

  return listAdminMarketingCampaigns({
    includeArchived: params?.includeArchived,
  });
}

export async function getMarketingCampaignByIdAction(id: string) {
  const auth = await ensureAdmin();

  if ("error" in auth) {
    throw new Error(auth.error);
  }

  return getAdminMarketingCampaignById(id);
}

export async function createMarketingCampaignAction(input: unknown) {
  const auth = await ensureAdmin();

  if ("error" in auth) {
    return { error: auth.error };
  }

  const parsed = marketingCampaignInputSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid campaign data." };
  }

  try {
    const campaign = await createAdminMarketingCampaign(parsed.data);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "MARKETING_CAMPAIGN_CREATED",
      targetEntityType: "MARKETING_CAMPAIGN",
      targetEntityId: campaign.id,
      summary: `Created marketing campaign ${campaign.name}.`,
      metadata: {
        name: campaign.name,
        slug: campaign.slug,
        status: campaign.status,
        heroBannerId: campaign.heroBannerId,
      },
    });

    revalidateMarketingRoutes();

    return { success: true, campaign };
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return { error: "A campaign with this slug already exists." };
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create marketing campaign.",
    };
  }
}

export async function updateMarketingCampaignAction(
  id: string,
  input: unknown,
) {
  const auth = await ensureAdmin();

  if ("error" in auth) {
    return { error: auth.error };
  }

  const parsed = marketingCampaignInputSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid campaign data." };
  }

  try {
    const campaign = await updateAdminMarketingCampaign(id, parsed.data);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "MARKETING_CAMPAIGN_UPDATED",
      targetEntityType: "MARKETING_CAMPAIGN",
      targetEntityId: campaign.id,
      summary: `Updated marketing campaign ${campaign.name}.`,
      metadata: {
        name: campaign.name,
        slug: campaign.slug,
        status: campaign.status,
        heroBannerId: campaign.heroBannerId,
      },
    });

    revalidateMarketingRoutes();

    return { success: true, campaign };
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return { error: "A campaign with this slug already exists." };
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update marketing campaign.",
    };
  }
}

export async function archiveMarketingCampaignAction(id: string) {
  const auth = await ensureAdmin();

  if ("error" in auth) {
    return { error: auth.error };
  }

  try {
    const campaign = await archiveAdminMarketingCampaign(id);

    await createAuditLog({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "MARKETING_CAMPAIGN_ARCHIVED",
      targetEntityType: "MARKETING_CAMPAIGN",
      targetEntityId: campaign.id,
      summary: `Archived marketing campaign ${campaign.name}.`,
      metadata: {
        name: campaign.name,
        slug: campaign.slug,
        status: campaign.status,
      },
    });

    revalidateMarketingRoutes();

    return { success: true, campaign };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to archive marketing campaign.",
    };
  }
}
