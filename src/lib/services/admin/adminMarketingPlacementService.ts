import "server-only";

import {
  MarketingCampaignStatus,
  MarketingPlacementSlot,
  Prisma,
} from "@/generated/prisma";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseOptionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue =
      value.length === 10 ? `${value}T00:00:00` : value;
    const parsedDate = new Date(normalizedValue);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return value;
}

export const featuredStorePlacementInputSchema = z
  .object({
    campaignId: z.string().cuid(),
    storeId: z.string().cuid(),
    slot: z.nativeEnum(MarketingPlacementSlot),
    isEnabled: z.boolean().default(true),
    tagLabel: z.preprocess(
      normalizeOptionalString,
      z.string().max(80).optional(),
    ),
    notes: z.preprocess(
      normalizeOptionalString,
      z.string().max(1000).optional(),
    ),
    startsAt: z.preprocess(parseOptionalDate, z.date().optional()),
    endsAt: z.preprocess(parseOptionalDate, z.date().optional()),
  })
  .refine(
    (data) => !(data.startsAt && data.endsAt && data.startsAt > data.endsAt),
    {
      message: "Placement start date cannot be after the end date.",
      path: ["endsAt"],
    },
  );

export const featuredProductPlacementInputSchema = z
  .object({
    campaignId: z.string().cuid(),
    productId: z.string().cuid(),
    slot: z.nativeEnum(MarketingPlacementSlot),
    isEnabled: z.boolean().default(true),
    tagLabel: z.preprocess(
      normalizeOptionalString,
      z.string().max(80).optional(),
    ),
    notes: z.preprocess(
      normalizeOptionalString,
      z.string().max(1000).optional(),
    ),
    startsAt: z.preprocess(parseOptionalDate, z.date().optional()),
    endsAt: z.preprocess(parseOptionalDate, z.date().optional()),
  })
  .refine(
    (data) => !(data.startsAt && data.endsAt && data.startsAt > data.endsAt),
    {
      message: "Placement start date cannot be after the end date.",
      path: ["endsAt"],
    },
  );

export type FeaturedStorePlacementInput = z.infer<
  typeof featuredStorePlacementInputSchema
>;
export type FeaturedProductPlacementInput = z.infer<
  typeof featuredProductPlacementInputSchema
>;

