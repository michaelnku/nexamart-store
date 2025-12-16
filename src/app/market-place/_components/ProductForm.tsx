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
  FormMessage,
  FormControl,
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

type ProductFormProps = {
  categories: Category[];
};

type PreviewImage = {
  id: string;
  url: string;
  key: string;
  deleting?: boolean;
};

const ProductForm = ({ categories }: ProductFormProps) => {
  const router = useRouter();

  const [level1, setLevel1] = useState<string | null>(null);
  const [level2, setLevel2] = useState<string | null>(null);
  const [level3, setLevel3] = useState<string | null>(null);

  const [images, setImages] = useState<PreviewImage[]>([]);

  const [error, setError] = useState<string | undefined>();

  const [hasVariants, setHasVariants] = useState(true);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [isPending, startTransition] = useTransition();

  const childrenLevel1 = categories.filter((c) => c.parentId === level1);
  const childrenLevel2 = categories.filter((c) => c.parentId === level2);

  const form = useForm<productSchemaType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      specifications: "",
      technicalDetails: [],
      brand: "",
      images: [],
      categoryId: "",
      currency: "USD",
      shippingFee: 0,
      oldPrice: 0,
      discount: 0,
      nonVariantStock: 0,
      variants: [
        {
          color: "",
          size: "",
          price: 0,
          stock: 0,
          sku: "",
          oldPrice: 0,
          discount: 0,
        },
      ],
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
    control,
    name: "technicalDetails",
  });

  const generateVariantSku = (color?: string, size?: string) => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const c = (color || "NA").slice(0, 2).toUpperCase();
    const s = (size || "NA").slice(0, 2).toUpperCase();
    return `${c}-${s}-${rand}`;
  };

  const generateSimpleSku = (name: string) => {
    const id = Math.floor(100000 + Math.random() * 900000);
    return `${name.slice(0, 3).toUpperCase()}-${id}`;
  };

  useEffect(() => {
    const finalId = level3 || level2 || level1 || "";
    setValue("categoryId", finalId);
  }, [level1, level2, level3, setValue]);

  const onSubmit = (values: productSchemaType) => {
    if (!hasVariants && values.variants?.length) {
      values.variants = [];
    }

    const round = (n: number | undefined | null) =>
      Math.max(0, Math.round(Number(n || 0)));

    values.oldPrice = values.oldPrice ? round(values.oldPrice) : undefined;
    values.discount = values.discount ? round(values.discount) : undefined;
    values.nonVariantStock = values.nonVariantStock
      ? round(values.nonVariantStock)
      : 0;

    if (!hasVariants) {
      const old = round(values.oldPrice ?? 0);
      const discount = round(values.discount ?? 0);
      const hasDiscount = old > 0 && discount > 0;

      const finalPrice = hasDiscount
        ? round(old - (old * discount) / 100)
        : old;

      const stock = round(values.nonVariantStock ?? 0);

      values.variants = [
        {
          color: "",
          size: "",
          price: finalPrice,
          oldPrice: old || undefined,
          discount: hasDiscount ? discount : undefined,
          stock,
          sku: generateSimpleSku(values.name),
        },
      ];
    }

    if (hasVariants) {
      values.variants = (values.variants ?? []).map((v) => {
        const old = round(v.oldPrice);
        const discount = round(v.discount);
        const priceInput = round(v.price);

        const hasDiscount = old > 0 && discount > 0;

        const finalPrice = hasDiscount
          ? round(old - (old * discount) / 100)
          : old || priceInput;

        return {
          ...v,
          price: finalPrice,
          oldPrice: old > 0 ? old : undefined,
          discount: hasDiscount ? discount : undefined,
          stock: round(v.stock),
        };
      });
    }

    if (uploading) {
      toast.error("Wait for images to finish uploading");
      return;
    }

    if (getValues("images").length === 0) {
      toast.error("Upload at least 1 product image");
      return;
    }

    startTransition(async () => {
      try {
        setError(undefined);
        const res = await createProductAction(values);

        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
          return;
        }

        toast.success("Product created successfully!");
        router.push("/market-place/dashboard/seller/products");
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Try again.");
        toast.error("Something went wrong. Try again.");
      }
    });
    console.log("product data uploaded:", values);
  };

  const deleteImage = async (id: string) => {
    setIsDeletingImage(true);
    try {
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, deleting: true } : img))
      );

      const image = images.find((img) => img.id === id);
      if (!image) return;

      await deleteFileAction(image.key);

      setImages((prev) => prev.filter((img) => img.id !== id));

      setValue(
        "images",
        getValues("images").filter((img) => img.key !== image.key)
      );

      toast.success("Image deleted");
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeletingImage(false);
    }
  };

  return (
    <main className="flex justify-center p-4 md:p-8 lg:p-12 bg-gray-100 dark:bg-neutral-950 min-h-screen">
      <div className="w-full max-w-4xl border px-8 py-4 rounded-2xl shadow space-y-10">
        <h1 className="text-3xl font-bold text-center text-[var(--brand-blue)]">
          New Product
        </h1>

        {error && (
          <Alert variant="destructive" className="border-red-500 text-red-600">
            <AlertCircle />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {/* 🟦 Product Info */}
            <section className="space-y-5">
              <h2 className="font-semibold text-xl text-[var(--brand-black)] border-b pb-2">
                Product Information
              </h2>

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
                        className="focus-visible:ring-[var(--brand-blue)]"
                      />
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

              {/* description */}
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Detail</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="product detail..."
                        {...field}
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

              {/* Category  */}
              <FormField
                control={control}
                name="categoryId"
                render={() => (
                  <div className="space-y-4">
                    {/* Level 1 */}
                    <select
                      className="border p-2 rounded-md w-full"
                      value={level1 || ""}
                      onChange={(e) => {
                        const value = e.target.value || null;
                        setLevel1(value);
                        setLevel2(null);
                        setLevel3(null);
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
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
                          const value = e.target.value || null;
                          setLevel2(value);
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
                        onChange={(e) => {
                          const value = e.target.value || null;
                          setLevel3(value);
                          setValue("categoryId", e.target.value);
                        }}
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
                )}
              />
            </section>

            {/* 🟨 Currency & Delivery */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="border p-2 rounded-md w-full focus-visible:ring-[var(--brand-blue)]"
                      >
                        <option value="USD">USD $ </option>
                        <option value="NGN">NGN ₦ </option>
                        <option value="EUR">EUR € </option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="shippingFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Fee</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={1}
                        {...field}
                        className="focus-visible:ring-[var(--brand-blue)]"
                        onChange={(e) =>
                          field.onChange(
                            Math.max(0, Math.round(Number(e.target.value || 0)))
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </section>

            {/* 🔻 Toggle Variants */}
            <div className="flex items-center gap-3 border p-4 rounded-lg bg-[var(--brand-blue-light)]">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={() => {
                  const next = !hasVariants;
                  setHasVariants(next);

                  if (!next) {
                    setValue("variants", []);
                  } else {
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
                }}
                className="w-4 h-4 accent-[var(--brand-blue)]"
              />

              <span className="font-medium text-[var(--brand-black)]">
                This product has variants (color, size, different price)
              </span>
            </div>

            {/* 🟥 Price — Non Variant Product */}
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

            {/* 🟩 Variants Section */}
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

                    {/* COLOR / SIZE */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={control}
                        name={`variants.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Black"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const size = getValues(
                                    `variants.${index}.size`
                                  );
                                  setValue(
                                    `variants.${index}.sku`,
                                    generateVariantSku(e.target.value, size)
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
                                placeholder="M / L / XL"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const color = getValues(
                                    `variants.${index}.color`
                                  );
                                  setValue(
                                    `variants.${index}.sku`,
                                    generateVariantSku(color, e.target.value)
                                  );
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* PRICE / STOCK */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={control}
                        name={`variants.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step={1}
                                {...field}
                                onChange={(e) => {
                                  const price = Math.max(
                                    0,
                                    Math.round(Number(e.target.value || 0))
                                  );
                                  field.onChange(price);

                                  const old = Math.max(
                                    0,
                                    Math.round(
                                      Number(
                                        getValues(
                                          `variants.${index}.oldPrice`
                                        ) || 0
                                      )
                                    )
                                  );

                                  if (old > 0 && price > 0) {
                                    const discount =
                                      ((old - price) / old) * 100;
                                    setValue(
                                      `variants.${index}.discount`,
                                      Math.max(0, Math.round(discount))
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
                        name={`variants.${index}.stock`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step={1}
                                {...field}
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
                    </div>

                    {/* OLD PRICE / DISCOUNT */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={control}
                        name={`variants.${index}.oldPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Old Price (Optional)</FormLabel>
                            <FormControl>
                              <Input
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
                                        getValues(
                                          `variants.${index}.discount`
                                        ) || 0
                                      )
                                    )
                                  );

                                  const price = Math.max(
                                    0,
                                    Math.round(
                                      Number(
                                        getValues(`variants.${index}.price`) ||
                                          0
                                      )
                                    )
                                  );

                                  if (old > 0 && discount > 0) {
                                    const newPrice =
                                      old - (old * discount) / 100;
                                    setValue(
                                      `variants.${index}.price`,
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
                                          `variants.${index}.oldPrice`
                                        ) || 0
                                      )
                                    )
                                  );

                                  if (old > 0 && discount > 0) {
                                    const newPrice =
                                      old - (old * discount) / 100;
                                    setValue(
                                      `variants.${index}.price`,
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

                    {/* SKU */}
                    <FormField
                      control={control}
                      name={`variants.${index}.sku`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU (Auto)</FormLabel>
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
                      price: 0,
                      stock: 0,
                      sku: "",
                      oldPrice: undefined,
                      discount: undefined,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Variant
                </Button>
              </section>
            )}

            {/* 🟦 IMAGES */}
            <section className="space-y-5">
              <h2 className="font-semibold text-xl">Product Images</h2>

              <UploadButton
                endpoint="productImages"
                onUploadBegin={() => setUploading(true)}
                onClientUploadComplete={(res) => {
                  setUploading(false);

                  const uploaded: PreviewImage[] = res.map((file) => ({
                    id: crypto.randomUUID(),
                    url: file.url,
                    key: file.key,
                  }));

                  setImages((prev) => [...prev, ...uploaded]);

                  setValue("images", [
                    ...getValues("images"),
                    ...uploaded.map(({ url, key }) => ({ url, key })),
                  ]);

                  toast.success("Images uploaded");
                }}
                className="ut-button:bg-[var(--brand-blue)] ut-button:text-white ut-button:rounded-lg"
              />

              <div className="flex flex-wrap gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-40 h-40 rounded-lg overflow-hidden border"
                  >
                    <button
                      type="button"
                      onClick={() => deleteImage(img.id)}
                      className="absolute top-2 right-2 z-10 bg-red-600 text-white p-1 rounded-full"
                      disabled={img.deleting}
                    >
                      {img.deleting ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <Trash className="w-4 h-4" />
                      )}
                    </button>

                    <Image
                      src={img.url}
                      alt="product image"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* SUBMIT */}
            <Button
              type="submit"
              disabled={isPending || uploading}
              className="w-full text-lg py-3 rounded-xl font-semibold
                bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white 
                shadow-md disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="animate-spin mr-2" />
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
