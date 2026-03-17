"use client";

import {
  Archive,
  ArrowDown,
  ArrowUp,
  CalendarRange,
  PencilLine,
  ExternalLink,
  LayoutTemplate,
  Megaphone,
  MoreHorizontal,
  MousePointerClick,
  Percent,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBag,
  Tag,
  TicketPercent,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  DashboardHero,
  PremiumPanel,
  PremiumStatCard,
} from "@/app/marketplace/_components/PremiumDashboard";
import {
  AnalyticsChangeFooter,
  AnalyticsRankedList,
  AnalyticsTrendPanel,
} from "@/app/marketplace/dashboard/admin/_components/AdminAnalyticsPanels";
import {
  archiveMarketingCampaignAction,
  createMarketingCampaignAction,
  updateMarketingCampaignAction,
} from "@/actions/admin/marketingCampaignActions";
import {
  createFeaturedProductPlacementAction,
  createFeaturedStorePlacementAction,
  deleteFeaturedProductPlacementAction,
  deleteFeaturedStorePlacementAction,
  moveFeaturedProductPlacementAction,
  moveFeaturedStorePlacementAction,
  toggleFeaturedProductPlacementAction,
  toggleFeaturedStorePlacementAction,
  updateFeaturedProductPlacementAction,
  updateFeaturedStorePlacementAction,
} from "@/actions/admin/marketingPlacementActions";
import {
  moveHeroBannerPositionAction,
  toggleHeroBannerActiveAction,
} from "@/actions/banners";
import {
  softDeleteCouponAction,
  toggleCouponActiveAction,
} from "@/actions/coupons/createCouponAction";
import { AnalyticsDateRangeFilter } from "@/components/analytics/AnalyticsDateRangeFilter";
import {
  MarketingCampaignForm,
  MarketingCampaignFormValues,
} from "@/components/admin/marketing/MarketingCampaignForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { useAdminMarketingDashboard } from "@/hooks/useAdminMarketingDashboard";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import {
  formatAnalyticsCount,
  formatAnalyticsPercent,
} from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

type AdminMarketingClientProps = {
  initialRange: {
    preset: AnalyticsDatePreset;
    startDate: string;
    endDate: string;
  };
};

