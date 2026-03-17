import "server-only";

import {
  MarketingCampaignStatus,
  Prisma,
} from "@/generated/prisma";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

function labelEnumValue(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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

export const marketingCampaignInputSchema = z
  .object({
    name: z.string().trim().min(1, "Campaign name is required."),
    slug: z
      .string()
      .trim()
      .min(1, "Campaign slug is required.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must use lowercase letters, numbers, and hyphens only.",
      ),
    description: z.preprocess(
      normalizeOptionalString,
      z.string().max(500).optional(),
    ),
    status: z.nativeEnum(MarketingCampaignStatus),
    themeKey: z.preprocess(
      normalizeOptionalString,
      z.string().max(80).optional(),
    ),
    accentColor: z.preprocess(
      normalizeOptionalString,
      z
        .string()
        .regex(
          /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
          "Accent color must be a valid hex value.",
        )
        .optional(),
    ),
    notes: z.preprocess(
      normalizeOptionalString,
      z.string().max(1000).optional(),
    ),
    heroBannerId: z.preprocess(
      normalizeOptionalString,
      z.string().cuid().optional(),
    ),
    startsAt: z.preprocess(parseOptionalDate, z.date().optional()),
    endsAt: z.preprocess(parseOptionalDate, z.date().optional()),
  })
  .refine(
    (data) =>
      !(data.startsAt && data.endsAt && data.startsAt > data.endsAt),
    {
      message: "Campaign start date cannot be after the end date.",
      path: ["endsAt"],
    },
  );

export type MarketingCampaignInput = z.infer<
  typeof marketingCampaignInputSchema
>;

export type AdminMarketingCampaign = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: MarketingCampaignStatus;
  themeKey: string | null;
  accentColor: string | null;
  notes: string | null;
  heroBannerId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  heroBanner: {
    id: string;
    title: string;
    placementLabel: string;
  } | null;
};

function serializeCampaign(
  campaign: Prisma.MarketingCampaignGetPayload<{
    include: {
      heroBanner: {
        select: {
          id: true;
          title: true;
          placement: true;
        };
      };
    };
  }>,
): AdminMarketingCampaign {
  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    description: campaign.description,
    status: campaign.status,
    themeKey: campaign.themeKey,
    accentColor: campaign.accentColor,
    notes: campaign.notes,
    heroBannerId: campaign.heroBannerId,
    startsAt: campaign.startsAt?.toISOString() ?? null,
    endsAt: campaign.endsAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    heroBanner: campaign.heroBanner
      ? {
          id: campaign.heroBanner.id,
          title: campaign.heroBanner.title?.trim() || "Untitled banner",
          placementLabel: labelEnumValue(campaign.heroBanner.placement),
        }
      : null,
  };
}

async function ensureUniqueCampaignSlug(slug: string, excludeId?: string) {
  const existingCampaign = await prisma.marketingCampaign.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingCampaign && existingCampaign.id !== excludeId) {
    throw new Error("A campaign with this slug already exists.");
  }
}

async function ensureHeroBannerExists(heroBannerId?: string) {
  if (!heroBannerId) {
    return;
  }

  const banner = await prisma.heroBanner.findFirst({
    where: {
      id: heroBannerId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!banner) {
    throw new Error("Selected hero banner could not be found.");
  }
}

export async function listAdminMarketingCampaigns(options?: {
  includeArchived?: boolean;
}): Promise<AdminMarketingCampaign[]> {
  const campaigns = await prisma.marketingCampaign.findMany({
    where: options?.includeArchived ? undefined : { status: { not: "ARCHIVED" } },
    include: {
      heroBanner: {
        select: {
          id: true,
          title: true,
          placement: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { startsAt: "asc" },
      { createdAt: "desc" },
    ],
  });

  return campaigns.map(serializeCampaign);
}

export async function getAdminMarketingCampaignById(
  id: string,
): Promise<AdminMarketingCampaign | null> {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    include: {
      heroBanner: {
        select: {
          id: true,
          title: true,
          placement: true,
        },
      },
    },
  });

  return campaign ? serializeCampaign(campaign) : null;
}

export async function createAdminMarketingCampaign(
  input: MarketingCampaignInput,
): Promise<AdminMarketingCampaign> {
  await ensureUniqueCampaignSlug(input.slug);
  await ensureHeroBannerExists(input.heroBannerId);

  const campaign = await prisma.marketingCampaign.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: input.status,
      themeKey: input.themeKey ?? null,
      accentColor: input.accentColor ?? null,
      notes: input.notes ?? null,
      heroBannerId: input.heroBannerId ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    },
    include: {
      heroBanner: {
        select: {
          id: true,
          title: true,
          placement: true,
        },
      },
    },
  });

  return serializeCampaign(campaign);
}

export async function updateAdminMarketingCampaign(
  id: string,
  input: MarketingCampaignInput,
): Promise<AdminMarketingCampaign> {
  const existingCampaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingCampaign) {
    throw new Error("Marketing campaign not found.");
  }

  await ensureUniqueCampaignSlug(input.slug, id);
  await ensureHeroBannerExists(input.heroBannerId);

  const campaign = await prisma.marketingCampaign.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: input.status,
      themeKey: input.themeKey ?? null,
      accentColor: input.accentColor ?? null,
      notes: input.notes ?? null,
      heroBannerId: input.heroBannerId ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    },
    include: {
      heroBanner: {
        select: {
          id: true,
          title: true,
          placement: true,
        },
      },
    },
  });

  return serializeCampaign(campaign);
}

export async function archiveAdminMarketingCampaign(
  id: string,
): Promise<AdminMarketingCampaign> {
  const existingCampaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingCampaign) {
    throw new Error("Marketing campaign not found.");
  }

  const campaign = await prisma.marketingCampaign.update({
    where: { id },
    data: {
      status: "ARCHIVED",
    },
    include: {
      heroBanner: {
        select: {
          id: true,
          title: true,
          placement: true,
        },
      },
    },
  });

  return serializeCampaign(campaign);
}
