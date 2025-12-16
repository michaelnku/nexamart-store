"use client";

import React from "react";
import { useEffect, useState, useTransition } from "react";
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

type UpdateProductProps = {
  initialData: FullProduct;
  categories: Category[];
};

const UpdateProductForm = ({ initialData, categories }: UpdateProductProps) => {
  const router = useRouter();

  const topLevelCategories = categories.filter((c) => !c.parentId);
  const [level1, setLevel1] = useState<string | null>(initialData.categoryId);
  const [level2, setLevel2] = useState<string | null>(null);
  const [level3, setLevel3] = useState<string | null>(null);

  const childrenLevel1 = categories.filter((c) => c.parentId === level1);
  const childrenLevel2 = categories.filter((c) => c.parentId === level2);

  const [error, setError] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>(() =>
    initialData.images.map((img) => img.imageUrl)
  );

  const initialHasVariants =
    initialData.variants.length > 1 ||
    initialData.variants.some((v) => v.color || v.size);

  const [hasVariants, setHasVariants] = useState<boolean>(initialHasVariants);
  const [isPending, startTransition] = useTransition();

  const generateSimpleSku = (name: string) => {
    const id = Math.floor(100000 + Math.random() * 900000);
    return `${name.slice(0, 3).toUpperCase()}-${id}`;
  };

  const form = useForm<updateProductSchemaType>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: initialData.name,
      brand: initialData.brand ?? "",
      description: initialData.description,
      nonVariantStock: initialData.nonVariantStock ?? 0,
      specifications: Array.isArray(initialData.specifications)
        ? initialData.specifications.join("\n")
        : initialData.specifications ?? "",

      technicalDetails: Array.isArray(initialData.technicalDetails)
        ? initialData.technicalDetails.map((item: any) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "key" in item &&
              "value" in item
            ) {
              return {
                key: String(item.key ?? ""),
                value: String(item.value ?? ""),
              };
            }
            if (typeof item === "string" && item.includes(":")) {
              const [key, value] = item.split(":");
              return { key: key.trim(), value: value.trim() };
            }
            return { key: "", value: "" };
          })
        : typeof initialData.technicalDetails === "object" &&
          initialData.technicalDetails !== null
        ? [
            {
              key: String((initialData.technicalDetails as any).key ?? ""),
              value: String((initialData.technicalDetails as any).value ?? ""),
            },
          ]
        : [],

      categoryId: initialData.categoryId,
      currency: (initialData as any).currency ?? "USD",
      shippingFee: (initialData as any).shippingFee ?? 0,
      oldPrice: initialData.oldPrice ?? 0,
      discount: initialData.discount ?? 0,
      images: initialData.images.map((img) => ({
        url: img.imageUrl,
        key: img.imageKey,
      })),
      variants:
        initialData.variants.length > 0
          ? initialData.variants.map((v) => ({
              color: v.color || "",
              size: v.size || "",
              price: v.price,
              stock: v.stock,
              sku: v.sku,
              oldPrice: v.oldPrice ?? 0,
              discount: v.discount ?? 0,
            }))
          : [
              {
                color: "",
                size: "",
                price: 0,
                stock: initialData.nonVariantStock ?? 0,
                sku: generateSimpleSku(initialData.name),
                oldPrice: initialData.oldPrice ?? 0,
                discount: initialData.discount ?? 0,
              },
            ],
    },
  });

  const { control, setValue, getValues } = form;

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

  const generateVariantSku = (color?: string, size?: string) => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const c = (color || "NA").slice(0, 2).toUpperCase();
    const s = (size || "NA").slice(0, 2).toUpperCase();
    return `${c}-${s}-${rand}`;
  };

  const deleteImage = (index: number) => {
    const current = form.getValues("images");
    form.setValue(
      "images",
      current.filter((_, i) => i !== index)
    );
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const onSubmit = (values: updateProductSchemaType) => {
    values.images = form.getValues("images");

    if (!hasVariants) {
      const old = values.oldPrice ?? 0;
      const discount = values.discount ?? 0;

      const rawPrice =
        old > 0 && discount > 0 ? old - (old * discount) / 100 : old;

      const finalPrice = Math.round(rawPrice * 100) / 100;

      const existingVariant = values.variants?.[0];

      values.variants = [
        {
          color: "",
          size: "",
          price: finalPrice,
          stock: existingVariant?.stock ?? 0,
          sku: existingVariant?.sku || generateSimpleSku(values.name),
          oldPrice: old,
          discount,
        },
      ];
    }

    if (hasVariants) {
      values.variants = (values.variants ?? []).map((v) => {
        const old = v.oldPrice ?? 0;
        const discount = v.discount ?? 0;
        const manualPrice = v.price ?? 0;

        const rawPrice =
          old > 0 && discount > 0
            ? old - (old * discount) / 100
            : old || manualPrice;

        const finalPrice = Math.round(rawPrice * 100) / 100;

        return {
          ...v,
          price: finalPrice,
          oldPrice: old,
          discount,
        };
      });
    }

    startTransition(async () => {
      try {
        setError(undefined);
        const res = await updateProductAction(initialData.id, values);

        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
          return;
        }

        toast.success("Product updated successfully!");
        router.push("/market-place/dashboard/seller/products");
      } catch {
        setError("Something went wrong.");
        toast.error("Something went wrong. Try again.");
      }
    });
  };

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
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

            {/* VARIANT TOGGLE */}
            <div className="flex items-center gap-3 border p-4 rounded-lg bg-[var(--brand-blue-light)]">
              <input
                checked={hasVariants}
                type="checkbox"
                onChange={() => {
                  const next = !hasVariants;
                  setHasVariants(next);
                  if (!next) {
                    setValue("variants", [
                      {
                        color: "",
                        size: "",
                        price: 0,
                        stock: 0,
                        sku: "",
                        oldPrice: 0,
                        discount: 0,
                      },
                    ]);
                  } else {
                    if (
                      !getValues("variants") ||
                      getValues("variants").length === 0
                    ) {
                      setValue("variants", [
                        {
                          color: "",
                          size: "",
                          price: 0,
                          stock: 0,
                          sku: "",
                          oldPrice: undefined,
                          discount: undefined,
                        },
                      ]);
                    }
                  }
                }}
                className="w-4 h-4 accent-[var(--brand-blue)]"
              />
              <span className="font-medium">
                This product has variants (color, size, different price)
              </span>
            </div>

            {/* 🟥 Price — Non Variant Product update product form */}
            {!hasVariants && (
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={control}
                  name="oldPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={1}
                          {...field}
                          value={field.value ?? ""}
                          className="focus-visible:ring-[var(--brand-blue)]"
                          onChange={(e) =>
                            field.onChange(
                              Math.max(
                                0,
                                Math.round(Number(e.target.value || 0))
                              )
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount % (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={1}
                          {...field}
                          value={field.value ?? ""}
                          className="focus-visible:ring-[var(--brand-blue)]"
                          onChange={(e) =>
                            field.onChange(
                              Math.max(
                                0,
                                Math.round(Number(e.target.value || 0))
                              )
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="nonVariantStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={1}
                          {...field}
                          value={field.value ?? ""}
                          className="focus-visible:ring-[var(--brand-blue)]"
                          onChange={(e) =>
                            field.onChange(
                              Math.max(
                                0,
                                Math.round(Number(e.target.value || 0))
                              )
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </section>
            )}

            {/* VARIANTS SECTION */}
            {hasVariants && (
              <section className="space-y-6">
                <h2 className="font-semibold text-xl">Variants</h2>

                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-5 grid gap-5 relative"
                  >
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-3 right-3 text-red-500"
                      >
                        <Trash />
                      </button>
                    )}

                    {/* COLOR & SIZE */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                const size = form.getValues(
                                  `variants.${index}.size`
                                );
                                const currentSku = form.getValues(
                                  `variants.${index}.sku`
                                );
                                if (!currentSku)
                                  form.setValue(
                                    `variants.${index}.sku`,
                                    generateVariantSku(e.target.value, size)
                                  );
                              }}
                            />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`variants.${index}.size`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Size</FormLabel>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                const color = form.getValues(
                                  `variants.${index}.color`
                                );
                                const currentSku = form.getValues(
                                  `variants.${index}.sku`
                                );
                                if (!currentSku)
                                  form.setValue(
                                    `variants.${index}.sku`,
                                    generateVariantSku(color, e.target.value)
                                  );
                              }}
                            />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* PRICE & STOCK */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const price = Number(e.target.value);
                                field.onChange(price);

                                const old = Number(
                                  form.getValues(`variants.${index}.oldPrice`)
                                );
                                if (old > 0 && price > 0) {
                                  const discount = ((old - price) / old) * 100;
                                  form.setValue(
                                    `variants.${index}.discount`,
                                    Math.max(0, Math.round(discount))
                                  );
                                }
                              }}
                            />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`variants.${index}.stock`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock</FormLabel>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* OLD PRICE & DISCOUNT */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.oldPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Old Price</FormLabel>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const old = Number(e.target.value);
                                field.onChange(old);
                                const price = form.getValues(
                                  `variants.${index}.price`
                                );
                                if (old > 0 && price > 0) {
                                  const discount = ((old - price) / old) * 100;
                                  form.setValue(
                                    `variants.${index}.discount`,
                                    Math.max(0, Math.round(discount))
                                  );
                                }
                              }}
                            />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`variants.${index}.discount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount %</FormLabel>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const discount = Number(e.target.value);
                                field.onChange(discount);

                                const old = Number(
                                  form.getValues(`variants.${index}.oldPrice`)
                                );
                                if (old > 0 && discount > 0) {
                                  const newPrice = old - (old * discount) / 100;
                                  form.setValue(
                                    `variants.${index}.price`,
                                    Math.max(0, Math.round(newPrice))
                                  );
                                }
                              }}
                            />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* SKU */}
                    <FormField
                      control={form.control}
                      name={`variants.${index}.sku`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <Input {...field} />
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
                      price: 0,
                      stock: 0,
                      sku: "",
                      oldPrice: 0,
                      discount: 0,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Variant
                </Button>
              </section>
            )}

            {/* IMAGES */}
            <section className="space-y-5">
              <h2 className="font-semibold text-xl">Product Images</h2>

              <UploadButton
                endpoint="productImages"
                onUploadBegin={() => setUploading(true)}
                onClientUploadComplete={(res) => {
                  setUploading(false);
                  const uploaded = res.map((img) => ({
                    url: img.url,
                    key: img.key,
                  }));
                  const images = [...form.getValues("images"), ...uploaded];
                  form.setValue("images", images);
                  setPreviewImages(images.map((i) => i.url));
                  toast.success("Images uploaded");
                }}
                className="ut-button:bg-[var(--brand-blue)] ut-button:text-white ut-button:rounded-lg"
              />

              <div className="flex flex-wrap gap-4">
                {previewImages.map((url, index) => (
                  <div
                    key={index}
                    className="relative w-40 h-40 rounded-lg overflow-hidden border"
                  >
                    <button
                      type="button"
                      onClick={() => deleteImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
                    >
                      <Trash />
                    </button>
                    <Image src={url} alt="img" fill className="object-cover" />
                  </div>
                ))}
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
