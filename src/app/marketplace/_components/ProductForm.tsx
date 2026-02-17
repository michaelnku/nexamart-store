"use client";

import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Plus, Trash } from "lucide-react";

import { useRouter } from "next/navigation";
import { productSchema, productSchemaType } from "@/lib/zodValidation";
import { createProductAction } from "@/actions/auth/product";

import { UploadButton } from "@/utils/uploadthing";
import Image from "next/image";
import { toast } from "sonner";

import type { Category } from "@/lib/types";
import { deleteFileAction } from "@/actions/actions";
import { PriceConverter } from "@/components/currency/PriceConverter";

type ProductFormProps = {
  categories: Category[];
};

const ProductForm = ({ categories }: ProductFormProps) => {
  const router = useRouter();

  const [level1, setLevel1] = useState<string | null>(null);
  const [level2, setLevel2] = useState<string | null>(null);
  const [level3, setLevel3] = useState<string | null>(null);

  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const childrenLevel1 = categories.filter((c) => c.parentId === level1);
  const childrenLevel2 = categories.filter((c) => c.parentId === level2);

  const form = useForm<productSchemaType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      specifications: "",
      technicalDetails: [],
      categoryId: "",
      images: [],
      variants: [
        {
          color: "",
          size: "",
          priceUSD: 0,
          stock: 0,
          sku: "",
          oldPriceUSD: 0,
          discount: 0,
        },
      ],
    },
  });

  const { control, handleSubmit, setValue, getValues } = form;

  const generateVariantSku = (color?: string, size?: string) => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const c = (color || "NA").slice(0, 2).toUpperCase();
    const s = (size || "NA").slice(0, 2).toUpperCase();
    return `${c}-${s}-${rand}`;
  };

  const generateSimpleSku = (name: string) => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `${name.slice(0, 3).toUpperCase()}-${rand}`;
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const {
    fields: techFields,
    append: appendTech,
    remove: removeTech,
  } = useFieldArray({
    control,
    name: "technicalDetails",
  });

  useEffect(() => {
    const finalId = level3 || level2 || level1 || "";
    setValue("categoryId", finalId);
  }, [level1, level2, level3, setValue]);

  useEffect(() => {
    const variants = getValues("variants");
    const productName = getValues("name");

    variants?.forEach((v, index) => {
      if (!v.sku) {
        const hasOptions = Boolean(v.color || v.size);

        setValue(
          `variants.${index}.sku`,
          hasOptions
            ? generateVariantSku(v.color, v.size)
            : generateSimpleSku(productName),
        );
      }
    });
  }, [getValues, setValue]);

  const hasDuplicateSkus = (variants: { sku: string }[]) => {
    const skus = variants.map((v) => v.sku.trim());
    return new Set(skus).size !== skus.length;
  };

  const onSubmit = (values: productSchemaType) => {
    const variants = values.variants;
    if (!values.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (!variants || variants.length === 0) {
      toast.error("At least one variant is required");
      return;
    }

    if (hasDuplicateSkus(variants)) {
      toast.error(
        "Duplicate SKUs detected. Each variant must have a unique SKU.",
      );
      return;
    }

    if (uploading) {
      toast.error("Wait for images to finish uploading");
      return;
    }

    if (!values.images.length) {
      toast.error("Upload at least one product image");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createProductAction(values);
        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
          return;
        }

        toast.success("Product created successfully");
        router.push("/marketplace/dashboard/seller/products");
      } catch {
        toast.error("Something went wrong");
      }
    });
  };

  const deleteImage = async (key: string) => {
    if (deletingKeys.has(key)) return;

    setDeletingKeys((prev) => new Set(prev).add(key));

    try {
      await deleteFileAction(key);

      setValue(
        "images",
        getValues("images").filter((img) => img.key !== key),
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
    <main className="flex justify-center dark:bg-neutral-950">
      <div className="w-full max-w-4xl border px-8 py-4 rounded-2xl shadow space-y-10">
        <h1 className="text-3xl font-bold text-center text-[var(--brand-blue)]">
          New Product
        </h1>

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit, (errors) => {
              console.log("FORM ERRORS", errors);
              toast.error("Please fix the highlighted fields");
            })}
            className="space-y-12"
          >
            {/* PRODUCT INFO */}
            <section className="space-y-5">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Samsung TV 55 inch"
                        {...field}
                        maxLength={120}
                        className="focus-visible:ring-[var(--brand-blue)]"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-400 mt-1">
                      {field.value.length}/120 characters
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nike / LG / Generic / None"
                        {...field}
                        className="focus-visible:ring-[var(--brand-blue)]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        {...field}
                        placeholder="product detail..."
                        className="focus-visible:ring-[var(--brand-blue)]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Specifications (bullet style) */}
              <FormField
                control={control}
                name="specifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specifications (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={`5000mAh battery
6.5-inch AMOLED display
Snapdragon processor
Dual SIM`}
                        {...field}
                        className="focus-visible:ring-[var(--brand-blue)] whitespace-pre-wrap"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Technical details (key/value) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--brand-black)]">
                    Technical Details
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendTech({ key: "", value: "" })}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Detail
                  </Button>
                </div>

                {techFields.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No technical details added yet.
                  </p>
                )}

                <div className="space-y-3">
                  {techFields.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[2fr,3fr,auto] gap-3 items-center"
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
                                placeholder="Processor / Material / Model number..."
                                className="focus-visible:ring-[var(--brand-blue)]"
                              />
                            </FormControl>
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
                                placeholder="Snapdragon 720 / Stainless steel..."
                                className="focus-visible:ring-[var(--brand-blue)]"
                              />
                            </FormControl>
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
              </div>

              {/* CATEGORY */}
              <div className="space-y-4">
                <select
                  className="border p-2 rounded-md w-full"
                  value={level1 || ""}
                  onChange={(e) => {
                    setLevel1(e.target.value || null);
                    setLevel2(null);
                    setLevel3(null);
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {childrenLevel1.length > 0 && (
                  <select
                    className="border p-2 rounded-md w-full"
                    value={level2 || ""}
                    onChange={(e) => {
                      setLevel2(e.target.value || null);
                      setLevel3(null);
                    }}
                  >
                    <option value="">Select Subcategory</option>
                    {childrenLevel1.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {childrenLevel2.length > 0 && (
                  <select
                    className="border p-2 rounded-md w-full"
                    value={level3 || ""}
                    onChange={(e) => setLevel3(e.target.value || null)}
                  >
                    <option value="">Select Sub-Sub Category</option>
                    {childrenLevel2.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </section>

            {/* VARIANTS */}
            <section className="space-y-6">
              <h2 className="font-semibold text-xl">Variants Section</h2>
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
                              placeholder="Black"
                              className="focus-visible:ring-[var(--brand-blue)]"
                              onChange={(e) => {
                                field.onChange(e);
                                setValue(
                                  `variants.${index}.sku`,
                                  generateVariantSku(
                                    e.target.value,
                                    getValues(`variants.${index}.size`),
                                  ),
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
                              className="focus-visible:ring-[var(--brand-blue)]"
                              placeholder="M / L / XL"
                              onChange={(e) => {
                                field.onChange(e);
                                setValue(
                                  `variants.${index}.sku`,
                                  generateVariantSku(
                                    e.target.value,
                                    getValues(`variants.${index}.size`),
                                  ),
                                );
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <PriceConverter
                    onUSDChange={(usd) =>
                      setValue(`variants.${index}.priceUSD`, usd)
                    }
                  />

                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      control={control}
                      name={`variants.${index}.priceUSD`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="focus-visible:ring-[var(--brand-blue)]"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
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
                              className="focus-visible:ring-[var(--brand-blue)]"
                            />
                          </FormControl>
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
                                  Math.round(Number(e.target.value || 0)),
                                );
                                field.onChange(old);

                                const discount = Math.max(
                                  0,
                                  Math.round(
                                    Number(
                                      getValues(`variants.${index}.discount`) ||
                                        0,
                                    ),
                                  ),
                                );

                                const price = Math.max(
                                  0,
                                  Math.round(
                                    Number(
                                      getValues(`variants.${index}.priceUSD`) ||
                                        0,
                                    ),
                                  ),
                                );

                                if (old > 0 && discount > 0) {
                                  const newPrice = old - (old * discount) / 100;
                                  setValue(
                                    `variants.${index}.priceUSD`,
                                    Math.max(0, Math.round(newPrice)),
                                  );
                                }

                                if (old > 0 && price > 0) {
                                  const newDiscount =
                                    ((old - price) / old) * 100;
                                  setValue(
                                    `variants.${index}.discount`,
                                    Math.max(0, Math.round(newDiscount)),
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
                                  Math.round(Number(e.target.value || 0)),
                                );
                                field.onChange(discount);

                                const old = Math.max(
                                  0,
                                  Math.round(
                                    Number(
                                      getValues(
                                        `variants.${index}.oldPriceUSD`,
                                      ) || 0,
                                    ),
                                  ),
                                );

                                if (old > 0 && discount > 0) {
                                  const newPrice = old - (old * discount) / 100;
                                  setValue(
                                    `variants.${index}.priceUSD`,
                                    Math.max(0, Math.round(newPrice)),
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
                className="
 ut-button:bg-[var(--brand-blue)]
    ut-button:text-white
    ut-button:border
    ut-button:border-blue-500/30
    ut-button:rounded-full
    ut-button:px-6
    ut-button:py-2
    ut-button:text-sm
    hover:ut-button:bg-blue-500/20
  "
              />

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

            <Button
              type="submit"
              disabled={isPending || uploading}
              className="w-full text-lg py-3 rounded-xl font-semibold
                bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white 
                shadow-md disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create Product"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
};

export default ProductForm;
