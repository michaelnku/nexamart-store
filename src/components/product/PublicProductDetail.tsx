"use client";

import Image from "next/image";
import {
  CheckCircle2,
  Circle,
  ShieldCheck,
  Square,
  Store,
  Truck,
} from "lucide-react";
import type { UserRole } from "@/generated/prisma/client";
import { FoodDetails, FoodSelectedOptionInput, FullProduct } from "@/lib/types";
import { useState, useEffect, useRef, useMemo } from "react";
import WishlistButton from "./WishlistButton";
import AddToCartControl from "./AddtoCartButton";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../ui/carousel";
import { useCartStore } from "@/stores/useCartstore";
import { useWishlistStore } from "@/stores/useWishlistStore";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { addRecentlyViewed } from "@/hooks/useRecentlyViewed";
import StarRating from "@/components/reviews/StarRating";
import ProductInformationSections from "./ProductInformationSections";
import { normalizeFoodDetails } from "@/app/marketplace/_components/productFormHelpers";
import AskStoreQuestionDialog from "./AskStoreQuestionDialog";
import { MarketplaceImagePreview } from "@/components/media/MarketplaceImagePreview";
import { buildFoodSelectionFingerprint } from "@/lib/food/ordering";
import { getProductAvailabilityState } from "@/lib/product/availability";
import { cn } from "@/lib/utils";

type ProductVariant = FullProduct["variants"][number];

type Props = {
  data: FullProduct;
  defaultVariant: ProductVariant;
  cartItems: {
    id?: string;
    productId: string;
    variantId: string | null;
    selectionFingerprint?: string;
    quantity: number;
    cartItemSelectedOptions?: Array<{
      optionGroupId: string;
      optionId: string;
    }>;
  }[];
  isWishlisted: boolean;
  userId?: string | null;
  userRole?: UserRole | null;
  isFoodProduct?: boolean;
  foodDetails?: FoodDetails | null;
};

function InfoPill({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "success" | "danger";
}) {
  const className =
    variant === "success"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : variant === "danger"
        ? "bg-red-50 text-red-700 ring-1 ring-red-200"
        : "bg-slate-50 text-slate-700 ring-1 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${className}`}
    >
      {children}
    </span>
  );
}

type FoodOptionGroupView = NonNullable<FullProduct["foodOptionGroups"]>[number];
type FoodOptionView = FoodOptionGroupView["options"][number];

function getFoodOptionGroupHelperText(group: FoodOptionGroupView) {
  const modeText =
    group.type === "SINGLE_SELECT"
      ? "Select one"
      : group.maxSelections != null
        ? `Select up to ${group.maxSelections}`
        : "Select any that fit your order";

  return `${group.isRequired ? "Required" : "Optional"} • ${modeText}`;
}