export type AdminFeaturedStorePlacement = {
  id: string;
  campaignId: string;
  store: {
    id: string;
    name: string;
    ownerLabel: string;
  };
  slot: MarketingPlacementSlot;
  priority: number;
  isEnabled: boolean;
  tagLabel: string | null;
  notes: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminFeaturedProductPlacement = {
  id: string;
  campaignId: string;
  product: {
    id: string;
    name: string;
  };
  store: {
    id: string;
    name: string;
  };
  slot: MarketingPlacementSlot;
  priority: number;
  isEnabled: boolean;
  tagLabel: string | null;
  notes: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlacementSlotOption = {
  value: MarketingPlacementSlot;
  label: string;
};

export const STORE_PLACEMENT_SLOTS: MarketingPlacementSlot[] = [
  "HOMEPAGE_FEATURED_STORES",
  "SEASONAL_CAMPAIGN_STRIP",
  "STORE_SPOTLIGHT_ROW",
  "RECOMMENDED_CAMPAIGN_SLOT",
];

export const PRODUCT_PLACEMENT_SLOTS: MarketingPlacementSlot[] = [
  "HOMEPAGE_FEATURED_PRODUCTS",
  "SEASONAL_CAMPAIGN_STRIP",
  "RECOMMENDED_CAMPAIGN_SLOT",
];

export const STORE_PLACEMENT_SLOT_OPTIONS: PlacementSlotOption[] =
  STORE_PLACEMENT_SLOTS.map((slot) => ({
    value: slot,
    label: labelEnumValue(slot),
  }));

export const PRODUCT_PLACEMENT_SLOT_OPTIONS: PlacementSlotOption[] =
  PRODUCT_PLACEMENT_SLOTS.map((slot) => ({
    value: slot,
    label: labelEnumValue(slot),
  }));

function labelEnumValue(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toIsoString(value: Date | null) {
  return value?.toISOString() ?? null;
}

type StorePlacementRecord = Prisma.FeaturedStorePlacementGetPayload<{
  include: {
    store: {
      select: {
        id: true;
        name: true;
        owner: {
          select: {
            name: true;
            email: true;
          };
        };
      };
    };
  };
}>;

type ProductPlacementRecord = Prisma.FeaturedProductPlacementGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        name: true;
        store: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}>;

function serializeStorePlacement(
  placement: StorePlacementRecord,
): AdminFeaturedStorePlacement {
  return {
    id: placement.id,
    campaignId: placement.campaignId,
    store: {
      id: placement.store.id,
      name: placement.store.name,
      ownerLabel: placement.store.owner.name ?? placement.store.owner.email,
    },
    slot: placement.slot,
    priority: placement.priority,
    isEnabled: placement.isEnabled,
    tagLabel: placement.tagLabel,
    notes: placement.notes,
    startsAt: toIsoString(placement.startsAt),
    endsAt: toIsoString(placement.endsAt),
    createdAt: placement.createdAt.toISOString(),
    updatedAt: placement.updatedAt.toISOString(),
  };
}

function serializeProductPlacement(
  placement: ProductPlacementRecord,
): AdminFeaturedProductPlacement {
  return {
    id: placement.id,
    campaignId: placement.campaignId,
    product: {
      id: placement.product.id,
      name: placement.product.name,
    },
    store: {
      id: placement.product.store.id,
      name: placement.product.store.name,
    },
    slot: placement.slot,
    priority: placement.priority,
    isEnabled: placement.isEnabled,
    tagLabel: placement.tagLabel,
    notes: placement.notes,
    startsAt: toIsoString(placement.startsAt),
    endsAt: toIsoString(placement.endsAt),
    createdAt: placement.createdAt.toISOString(),
    updatedAt: placement.updatedAt.toISOString(),
  };
}

async function ensureCampaignMutable(campaignId: string) {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true },
  });

  if (!campaign) {
    throw new Error("Marketing campaign not found.");
  }

  if (campaign.status === MarketingCampaignStatus.ARCHIVED) {
    throw new Error("Archived campaigns are read-only.");
  }

  return campaign;
}

async function ensureStoreEligible(storeId: string) {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      isDeleted: false,
      isSuspended: false,
    },
    select: { id: true },
  });

  if (!store) {
    throw new Error("Selected store could not be found.");
  }
}

async function ensureProductEligible(productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isPublished: true,
      store: {
        isDeleted: false,
        isSuspended: false,
      },
    },
    select: { id: true },
  });

  if (!product) {
    throw new Error("Selected product could not be found.");
  }
}

