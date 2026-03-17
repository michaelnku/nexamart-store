"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DashboardHero } from "@/app/marketplace/_components/PremiumDashboard";
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
import {
  MarketingAnalyticsSection,
} from "@/app/marketplace/dashboard/admin/_components/marketing/MarketingAnalyticsSection";
import {
  MarketingBannerSection,
} from "@/app/marketplace/dashboard/admin/_components/marketing/MarketingBannerSection";
import {
  MarketingCouponsPanel,
} from "@/app/marketplace/dashboard/admin/_components/marketing/MarketingCouponsPanel";
import {
  MarketingFeaturedContentPanel,
} from "@/app/marketplace/dashboard/admin/_components/marketing/MarketingFeaturedContentPanel";
import {
  MarketingOverviewSection,
} from "@/app/marketplace/dashboard/admin/_components/marketing/MarketingOverviewSection";
import { AnalyticsDateRangeFilter } from "@/components/analytics/AnalyticsDateRangeFilter";
import type { MarketingCampaignFormValues } from "@/components/admin/marketing/MarketingCampaignForm";
import { Button } from "@/components/ui/button";
import { useAdminMarketingDashboard } from "@/hooks/useAdminMarketingDashboard";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import {
  CampaignDisplayStatus,
  getCampaignDisplayStatus,
  getEmptyCampaignValues,
  getEmptyPlacementFormState,
  MarketingLoadingState,
  PlacementFormState,
  toDateInputValue,
  toPlacementInput,
} from "@/app/marketplace/dashboard/admin/_components/marketing/marketingShared";

type AdminMarketingClientProps = {
  initialRange: {
    preset: AnalyticsDatePreset;
    startDate: string;
    endDate: string;
  };
};

