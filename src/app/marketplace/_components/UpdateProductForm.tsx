"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteProductImageAction } from "@/actions/actions";
import { updateProductAction } from "@/actions/auth/product";
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
import type { Category, FullProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  updateProductSchema,
  type updateProductSchemaType,
} from "@/lib/zodValidation";

import {
  DEFAULT_FOOD_CONFIG,
  createEmptyVariant,
  getCategoryLevels,
  getProductFormDefaults,
} from "./productFormHelpers";
import {
  getProductFormSectionErrors,
  getProductFormValidationToastMessage,
  validateProductFormBeforeSubmit,
} from "./productFormValidation";
import {
  clampNonNegativeUSD,
  normalizeDiscountPercent,
} from "./productPricingFormUtils";

type UpdateProductProps = {
  initialData: FullProduct;
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

export default function UpdateProductForm({
  initialData,
  categories,
  storeType,
}: UpdateProductProps) {
  const router = useRouter();
  const isFoodStore = storeType === "FOOD";
  const topLevelCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories],
  );
  const initialLevels = useMemo(
    () => getCategoryLevels(categories, initialData.categoryId),
    [categories, initialData.categoryId],
  );

  const [level1, setLevel1] = useState<string | null>(initialLevels.level1);
  const [level2, setLevel2] = useState<string | null>(initialLevels.level2);
  const [level3, setLevel3] = useState<string | null>(initialLevels.level3);
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isUploadingImages = uploading || isImageProcessing;

  const form = useForm<any>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: getProductFormDefaults({
      isFoodStore,
      initialData,
    }),
  });

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    setError: setFieldError,
    clearErrors,
  } = form;
  const childrenLevel1 = categories.filter(
    (category) => category.parentId === level1,
  );
  const childrenLevel2 = categories.filter(
    (category) => category.parentId === level2,
  );
  const watchedImages = watch("images");
  const foodInventoryMode = watch("foodConfig.inventoryMode");
  const { categoryError, imagesError, variantsError } =
    getProductFormSectionErrors(form.formState.errors);

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

  useEffect(() => {
    setValue("categoryId", level3 || level2 || level1 || "");
  }, [level1, level2, level3, setValue]);

  useEffect(() => {
    setValue("isFoodProduct", isFoodStore);

    if (isFoodStore) {
      const currentVariant =
        getValues("variants")[0] ?? createEmptyVariant(true);
      replace([
        {
          ...currentVariant,
          color: undefined,
          size: undefined,
        },
      ]);
      if (!getValues("foodConfig")) {
        setValue("foodConfig", DEFAULT_FOOD_CONFIG);
      }
      if (!Array.isArray(getValues("foodOptionGroups"))) {
        setValue("foodOptionGroups", []);
      }
      return;
    }

    setValue("foodDetails", undefined);
    setValue("foodConfig", undefined);
    setValue("foodOptionGroups", []);
  }, [getValues, isFoodStore, replace, setValue]);

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

  const hasDuplicateSkus = (variants: { sku: string }[]) => {
    const skus = variants.map((variant) => variant.sku.trim());
    return new Set(skus).size !== skus.length;
  };

  const onSubmit = (values: updateProductSchemaType) => {
    const normalizedValues: updateProductSchemaType = {
      ...values,
      isFoodProduct: isFoodStore,
      description: values.description.trim(),
      brand: values.brand?.trim() || "",
      foodDetails: isFoodStore ? values.foodDetails : undefined,
      foodConfig: isFoodStore ? values.foodConfig : undefined,
      foodOptionGroups: isFoodStore ? values.foodOptionGroups ?? [] : [],
      technicalDetails: isFoodStore ? [] : (values.technicalDetails ?? []),
      specifications: isFoodStore ? "" : (values.specifications ?? "").trim(),
      variants: values.variants.map((variant) => ({
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

    const validationResult = validateProductFormBeforeSubmit({
      values: normalizedValues,
      isFoodStore,
      isUploadingImages,
      hasDuplicateSkus,
      setError: setFieldError,
      clearErrors,
    });

    if (validationResult.error) {
      toast.error(validationResult.error);
      return;
    }

    startTransition(async () => {
      try {
        const response = await updateProductAction(
          initialData.id,
          normalizedValues,
        );
        if (response?.error) {
          setError(response.error);
          toast.error(response.error);
          return;
        }

        toast.success("Product updated successfully");
        router.push("/marketplace/dashboard/seller/products");
      } catch {
        toast.error("Something went wrong while updating this product.");
      }
    });
  };

  const deleteImage = async (key: string) => {
    if (deletingKeys.has(key)) return;

    setDeletingKeys((previous) => new Set(previous).add(key));
    try {
      await deleteProductImageAction(key);
      setValue(
        "images",
        getValues("images").filter(
          (image: { key: string }) => image.key !== key,
        ),
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
    <main className="flex h-full min-h-0 justify-center overflow-hidden  px-3 py-4 ">
      <div className="flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/70  p-3 shadow-[0_30px_100px_-46px_rgba(15,23,42,0.35)] backdrop-blur sm:p-4 lg:p-5 dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="rounded-[28px] border border-white/15 bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_42%,#0f766e_100%)] px-5 py-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:px-6 sm:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-100/80">
                NexaMart Seller Workspace
              </p>
              <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
                Update Product
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-100/85 sm:text-base">
                {isFoodStore
                  ? "Keep menu information complete and service-ready with description, prep time, ingredients, pricing, and stock."
                  : "Maintain a polished listing with accurate variants, specifications, inventory, and presentation-ready product images."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur">
              Last saved product:{" "}
              <span className="font-semibold text-white">
                {initialData.name}
              </span>
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
              toast.error(getProductFormValidationToastMessage(errors));
            })}
            className="mt-4 min-h-0 flex-1 space-y-8 overflow-y-auto pr-1"
          >
            <FormSection
              title="Product Information"
              description="Keep the essentials clean and descriptive so buyers can quickly understand what they are purchasing."
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
                      <Input {...field} />
                    </FormControl>
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
                      <Input {...field} />
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
                      {isFoodStore ? "Menu Description" : "Product Description"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={isFoodStore ? 5 : 4}
                        placeholder={
                          isFoodStore
                            ? "Describe taste, portion, preparation style, and serving appeal."
                            : "Describe the product clearly."
                        }
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
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
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
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
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
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
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
                        <Textarea {...field} rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Technical Details
                  </h3>

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
                              <Input {...field} />
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
                              <Input {...field} />
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
                description="Keep menu information complete and restaurant-ready."
                className="border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:border-orange-900/40 dark:from-orange-950/20 dark:to-zinc-950/80"
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
                  : "Keep your variant options, pricing, discounts, and stock aligned."
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
                  className="space-y-4 rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70"
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={control}
                        name={`variants.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
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

                  <div className="grid gap-4 sm:grid-cols-2">
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

                  <div className="grid gap-4 sm:grid-cols-2">
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
              description="Review and refine each image before upload so your listing stays consistent across cards, search, and detail pages."
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

            <div className="sticky bottom-0 z-10 -mx-1 border-t border-slate-200/80 bg-white/95 px-1 pb-1 pt-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
              <Button
                type="submit"
                disabled={isPending || isUploadingImages}
                className="w-full rounded-xl bg-[var(--brand-blue)] py-3 text-lg font-semibold text-white shadow-md hover:bg-[var(--brand-blue-hover)] disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating product...
                  </>
                ) : (
                  "Update Product"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
