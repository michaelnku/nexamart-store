"use client";

import { type ReactNode, useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteFileAction } from "@/actions/actions";
import { createProductAction } from "@/actions/auth/product";
import { PriceConverter } from "@/components/currency/PriceConverter";
import FoodProductSection from "@/components/product/FoodProductSection";
import { ProductImageUploader } from "@/components/product/ProductImageUploader";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { productSchema, type productSchemaType } from "@/lib/zodValidation";

import {
  DEFAULT_FOOD_CONFIG,
  createEmptyVariant,
  getProductFormDefaults,
} from "./productFormHelpers";
import {
  clampNonNegativeUSD,
  normalizeDiscountPercent,
} from "./productPricingFormUtils";

type ProductFormProps = {
  categories: Category[];
  storeType: "GENERAL" | "FOOD";
};

const sectionCardClassName =
  "space-y-6 rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.22)] backdrop-blur sm:p-6 dark:border-zinc-800 dark:bg-zinc-950/80";

function FormSection({
  title,
  description,
  className,
  children,
  action,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cn(sectionCardClassName, className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export default function ProductForm({
  categories,
  storeType,
}: ProductFormProps) {
  const router = useRouter();
  const isFoodStore = storeType === "FOOD";

  const [level1, setLevel1] = useState<string | null>(null);
  const [level2, setLevel2] = useState<string | null>(null);
  const [level3, setLevel3] = useState<string | null>(null);
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isUploadingImages = uploading || isImageProcessing;

  const topLevelCategories = categories.filter(
    (category) => !category.parentId,
  );
  const childrenLevel1 = categories.filter(
    (category) => category.parentId === level1,
  );
  const childrenLevel2 = categories.filter(
    (category) => category.parentId === level2,
  );

  const form = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: getProductFormDefaults({
      isFoodStore,
    }),
  });

  const {
    control,
    getValues,
    handleSubmit,
    setError: setFieldError,
    clearErrors,
    setValue,
    watch,
  } = form;
  const watchedImages = watch("images");
  const foodInventoryMode = watch("foodConfig.inventoryMode");
  const categoryError =
    typeof form.formState.errors.categoryId?.message === "string"
      ? form.formState.errors.categoryId.message
      : undefined;
  const imagesError =
    typeof form.formState.errors.images?.message === "string"
      ? form.formState.errors.images.message
      : undefined;
  const variantsError =
    typeof form.formState.errors.variants?.message === "string"
      ? form.formState.errors.variants.message
      : undefined;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "variants",
  });
  const {
    fields: technicalFields,
    append: appendTechnicalDetail,
    remove: removeTechnicalDetail,
  } = useFieldArray({
    control,
    name: "technicalDetails",
  });

  const generateSimpleSku = (name: string) => {
    const prefix = (name || "PRD")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase();
    return `${prefix || "PRD"}-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const generateVariantSku = (color?: string, size?: string) => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const colorToken = (color || "NA").slice(0, 2).toUpperCase();
    const sizeToken = (size || "NA").slice(0, 2).toUpperCase();
    return `${colorToken}-${sizeToken}-${rand}`;
  };

  const getFirstErrorDetail = (
    value: unknown,
    path: string[] = [],
  ): { message: string; path: string[] } | undefined => {
    if (!value || typeof value !== "object") return undefined;

    if (
      "message" in (value as Record<string, unknown>) &&
      typeof (value as Record<string, unknown>).message === "string"
    ) {
      return {
        message: (value as { message: string }).message,
        path,
      };
    }

    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const detail = getFirstErrorDetail(nestedValue, [...path, key]);
      if (detail) return detail;
    }

    return undefined;
  };

  const normalizeErrorMessage = (message: string) => {
    if (message === "Too small: expected string to have >= 1 characters") {
      return "This field is required.";
    }

    return message;
  };

  const formatErrorPath = (path: string[]) => {
    const [root, second, third] = path;

    if (root === "categoryId") return "Category";
    if (root === "images") return "Product Images";
    if (root === "variants") {
      if (typeof second === "undefined") return "Variants";
      const variantLabel = `Variant ${Number(second) + 1}`;
      if (third === "priceUSD") return `${variantLabel} Price`;
      if (third === "stock") return `${variantLabel} Stock`;
      if (third === "color") return `${variantLabel} Color`;
      if (third === "size") return `${variantLabel} Size`;
      if (third === "sku") return `${variantLabel} SKU`;
      if (third === "oldPriceUSD") return `${variantLabel} Old Price`;
      if (third === "discount") return `${variantLabel} Discount`;
      return variantLabel;
    }

    if (root === "foodDetails") {
      if (second === "ingredients") {
        return `Food Details > Ingredient ${Number(third) + 1}`;
      }
      if (second === "preparationTimeMinutes") {
        return "Food Details > Preparation Time";
      }
      if (second === "portionSize") return "Food Details > Portion Size";
      if (second === "spiceLevel") return "Food Details > Spice Level";
      if (second === "dietaryTags") return "Food Details > Dietary Tags";
      if (second === "expiresAt") return "Food Details > Expiry Date";
      return "Food Details";
    }

    if (root === "foodConfig") {
      if (second === "itemType") return "Food Configuration > Item Type";
      if (second === "inventoryMode")
        return "Food Configuration > Inventory Mode";
      if (second === "isAvailable") return "Availability > Accepting Orders";
      if (second === "isSoldOut") return "Availability > Sold Out";
      if (second === "preparationTimeMinutes")
        return "Food Configuration > Preparation Time";
      if (second === "dailyOrderLimit")
        return "Food Configuration > Daily Order Limit";
      if (second === "availableFrom") return "Availability > Available From";
      if (second === "availableUntil") return "Availability > Available Until";
      if (second === "availableDays") return "Availability > Available Days";
      if (second === "allowScheduledOrder") return "Schedule > Scheduled Orders";
      if (second === "allowSameDayPreorder")
        return "Schedule > Same-Day Preorder";
      return "Food Configuration";
    }

    if (root === "foodOptionGroups") {
      const groupLabel =
        typeof second === "undefined"
          ? "Food Option Groups"
          : `Food Option Group ${Number(second) + 1}`;

      if (third === "name") return `${groupLabel} Name`;
      if (third === "type") return `${groupLabel} Type`;
      if (third === "minSelections") return `${groupLabel} Min Selections`;
      if (third === "maxSelections") return `${groupLabel} Max Selections`;
      if (third === "options") return `${groupLabel} Options`;
      return groupLabel;
    }

    if (root === "technicalDetails") {
      const detailLabel =
        typeof second === "undefined"
          ? "Technical Details"
          : `Technical Detail ${Number(second) + 1}`;
      if (third === "key") return `${detailLabel} Label`;
      if (third === "value") return `${detailLabel} Value`;
      return detailLabel;
    }

    if (root === "name") return "Product Name";
    if (root === "brand") return "Brand";
    if (root === "description") return "Description";
    if (root === "specifications") return "Specifications";

    return path
      .map((segment) =>
        segment
          .replace(/([A-Z])/g, " $1")
          .replace(/^\w/, (char) => char.toUpperCase()),
      )
      .join(" > ");
  };

  const hasDuplicateSkus = (variants: { sku: string }[]) => {
    const skus = variants.map((variant) => variant.sku.trim());
    return new Set(skus).size !== skus.length;
  };

  useEffect(() => {
    setValue("categoryId", level3 || level2 || level1 || "");
  }, [level1, level2, level3, setValue]);

  useEffect(() => {
    setValue("isFoodProduct", isFoodStore);

    if (!isFoodStore) {
      setValue("foodDetails", undefined);
      setValue("foodConfig", undefined);
      setValue("foodOptionGroups", []);
      return;
    }

    const currentVariant = getValues("variants")[0] ?? createEmptyVariant(true);
    replace([
      {
        ...currentVariant,
        color: undefined,
        size: undefined,
      },
    ]);

    const currentFoodDetails = getValues("foodDetails");
    if (!currentFoodDetails) {
      setValue("foodDetails", {
        ingredients: [""],
        preparationTimeMinutes: 1,
        portionSize: "",
        spiceLevel: undefined,
        dietaryTags: [],
        isPerishable: false,
        expiresAt: undefined,
      });
    }

    if (!getValues("foodConfig")) {
      setValue("foodConfig", DEFAULT_FOOD_CONFIG);
    }

    if (!Array.isArray(getValues("foodOptionGroups"))) {
      setValue("foodOptionGroups", []);
    }
  }, [getValues, isFoodStore, replace, setValue]);

  useEffect(() => {
    const productName = getValues("name");

    getValues("variants").forEach((variant: any, index: number) => {
      if (!variant.sku) {
        const nextSku =
          !isFoodStore && (variant.color || variant.size)
            ? generateVariantSku(variant.color, variant.size)
            : generateSimpleSku(productName);

        setValue(`variants.${index}.sku`, nextSku);
      }
    });
  }, [getValues, isFoodStore, setValue]);

  const onSubmit = (values: productSchemaType) => {
    if (!values.categoryId) {
      setFieldError("categoryId", {
        type: "manual",
        message: "Please select a category.",
      });
      toast.error("Please select a category");
      return;
    }
    clearErrors("categoryId");

    if (!values.images.length) {
      setFieldError("images", {
        type: "manual",
        message: "Upload at least one product image.",
      });
      toast.error("Upload at least one product image");
      return;
    }
    clearErrors("images");

    if (isUploadingImages) {
      toast.error("Wait for images to finish uploading");
      return;
    }

    const normalizedValues: productSchemaType = {
      ...values,
      isFoodProduct: isFoodStore,
      description: values.description.trim(),
      brand: values.brand?.trim() || "",
      foodDetails: isFoodStore ? values.foodDetails : undefined,
      foodConfig: isFoodStore ? values.foodConfig : undefined,
      foodOptionGroups: isFoodStore ? values.foodOptionGroups ?? [] : [],
      technicalDetails: isFoodStore ? [] : (values.technicalDetails ?? []),
      specifications: isFoodStore ? "" : (values.specifications ?? "").trim(),
      variants: values.variants.map((variant: any, index: number) => ({
        ...variant,
        color: isFoodStore ? undefined : variant.color?.trim() || "",
        size: isFoodStore ? undefined : variant.size?.trim() || "",
        stock:
          isFoodStore && values.foodConfig?.inventoryMode === "AVAILABILITY_ONLY"
            ? 0
            : variant.stock,
        sku:
          variant.sku?.trim() ||
          (isFoodStore
            ? generateSimpleSku(values.name)
            : generateVariantSku(variant.color, variant.size)),
      })),
    };

    if (!normalizedValues.variants.length) {
      setFieldError("variants", {
        type: "manual",
        message: "At least one variant is required.",
      });
      toast.error("At least one variant is required");
      return;
    }
    clearErrors("variants");

    if (isFoodStore && normalizedValues.variants.length !== 1) {
      setFieldError("variants", {
        type: "manual",
        message: "Food products can only have one pricing option.",
      });
      toast.error("Food products can only have one pricing option.");
      return;
    }

    if (hasDuplicateSkus(normalizedValues.variants)) {
      setFieldError("variants", {
        type: "manual",
        message: "Each variant must have a unique SKU.",
      });
      toast.error("Each variant must have a unique SKU.");
      return;
    }
    clearErrors("variants");

    startTransition(async () => {
      try {
        const response = await createProductAction(normalizedValues);
        if (response?.error) {
          setError(response.error);
          toast.error(response.error);
          return;
        }

        toast.success("Product created successfully");
        router.push("/marketplace/dashboard/seller/products");
      } catch {
        toast.error("Something went wrong while creating this product.");
      }
    });
  };

  const deleteImage = async (key: string) => {
    if (deletingKeys.has(key)) return;

    setDeletingKeys((previous) => new Set(previous).add(key));
    try {
      await deleteFileAction(key);
      setValue(
        "images",
        getValues("images").filter((image: any) => image.key !== key),
      );
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    } finally {
      setDeletingKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <main className="flex justify-center  px-3 py-4 dark:bg-neutral-950">
      <div className="w-full max-w-6xl rounded-[32px] border border-white/70 bg-white/85 p-3 shadow-[0_30px_100px_-46px_rgba(15,23,42,0.35)] backdrop-blur sm:p-4 lg:p-5 dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="rounded-[28px] border border-white/15 bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_42%,#0f766e_100%)] px-5 py-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:px-6 sm:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-100/80">
                NexaMart Seller Workspace
              </p>
              <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
                New Product
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-100/85 sm:text-base">
                {isFoodStore
                  ? "Create a service-ready menu listing with clean details, accurate pricing, and polished imagery."
                  : "Launch a polished product listing with strong merchandising, accurate stock, and marketplace-ready visuals."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur">
              Store type:{" "}
              <span className="font-semibold text-white">{storeType}</span>
            </div>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-4 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : null}

        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit, (errors) => {
              const errorDetail = getFirstErrorDetail(errors);
              toast.error(
                errorDetail
                  ? `${formatErrorPath(errorDetail.path)}: ${normalizeErrorMessage(errorDetail.message)}`
                  : "Please fix the highlighted fields",
              );
            })}
            className="mt-4 space-y-8"
          >
            <FormSection
              title="Product Information"
              description="Cover the fundamentals clearly so customers can evaluate your product quickly."
            >
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isFoodStore ? "Menu Item Name" : "Product Name"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={120}
                        placeholder="e.g. Samsung TV 55 inch"
                        className="focus-visible:ring-[var(--brand-blue)]"
                      />
                    </FormControl>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                      {field.value.length}/120 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isFoodStore
                        ? "Kitchen / Brand (optional)"
                        : "Brand (optional)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nike / LG / Generic / None"
                        className="focus-visible:ring-[var(--brand-blue)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isFoodStore ? "Menu Description" : "Description"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={isFoodStore ? 5 : 4}
                        placeholder={
                          isFoodStore
                            ? "Describe taste, portion, preparation style, and key selling points."
                            : "Describe the product clearly."
                        }
                        className="focus-visible:ring-[var(--brand-blue)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Category</FormLabel>
                  <select
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={level1 ?? ""}
                    onChange={(event) => {
                      const value = event.target.value || null;
                      setLevel1(value);
                      setLevel2(null);
                      setLevel3(null);
                    }}
                  >
                    <option value="">Select category</option>
                    {topLevelCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categoryError ? (
                    <p className="text-sm font-medium text-destructive">
                      {categoryError}
                    </p>
                  ) : null}
                </div>

                {childrenLevel1.length > 0 ? (
                  <select
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={level2 ?? ""}
                    onChange={(event) => {
                      const value = event.target.value || null;
                      setLevel2(value);
                      setLevel3(null);
                    }}
                  >
                    <option value="">Select subcategory</option>
                    {childrenLevel1.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : null}

                {childrenLevel2.length > 0 ? (
                  <select
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={level3 ?? ""}
                    onChange={(event) => setLevel3(event.target.value || null)}
                  >
                    <option value="">Select sub-subcategory</option>
                    {childrenLevel2.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </FormSection>

            {!isFoodStore ? (
              <FormSection
                title="Specifications and Technical Details"
                description="Surface the details that matter most for comparison shoppers and high-intent buyers."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendTechnicalDetail({ key: "", value: "" })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Detail
                  </Button>
                }
              >
                <FormField
                  control={control}
                  name="specifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Features (one per line)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={5}
                          placeholder={`5000mAh battery
6.5-inch AMOLED display
Snapdragon processor
Dual SIM`}
                          className="focus-visible:ring-[var(--brand-blue)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Technical Details
                  </h3>

                  {technicalFields.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      No technical details added yet.
                    </p>
                  ) : null}

                  {technicalFields.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 md:grid-cols-[1.2fr_1.6fr_auto] dark:border-zinc-800 dark:bg-zinc-900/80"
                    >
                      <FormField
                        control={control}
                        name={`technicalDetails.${index}.key`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Label</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="focus-visible:ring-[var(--brand-blue)]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`technicalDetails.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Value</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="focus-visible:ring-[var(--brand-blue)]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTechnicalDetail(index)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </FormSection>
            ) : (
              <FormSection
                title="Food Details"
                description="Add the operational details buyers expect from a restaurant-quality menu item."
                className="border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:border-orange-900/40 dark:bg-[linear-gradient(135deg,rgba(124,45,18,0.28)_0%,rgba(23,23,23,0.92)_48%,rgba(9,9,11,0.96)_100%)]"
              >
                <FoodProductSection control={control} />
              </FormSection>
            )}

            <FormSection
              title={
                isFoodStore
                  ? "Pricing and Availability"
                  : "Variants and Inventory"
              }
              description={
                isFoodStore
                  ? "Maintain one clear pricing option with reliable stock visibility for customers."
                  : "Define each purchasable combination with the right pricing and stock."
              }
            >
              {variantsError ? (
                <p className="text-sm font-medium text-destructive">
                  {variantsError}
                </p>
              ) : null}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-5 rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/70"
                >
                  {!isFoodStore && fields.length > 1 ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : null}

                  {!isFoodStore ? (
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={control}
                        name={`variants.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Black"
                                className="focus-visible:ring-[var(--brand-blue)]"
                                onChange={(event) => {
                                  field.onChange(event);
                                  setValue(
                                    `variants.${index}.sku`,
                                    generateVariantSku(
                                      event.target.value,
                                      getValues(`variants.${index}.size`),
                                    ),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`variants.${index}.size`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Size</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="M / L / XL"
                                className="focus-visible:ring-[var(--brand-blue)]"
                                onChange={(event) => {
                                  field.onChange(event);
                                  setValue(
                                    `variants.${index}.sku`,
                                    generateVariantSku(
                                      getValues(`variants.${index}.color`),
                                      event.target.value,
                                    ),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : null}

                  <PriceConverter
                    onUSDChange={(usd) =>
                      setValue(`variants.${index}.priceUSD`, usd)
                    }
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      control={control}
                      name={`variants.${index}.priceUSD`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              className="focus-visible:ring-[var(--brand-blue)]"
                              onChange={(event) =>
                                field.onChange(Number(event.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`variants.${index}.stock`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isFoodStore ? "Available Portions" : "Stock"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              disabled={
                                isFoodStore &&
                                foodInventoryMode === "AVAILABILITY_ONLY"
                              }
                              placeholder={
                                isFoodStore &&
                                foodInventoryMode === "AVAILABILITY_ONLY"
                                  ? "Not required"
                                  : undefined
                              }
                              className="focus-visible:ring-[var(--brand-blue)]"
                              onChange={(event) =>
                                field.onChange(Number(event.target.value))
                              }
                            />
                          </FormControl>
                          {isFoodStore &&
                          foodInventoryMode === "AVAILABILITY_ONLY" ? (
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              Stock is skipped for availability-only food items.
                            </p>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      control={control}
                      name={`variants.${index}.oldPriceUSD`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Old Price (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              className="focus-visible:ring-[var(--brand-blue)]"
                              onChange={(event) => {
                                const oldPrice = clampNonNegativeUSD(
                                  Number(event.target.value || 0),
                                );
                                field.onChange(oldPrice);

                                const discount = normalizeDiscountPercent(
                                  Number(
                                    getValues(`variants.${index}.discount`) || 0,
                                  ),
                                );
                                const price = clampNonNegativeUSD(
                                  Number(
                                    getValues(`variants.${index}.priceUSD`) || 0,
                                  ),
                                );

                                if (oldPrice > 0 && discount > 0) {
                                  const nextPrice =
                                    oldPrice - (oldPrice * discount) / 100;
                                  setValue(
                                    `variants.${index}.priceUSD`,
                                    clampNonNegativeUSD(nextPrice),
                                  );
                                }

                                if (oldPrice > 0 && price > 0) {
                                  const nextDiscount =
                                    ((oldPrice - price) / oldPrice) * 100;
                                  setValue(
                                    `variants.${index}.discount`,
                                    normalizeDiscountPercent(nextDiscount),
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`variants.${index}.discount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount % (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              className="focus-visible:ring-[var(--brand-blue)]"
                              onChange={(event) => {
                                const discount = normalizeDiscountPercent(
                                  Number(event.target.value || 0),
                                );
                                field.onChange(discount);

                                const oldPrice = clampNonNegativeUSD(
                                  Number(
                                    getValues(`variants.${index}.oldPriceUSD`) ||
                                      0,
                                  ),
                                );

                                if (oldPrice > 0 && discount > 0) {
                                  const nextPrice =
                                    oldPrice - (oldPrice * discount) / 100;
                                  setValue(
                                    `variants.${index}.priceUSD`,
                                    clampNonNegativeUSD(nextPrice),
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={control}
                    name={`variants.${index}.sku`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input disabled {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              {!isFoodStore ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append(createEmptyVariant(false))}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variant
                </Button>
              ) : null}
            </FormSection>

            <FormSection
              title="Product Images"
              description="Crop, refine, and upload polished visuals for stronger marketplace presentation."
            >
              {imagesError ? (
                <p className="text-sm font-medium text-destructive">
                  {imagesError}
                </p>
              ) : null}
              <ProductImageUploader
                value={watchedImages ?? []}
                maxImages={10}
                aspect={1}
                disabled={isPending}
                storeType={storeType}
                onChange={(nextImages) =>
                  setValue("images", nextImages, { shouldValidate: true })
                }
                onDelete={deleteImage}
                onProcessingChange={(processing) => {
                  setUploading(processing);
                  setIsImageProcessing(processing);
                }}
              />
            </FormSection>

            <Button
              type="submit"
              disabled={isPending || isUploadingImages}
              className="w-full rounded-xl bg-[var(--brand-blue)] py-3 text-lg font-semibold text-white shadow-md hover:bg-[var(--brand-blue-hover)] disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating product...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