export default function AdminMarketingClient({
  initialRange,
}: AdminMarketingClientProps) {
  const [range, setRange] = useState(initialRange);
  const [storeSearch, setStoreSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("__new__");
  const [editingStorePlacementId, setEditingStorePlacementId] = useState<string | null>(null);
  const [editingProductPlacementId, setEditingProductPlacementId] = useState<string | null>(null);
  const [storePlacementForm, setStorePlacementForm] = useState<PlacementFormState>(
    getEmptyPlacementFormState(),
  );
  const [productPlacementForm, setProductPlacementForm] = useState<PlacementFormState>(
    getEmptyPlacementFormState(),
  );
  const [isPending, startTransition] = useTransition();
  const formatMoney = useFormatMoneyFromUSD();
  const queryClient = useQueryClient();
  const query = useAdminMarketingDashboard(range);
  const dashboard = query.data ?? null;

  const invalidateDashboard = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["admin-marketing-dashboard"],
    });
  };

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

  const selectedCampaignDisplayStatus = useMemo<CampaignDisplayStatus | null>(
    () => (selectedCampaign ? getCampaignDisplayStatus(selectedCampaign) : null),
    [selectedCampaign],
  );

  const selectedCampaignStorePlacements = useMemo(() => {
    if (!dashboard || !selectedCampaign) {
      return [];
    }

    return (
      dashboard.featuredContent.storePlacementsByCampaign[selectedCampaign.id] ?? []
    );
  }, [dashboard, selectedCampaign]);

  const selectedCampaignProductPlacements = useMemo(() => {
    if (!dashboard || !selectedCampaign) {
      return [];
    }

    return (
      dashboard.featuredContent.productPlacementsByCampaign[selectedCampaign.id] ?? []
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
    if (!dashboard || selectedCampaignId === "__new__") {
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
        const result = await updateMarketingCampaignAction(selectedCampaign.id, values);

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
      const payload = toPlacementInput(selectedCampaign.id, productPlacementForm, {
        productId: selectedProductId,
      });

      const result = editingProductPlacementId
        ? await updateFeaturedProductPlacementAction(editingProductPlacementId, payload)
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

  const handleEditStorePlacement = (
    placement: (typeof selectedCampaignStorePlacements)[number],
  ) => {
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

  const handleMoveProductPlacement = (id: string, direction: "up" | "down") => {
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
    return <MarketingLoadingState />;
  }

  if (query.isError || !dashboard) {
    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Marketplace Marketing Control"
          title="Marketing"
          description="Manage banners, coupon-driven demand, and merchandising readiness from a premium marketplace marketing control center."
          accentClassName="bg-[linear-gradient(135deg,#1f2937_0%,#23416d_48%,#0f766e_100%)]"
        />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          Failed to load the marketing dashboard.
        </div>
      </div>
    );
  }

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
  const placementEditingDisabled =
    !selectedCampaign || isArchivedCampaignSelected;

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

      <MarketingOverviewSection dashboard={dashboard} formatMoney={formatMoney} />

      <MarketingBannerSection
        banners={dashboard.banners}
        isPending={isPending}
        onToggleBanner={handleBannerToggle}
        onMoveBanner={handleMoveBanner}
      />

      <MarketingCouponsPanel
        coupons={dashboard.coupons}
        formatMoney={formatMoney}
        onToggleCoupon={handleCouponToggle}
        onArchiveCoupon={handleCouponDelete}
      />

      <MarketingAnalyticsSection
        dashboard={dashboard}
        formatMoney={formatMoney}
      />

      <MarketingFeaturedContentPanel
        selectedCampaign={selectedCampaign}
        selectedCampaignId={selectedCampaignId}
        selectedCampaignDisplayStatus={selectedCampaignDisplayStatus}
        selectableCampaigns={selectableCampaigns}
        campaignFormValues={campaignFormValues}
        heroBannerOptions={dashboard.featuredContent.heroBannerOptions}
        isPending={isPending}
        storeSearch={storeSearch}
        setStoreSearch={setStoreSearch}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        selectedStoreId={selectedStoreId}
        setSelectedStoreId={setSelectedStoreId}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        selectedStoreLabel={selectedStoreLabel}
        selectedProductLabel={selectedProductLabel}
        filteredStores={filteredStores}
        filteredProducts={filteredProducts}
        storePlacementForm={storePlacementForm}
        setStorePlacementForm={(updater) => setStorePlacementForm(updater)}
        productPlacementForm={productPlacementForm}
        setProductPlacementForm={(updater) => setProductPlacementForm(updater)}
        groupedStorePlacements={groupedStorePlacements}
        groupedProductPlacements={groupedProductPlacements}
        storeSlotOptions={dashboard.featuredContent.storeSlotOptions}
        productSlotOptions={dashboard.featuredContent.productSlotOptions}
        onCampaignSelect={setSelectedCampaignId}
        onCampaignSubmit={handleCampaignSubmit}
        onCampaignArchive={handleCampaignArchive}
        onStorePlacementSubmit={handleStorePlacementSubmit}
        onProductPlacementSubmit={handleProductPlacementSubmit}
        onResetStorePlacement={resetStorePlacementEditor}
        onResetProductPlacement={resetProductPlacementEditor}
        onEditStorePlacement={handleEditStorePlacement}
        onEditProductPlacement={handleEditProductPlacement}
        onToggleStorePlacement={handleToggleStorePlacement}
        onToggleProductPlacement={handleToggleProductPlacement}
        onMoveStorePlacement={handleMoveStorePlacement}
        onMoveProductPlacement={handleMoveProductPlacement}
        onDeleteStorePlacement={handleDeleteStorePlacement}
        onDeleteProductPlacement={handleDeleteProductPlacement}
        placementEditingDisabled={placementEditingDisabled}
        isArchivedCampaignSelected={isArchivedCampaignSelected}
        editingStorePlacement={Boolean(editingStorePlacementId)}
        editingProductPlacement={Boolean(editingProductPlacementId)}
        campaigns={dashboard.featuredContent.campaigns}
      />

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