function FoodOptionChoice({
  option,
  isSelected,
  groupType,
  onSelect,
  formatMoneyFromUSD,
}: {
  option: FoodOptionView;
  isSelected: boolean;
  groupType: "SINGLE_SELECT" | "MULTI_SELECT";
  onSelect: () => void;
  formatMoneyFromUSD: (value: number) => string;
}) {
  const isUnavailable = !option.isAvailable;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isUnavailable}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c9ee0] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900",
        isUnavailable
          ? "cursor-not-allowed border-slate-200/70 bg-slate-100/70 text-slate-400 opacity-75 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-500"
          : isSelected
            ? "border-[#3c9ee0]/70 bg-[#3c9ee0]/[0.08] text-slate-950 shadow-[0_14px_30px_-24px_rgba(60,158,224,0.55)] dark:border-[#72bdf0]/60 dark:bg-[#3c9ee0]/[0.14] dark:text-white"
            : "border-slate-200 bg-white hover:border-[#3c9ee0]/35 hover:bg-slate-50/90 hover:shadow-[0_16px_28px_-24px_rgba(15,23,42,0.35)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-[#3c9ee0]/35 dark:hover:bg-neutral-900/90",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition",
          groupType === "SINGLE_SELECT" ? "rounded-full" : "rounded-md",
          isSelected
            ? "bg-[#3c9ee0] text-white shadow-sm"
            : "border border-slate-300 bg-white text-slate-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-600",
        )}
      >
        {groupType === "SINGLE_SELECT" ? (
          isSelected ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )
        ) : isSelected ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-semibold",
                isUnavailable
                  ? "text-slate-400 dark:text-neutral-500"
                  : "text-slate-900 dark:text-white",
              )}
            >
              {option.name}
            </p>
            {option.description ? (
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-neutral-400">
                {option.description}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            <p
              className={cn(
                "text-sm font-semibold",
                isSelected
                  ? "text-[#256fa6] dark:text-[#8ecdf6]"
                  : "text-slate-700 dark:text-neutral-200",
              )}
            >
              {option.priceDeltaUSD > 0
                ? `+${formatMoneyFromUSD(option.priceDeltaUSD)}`
                : "Included"}
            </p>
            {isSelected ? (
              <span className="mt-1 inline-flex rounded-full bg-[#3c9ee0]/10 px-2 py-0.5 text-[11px] font-medium text-[#256fa6] dark:bg-[#3c9ee0]/15 dark:text-[#8ecdf6]">
                Selected
              </span>
            ) : null}
          </div>
        </div>

        {isUnavailable ? (
          <p className="pt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-neutral-500">
            Unavailable
          </p>
        ) : null}
      </div>
    </button>
  );
}

function FoodOptionGroupCard({
  group,
  selectedOptionIds,
  onSelect,
  formatMoneyFromUSD,
}: {
  group: FoodOptionGroupView;
  selectedOptionIds: Set<string>;
  onSelect: (optionId: string) => void;
  formatMoneyFromUSD: (value: number) => string;
}) {
  const availableOptions = group.options.filter((option) => option.isAvailable);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_50px_-34px_rgba(15,23,42,0.26)] dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-slate-200/80 bg-slate-50/85 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold tracking-[0.01em] text-slate-950 dark:text-white">
                {group.name}
              </h3>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                  group.isRequired
                    ? "bg-[#3c9ee0]/10 text-[#256fa6] dark:bg-[#3c9ee0]/15 dark:text-[#8ecdf6]"
                    : "bg-slate-200/70 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300",
                )}
              >
                {group.isRequired ? "Required" : "Optional"}
              </span>
            </div>
            {group.description ? (
              <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-neutral-400">
                {group.description}
              </p>
            ) : null}
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-400">
            {getFoodOptionGroupHelperText(group)}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {availableOptions.map((option) => (
          <FoodOptionChoice
            key={option.id}
            option={option}
            isSelected={selectedOptionIds.has(option.id)}
            groupType={group.type}
            onSelect={() => onSelect(option.id)}
            formatMoneyFromUSD={formatMoneyFromUSD}
          />
        ))}
      </div>
    </section>
  );
}

