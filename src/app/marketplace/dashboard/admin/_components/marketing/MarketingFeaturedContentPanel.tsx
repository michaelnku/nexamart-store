"use client";

import { Archive, ArrowDown, ArrowUp, CalendarRange, ExternalLink, LayoutTemplate, PencilLine, Plus, Search, ShoppingBag, Tag, Trash2 } from "lucide-react";
import Link from "next/link";

import { PremiumPanel } from "@/app/marketplace/_components/PremiumDashboard";
import type { MarketingCampaignFormValues } from "@/components/admin/marketing/MarketingCampaignForm";
import { MarketingCampaignForm } from "@/components/admin/marketing/MarketingCampaignForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminMarketingCampaign } from "@/lib/services/admin/adminMarketingCampaignService";
import type { AdminFeaturedProductPlacement, AdminFeaturedStorePlacement, PlacementSlotOption } from "@/lib/services/admin/adminMarketingPlacementService";
import { formatAnalyticsCount } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";
import { CampaignStatusBadge, type CampaignDisplayStatus, formatMarketingDate, getCampaignDisplayStatus, getPlacementDisplayStatus, type PlacementFormState } from "./marketingShared";

type PlacementEditorProps = {
  title: string;
  description: string;
  selectedCampaign: AdminMarketingCampaign | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedValue: string;
  onSelectedValueChange: (value: string) => void;
  selectedLabel: string;
  searchPlaceholder: string;
  selectPlaceholder: string;
  options: Array<{ id: string; label: string }>;
  slotOptions: PlacementSlotOption[];
  form: PlacementFormState;
  onFormChange: (updater: (current: PlacementFormState) => PlacementFormState) => void;
  onSubmit: () => void;
  onReset: () => void;
  submitLabel: string;
  resetLabel: string;
  disabled: boolean;
  isPending: boolean;
  children: React.ReactNode;
};

type StorePlacementGroup = {
  slot: string;
  label: string;
  placements: AdminFeaturedStorePlacement[];
};

type ProductPlacementGroup = {
  slot: string;
  label: string;
  placements: AdminFeaturedProductPlacement[];
};

function PlacementEditor(props: PlacementEditorProps) {
  const {
    title,
    description,
    selectedCampaign,
    searchValue,
    onSearchChange,
    selectedValue,
    onSelectedValueChange,
    selectedLabel,
    searchPlaceholder,
    selectPlaceholder,
    options,
    slotOptions,
    form,
    onFormChange,
    onSubmit,
    onReset,
    submitLabel,
    resetLabel,
    disabled,
    isPending,
    children,
  } = props;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
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
        <p className="text-xs text-slate-500 dark:text-zinc-400">{description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
              disabled={disabled || isPending}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
            Selection
          </label>
          <Select
            value={selectedValue}
            onValueChange={onSelectedValueChange}
            disabled={disabled || isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {selectedLabel || "No selection made."}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
            Slot
          </label>
          <Select
            value={form.slot}
            onValueChange={(value) =>
              onFormChange((current) => ({ ...current, slot: value }))
            }
            disabled={disabled || isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a placement slot" />
            </SelectTrigger>
            <SelectContent>
              {slotOptions.map((slot) => (
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
            value={form.tagLabel}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, tagLabel: event.target.value }))
            }
            placeholder="Optional merchandising tag"
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
            Starts
          </label>
          <Input
            type="date"
            value={form.startsAt}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, startsAt: event.target.value }))
            }
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
            Ends
          </label>
          <Input
            type="date"
            value={form.endsAt}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, endsAt: event.target.value }))
            }
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
            Notes
          </label>
          <Textarea
            value={form.notes}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Optional context for this placement"
            disabled={disabled || isPending}
            rows={3}
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Placement enabled
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Disabled placements stay attached to the campaign but are excluded from
              active merchandising reads.
            </p>
          </div>
          <Switch
            checked={form.isEnabled}
            onCheckedChange={(checked) =>
              onFormChange((current) => ({ ...current, isEnabled: checked }))
            }
            disabled={disabled || isPending}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={disabled || isPending || !selectedCampaign || !selectedValue || !form.slot}
        >
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onReset} disabled={isPending}>
          {resetLabel}
        </Button>
      </div>

      {children}
    </div>
  );
}