async function normalizeStorePlacementPriorities(
  campaignId: string,
  slot: MarketingPlacementSlot,
) {
  const placements = await prisma.featuredStorePlacement.findMany({
    where: { campaignId, slot },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  await Promise.all(
    placements.map((placement, index) =>
      prisma.featuredStorePlacement.update({
        where: { id: placement.id },
        data: { priority: index },
      }),
    ),
  );
}

async function normalizeProductPlacementPriorities(
  campaignId: string,
  slot: MarketingPlacementSlot,
) {
  const placements = await prisma.featuredProductPlacement.findMany({
    where: { campaignId, slot },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  await Promise.all(
    placements.map((placement, index) =>
      prisma.featuredProductPlacement.update({
        where: { id: placement.id },
        data: { priority: index },
      }),
    ),
  );
}

export async function listFeaturedStorePlacementsForCampaign(
  campaignId: string,
): Promise<AdminFeaturedStorePlacement[]> {
  const placements = await prisma.featuredStorePlacement.findMany({
    where: { campaignId },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [{ slot: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
  });

  return placements.map(serializeStorePlacement);
}

export async function listFeaturedProductPlacementsForCampaign(
  campaignId: string,
): Promise<AdminFeaturedProductPlacement[]> {
  const placements = await prisma.featuredProductPlacement.findMany({
    where: { campaignId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ slot: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
  });

  return placements.map(serializeProductPlacement);
}

export async function listFeaturedStorePlacementsForCampaigns(
  campaignIds: string[],
): Promise<Record<string, AdminFeaturedStorePlacement[]>> {
  if (campaignIds.length === 0) {
    return {};
  }

  const placements = await prisma.featuredStorePlacement.findMany({
    where: {
      campaignId: { in: campaignIds },
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [{ campaignId: "asc" }, { slot: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
  });

  return placements.reduce<Record<string, AdminFeaturedStorePlacement[]>>(
    (accumulator, placement) => {
      const serialized = serializeStorePlacement(placement);
      accumulator[placement.campaignId] ??= [];
      accumulator[placement.campaignId].push(serialized);
      return accumulator;
    },
    {},
  );
}

export async function listFeaturedProductPlacementsForCampaigns(
  campaignIds: string[],
): Promise<Record<string, AdminFeaturedProductPlacement[]>> {
  if (campaignIds.length === 0) {
    return {};
  }

  const placements = await prisma.featuredProductPlacement.findMany({
    where: {
      campaignId: { in: campaignIds },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ campaignId: "asc" }, { slot: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
  });

  return placements.reduce<Record<string, AdminFeaturedProductPlacement[]>>(
    (accumulator, placement) => {
      const serialized = serializeProductPlacement(placement);
      accumulator[placement.campaignId] ??= [];
      accumulator[placement.campaignId].push(serialized);
      return accumulator;
    },
    {},
  );
}

export async function createFeaturedStorePlacement(
  input: FeaturedStorePlacementInput,
) {
  await ensureCampaignMutable(input.campaignId);
  await ensureStoreEligible(input.storeId);

  const existingPlacement = await prisma.featuredStorePlacement.findUnique({
    where: {
      campaignId_storeId_slot: {
        campaignId: input.campaignId,
        storeId: input.storeId,
        slot: input.slot,
      },
    },
    select: { id: true },
  });

  if (existingPlacement) {
    throw new Error("This store is already assigned to the campaign in that slot.");
  }

  const nextPriority = await prisma.featuredStorePlacement.count({
    where: {
      campaignId: input.campaignId,
      slot: input.slot,
    },
  });

  const placement = await prisma.featuredStorePlacement.create({
    data: {
      campaignId: input.campaignId,
      storeId: input.storeId,
      slot: input.slot,
      isEnabled: input.isEnabled,
      priority: nextPriority,
      tagLabel: input.tagLabel ?? null,
      notes: input.notes ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  await normalizeStorePlacementPriorities(input.campaignId, input.slot);

  return serializeStorePlacement(placement);
}

export async function updateFeaturedStorePlacement(
  id: string,
  input: FeaturedStorePlacementInput,
) {
  const existingPlacement = await prisma.featuredStorePlacement.findUnique({
    where: { id },
    select: {
      id: true,
      campaignId: true,
      slot: true,
    },
  });

  if (!existingPlacement) {
    throw new Error("Featured store placement not found.");
  }

  await ensureCampaignMutable(input.campaignId);
  await ensureStoreEligible(input.storeId);

  const conflictingPlacement = await prisma.featuredStorePlacement.findUnique({
    where: {
      campaignId_storeId_slot: {
        campaignId: input.campaignId,
        storeId: input.storeId,
        slot: input.slot,
      },
    },
    select: { id: true },
  });

  if (conflictingPlacement && conflictingPlacement.id !== id) {
    throw new Error("This store is already assigned to the campaign in that slot.");
  }

  const placementCountInSlot = await prisma.featuredStorePlacement.count({
    where: {
      campaignId: input.campaignId,
      slot: input.slot,
    },
  });

  const placement = await prisma.featuredStorePlacement.update({
    where: { id },
    data: {
      campaignId: input.campaignId,
      storeId: input.storeId,
      slot: input.slot,
      isEnabled: input.isEnabled,
      priority:
        existingPlacement.campaignId === input.campaignId &&
        existingPlacement.slot === input.slot
          ? undefined
          : placementCountInSlot,
      tagLabel: input.tagLabel ?? null,
      notes: input.notes ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  await Promise.all([
    normalizeStorePlacementPriorities(existingPlacement.campaignId, existingPlacement.slot),
    existingPlacement.campaignId === input.campaignId &&
    existingPlacement.slot === input.slot
      ? Promise.resolve()
      : normalizeStorePlacementPriorities(input.campaignId, input.slot),
  ]);

  return serializeStorePlacement(placement);
}

export async function deleteFeaturedStorePlacement(id: string) {
  const existingPlacement = await prisma.featuredStorePlacement.findUnique({
    where: { id },
    select: {
      id: true,
      campaignId: true,
      slot: true,
    },
  });

  if (!existingPlacement) {
    throw new Error("Featured store placement not found.");
  }

  await ensureCampaignMutable(existingPlacement.campaignId);

  await prisma.featuredStorePlacement.delete({
    where: { id },
  });

  await normalizeStorePlacementPriorities(
    existingPlacement.campaignId,
    existingPlacement.slot,
  );
}

export async function toggleFeaturedStorePlacement(
  id: string,
  isEnabled: boolean,
) {
  const existingPlacement = await prisma.featuredStorePlacement.findUnique({
    where: { id },
    select: {
      id: true,
      campaignId: true,
      slot: true,
    },
  });

  if (!existingPlacement) {
    throw new Error("Featured store placement not found.");
  }

  await ensureCampaignMutable(existingPlacement.campaignId);

  const placement = await prisma.featuredStorePlacement.update({
    where: { id },
    data: { isEnabled },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return serializeStorePlacement(placement);
}

export async function moveFeaturedStorePlacement(
  id: string,
  direction: "up" | "down",
) {
  const currentPlacement = await prisma.featuredStorePlacement.findUnique({
    where: { id },
    select: {
      id: true,
      campaignId: true,
      slot: true,
      priority: true,
    },
  });

  if (!currentPlacement) {
    throw new Error("Featured store placement not found.");
  }

  await ensureCampaignMutable(currentPlacement.campaignId);

  const placements = await prisma.featuredStorePlacement.findMany({
    where: {
      campaignId: currentPlacement.campaignId,
      slot: currentPlacement.slot,
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    select: { id: true, priority: true },
  });

  const currentIndex = placements.findIndex((placement) => placement.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= placements.length) {
    return;
  }

  const current = placements[currentIndex];
  const target = placements[targetIndex];

  await prisma.$transaction([
    prisma.featuredStorePlacement.update({
      where: { id: current.id },
      data: { priority: target.priority },
    }),
    prisma.featuredStorePlacement.update({
      where: { id: target.id },
      data: { priority: current.priority },
    }),
  ]);

  await normalizeStorePlacementPriorities(
    currentPlacement.campaignId,
    currentPlacement.slot,
  );
}

export async function createFeaturedProductPlacement(
  input: FeaturedProductPlacementInput,
) {
  await ensureCampaignMutable(input.campaignId);
  await ensureProductEligible(input.productId);

  const existingPlacement = await prisma.featuredProductPlacement.findUnique({
    where: {
      campaignId_productId_slot: {
        campaignId: input.campaignId,
        productId: input.productId,
        slot: input.slot,
      },
    },
    select: { id: true },
  });

  if (existingPlacement) {
    throw new Error(
      "This product is already assigned to the campaign in that slot.",
    );
  }

  const nextPriority = await prisma.featuredProductPlacement.count({
    where: {
      campaignId: input.campaignId,
      slot: input.slot,
    },
  });

  const placement = await prisma.featuredProductPlacement.create({
    data: {
      campaignId: input.campaignId,
      productId: input.productId,
      slot: input.slot,
      isEnabled: input.isEnabled,
      priority: nextPriority,
      tagLabel: input.tagLabel ?? null,
      notes: input.notes ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  await normalizeProductPlacementPriorities(input.campaignId, input.slot);

  return serializeProductPlacement(placement);
}

export async function updateFeaturedProductPlacement(
  id: string,
  input: FeaturedProductPlacementInput,
) {
  const existingPlacement = await prisma.featuredProductPlacement.findUnique({
    where: { id },
    select: {
      id: true,
      campaignId: true,
      slot: true,
    },
  });

  if (!existingPlacement) {
    throw new Error("Featured product placement not found.");
  }

  await ensureCampaignMutable(input.campaignId);
  await ensureProductEligible(input.productId);

  const conflictingPlacement = await prisma.featuredProductPlacement.findUnique({
    where: {
      campaignId_productId_slot: {
        campaignId: input.campaignId,
        productId: input.productId,
        slot: input.slot,
      },
    },
    select: { id: true },
  });

  if (conflictingPlacement && conflictingPlacement.id !== id) {
    throw new Error(
      "This product is already assigned to the campaign in that slot.",
    );
  }

  const placementCountInSlot = await prisma.featuredProductPlacement.count({
    where: {
      campaignId: input.campaignId,
      slot: input.slot,
    },
  });

  const placement = await prisma.featuredProductPlacement.update({
    where: { id },
    data: {
      campaignId: input.campaignId,
      productId: input.productId,
      slot: input.slot,
      isEnabled: input.isEnabled,
      priority:
        existingPlacement.campaignId === input.campaignId &&
        existingPlacement.slot === input.slot
          ? undefined
          : placementCountInSlot,
      tagLabel: input.tagLabel ?? null,
      notes: input.notes ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  await Promise.all([
    normalizeProductPlacementPriorities(
      existingPlacement.campaignId,
      existingPlacement.slot,
    ),
    existingPlacement.campaignId === input.campaignId &&
    existingPlacement.slot === input.slot
      ? Promise.resolve()
      : normalizeProductPlacementPriorities(input.campaignId, input.slot),
  ]);

  return serializeProductPlacement(placement);
}

export async function deleteFeaturedProductPlacement(id: string) {
  const existingPlacement = await prisma.featuredProductPlacement.findUnique({
    where: { id },
    select: {
      id: true,
      campaignId: true,
      slot: true,
    },
  });

  if (!existingPlacement) {
    throw new Error("Featured product placement not found.");
  }

  await ensureCampaignMutable(existingPlacement.campaignId);

  await prisma.featuredProductPlacement.delete({
    where: { id },
  });

  await normalizeProductPlacementPriorities(
    existingPlacement.campaignId,
    existingPlacement.slot,
  );
}

export async function toggleFeaturedProductPlacement(
  id: string,
  isEnabled: boolean,
) {
  const existingPlacement = await prisma.featuredProductPlacement.findUnique({
    where: { id },
    select: {
      id: true,
      campaignId: true,
    },
  });

  if (!existingPlacement) {
    throw new Error("Featured product placement not found.");
  }

  await ensureCampaignMutable(existingPlacement.campaignId);

  const placement = await prisma.featuredProductPlacement.update({
    where: { id },
    data: { isEnabled },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return serializeProductPlacement(placement);
}

export async function moveFeaturedProductPlacement(
  id: string,
  direction: "up" | "down",
) {
  const currentPlacement = await prisma.featuredProductPlacement.findUnique({
    where: { id },
    select: {
      id: true,
      campaignId: true,
      slot: true,
      priority: true,
    },
  });

  if (!currentPlacement) {
    throw new Error("Featured product placement not found.");
  }

  await ensureCampaignMutable(currentPlacement.campaignId);

  const placements = await prisma.featuredProductPlacement.findMany({
    where: {
      campaignId: currentPlacement.campaignId,
      slot: currentPlacement.slot,
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    select: { id: true, priority: true },
  });

  const currentIndex = placements.findIndex((placement) => placement.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= placements.length) {
    return;
  }

  const current = placements[currentIndex];
  const target = placements[targetIndex];

  await prisma.$transaction([
    prisma.featuredProductPlacement.update({
      where: { id: current.id },
      data: { priority: target.priority },
    }),
    prisma.featuredProductPlacement.update({
      where: { id: target.id },
      data: { priority: current.priority },
    }),
  ]);

  await normalizeProductPlacementPriorities(
    currentPlacement.campaignId,
    currentPlacement.slot,
  );
}