export default function ProductPublicDetail({
  data,
  defaultVariant,
  cartItems,
  isWishlisted,
  userId,
  userRole,
  isFoodProduct,
  foodDetails,
}: Props) {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isImageFading, setIsImageFading] = useState(false);
  const fadeRafRef = useRef<number | null>(null);

  useEffect(() => {
    addRecentlyViewed(data.id);
  }, [data.id]);

  useEffect(() => {
    if (cartItems?.length) useCartStore.getState().sync(cartItems);
  }, [cartItems]);

  useEffect(() => {
    if (isWishlisted) useWishlistStore.getState().add(data.id);
  }, [isWishlisted, data.id]);

  const images = data.images ?? [];
  const mainImage = images[activeIndex]?.imageUrl || "/placeholder.png";

  const previewImages = useMemo(
    () =>
      images.map((img, index) => ({
        id: `${data.id}-${index}`,
        src: img.imageUrl,
        alt: `${data.name} image ${index + 1}`,
      })),
    [images, data.id, data.name],
  );

  const colors = [
    ...new Set(data.variants.map((v) => v.color).filter(Boolean)),
  ];
  const sizes = [...new Set(data.variants.map((v) => v.size).filter(Boolean))];

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
  const [selectedFoodOptions, setSelectedFoodOptions] = useState<
    FoodSelectedOptionInput[]
  >([]);

  const foodOptionGroups = data.foodOptionGroups ?? [];
  const selectedOptionDetails = selectedFoodOptions
    .map((selection) => {
      const group = foodOptionGroups.find(
        (optionGroup) => optionGroup.id === selection.optionGroupId,
      );
      const option = group?.options.find(
        (groupOption) => groupOption.id === selection.optionId,
      );

      if (!group || !option) return null;

      return {
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceDeltaUSD: option.priceDeltaUSD,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const optionsPriceUSD = selectedOptionDetails.reduce(
    (sum, option) => sum + option.priceDeltaUSD,
    0,
  );
  const priceUSD = selectedVariant.priceUSD + optionsPriceUSD;
  const oldPriceUSD = selectedVariant.oldPriceUSD ?? null;
  const selectionFingerprint = buildFoodSelectionFingerprint(selectedFoodOptions);

  const discount =
    oldPriceUSD && oldPriceUSD > selectedVariant.priceUSD
      ? Math.round(
          ((oldPriceUSD - selectedVariant.priceUSD) / oldPriceUSD) * 100,
        )
      : null;

  const availabilityState = getProductAvailabilityState({
    product: {
      isFoodProduct: data.isFoodProduct,
      foodProductConfig: data.foodProductConfig
        ? {
            inventoryMode: data.foodProductConfig.inventoryMode,
            isAvailable: data.foodProductConfig.isAvailable,
            isSoldOut: data.foodProductConfig.isSoldOut,
            dailyOrderLimit: data.foodProductConfig.dailyOrderLimit,
            availableFrom: data.foodProductConfig.availableFrom,
            availableUntil: data.foodProductConfig.availableUntil,
            availableDays: data.foodProductConfig.availableDays,
          }
        : null,
      store: {
      },
    },
    variant: selectedVariant,
  });

  useEffect(() => {
    setSelectedColor(defaultVariant.color ?? null);
    setSelectedSize(defaultVariant.size ?? null);
  }, [defaultVariant]);

  useEffect(() => {
    const match = data.variants.find(
      (v) =>
        (selectedColor ? v.color === selectedColor : true) &&
        (selectedSize ? v.size === selectedSize : true),
    );

    if (match) {
      setSelectedVariant(match);
    }
  }, [selectedColor, selectedSize, data.variants]);

  useEffect(() => {
    if (!data.isFoodProduct) {
      setSelectedFoodOptions([]);
      return;
    }

    const defaults = foodOptionGroups.flatMap((group) => {
      const defaultOptions = group.options.filter(
        (option) => option.isDefault && option.isAvailable,
      );
      const selectedDefaults =
        group.type === "SINGLE_SELECT" ? defaultOptions.slice(0, 1) : defaultOptions;

      return selectedDefaults.map((option) => ({
        optionGroupId: group.id,
        optionId: option.id,
      }));
    });

    setSelectedFoodOptions(defaults);
  }, [data.isFoodProduct, foodOptionGroups]);

  useEffect(() => {
    setIsImageFading(true);
    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current);
    }
    fadeRafRef.current = requestAnimationFrame(() => {
      setIsImageFading(false);
    });

    return () => {
      if (fadeRafRef.current) {
        cancelAnimationFrame(fadeRafRef.current);
      }
    };
  }, [activeIndex]);

  const normalizedFoodDetails = normalizeFoodDetails(foodDetails);
  const isSellerViewer = userRole === "SELLER";
  const isOwner = Boolean(userId && userId === data.store.userId);

  const toggleFoodOption = (
    optionGroupId: string,
    optionId: string,
    groupType: "SINGLE_SELECT" | "MULTI_SELECT",
  ) => {
    setSelectedFoodOptions((current) => {
      const group = foodOptionGroups.find((item) => item.id === optionGroupId);
      const existingForGroup = current.filter(
        (selection) => selection.optionGroupId === optionGroupId,
      );
      const alreadySelected = existingForGroup.some(
        (selection) => selection.optionId === optionId,
      );

      if (groupType === "SINGLE_SELECT") {
        return current
          .filter((selection) => selection.optionGroupId !== optionGroupId)
          .concat({ optionGroupId, optionId });
      }

      if (alreadySelected) {
        return current.filter(
          (selection) =>
            !(
              selection.optionGroupId === optionGroupId &&
              selection.optionId === optionId
            ),
        );
      }

      if (
        groupType === "MULTI_SELECT" &&
        group?.maxSelections != null &&
        existingForGroup.length >= group.maxSelections
      ) {
        return current;
      }

      return [...current, { optionGroupId, optionId }];
    });
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-10 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_-18px_rgba(15,23,42,0.18)] dark:border-neutral-800 dark:bg-neutral-900">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="border-b border-slate-200/80 bg-slate-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-950/40 lg:border-b-0 lg:border-r lg:p-6">
            <div className="space-y-4">
              <MarketplaceImagePreview
                images={previewImages}
                initialIndex={activeIndex}
                variant="product"
                title={data.name}
                description="Preview product images"
                triggerClassName="rounded-2xl"
              >
                <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <Image
                    key={mainImage}
                    src={mainImage}
                    alt={data.name}
                    fill
                    className={`object-contain p-4 transition-all duration-300 ease-in-out group-hover:scale-[1.02] ${
                      isImageFading ? "opacity-0" : "opacity-100"
                    }`}
                  />
                </div>
              </MarketplaceImagePreview>

              {images.length > 0 && (
                <div className="relative rounded-2xl border border-slate-200 bg-white px-2 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <Carousel className="w-full">
                    <CarouselContent className="mx-0 flex gap-2 px-8">
                      {images.map((img, i) => (
                        <CarouselItem
                          key={i}
                          className="basis-1/5 pl-0 min-w-[72px] sm:min-w-[84px]"
                        >
                          <button
                            onClick={() => setActiveIndex(i)}
                            className={`relative aspect-square w-full overflow-hidden rounded-xl border bg-white transition ${
                              activeIndex === i
                                ? "border-[#3c9ee0] ring-2 ring-[#3c9ee0]/30"
                                : "border-slate-200 hover:border-slate-400 dark:border-neutral-700 dark:hover:border-neutral-500"
                            }`}
                          >
                            <Image
                              fill
                              src={img.imageUrl}
                              alt={`${data.name} thumbnail ${i + 1}`}
                              className="object-cover"
                            />
                          </button>
                        </CarouselItem>
                      ))}
                    </CarouselContent>

                    <CarouselPrevious className="absolute left-1 top-1/2 z-20 size-8 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800" />
                    <CarouselNext className="absolute right-1 top-1/2 z-20 size-8 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800" />
                  </Carousel>
                </div>
              )}
            </div>
          </div>

          <section className="space-y-6 p-5 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {availabilityState.isInStock ? (
                    <InfoPill variant="success">
                      {availabilityState.label}
                    </InfoPill>
                  ) : (
                    <InfoPill variant="danger">{availabilityState.label}</InfoPill>
                  )}

                  {discount ? <InfoPill>{discount}% OFF</InfoPill> : null}
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">
                  {data.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {data.brand && (
                    <p className="text-slate-600 dark:text-slate-300">
                      Brand:{" "}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {data.brand}
                      </span>
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <StarRating value={data.averageRating} readonly size="sm" />
                    <span className="text-slate-500">({data.reviewCount})</span>
                  </div>
                </div>
              </div>

              {!isSellerViewer ? (
                <div className="shrink-0">
                  <WishlistButton
                    productId={data.id}
                    userId={userId}
                    isWishlisted={isWishlisted}
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-neutral-800 dark:bg-neutral-950/40">
              <div className="flex flex-wrap items-end gap-3">
                <div className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  {formatMoneyFromUSD(priceUSD)}
                </div>

                {oldPriceUSD !== null && oldPriceUSD > priceUSD && (
                  <div className="pb-1 text-sm text-slate-500 line-through">
                    {formatMoneyFromUSD(oldPriceUSD)}
                  </div>
                )}
              </div>

              {discount && oldPriceUSD !== null && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Save {formatMoneyFromUSD(oldPriceUSD - selectedVariant.priceUSD)} on this
                  option
                </p>
              )}

              {optionsPriceUSD > 0 ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Includes {formatMoneyFromUSD(optionsPriceUSD)} in selected
                  add-ons.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-[#3c9ee0]/10 p-2 text-[#3c9ee0]">
                  <Store className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sold by
                  </p>
                  <Link
                    href={`/store/${data.store.slug}`}
                    className="mt-1 inline-flex items-center text-sm font-semibold text-[#3c9ee0] hover:underline"
                  >
                    {data.store.name}
                  </Link>
                </div>
              </div>
            </div>

            {colors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Color
                  </p>
                  {selectedColor && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Selected: {selectedColor}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const isActive = selectedColor === c;

                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`rounded-full border px-3.5 py-2 text-sm font-medium capitalize transition ${
                          isActive
                            ? "border-[#3c9ee0] bg-[#3c9ee0] text-white shadow-sm"
                            : "border-slate-300 bg-white text-slate-700 hover:border-[#3c9ee0]/60 hover:text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Size
                  </p>
                  {selectedSize && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Selected: {selectedSize}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const isActive = selectedSize === s;

                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`rounded-full border px-3.5 py-2 text-sm font-medium uppercase transition ${
                          isActive
                            ? "border-[#3c9ee0] bg-[#3c9ee0] text-white shadow-sm"
                            : "border-slate-300 bg-white text-slate-700 hover:border-[#3c9ee0]/60 hover:text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {data.isFoodProduct && foodOptionGroups.length > 0 ? (
              <div className="space-y-5">
                {foodOptionGroups.map((group) => {
                  const selectedIds = new Set(
                    selectedFoodOptions
                      .filter((selection) => selection.optionGroupId === group.id)
                      .map((selection) => selection.optionId),
                  );

                  return (
                    <FoodOptionGroupCard
                      key={group.id}
                      group={group}
                      selectedOptionIds={selectedIds}
                      onSelect={(optionId) =>
                        toggleFoodOption(group.id, optionId, group.type)
                      }
                      formatMoneyFromUSD={formatMoneyFromUSD}
                    />
                  );
                })}
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              {isOwner ? (
                <Link
                  href={`/marketplace/dashboard/seller/products/${data.id}/update`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#3c9ee0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2f8dcd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c9ee0] focus-visible:ring-offset-2"
                >
                  Update Product
                </Link>
              ) : !isSellerViewer ? (
                <AddToCartControl
                  productId={data.id}
                  variantId={selectedVariant?.id ?? null}
                  availableStock={availabilityState.availableStock}
                  isOrderable={availabilityState.isOrderable}
                  selectionFingerprint={selectionFingerprint}
                  selectedOptions={selectedFoodOptions}
                />
              ) : (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Seller accounts can preview this listing, but cart actions are
                  reserved for customers.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  Fast delivery available
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Reliable fulfillment with smooth order tracking.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-[#3c9ee0]" />
                  Secure transaction
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Protected checkout experience built for marketplace trust.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <ProductInformationSections
        data={data}
        isFoodProduct={isFoodProduct}
        foodDetails={normalizedFoodDetails}
        foodEmptyState={
          <div className="space-y-3 py-8 text-center">
            <p className="text-sm text-gray-500">
              No food information has been provided.
            </p>
            <p className="text-xs text-gray-400">
              Please contact the store for preparation or ingredient details.
            </p>
            <AskStoreQuestionDialog
              productId={data.id}
              productName={data.name}
              storeName={data.store.name}
              isLoggedIn={Boolean(userId)}
            />
          </div>
        }
      />
    </main>
  );
}