function StorePlacementList({
  groups,
  disabled,
  isPending,
  onEdit,
  onToggle,
  onMove,
  onDelete,
}: {
  groups: StorePlacementGroup[];
  disabled: boolean;
  isPending: boolean;
  onEdit: (placement: AdminFeaturedStorePlacement) => void;
  onToggle: (id: string, checked: boolean) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
}) {
  if (groups.length === 0) {
    return (
      <Empty className="border-slate-200/80 dark:border-zinc-800">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Tag />
          </EmptyMedia>
          <EmptyTitle>No featured stores assigned</EmptyTitle>
          <EmptyDescription>
            Select a campaign and assign stores to start building campaign-backed
            store merchandising.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
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
                        <Badge variant="outline" className={status.className}>
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
                        Position {index + 1} of {group.placements.length} in {group.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={placement.isEnabled}
                        onCheckedChange={(checked) => onToggle(placement.id, checked)}
                        disabled={disabled || isPending}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(placement)}
                        disabled={disabled || isPending}
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onMove(placement.id, "up")}
                        disabled={disabled || isPending || index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onMove(placement.id, "down")}
                        disabled={disabled || isPending || index === group.placements.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(placement.id)}
                        disabled={disabled || isPending}
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
                    <span>Starts {formatMarketingDate(placement.startsAt)}</span>
                    <span>Ends {formatMarketingDate(placement.endsAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductPlacementList({
  groups,
  disabled,
  isPending,
  onEdit,
  onToggle,
  onMove,
  onDelete,
}: {
  groups: ProductPlacementGroup[];
  disabled: boolean;
  isPending: boolean;
  onEdit: (placement: AdminFeaturedProductPlacement) => void;
  onToggle: (id: string, checked: boolean) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
}) {
  if (groups.length === 0) {
    return (
      <Empty className="border-slate-200/80 dark:border-zinc-800">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShoppingBag />
          </EmptyMedia>
          <EmptyTitle>No featured products assigned</EmptyTitle>
          <EmptyDescription>
            Select a campaign and attach products to start building campaign-backed
            product merchandising.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
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
                        <Badge variant="outline" className={status.className}>
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
                        Position {index + 1} of {group.placements.length} in {group.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={placement.isEnabled}
                        onCheckedChange={(checked) => onToggle(placement.id, checked)}
                        disabled={disabled || isPending}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(placement)}
                        disabled={disabled || isPending}
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onMove(placement.id, "up")}
                        disabled={disabled || isPending || index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onMove(placement.id, "down")}
                        disabled={disabled || isPending || index === group.placements.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(placement.id)}
                        disabled={disabled || isPending}
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
                    <span>Starts {formatMarketingDate(placement.startsAt)}</span>
                    <span>Ends {formatMarketingDate(placement.endsAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

type MarketingFeaturedContentPanelProps = {
  selectedCampaign: AdminMarketingCampaign | null;
  selectedCampaignId: string;
  selectedCampaignDisplayStatus: CampaignDisplayStatus | null;
  selectableCampaigns: AdminMarketingCampaign[];
  campaignFormValues: MarketingCampaignFormValues;
  heroBannerOptions: Array<{ id: string; label: string }>;
  isPending: boolean;
  storeSearch: string;
  setStoreSearch: (value: string) => void;
  productSearch: string;
  setProductSearch: (value: string) => void;
  selectedStoreId: string;
  setSelectedStoreId: (value: string) => void;
  selectedProductId: string;
  setSelectedProductId: (value: string) => void;
  selectedStoreLabel: string;
  selectedProductLabel: string;
  filteredStores: Array<{ id: string; label: string }>;
  filteredProducts: Array<{ id: string; label: string }>;
  storePlacementForm: PlacementFormState;
  setStorePlacementForm: (updater: (current: PlacementFormState) => PlacementFormState) => void;
  productPlacementForm: PlacementFormState;
  setProductPlacementForm: (updater: (current: PlacementFormState) => PlacementFormState) => void;
  groupedStorePlacements: StorePlacementGroup[];
  groupedProductPlacements: ProductPlacementGroup[];
  storeSlotOptions: PlacementSlotOption[];
  productSlotOptions: PlacementSlotOption[];
  onCampaignSelect: (value: string) => void;
  onCampaignSubmit: (values: MarketingCampaignFormValues) => void;
  onCampaignArchive: () => void;
  onStorePlacementSubmit: () => void;
  onProductPlacementSubmit: () => void;
  onResetStorePlacement: () => void;
  onResetProductPlacement: () => void;
  onEditStorePlacement: (placement: AdminFeaturedStorePlacement) => void;
  onEditProductPlacement: (placement: AdminFeaturedProductPlacement) => void;
  onToggleStorePlacement: (id: string, checked: boolean) => void;
  onToggleProductPlacement: (id: string, checked: boolean) => void;
  onMoveStorePlacement: (id: string, direction: "up" | "down") => void;
  onMoveProductPlacement: (id: string, direction: "up" | "down") => void;
  onDeleteStorePlacement: (id: string) => void;
  onDeleteProductPlacement: (id: string) => void;
  placementEditingDisabled: boolean;
  isArchivedCampaignSelected: boolean;
  editingStorePlacement: boolean;
  editingProductPlacement: boolean;
  campaigns: AdminMarketingCampaign[];
};

export function MarketingFeaturedContentPanel({
  selectedCampaign,
  selectedCampaignId,
  selectedCampaignDisplayStatus,
  selectableCampaigns,
  campaignFormValues,
  heroBannerOptions,
  isPending,
  storeSearch,
  setStoreSearch,
  productSearch,
  setProductSearch,
  selectedStoreId,
  setSelectedStoreId,
  selectedProductId,
  setSelectedProductId,
  selectedStoreLabel,
  selectedProductLabel,
  filteredStores,
  filteredProducts,
  storePlacementForm,
  setStorePlacementForm,
  productPlacementForm,
  setProductPlacementForm,
  groupedStorePlacements,
  groupedProductPlacements,
  storeSlotOptions,
  productSlotOptions,
  onCampaignSelect,
  onCampaignSubmit,
  onCampaignArchive,
  onStorePlacementSubmit,
  onProductPlacementSubmit,
  onResetStorePlacement,
  onResetProductPlacement,
  onEditStorePlacement,
  onEditProductPlacement,
  onToggleStorePlacement,
  onToggleProductPlacement,
  onMoveStorePlacement,
  onMoveProductPlacement,
  onDeleteStorePlacement,
  onDeleteProductPlacement,
  placementEditingDisabled,
  isArchivedCampaignSelected,
  editingStorePlacement,
  editingProductPlacement,
  campaigns,
}: MarketingFeaturedContentPanelProps) {
  return (
    <PremiumPanel
      title="Featured Content"
      description="Attach featured stores and products directly to the selected campaign with slot-aware ordering and optional campaign windows."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <PlacementEditor
            title="Featured stores"
            description="Assign stores into campaign slots. Priority changes stay within the selected campaign and slot."
            selectedCampaign={selectedCampaign}
            searchValue={storeSearch}
            onSearchChange={setStoreSearch}
            selectedValue={selectedStoreId}
            onSelectedValueChange={setSelectedStoreId}
            selectedLabel={selectedStoreLabel}
            searchPlaceholder="Search stores"
            selectPlaceholder="Select a store candidate"
            options={filteredStores}
            slotOptions={storeSlotOptions}
            form={storePlacementForm}
            onFormChange={setStorePlacementForm}
            onSubmit={onStorePlacementSubmit}
            onReset={onResetStorePlacement}
            submitLabel={editingStorePlacement ? "Update store placement" : "Assign store"}
            resetLabel={editingStorePlacement ? "Cancel edit" : "Reset"}
            disabled={placementEditingDisabled}
            isPending={isPending}
          >
            <StorePlacementList
              groups={groupedStorePlacements}
              disabled={placementEditingDisabled}
              isPending={isPending}
              onEdit={onEditStorePlacement}
              onToggle={onToggleStorePlacement}
              onMove={onMoveStorePlacement}
              onDelete={onDeleteStorePlacement}
            />
          </PlacementEditor>

          <Separator />

          <PlacementEditor
            title="Featured products"
            description="Attach products to the selected campaign and manage slot-local ordering, notes, and merchandising windows."
            selectedCampaign={selectedCampaign}
            searchValue={productSearch}
            onSearchChange={setProductSearch}
            selectedValue={selectedProductId}
            onSelectedValueChange={setSelectedProductId}
            selectedLabel={selectedProductLabel}
            searchPlaceholder="Search product candidates"
            selectPlaceholder="Select a product candidate"
            options={filteredProducts}
            slotOptions={productSlotOptions}
            form={productPlacementForm}
            onFormChange={setProductPlacementForm}
            onSubmit={onProductPlacementSubmit}
            onReset={onResetProductPlacement}
            submitLabel={editingProductPlacement ? "Update product placement" : "Assign product"}
            resetLabel={editingProductPlacement ? "Cancel edit" : "Reset"}
            disabled={placementEditingDisabled}
            isPending={isPending}
          >
            <ProductPlacementList
              groups={groupedProductPlacements}
              disabled={placementEditingDisabled}
              isPending={isPending}
              onEdit={onEditProductPlacement}
              onToggle={onToggleProductPlacement}
              onMove={onMoveProductPlacement}
              onDelete={onDeleteProductPlacement}
            />
          </PlacementEditor>
        </div>

        <Card className="border-slate-200/80 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              Seasonal Campaign Tags
            </CardTitle>
            <CardDescription>
              Create, select, and manage campaign tags from real marketing campaign
              records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Active campaign selection
              </label>
              <Select
                value={selectedCampaignId}
                onValueChange={onCampaignSelect}
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
                Archived campaigns stay out of the primary selector but remain visible
                below for review.
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
                    . Featured store and product assignments now inherit this campaign
                    as their merchandising context.
                  </p>
                  {selectedCampaignDisplayStatus ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CampaignStatusBadge status={selectedCampaignDisplayStatus} />
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
                  onClick={() => onCampaignSelect("__new__")}
                  disabled={isPending && selectedCampaignId === "__new__"}
                >
                  <Plus className="h-4 w-4" />
                  New campaign
                </Button>
              </div>

              <MarketingCampaignForm
                mode={selectedCampaign ? "edit" : "create"}
                initialValues={campaignFormValues}
                heroBannerOptions={heroBannerOptions}
                disabled={isPending || isArchivedCampaignSelected}
                onSubmit={onCampaignSubmit}
                onArchive={
                  selectedCampaign && !isArchivedCampaignSelected
                    ? onCampaignArchive
                    : undefined
                }
                onReset={() => onCampaignSelect(selectedCampaign?.id ?? "__new__")}
              />
            </div>

            {campaigns.length === 0 ? (
              <Empty className="border-slate-200/80 dark:border-zinc-800">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Tag />
                  </EmptyMedia>
                  <EmptyTitle>No seasonal campaigns yet</EmptyTitle>
                  <EmptyDescription>
                    Create a campaign tag to start structuring homepage merchandising
                    and seasonal programming.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-3">
                {campaigns.map((campaign) => {
                  const displayStatus = getCampaignDisplayStatus(campaign);

                  return (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => onCampaignSelect(campaign.id)}
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
                            <span className="text-sm font-semibold">{campaign.name}</span>
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
                            {formatMarketingDate(campaign.startsAt)} -{" "}
                            {formatMarketingDate(campaign.endsAt)}
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
  );
}
