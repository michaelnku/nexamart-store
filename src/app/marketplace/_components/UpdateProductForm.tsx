"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateProductAction } from "@/actions/auth/product";
import { deleteProductImageAction } from "@/actions/actions";
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
import { productSchema, type productSchemaType } from "@/lib/zodValidation";

import {
  createEmptyVariant,
  getCategoryLevels,
  getProductFormDefaults,
} from "./productFormHelpers";

type UpdateProductProps = {
  initialData: FullProduct;
  categories: Category[];
  storeType: "GENERAL" | "FOOD";
};

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

  const form = useForm<productSchemaType>({
    resolver: zodResolver(productSchema),
    defaultValues: getProductFormDefaults({
      isFoodStore,
      initialData,
    }) as productSchemaType,
  });

  const { control, handleSubmit, setValue, getValues, watch } = form;
  const childrenLevel1 = categories.filter(
    (category) => category.parentId === level1,
  );
  const childrenLevel2 = categories.filter(
    (category) => category.parentId === level2,
  );
  const watchedImages = watch("images");

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
      return;
    }

    setValue("foodDetails", undefined);
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

  const onSubmit = (values: productSchemaType) => {
    if (!values.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (!values.images.length) {
      toast.error("Upload at least one product image");
      return;
    }

    if (isUploadingImages) {
      toast.error("Wait for image uploads to finish");
      return;
    }

    const normalizedValues: productSchemaType = {
      ...values,
      isFoodProduct: isFoodStore,
      description: values.description.trim(),
      brand: values.brand?.trim() || "",
      foodDetails: isFoodStore ? values.foodDetails : undefined,
      technicalDetails: isFoodStore ? [] : (values.technicalDetails ?? []),
      specifications: isFoodStore ? "" : (values.specifications ?? "").trim(),
      variants: values.variants.map((variant) => ({
        ...variant,
        color: isFoodStore ? undefined : variant.color?.trim() || "",
        size: isFoodStore ? undefined : variant.size?.trim() || "",
        sku:
          variant.sku?.trim() ||
          (isFoodStore
            ? generateSimpleSku(values.name)
            : generateVariantSku(variant.color, variant.size)),
      })),
    };

    if (!normalizedValues.variants.length) {
      toast.error("At least one variant is required");
      return;
    }

    if (isFoodStore && normalizedValues.variants.length !== 1) {
      toast.error("Food products can only have one pricing option.");
      return;
    }

    if (hasDuplicateSkus(normalizedValues.variants)) {
      toast.error("Each variant must have a unique SKU.");
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
        getValues("images").filter((image) => image.key !== key),
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
    <main className="flex justify-center px-3 py-4 dark:bg-neutral-950">
      <div className="w-full max-w-5xl space-y-8 rounded-[28px] border bg-white p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] sm:p-6 lg:p-8 dark:bg-zinc-950">
        <div className="rounded-[24px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#0f766e_100%)] p-6 text-white">
          <h1 className="text-2xl font-semibold sm:text-3xl">Update Product</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-100/85 sm:text-base">
            {isFoodStore
              ? "Keep menu information complete and service-ready with description, prep time, ingredients, and stock."
              : "Maintain a polished product listing with accurate variants, specs, inventory, and images."}
          </p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : null}

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <section className="space-y-6 rounded-[24px] border p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Product Information</h2>

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
            </section>

            {!isFoodStore ? (
              <section className="space-y-6 rounded-[24px] border p-5 sm:p-6">
                <h2 className="text-lg font-semibold">
                  Specifications and Technical Details
                </h2>

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
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">Technical Details</h3>
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
                  </div>

                  {technicalFields.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[1.2fr_1.6fr_auto]"
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
              </section>
            ) : (
              <section className="space-y-4 rounded-[24px] border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-semibold">Food Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Keep menu information complete and restaurant-ready.
                  </p>
                </div>
                <FoodProductSection control={control} />
              </section>
            )}

            <section className="space-y-6 rounded-[24px] border p-5 sm:p-6">
              <h2 className="text-lg font-semibold">
                {isFoodStore
                  ? "Pricing and Availability"
                  : "Variants and Inventory"}
              </h2>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 rounded-[22px] border bg-slate-50/70 p-4"
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
                              onChange={(event) =>
                                field.onChange(Number(event.target.value))
                              }
                            />
                          </FormControl>
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
                              step={1}
                              {...field}
                              onChange={(event) =>
                                field.onChange(
                                  Math.max(
                                    0,
                                    Math.round(Number(event.target.value || 0)),
                                  ),
                                )
                              }
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
                              step={1}
                              {...field}
                              onChange={(event) =>
                                field.onChange(
                                  Math.max(
                                    0,
                                    Math.round(Number(event.target.value || 0)),
                                  ),
                                )
                              }
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
            </section>

            <section className="space-y-6 rounded-[24px] border p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Product Images</h2>

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
            </section>

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
          </form>
        </Form>
      </div>
    </main>
  );
}
