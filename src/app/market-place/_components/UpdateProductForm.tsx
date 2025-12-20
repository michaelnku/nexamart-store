"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  updateProductSchema,
  updateProductSchemaType,
} from "@/lib/zodValidation";

import { Category, FullProduct } from "@/lib/types";
import { updateProductAction } from "@/actions/auth/product";
import { UploadButton } from "@/utils/uploadthing";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Plus, Trash } from "lucide-react";
import Image from "next/image";
import { deleteProductImageAction } from "@/actions/actions";
import { PriceConverter } from "@/components/currency/PriceConverter";

type UpdateProductProps = {
  initialData: FullProduct;
  categories: Category[];
};

type TechnicalDetail = {
  key: string;
  value: string;
};

const UpdateProductForm = ({ initialData, categories }: UpdateProductProps) => {
  const router = useRouter();

  const topLevelCategories = categories.filter((c) => !c.parentId);
  const [level1, setLevel1] = useState<string | null>(initialData.categoryId);
  const [level2, setLevel2] = useState<string | null>(null);
  const [level3, setLevel3] = useState<string | null>(null);

  const childrenLevel1 = categories.filter((c) => c.parentId === level1);
  const childrenLevel2 = categories.filter((c) => c.parentId === level2);

  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);

  const [isPending, startTransition] = useTransition();

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  useEffect(() => {
    const leaf = categoryMap.get(initialData.categoryId);
    if (!leaf) return;

    const parent = leaf.parentId ? categoryMap.get(leaf.parentId) : null;

    const grandParent = parent?.parentId
      ? categoryMap.get(parent.parentId)
      : null;

    setLevel1(grandParent?.id ?? parent?.id ?? leaf.id);
    setLevel2(parent && grandParent ? parent.id : null);
    setLevel3(parent && grandParent ? leaf.id : null);
  }, [initialData.categoryId, categoryMap]);

  const generateSimpleSku = (name: string) => {
    const id = Math.floor(100000 + Math.random() * 900000);
    return `${name.slice(0, 3).toUpperCase()}-${id}`;
  };

  const generateVariantSku = (color?: string, size?: string) => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const c = (color || "NA").slice(0, 2).toUpperCase();
    const s = (size || "NA").slice(0, 2).toUpperCase();
    return `${c}-${s}-${rand}`;
  };

  const isKeyValueObject = (value: unknown): value is TechnicalDetail => {
    if (typeof value !== "object" || value === null) return false;

    return (
      "key" in value &&
      "value" in value &&
      typeof (value as Record<string, unknown>).key === "string" &&
      typeof (value as Record<string, unknown>).value === "string"
    );
  };

  const normalizeTechnicalDetails = (input: unknown): TechnicalDetail[] => {
    if (!input) return [];

    if (Array.isArray(input)) {
      return input.filter(isKeyValueObject);
    }

    if (isKeyValueObject(input)) {
      return [input];
    }

    return [];
  };

  const form = useForm<updateProductSchemaType>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: initialData.name,
      brand: initialData.brand ?? "",
      description: initialData.description,
      specifications: initialData.specifications.join("\n"),
      technicalDetails: normalizeTechnicalDetails(initialData.technicalDetails),
      categoryId: initialData.categoryId,
      images: initialData.images.map((img) => ({
        url: img.imageUrl,
        key: img.imageKey,
      })),
      variants: initialData.variants.map((v) => ({
        color: v.color ?? "",
        size: v.size ?? "",
        priceUSD: v.priceUSD,
        stock: v.stock,
        sku: v.sku,
        oldPriceUSD: v.oldPriceUSD ?? 0,
        discount: v.discount ?? 0,
      })),
    },
  });

  const { control, handleSubmit, setValue, getValues } = form;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const {
    fields: techFields,
    append: appendTech,
    remove: removeTech,
  } = useFieldArray({
    control: form.control,
    name: "technicalDetails",
  });

  useEffect(() => {
    const finalId = level3 || level2 || level1 || "";
    setValue("categoryId", finalId);
  }, [level1, level2, level3, setValue]);

  useEffect(() => {
    const name = getValues("name");
    const variants = getValues("variants");

    variants.forEach((v, index) => {
      if (v.sku) return;

      setValue(
        `variants.${index}.sku`,
        v.color || v.size
          ? generateVariantSku(v.color, v.size)
          : generateSimpleSku(name)
      );
    });
  }, [getValues, setValue]);

  const hasDuplicateSkus = (variants: { sku: string }[]) => {
    const skus = variants.map((v) => v.sku.trim());
    return new Set(skus).size !== skus.length;
  };

  const onSubmit = (values: updateProductSchemaType) => {
    const variants = values.variants;

    if (!variants || variants.length === 0) {
      toast.error("At least one variant is required");
      return;
    }

    if (hasDuplicateSkus(variants)) {
      toast.error(
        "Duplicate SKUs detected. Each variant must have a unique SKU."
      );
      return;
    }

    if (uploading) {
      toast.error("Wait for images to finish uploading");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateProductAction(initialData.id, values);
        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
          return;
        }

        toast.success("Product updated successfully");
        router.push("/market-place/dashboard/seller/products");
      } catch {
        toast.error("Something went wrong");
      }
    });
  };

  const deleteImage = async (key: string) => {
    if (deletingKeys.has(key)) return;

    setDeletingKeys((prev) => new Set(prev).add(key));

    try {
      await deleteProductImageAction(key);

      setValue(
        "images",
        getValues("images").filter((img) => img.key !== key)
      );

      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    } finally {
      setDeletingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const watchedImages = form.watch("images");

  return (
    <main className="flex justify-center p-4 md:p-8 lg:p-12 bg-gray-100 dark:bg-neutral-950 min-h-screen">
      <div className="w-full max-w-4xl border px-8 py-6 rounded-2xl shadow light:bg-white space-y-10">
        <h1 className="text-3xl font-bold text-center text-[var(--brand-blue)]">
          Update Product
        </h1>

        {error && (
          <Alert variant="destructive" className="border-red-500 text-red-600">
            <AlertCircle />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {/* GENERAL INFO */}
            <section className="space-y-5">
              <h2 className="font-semibold text-xl border-b pb-1">
                Product Information
              </h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <Input {...field} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand (optional)</FormLabel>
                    <Input {...field} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Detail</FormLabel>
                    <Textarea {...field} rows={3} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specifications (one per line)</FormLabel>
                    <Textarea
                      rows={4}
                      placeholder={`5000mAh battery
6.5-inch AMOLED display
Dual SIM`}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              {/* TECHNICAL DETAILS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Technical Details</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendTech({ key: "", value: "" })}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Detail
                  </Button>
                </div>

                {techFields.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr,3fr,auto] gap-3"
                  >
                    <FormField
                      control={form.control}
                      name={`technicalDetails.${index}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Label</FormLabel>
                          <Input
                            {...field}
                            placeholder="Processor / Material..."
                          />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`technicalDetails.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Value</FormLabel>
                          <Input
                            {...field}
                            placeholder="Snapdragon 720 / Stainless steel..."
                          />
                        </FormItem>
                      )}
                    />

                    <button
                      type="button"
                      onClick={() => removeTech(index)}
                      className="mt-5 text-red-500 hover:text-red-600"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* CATEGORY */}
              <FormField
                control={form.control}
                name="categoryId"
                render={() => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <div className="space-y-3">
                      {/* Level 1 */}
                      <select
                        className="border p-2 rounded-md w-full"
                        value={level1 || ""}
                        onChange={(e) => {
                          setLevel1(e.target.value);
                          setLevel2(null);
                          setLevel3(null);
                        }}
                      >
                        <option value="">Select Category</option>
                        {topLevelCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>

                      {/* Level 2 */}
                      {childrenLevel1.length > 0 && (
                        <select
                          className="border p-2 rounded-md w-full"
                          value={level2 || ""}
                          onChange={(e) => {
                            setLevel2(e.target.value);
                            setLevel3(null);
                          }}
                        >
                          <option value="">Select Subcategory</option>
                          {childrenLevel1.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Level 3 */}
                      {childrenLevel2.length > 0 && (
                        <select
                          className="border p-2 rounded-md w-full"
                          value={level3 || ""}
                          onChange={(e) => setLevel3(e.target.value)}
                        >
                          <option value="">Select Sub-Sub Category</option>
                          {childrenLevel2.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* VARIANTS */}
            <section className="space-y-6">
              <h2 className="font-semibold text-xl">Variants (Price in USD)</h2>
              {fields.map((_, index) => (
                <div key={index} className="border rounded-lg p-5 space-y-5">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500"
                    >
                      <Trash />
                    </button>
                  )}

                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      control={control}
                      name={`variants.${index}.color`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setValue(
                                  `variants.${index}.sku`,
                                  generateVariantSku(
                                    e.target.value,
                                    getValues(`variants.${index}.size`)
                                  )
                                );
                              }}
                            />
                          </FormControl>
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
                              onChange={(e) => {
                                field.onChange(e);
                                setValue(
                                  `variants.${index}.sku`,
                                  generateVariantSku(
                                    e.target.value,
                                    getValues(`variants.${index}.size`)
                                  )
                                );
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <PriceConverter
                      onUSDChange={(usd) =>
                        setValue(`variants.${index}.priceUSD`, usd)
                      }
                    />

                    <FormField
                      control={control}
                      name={`variants.${index}.priceUSD`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`variants.${index}.stock`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* OLD PRICE / DISCOUNT */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      control={control}
                      name={`variants.${index}.oldPriceUSD`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Old Price (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              className="focus-visible:ring-[var(--brand-blue)]"
                              type="number"
                              step={1}
                              {...field}
                              onChange={(e) => {
                                const old = Math.max(
                                  0,
                                  Math.round(Number(e.target.value || 0))
                                );
                                field.onChange(old);

                                const discount = Math.max(
                                  0,
                                  Math.round(
                                    Number(
                                      getValues(`variants.${index}.discount`) ||
                                        0
                                    )
                                  )
                                );

                                const price = Math.max(
                                  0,
                                  Math.round(
                                    Number(
                                      getValues(`variants.${index}.priceUSD`) ||
                                        0
                                    )
                                  )
                                );

                                if (old > 0 && discount > 0) {
                                  const newPrice = old - (old * discount) / 100;
                                  setValue(
                                    `variants.${index}.priceUSD`,
                                    Math.max(0, Math.round(newPrice))
                                  );
                                }

                                if (old > 0 && price > 0) {
                                  const newDiscount =
                                    ((old - price) / old) * 100;
                                  setValue(
                                    `variants.${index}.discount`,
                                    Math.max(0, Math.round(newDiscount))
                                  );
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`variants.${index}.discount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount % (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              className="focus-visible:ring-[var(--brand-blue)]"
                              type="number"
                              step={1}
                              {...field}
                              onChange={(e) => {
                                const discount = Math.max(
                                  0,
                                  Math.round(Number(e.target.value || 0))
                                );
                                field.onChange(discount);

                                const old = Math.max(
                                  0,
                                  Math.round(
                                    Number(
                                      getValues(
                                        `variants.${index}.oldPriceUSD`
                                      ) || 0
                                    )
                                  )
                                );

                                if (old > 0 && discount > 0) {
                                  const newPrice = old - (old * discount) / 100;
                                  setValue(
                                    `variants.${index}.priceUSD`,
                                    Math.max(0, Math.round(newPrice))
                                  );
                                }
                              }}
                            />
                          </FormControl>
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
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    color: "",
                    size: "",
                    priceUSD: 0,
                    stock: 0,
                    sku: "",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Variant
              </Button>
            </section>

            {/* IMAGES */}
            <section className="space-y-5">
              <h2 className="font-semibold text-xl">Product Images</h2>
              <UploadButton
                endpoint="productImages"
                onUploadBegin={() => setUploading(true)}
                onClientUploadComplete={(res) => {
                  setUploading(false);

                  const uploaded = res.map((f) => ({
                    url: f.url,
                    key: f.key,
                  }));

                  setValue("images", [
                    ...(getValues("images") ?? []),
                    ...uploaded,
                  ]);

                  toast.success("Images uploaded");
                }}
                className="ut-button:bg-[var(--brand-blue)] ut-button:text-white ut-button:rounded-lg"
              />

              {/* IMAGE PREVIEW */}
              <div className="flex flex-wrap gap-4">
                {watchedImages?.map((img) => {
                  const isDeleting = deletingKeys.has(img.key);

                  return (
                    <div
                      key={img.key}
                      className="relative w-40 h-40 rounded-lg overflow-hidden border"
                    >
                      <button
                        type="button"
                        onClick={() => deleteImage(img.key)}
                        disabled={isDeleting}
                        className="absolute top-2 right-2 z-10 bg-red-600 text-white p-1 rounded-full disabled:opacity-60"
                      >
                        {isDeleting ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          <Trash className="w-4 h-4" />
                        )}
                      </button>

                      <Image
                        src={img.url}
                        alt="product image"
                        fill
                        className={`object-cover transition ${
                          isDeleting ? "opacity-50" : ""
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SUBMIT */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full text-lg py-3 rounded-xl font-semibold
              bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white 
              shadow-md disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                "Update Product"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
};

export default UpdateProductForm;
