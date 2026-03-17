"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAnalyticsCount } from "@/lib/analytics/format";
import type { MarketingCampaignFormValues } from "@/components/admin/marketing/MarketingCampaignForm";

export type CampaignDisplayStatus = {
  label: string;
  toneClassName: string;
  isReadOnly: boolean;
};

export type PlacementDisplayStatus = {
  label: string;
  className: string;
};

export type PlacementFormState = {
  slot: string;
  tagLabel: string;
  notes: string;
  startsAt: string;
  endsAt: string;
  isEnabled: boolean;
};

export function MarketingLoadingState() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 rounded-[28px]" />
      <Skeleton className="h-24 rounded-[24px]" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-[24px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[360px] rounded-[28px]" />
        ))}
      </div>
      <Skeleton className="h-[520px] rounded-[28px]" />
    </div>
  );
}

export function formatMarketingDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function formatCouponValue(type: string, value: number) {
  if (type === "PERCENTAGE") {
    return `${formatAnalyticsCount(value)}%`;
  }

  if (type === "FREE_SHIPPING") {
    return "Free shipping";
  }

  return null;
}

export function BannerStatusBadge({
  status,
}: {
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED";
}) {
  const toneClassName =
    status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
      : status === "SCHEDULED"
        ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300"
        : status === "EXPIRED"
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
          : "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";

  return (
    <Badge variant="outline" className={toneClassName}>
      {status.toLowerCase().replace("_", " ")}
    </Badge>
  );
}

export function CampaignStatusBadge({
  status,
}: {
  status: CampaignDisplayStatus;
}) {
  return (
    <Badge variant="outline" className={status.toneClassName}>
      {status.label}
    </Badge>
  );
}

export function getCampaignDisplayStatus(campaign: {
  status: "DRAFT" | "ACTIVE" | "SCHEDULED" | "ARCHIVED";
  startsAt: string | null;
  endsAt: string | null;
}): CampaignDisplayStatus {
  if (campaign.status === "ARCHIVED") {
    return {
      label: "Archived",
      toneClassName:
        "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
      isReadOnly: true,
    };
  }

  if (campaign.status === "DRAFT") {
    return {
      label: "Draft",
      toneClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
      isReadOnly: false,
    };
  }

  const now = new Date();
  const startsAt = campaign.startsAt ? new Date(campaign.startsAt) : null;
  const endsAt = campaign.endsAt ? new Date(campaign.endsAt) : null;

  if (startsAt && startsAt > now) {
    return {
      label: "Scheduled",
      toneClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
      isReadOnly: false,
    };
  }

  if (endsAt && endsAt < now) {
    return {
      label: "Window ended",
      toneClassName:
        "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
      isReadOnly: false,
    };
  }

  if (campaign.status === "SCHEDULED") {
    return {
      label: "Scheduled",
      toneClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
      isReadOnly: false,
    };
  }

  return {
    label: "Active",
    toneClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    isReadOnly: false,
  };
}

export function getEmptyCampaignValues(): MarketingCampaignFormValues {
  return {
    name: "",
    slug: "",
    description: "",
    status: "DRAFT",
    themeKey: "",
    accentColor: "",
    notes: "",
    heroBannerId: "",
    startsAt: "",
    endsAt: "",
  };
}

export function getEmptyPlacementFormState(defaultSlot = ""): PlacementFormState {
  return {
    slot: defaultSlot,
    tagLabel: "",
    notes: "",
    startsAt: "",
    endsAt: "",
    isEnabled: true,
  };
}

export function toPlacementInput(
  campaignId: string,
  formState: PlacementFormState,
  entity: { storeId?: string; productId?: string },
) {
  return {
    campaignId,
    ...entity,
    slot: formState.slot,
    tagLabel: formState.tagLabel,
    notes: formState.notes,
    startsAt: formState.startsAt,
    endsAt: formState.endsAt,
    isEnabled: formState.isEnabled,
  };
}

export function getPlacementDisplayStatus(placement: {
  isEnabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
}): PlacementDisplayStatus {
  if (!placement.isEnabled) {
    return {
      label: "Disabled",
      className:
        "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
    };
  }

  const now = new Date();
  const startsAt = placement.startsAt ? new Date(placement.startsAt) : null;
  const endsAt = placement.endsAt ? new Date(placement.endsAt) : null;

  if (startsAt && startsAt > now) {
    return {
      label: "Scheduled",
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
    };
  }

  if (endsAt && endsAt < now) {
    return {
      label: "Expired",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    };
  }

  return {
    label: "Active",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  };
}