function LoadingState() {
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

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function formatCouponValue(type: string, value: number) {
  if (type === "PERCENTAGE") {
    return `${formatAnalyticsCount(value)}%`;
  }

  if (type === "FREE_SHIPPING") {
    return "Free shipping";
  }

  return null;
}

function BannerStatusBadge({
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

function CampaignStatusBadge({
  status,
}: {
  status: {
    label: string;
    toneClassName: string;
  };
}) {
  return (
    <Badge variant="outline" className={status.toneClassName}>
      {status.label}
    </Badge>
  );
}

function getCampaignDisplayStatus(campaign: {
  status: "DRAFT" | "ACTIVE" | "SCHEDULED" | "ARCHIVED";
  startsAt: string | null;
  endsAt: string | null;
}) {
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

function getEmptyCampaignValues(): MarketingCampaignFormValues {
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

type PlacementFormState = {
  slot: string;
  tagLabel: string;
  notes: string;
  startsAt: string;
  endsAt: string;
  isEnabled: boolean;
};

function getEmptyPlacementFormState(defaultSlot = ""): PlacementFormState {
  return {
    slot: defaultSlot,
    tagLabel: "",
    notes: "",
    startsAt: "",
    endsAt: "",
    isEnabled: true,
  };
}

function toPlacementInput(
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

function getPlacementDisplayStatus(placement: {
  isEnabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
}) {
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

export default function AdminMarketingClient({
  initialRange,
}: AdminMarketingClientProps) {
  const [range, setRange] = useState(initialRange);
  const [storeSearch, setStoreSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("__new__");
  const [editingStorePlacementId, setEditingStorePlacementId] = useState<
    string | null
  >(null);
  const [editingProductPlacementId, setEditingProductPlacementId] = useState<
    string | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const formatMoney = useFormatMoneyFromUSD();
  const queryClient = useQueryClient();
  const query = useAdminMarketingDashboard(range);
  const dashboard = query.data ?? null;
  const [storePlacementForm, setStorePlacementForm] = useState<PlacementFormState>(
    getEmptyPlacementFormState(),
  );
  const [productPlacementForm, setProductPlacementForm] = useState<PlacementFormState>(
    getEmptyPlacementFormState(),
  );

  const selectableCampaigns = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return dashboard.featuredContent.campaigns.filter(
      (campaign) => campaign.status !== "ARCHIVED",
    );
  }, [dashboard]);

  const selectedCampaign = useMemo(() => {
    if (!dashboard || selectedCampaignId === "__new__") {
      return null;
    }

    return (
      dashboard.featuredContent.campaigns.find(
        (campaign) => campaign.id === selectedCampaignId,
      ) ?? null
    );
  }, [dashboard, selectedCampaignId]);

  const selectedCampaignDisplayStatus = useMemo(
    () => (selectedCampaign ? getCampaignDisplayStatus(selectedCampaign) : null),
    [selectedCampaign],
  );
  const selectedCampaignStorePlacements = useMemo(() => {
    if (!dashboard || !selectedCampaign) {
      return [];
    }

    return (
      dashboard.featuredContent.storePlacementsByCampaign[selectedCampaign.id] ??
      []
    );
  }, [dashboard, selectedCampaign]);
  const selectedCampaignProductPlacements = useMemo(() => {
    if (!dashboard || !selectedCampaign) {
      return [];
    }

    return (
      dashboard.featuredContent.productPlacementsByCampaign[selectedCampaign.id] ??
      []
    );
  }, [dashboard, selectedCampaign]);

  const campaignFormValues = useMemo<MarketingCampaignFormValues>(() => {
    if (!selectedCampaign) {
      return getEmptyCampaignValues();
    }

    return {
      name: selectedCampaign.name,
      slug: selectedCampaign.slug,
      description: selectedCampaign.description ?? "",
      status: selectedCampaign.status,
      themeKey: selectedCampaign.themeKey ?? "",
      accentColor: selectedCampaign.accentColor ?? "",
      notes: selectedCampaign.notes ?? "",
      heroBannerId: selectedCampaign.heroBannerId ?? "",
      startsAt: toDateInputValue(selectedCampaign.startsAt),
      endsAt: toDateInputValue(selectedCampaign.endsAt),
    };
  }, [selectedCampaign]);

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    if (selectedCampaignId === "__new__") {
      return;
    }

    const campaignExists = dashboard.featuredContent.campaigns.some(
      (campaign) => campaign.id === selectedCampaignId,
    );

    if (campaignExists) {
      return;
    }

    const nextCampaign =
      dashboard.featuredContent.campaigns.find(
        (campaign) => campaign.status !== "ARCHIVED",
      ) ??
      dashboard.featuredContent.campaigns[0] ??
      null;

    setSelectedCampaignId(nextCampaign?.id ?? "__new__");
  }, [dashboard, selectedCampaignId]);

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    const defaultStoreSlot =
      dashboard.featuredContent.storeSlotOptions[0]?.value ?? "";
    const defaultProductSlot =
      dashboard.featuredContent.productSlotOptions[0]?.value ?? "";

    setEditingStorePlacementId(null);
    setEditingProductPlacementId(null);
    setSelectedStoreId("");
    setSelectedProductId("");
    setStorePlacementForm(getEmptyPlacementFormState(defaultStoreSlot));
    setProductPlacementForm(getEmptyPlacementFormState(defaultProductSlot));
  }, [dashboard, selectedCampaignId]);

  const filteredStores = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return dashboard.featuredContent.stores.filter((store) =>
      store.label.toLowerCase().includes(storeSearch.toLowerCase()),
    );
  }, [dashboard, storeSearch]);

  const filteredProducts = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return dashboard.featuredContent.products.filter((product) =>
      product.label.toLowerCase().includes(productSearch.toLowerCase()),
    );
  }, [dashboard, productSearch]);

  const invalidateDashboard = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["admin-marketing-dashboard"],
    });
  };

  const resetStorePlacementEditor = () => {
    setEditingStorePlacementId(null);
    setSelectedStoreId("");
    setStorePlacementForm(
      getEmptyPlacementFormState(
        dashboard?.featuredContent.storeSlotOptions[0]?.value ?? "",
      ),
    );
  };

  const resetProductPlacementEditor = () => {
    setEditingProductPlacementId(null);
    setSelectedProductId("");
    setProductPlacementForm(
      getEmptyPlacementFormState(
        dashboard?.featuredContent.productSlotOptions[0]?.value ?? "",
      ),
    );
  };

  const handleCampaignSubmit = (values: MarketingCampaignFormValues) => {
    startTransition(async () => {
      if (selectedCampaign && selectedCampaignId !== "__new__") {
        const result = await updateMarketingCampaignAction(
          selectedCampaign.id,
          values,
        );

        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Campaign updated.");

        if ("campaign" in result && result.campaign?.id) {
          setSelectedCampaignId(result.campaign.id);
        }

        await invalidateDashboard();
        return;
      }

      const result = await createMarketingCampaignAction(values);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Campaign created.");

      if ("campaign" in result && result.campaign?.id) {
        setSelectedCampaignId(result.campaign.id);
      }

      await invalidateDashboard();
    });
  };

  const handleCampaignArchive = () => {
    if (!selectedCampaign) {
      return;
    }

    startTransition(async () => {
      const result = await archiveMarketingCampaignAction(selectedCampaign.id);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Campaign archived.");
      setSelectedCampaignId("__new__");
      await invalidateDashboard();
    });
  };

  const handleStorePlacementSubmit = () => {
    if (!selectedCampaign || !selectedStoreId) {
      return;
    }

    startTransition(async () => {
      const payload = toPlacementInput(selectedCampaign.id, storePlacementForm, {
        storeId: selectedStoreId,
      });

      const result = editingStorePlacementId
        ? await updateFeaturedStorePlacementAction(editingStorePlacementId, payload)
        : await createFeaturedStorePlacementAction(payload);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        editingStorePlacementId
          ? "Featured store placement updated."
          : "Featured store placement created.",
      );
      resetStorePlacementEditor();
      await invalidateDashboard();
    });
  };

  const handleProductPlacementSubmit = () => {
    if (!selectedCampaign || !selectedProductId) {
      return;
    }

    startTransition(async () => {
      const payload = toPlacementInput(
        selectedCampaign.id,
        productPlacementForm,
        {
          productId: selectedProductId,
        },
      );

      const result = editingProductPlacementId
        ? await updateFeaturedProductPlacementAction(
            editingProductPlacementId,
            payload,
          )
        : await createFeaturedProductPlacementAction(payload);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        editingProductPlacementId
          ? "Featured product placement updated."
          : "Featured product placement created.",
      );
      resetProductPlacementEditor();
      await invalidateDashboard();
    });
  };

  const handleEditStorePlacement = (placement: (typeof selectedCampaignStorePlacements)[number]) => {
    setEditingStorePlacementId(placement.id);
    setSelectedStoreId(placement.store.id);
    setStorePlacementForm({
      slot: placement.slot,
      tagLabel: placement.tagLabel ?? "",
      notes: placement.notes ?? "",
      startsAt: toDateInputValue(placement.startsAt),
      endsAt: toDateInputValue(placement.endsAt),
      isEnabled: placement.isEnabled,
    });
  };

  const handleEditProductPlacement = (
    placement: (typeof selectedCampaignProductPlacements)[number],
  ) => {
    setEditingProductPlacementId(placement.id);
    setSelectedProductId(placement.product.id);
    setProductPlacementForm({
      slot: placement.slot,
      tagLabel: placement.tagLabel ?? "",
      notes: placement.notes ?? "",
      startsAt: toDateInputValue(placement.startsAt),
      endsAt: toDateInputValue(placement.endsAt),
      isEnabled: placement.isEnabled,
    });
  };

  const handleToggleStorePlacement = (id: string, isEnabled: boolean) => {
    startTransition(async () => {
      const result = await toggleFeaturedStorePlacementAction(id, isEnabled);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEnabled ? "Store placement enabled." : "Store placement disabled.");
      await invalidateDashboard();
    });
  };

  const handleToggleProductPlacement = (id: string, isEnabled: boolean) => {
    startTransition(async () => {
      const result = await toggleFeaturedProductPlacementAction(id, isEnabled);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        isEnabled ? "Product placement enabled." : "Product placement disabled.",
      );
      await invalidateDashboard();
    });
  };

  const handleDeleteStorePlacement = (id: string) => {
    startTransition(async () => {
      const result = await deleteFeaturedStorePlacementAction(id);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (editingStorePlacementId === id) {
        resetStorePlacementEditor();
      }
      toast.success("Store placement removed.");
      await invalidateDashboard();
    });
  };

  const handleDeleteProductPlacement = (id: string) => {
    startTransition(async () => {
      const result = await deleteFeaturedProductPlacementAction(id);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (editingProductPlacementId === id) {
        resetProductPlacementEditor();
      }
      toast.success("Product placement removed.");
      await invalidateDashboard();
    });
  };

  const handleMoveStorePlacement = (id: string, direction: "up" | "down") => {
    startTransition(async () => {
      const result = await moveFeaturedStorePlacementAction(id, direction);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      await invalidateDashboard();
    });
  };

  const handleMoveProductPlacement = (
    id: string,
    direction: "up" | "down",
  ) => {
    startTransition(async () => {
      const result = await moveFeaturedProductPlacementAction(id, direction);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      await invalidateDashboard();
    });
  };

  const handleBannerToggle = (id: string, nextIsActive: boolean) => {
    startTransition(async () => {
      const result = await toggleHeroBannerActiveAction(id, nextIsActive);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(nextIsActive ? "Banner activated." : "Banner disabled.");
      await invalidateDashboard();
    });
  };

  const handleMoveBanner = (id: string, direction: "up" | "down") => {
    startTransition(async () => {
      const result = await moveHeroBannerPositionAction(id, direction);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        direction === "up"
          ? "Banner priority increased."
          : "Banner priority decreased.",
      );
      await invalidateDashboard();
    });
  };

  const handleCouponToggle = (id: string, nextIsActive: boolean) => {
    startTransition(async () => {
      const result = await toggleCouponActiveAction(id, nextIsActive);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(nextIsActive ? "Coupon activated." : "Coupon disabled.");
      await invalidateDashboard();
    });
  };

  const handleCouponDelete = (id: string) => {
    startTransition(async () => {
      const result = await softDeleteCouponAction(id);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Coupon archived.");
      await invalidateDashboard();
    });
  };

  if (query.isLoading) {
    return <LoadingState />;
  }

  if (query.isError || !dashboard) {
    const errorMessage = "Failed to load the marketing dashboard.";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Marketplace Marketing Control"
          title="Marketing"
          description="Manage banners, coupon-driven demand, and merchandising readiness from a premium marketplace marketing control center."
          accentClassName="bg-[linear-gradient(135deg,#1f2937_0%,#23416d_48%,#0f766e_100%)]"
        />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {errorMessage}
        </div>
      </div>
    );
  }

  const overviewCards = [
    {
      title: "Active Banners",
      value: formatAnalyticsCount(dashboard.snapshot.activeBanners),
      description: "Banner placements active as of the selected period end.",
      icon: LayoutTemplate,
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
      change: dashboard.changes.activeBanners,
    },
    {
      title: "Active Coupons",
      value: formatAnalyticsCount(dashboard.snapshot.activeCoupons),
      description: "Enabled coupons valid through the selected range end date.",
      icon: TicketPercent,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
      change: dashboard.changes.activeCoupons,
    },
    {
      title: "Campaign Conversions",
      value: formatAnalyticsPercent(dashboard.rangeSummary.campaignConversions),
      description: "Share of paid orders in range that used a coupon.",
      icon: Percent,
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      change: dashboard.changes.campaignConversions,
    },
    {
      title: "Revenue From Coupons",
      value: formatMoney(dashboard.rangeSummary.revenueFromCoupons),
      description:
        "Paid order GMV attributed to coupon-backed orders in range.",
      icon: Megaphone,
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
      change: dashboard.changes.revenueFromCoupons,
    },
    {
      title: "Orders Using Coupons",
      value: formatAnalyticsCount(dashboard.rangeSummary.ordersUsingCoupons),
      description: "Paid orders created in range with a coupon attached.",
      icon: ShoppingBag,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300",
      change: dashboard.changes.ordersUsingCoupons,
    },
    {
      title: "Banner Click Through Rate",
      value: "Untracked",
      description: "Percentage of banner impressions that resulted in a click.",
      icon: MousePointerClick,
      tintClassName:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
    },
  ];

  const bannerCounts = dashboard.banners.reduce(
    (accumulator, banner) => {
      accumulator[banner.status] += 1;
      return accumulator;
    },
    {
      ACTIVE: 0,
      SCHEDULED: 0,
      EXPIRED: 0,
      DISABLED: 0,
    },
  );

  const bannersByPlacement = dashboard.banners.reduce<
    Array<{
      placement: string;
      placementLabel: string;
      banners: typeof dashboard.banners;
    }>
  >((groups, banner) => {
    const existingGroup = groups.find(
      (group) => group.placement === banner.placement,
    );

    if (existingGroup) {
      existingGroup.banners.push(banner);
      return groups;
    }

    groups.push({
      placement: banner.placement,
      placementLabel: banner.placementLabel,
      banners: [banner],
    });

    return groups;
  }, []);

  const ordersUsingCouponsChartData = dashboard.trends.ordersUsingCoupons.map(
    (point) => ({
      label: point.label,
      orders: point.value,
    }),
  );

  const selectedStoreLabel =
    dashboard.featuredContent.stores.find((store) => store.id === selectedStoreId)
      ?.label ?? "";
  const selectedProductLabel =
    dashboard.featuredContent.products.find(
      (product) => product.id === selectedProductId,
    )?.label ?? "";
  const groupedStorePlacements = selectedCampaignStorePlacements.reduce<
    Array<{
      slot: string;
      label: string;
      placements: typeof selectedCampaignStorePlacements;
    }>
  >((groups, placement) => {
    const slotLabel =
      dashboard.featuredContent.storeSlotOptions.find(
        (option) => option.value === placement.slot,
      )?.label ?? placement.slot;
    const group = groups.find((item) => item.slot === placement.slot);

    if (group) {
      group.placements.push(placement);
      return groups;
    }

    groups.push({
      slot: placement.slot,
      label: slotLabel,
      placements: [placement],
    });
    return groups;
  }, []);
  const groupedProductPlacements = selectedCampaignProductPlacements.reduce<
    Array<{
      slot: string;
      label: string;
      placements: typeof selectedCampaignProductPlacements;
    }>
  >((groups, placement) => {
    const slotLabel =
      dashboard.featuredContent.productSlotOptions.find(
        (option) => option.value === placement.slot,
      )?.label ?? placement.slot;
    const group = groups.find((item) => item.slot === placement.slot);

    if (group) {
      group.placements.push(placement);
      return groups;
    }

    groups.push({
      slot: placement.slot,
      label: slotLabel,
      placements: [placement],
    });
    return groups;
  }, []);
  const isArchivedCampaignSelected =
    selectedCampaignDisplayStatus?.isReadOnly ?? false;
  const placementEditingDisabled = !selectedCampaign || isArchivedCampaignSelected;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Marketplace Marketing Control"
        title="Marketing"
        description="Manage banners, coupon-driven demand, and merchandising readiness from a premium marketplace marketing control center."
        accentClassName="bg-[linear-gradient(135deg,#1f2937_0%,#23416d_48%,#0f766e_100%)]"
      />

      <AnalyticsDateRangeFilter
        preset={range.preset}
        startDate={range.startDate}
        endDate={range.endDate}
        disabled={query.isFetching || isPending}
        onPresetChange={(preset) =>
          setRange((currentRange) => applyAnalyticsPreset(currentRange, preset))
        }
        onCustomRangeApply={({ startDate, endDate }) =>
          setRange({
            preset: "custom",
            startDate,
            endDate,
          })
        }
      />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Marketing Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review marketing configuration and coupon-attributed demand in the
            selected reporting context.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {overviewCards.map((item) => (
            <PremiumStatCard
              key={item.title}
              title={item.title}
              value={item.value}
              description={item.description}
              icon={item.icon}
              tintClassName={item.tintClassName}
              footer={
                "change" in item ? (
                  <AnalyticsChangeFooter value={item.change ?? null} />
                ) : undefined
              }
            />
          ))}
        </div>
      </section>

      <PremiumPanel
        title="Banner Campaigns"
        description="Review the current hero banner slate, adjust placement priority, and disable placements without leaving the marketing control center."
      >
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          {[
            { label: "Active banners", value: bannerCounts.ACTIVE },
            { label: "Scheduled banners", value: bannerCounts.SCHEDULED },
            { label: "Expired banners", value: bannerCounts.EXPIRED },
            { label: "Disabled banners", value: bannerCounts.DISABLED },
          ].map((item) => (
            <Card
              key={item.label}
              className="gap-3 border-slate-200/80 py-4 dark:border-zinc-800"
            >
              <CardHeader className="px-4">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-2xl">
                  {formatAnalyticsCount(item.value)}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {dashboard.banners.length === 0 ? (
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutTemplate />
              </EmptyMedia>
              <EmptyTitle>No banner campaigns configured</EmptyTitle>
              <EmptyDescription>
                Create your first hero banner campaign to start managing
                homepage and category placements here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-6">
            {bannersByPlacement.map((group) => (
              <div key={group.placement} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-400">
                      {group.placementLabel}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                      {formatAnalyticsCount(group.banners.length)} banner
                      {group.banners.length === 1 ? "" : "s"} in this placement.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {group.banners.map((banner, index) => (
                    <Card
                      key={banner.id}
                      className="gap-0 border-slate-200/80 py-0 dark:border-zinc-800"
                    >
                      <CardHeader className="border-b border-slate-200/80 px-5 py-5 dark:border-zinc-800">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="text-base">
                                {banner.title}
                              </CardTitle>
                              <BannerStatusBadge status={banner.status} />
                              <Badge
                                variant="outline"
                                className="border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                              >
                                {banner.placementLabel}
                              </Badge>
                            </div>
                            <CardDescription>
                              Priority {formatAnalyticsCount(banner.priority)} -
                              Start {formatDate(banner.startDate)} - End{" "}
                              {formatDate(banner.endDate)}
                            </CardDescription>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/marketplace/dashboard/admin/marketing/banners/${banner.id}`}
                                >
                                  Edit banner
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  handleBannerToggle(
                                    banner.id,
                                    !banner.isActive,
                                  )
                                }
                              >
                                {banner.isActive
                                  ? "Disable banner"
                                  : "Enable banner"}
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="/marketplace/dashboard/admin/marketing/banners">
                                  Open banner settings
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-zinc-400">
                          <span>Sortable priority controls</span>
                          <span>
                            Position {formatAnalyticsCount(index + 1)} of{" "}
                            {formatAnalyticsCount(group.banners.length)} in{" "}
                            {group.placementLabel}
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="justify-between border-t border-slate-200/80 px-5 py-4 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending || index === 0}
                            onClick={() => handleMoveBanner(banner.id, "up")}
                          >
                            <ArrowUp className="h-4 w-4" />
                            Higher
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              isPending || index === group.banners.length - 1
                            }
                            onClick={() => handleMoveBanner(banner.id, "down")}
                          >
                            <ArrowDown className="h-4 w-4" />
                            Lower
                          </Button>
                        </div>

                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/marketplace/dashboard/admin/marketing/banners/${banner.id}`}
                          >
                            Edit
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumPanel>

      <PremiumPanel
        title="Coupons & Promotions"
        description="Manage coupon inventory, validity windows, and activation states to drive sales and conversions."
      >
        <div className="mb-5 flex flex-wrap flex-col items-center justify-between gap-3">
          <Button asChild>
            <Link href="/marketplace/dashboard/admin/coupons/create">
              <Plus className="h-4 w-4" />
              Create Coupon
            </Link>
          </Button>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Coupons are a great way to drive sales and conversions.
          </p>
        </div>

        {dashboard.coupons.length === 0 ? (
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TicketPercent />
              </EmptyMedia>
              <EmptyTitle>No coupons available</EmptyTitle>
              <EmptyDescription>
                Create a coupon to start driving promotions and conversion
                reporting.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  {[
                    "Code",
                    "Type",
                    "Value",
                    "Usage",
                    "Usage Limit",
                    "Min Order",
                    "Active",
                    "Valid From",
                    "Valid To",
                    "Actions",
                  ].map((column) => (
                    <th
                      key={column}
                      className="border-b border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-zinc-800 dark:text-zinc-400"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="border-b border-slate-200/60 px-4 py-4 font-medium text-slate-950 dark:border-zinc-900 dark:text-white">
                      {coupon.code}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {coupon.type.toLowerCase().replace("_", " ")}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {formatCouponValue(coupon.type, coupon.value) ??
                        formatMoney(coupon.value)}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {formatAnalyticsCount(coupon.usageCount)}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {coupon.usageLimit
                        ? formatAnalyticsCount(coupon.usageLimit)
                        : "Unlimited"}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {coupon.minOrderAmount
                        ? formatMoney(coupon.minOrderAmount)
                        : "None"}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          coupon.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                        )}
                      >
                        {coupon.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {formatDate(coupon.validFrom)}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {formatDate(coupon.validTo)}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/marketplace/dashboard/admin/coupons/${coupon.id}`}
                            >
                              Edit coupon
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleCouponToggle(coupon.id, !coupon.isActive)
                            }
                          >
                            {coupon.isActive
                              ? "Disable coupon"
                              : "Enable coupon"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600 focus:text-rose-700 dark:text-rose-300 dark:focus:text-rose-200"
                            onSelect={() => handleCouponDelete(coupon.id)}
                          >
                            Archive coupon
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PremiumPanel>

      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Campaign Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Focused reporting for currently tracked coupon activity.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AnalyticsTrendPanel
            title="Coupon Usage Over Time"
            description="Coupon redemption events grouped by usage date."
            data={dashboard.trends.couponUsage}
            dataKey="couponUsage"
            color="#7c3aed"
            formatter={(value) => formatAnalyticsCount(value)}
          />

          <PremiumPanel
            title="Banner Click Through Rate"
            description="Banner CTR remains unavailable until impression and click tracking are added to the current data model."
          >
            <Empty className="border-slate-200/80 dark:border-zinc-800">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MousePointerClick />
                </EmptyMedia>
                <EmptyTitle>Banner CTR tracking unavailable</EmptyTitle>
                <EmptyDescription>
                  Expand the range or wait for banner CTR data to be available.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </PremiumPanel>

          <PremiumPanel
            title="Orders Using Coupons"
            description="Number of orders using at least one coupon."
          >
            {ordersUsingCouponsChartData.length === 0 ? (
              <Empty className="border-slate-200/80 dark:border-zinc-800">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShoppingBag />
                  </EmptyMedia>
                  <EmptyTitle>No coupon-backed orders in this range</EmptyTitle>
                  <EmptyDescription>
                    Expand the range or wait for coupon-attributed orders to be
                    recorded.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ordersUsingCouponsChartData}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value: number | string | undefined) => [
                        formatAnalyticsCount(
                          typeof value === "number"
                            ? value
                            : Number(value ?? 0),
                        ),
                        "Orders",
                      ]}
                    />
                    <Bar
                      dataKey="orders"
                      radius={[8, 8, 0, 0]}
                      fill="#0f766e"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </PremiumPanel>

          <AnalyticsRankedList
            title="Top Performing Coupons"
            description="Coupons ranked by paid order GMV attributed in the selected range."
            rows={dashboard.topCoupons}
            primaryFormatter={formatMoney}
            secondaryLabel={(value) =>
              `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
            }
          />
        </div>
      </section>

      <PremiumPanel
        title="Featured Content"
        description="Attach featured stores and products directly to the selected campaign with slot-aware ordering and optional campaign windows."
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Featured stores
                  </h3>
                  {selectedCampaign ? (
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                    >
                      {selectedCampaign.name}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Assign stores into campaign slots. Priority changes stay within
                  the selected campaign and slot.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Search stores
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      value={storeSearch}
                      onChange={(event) => setStoreSearch(event.target.value)}
                      placeholder="Search stores"
                      className="pl-9"
                      disabled={placementEditingDisabled || isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Store
                  </label>
                  <Select
                    value={selectedStoreId}
                    onValueChange={setSelectedStoreId}
                    disabled={placementEditingDisabled || isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a store candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {selectedStoreLabel || "No store selected."}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Slot
                  </label>
                  <Select
                    value={storePlacementForm.slot}
                    onValueChange={(value) =>
                      setStorePlacementForm((current) => ({
                        ...current,
                        slot: value,
                      }))
                    }
                    disabled={placementEditingDisabled || isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a placement slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {dashboard.featuredContent.storeSlotOptions.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Tag label
                  </label>
                  <Input
                    value={storePlacementForm.tagLabel}
                    onChange={(event) =>
                      setStorePlacementForm((current) => ({
                        ...current,
                        tagLabel: event.target.value,
                      }))
                    }
                    placeholder="Optional merchandising tag"
                    disabled={placementEditingDisabled || isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Starts
                  </label>
                  <Input
                    type="date"
                    value={storePlacementForm.startsAt}
                    onChange={(event) =>
                      setStorePlacementForm((current) => ({
                        ...current,
                        startsAt: event.target.value,
                      }))
                    }
                    disabled={placementEditingDisabled || isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Ends
                  </label>
                  <Input
                    type="date"
                    value={storePlacementForm.endsAt}
                    onChange={(event) =>
                      setStorePlacementForm((current) => ({
                        ...current,
                        endsAt: event.target.value,
                      }))
                    }
                    disabled={placementEditingDisabled || isPending}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Notes
                  </label>
                  <Textarea
                    value={storePlacementForm.notes}
                    onChange={(event) =>
                      setStorePlacementForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Optional context for this featured store placement"
                    disabled={placementEditingDisabled || isPending}
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Placement enabled
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Disabled placements stay attached to the campaign but do not
                      appear in active merchandising reads.
                    </p>
                  </div>
                  <Switch
                    checked={storePlacementForm.isEnabled}
                    onCheckedChange={(checked) =>
                      setStorePlacementForm((current) => ({
                        ...current,
                        isEnabled: checked,
                      }))
                    }
                    disabled={placementEditingDisabled || isPending}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleStorePlacementSubmit}
                  disabled={
                    placementEditingDisabled ||
                    isPending ||
                    !selectedCampaign ||
                    !selectedStoreId ||
                    !storePlacementForm.slot
                  }
                >
                  {editingStorePlacementId ? "Update store placement" : "Assign store"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetStorePlacementEditor}
                  disabled={isPending}
                >
                  {editingStorePlacementId ? "Cancel edit" : "Reset"}
                </Button>
              </div>

              {groupedStorePlacements.length === 0 ? (
                <Empty className="border-slate-200/80 dark:border-zinc-800">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Tag />
                    </EmptyMedia>
                    <EmptyTitle>No featured stores assigned</EmptyTitle>
                    <EmptyDescription>
                      Select a campaign and assign stores to start building
                      campaign-backed store merchandising.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-4">
                  {groupedStorePlacements.map((group) => (
                    <div key={group.slot} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {group.label}
                        </h4>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                        >
                          {formatAnalyticsCount(group.placements.length)} assigned
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {group.placements.map((placement, index) => {
                          const status = getPlacementDisplayStatus(placement);

                          return (
                            <div
                              key={placement.id}
                              className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/60"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {placement.store.name}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className={status.className}
                                    >
                                      {status.label}
                                    </Badge>
                                    {placement.tagLabel ? (
                                      <Badge
                                        variant="outline"
                                        className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300"
                                      >
                                        {placement.tagLabel}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    {placement.store.ownerLabel}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    Position {index + 1} of {group.placements.length} in{" "}
                                    {group.label}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={placement.isEnabled}
                                    onCheckedChange={(checked) =>
                                      handleToggleStorePlacement(placement.id, checked)
                                    }
                                    disabled={placementEditingDisabled || isPending}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditStorePlacement(placement)}
                                    disabled={placementEditingDisabled || isPending}
                                  >
                                    <PencilLine className="h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleMoveStorePlacement(placement.id, "up")
                                    }
                                    disabled={
                                      placementEditingDisabled ||
                                      isPending ||
                                      index === 0
                                    }
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleMoveStorePlacement(placement.id, "down")
                                    }
                                    disabled={
                                      placementEditingDisabled ||
                                      isPending ||
                                      index === group.placements.length - 1
                                    }
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteStorePlacement(placement.id)}
                                    disabled={placementEditingDisabled || isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                              {placement.notes ? (
                                <p className="mt-3 text-sm text-slate-600 dark:text-zinc-300">
                                  {placement.notes}
                                </p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-zinc-400">
                                <span>Starts {formatDate(placement.startsAt)}</span>
                                <span>Ends {formatDate(placement.endsAt)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Featured products
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Attach products to the selected campaign and manage slot-local
                  ordering, notes, and merchandising windows.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Search products
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search product candidates"
                      className="pl-9"
                      disabled={placementEditingDisabled || isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Product
                  </label>
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                    disabled={placementEditingDisabled || isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a product candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {selectedProductLabel || "No product selected."}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Slot
                  </label>
                  <Select
                    value={productPlacementForm.slot}
                    onValueChange={(value) =>
                      setProductPlacementForm((current) => ({
                        ...current,
                        slot: value,
                      }))
                    }
                    disabled={placementEditingDisabled || isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a placement slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {dashboard.featuredContent.productSlotOptions.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Tag label
                  </label>
                  <Input
                    value={productPlacementForm.tagLabel}
                    onChange={(event) =>
                      setProductPlacementForm((current) => ({
                        ...current,
                        tagLabel: event.target.value,
                      }))
                    }
                    placeholder="Optional merchandising tag"
                    disabled={placementEditingDisabled || isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Starts
                  </label>
                  <Input
                    type="date"
                    value={productPlacementForm.startsAt}
                    onChange={(event) =>
                      setProductPlacementForm((current) => ({
                        ...current,
                        startsAt: event.target.value,
                      }))
                    }
                    disabled={placementEditingDisabled || isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Ends
                  </label>
                  <Input
                    type="date"
                    value={productPlacementForm.endsAt}
                    onChange={(event) =>
                      setProductPlacementForm((current) => ({
                        ...current,
                        endsAt: event.target.value,
                      }))
                    }
                    disabled={placementEditingDisabled || isPending}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                    Notes
                  </label>
                  <Textarea
                    value={productPlacementForm.notes}
                    onChange={(event) =>
                      setProductPlacementForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Optional context for this featured product placement"
                    disabled={placementEditingDisabled || isPending}
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Placement enabled
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Enabled product placements are eligible for future storefront
                      reads once campaign merchandising consumes this slot.
                    </p>
                  </div>
                  <Switch
                    checked={productPlacementForm.isEnabled}
                    onCheckedChange={(checked) =>
                      setProductPlacementForm((current) => ({
                        ...current,
                        isEnabled: checked,
                      }))
                    }
                    disabled={placementEditingDisabled || isPending}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleProductPlacementSubmit}
                  disabled={
                    placementEditingDisabled ||
                    isPending ||
                    !selectedCampaign ||
                    !selectedProductId ||
                    !productPlacementForm.slot
                  }
                >
                  {editingProductPlacementId
                    ? "Update product placement"
                    : "Assign product"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetProductPlacementEditor}
                  disabled={isPending}
                >
                  {editingProductPlacementId ? "Cancel edit" : "Reset"}
                </Button>
              </div>

              {groupedProductPlacements.length === 0 ? (
                <Empty className="border-slate-200/80 dark:border-zinc-800">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShoppingBag />
                    </EmptyMedia>
                    <EmptyTitle>No featured products assigned</EmptyTitle>
                    <EmptyDescription>
                      Select a campaign and attach products to start building
                      campaign-backed product merchandising.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-4">
                  {groupedProductPlacements.map((group) => (
                    <div key={group.slot} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {group.label}
                        </h4>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                        >
                          {formatAnalyticsCount(group.placements.length)} assigned
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {group.placements.map((placement, index) => {
                          const status = getPlacementDisplayStatus(placement);

                          return (
                            <div
                              key={placement.id}
                              className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/60"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {placement.product.name}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className={status.className}
                                    >
                                      {status.label}
                                    </Badge>
                                    {placement.tagLabel ? (
                                      <Badge
                                        variant="outline"
                                        className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300"
                                      >
                                        {placement.tagLabel}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    {placement.store.name}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    Position {index + 1} of {group.placements.length} in{" "}
                                    {group.label}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={placement.isEnabled}
                                    onCheckedChange={(checked) =>
                                      handleToggleProductPlacement(
                                        placement.id,
                                        checked,
                                      )
                                    }
                                    disabled={placementEditingDisabled || isPending}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditProductPlacement(placement)}
                                    disabled={placementEditingDisabled || isPending}
                                  >
                                    <PencilLine className="h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleMoveProductPlacement(placement.id, "up")
                                    }
                                    disabled={
                                      placementEditingDisabled ||
                                      isPending ||
                                      index === 0
                                    }
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleMoveProductPlacement(
                                        placement.id,
                                        "down",
                                      )
                                    }
                                    disabled={
                                      placementEditingDisabled ||
                                      isPending ||
                                      index === group.placements.length - 1
                                    }
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteProductPlacement(placement.id)
                                    }
                                    disabled={placementEditingDisabled || isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                              {placement.notes ? (
                                <p className="mt-3 text-sm text-slate-600 dark:text-zinc-300">
                                  {placement.notes}
                                </p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-zinc-400">
                                <span>Starts {formatDate(placement.startsAt)}</span>
                                <span>Ends {formatDate(placement.endsAt)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Card className="border-slate-200/80 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" />
                Seasonal Campaign Tags
              </CardTitle>
              <CardDescription>
                Create, select, and manage campaign tags from real marketing
                campaign records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900 dark:text-white">
                  Active campaign selection
                </label>
                <Select
                  value={selectedCampaignId}
                  onValueChange={setSelectedCampaignId}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">Create new campaign</SelectItem>
                    {selectableCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Archived campaigns stay out of the primary selector but remain
                  visible below for review.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedCampaign
                        ? isArchivedCampaignSelected
                          ? "Archived campaign"
                          : "Edit campaign"
                        : "Create campaign"}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                      Campaign tags now persist through{" "}
                      <span className="font-medium text-slate-700 dark:text-zinc-200">
                        MarketingCampaign
                      </span>
                      . Featured store and product assignments now inherit this
                      campaign as their merchandising context.
                    </p>
                    {selectedCampaignDisplayStatus ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <CampaignStatusBadge
                          status={selectedCampaignDisplayStatus}
                        />
                        {isArchivedCampaignSelected ? (
                          <span className="text-xs text-slate-500 dark:text-zinc-400">
                            Archived campaigns remain visible for review and are
                            read-only in this workspace.
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCampaignId("__new__")}
                    disabled={isPending && selectedCampaignId === "__new__"}
                  >
                    <Plus className="h-4 w-4" />
                    New campaign
                  </Button>
                </div>

                <MarketingCampaignForm
                  mode={selectedCampaign ? "edit" : "create"}
                  initialValues={campaignFormValues}
                  heroBannerOptions={dashboard.featuredContent.heroBannerOptions}
                  disabled={isPending || isArchivedCampaignSelected}
                  onSubmit={handleCampaignSubmit}
                  onArchive={
                    selectedCampaign && !isArchivedCampaignSelected
                      ? handleCampaignArchive
                      : undefined
                  }
                  onReset={() =>
                    setSelectedCampaignId(selectedCampaign?.id ?? "__new__")
                  }
                />
              </div>

              {dashboard.featuredContent.campaigns.length === 0 ? (
                <Empty className="border-slate-200/80 dark:border-zinc-800">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Tag />
                    </EmptyMedia>
                    <EmptyTitle>No seasonal campaigns yet</EmptyTitle>
                    <EmptyDescription>
                      Create a campaign tag to start structuring homepage
                      merchandising and seasonal programming.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-3">
                  {dashboard.featuredContent.campaigns.map((campaign) => {
                    const displayStatus = getCampaignDisplayStatus(campaign);

                    return (
                      <button
                        key={campaign.id}
                        type="button"
                        onClick={() => setSelectedCampaignId(campaign.id)}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition-colors",
                          selectedCampaignId === campaign.id
                            ? "border-slate-900 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
                            : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700",
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">
                                {campaign.name}
                              </span>
                              <CampaignStatusBadge status={displayStatus} />
                              {campaign.heroBanner ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    selectedCampaignId === campaign.id
                                      ? "border-white/30 bg-white/10 text-white dark:border-slate-300 dark:bg-slate-100 dark:text-slate-950"
                                      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                                  )}
                                >
                                  Banner attached
                                </Badge>
                              ) : null}
                            </div>
                            <p
                              className={cn(
                                "text-xs",
                                selectedCampaignId === campaign.id
                                  ? "text-slate-200 dark:text-slate-700"
                                  : "text-slate-500 dark:text-zinc-400",
                              )}
                            >
                              {campaign.description || "No description provided."}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {campaign.accentColor ? (
                              <span
                                className="h-4 w-4 rounded-full border border-black/10 dark:border-white/10"
                                style={{ backgroundColor: campaign.accentColor }}
                                aria-hidden="true"
                              />
                            ) : null}
                            {displayStatus.label === "Archived" ? (
                              <Archive className="h-4 w-4 opacity-70" />
                            ) : null}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "mt-4 grid gap-2 text-xs sm:grid-cols-2",
                            selectedCampaignId === campaign.id
                              ? "text-slate-200 dark:text-slate-700"
                              : "text-slate-500 dark:text-zinc-400",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <CalendarRange className="h-3.5 w-3.5" />
                            <span>
                              {formatDate(campaign.startsAt)} -{" "}
                              {formatDate(campaign.endsAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <LayoutTemplate className="h-3.5 w-3.5" />
                            <span>
                              {campaign.heroBanner
                                ? `${campaign.heroBanner.title} (${campaign.heroBanner.placementLabel})`
                                : "No hero banner attached"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between border-t border-slate-200/80 dark:border-zinc-800">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Campaign tags, featured store placements, and featured product
                placements now share the same campaign-backed workflow.
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link href="/marketplace/dashboard/admin/marketing/banners">
                  Review banner placements
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PremiumPanel>

      {query.isFetching || isPending ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled>
            <RefreshCcw className="h-4 w-4" />
            Refreshing marketing controls...
          </Button>
        </div>
      ) : null}
    </main>
  );
}
