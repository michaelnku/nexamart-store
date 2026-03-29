import z from "zod";
import {
  foodDetailsSchema,
  foodOptionGroupSchema,
  foodProductConfigSchema,
} from "./food.schemas";
import {
  productImageSchema,
  technicalDetailSchema,
} from "./shared.schemas";

export const productVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),

  priceUSD: z.number().min(1, "Price must be greater than 0"),

  stock: z.number().min(0, "Stock cannot be negative"),
  color: z.string().optional(),
  size: z.string().optional(),

  oldPriceUSD: z.number().optional(),
  discount: z.number().optional(),
});

const baseProductSchema = z.object({
  name: z
    .string()
    .min(3, "Product name is too short")
    .max(120, "Product name must be under 120 characters"),
  brand: z.string().optional(),
  description: z.string().min(1, "Description is required"),

  specifications: z.string().optional(),
  technicalDetails: z.array(technicalDetailSchema).optional(),

  categoryId: z.string().min(1, "Category is required"),

  oldPriceUSD: z.number().optional(),
  discount: z.number().optional(),

  images: z.array(productImageSchema).min(1, "At least one image is required"),

  variants: z
    .array(productVariantSchema)
    .min(1, "At least one variant is required"),
  isFoodProduct: z.boolean().optional(),
  foodDetails: foodDetailsSchema.nullable().optional(),
  foodConfig: foodProductConfigSchema.nullable().optional(),
  foodOptionGroups: z.array(foodOptionGroupSchema).default([]),
});

export const productSchema = baseProductSchema
  .refine((data) => !data.isFoodProduct || Boolean(data.foodDetails), {
    message: "foodDetails is required for FOOD products",
    path: ["foodDetails"],
  })
  .refine((data) => !data.isFoodProduct || data.variants.length === 1, {
    message: "FOOD products must have exactly one variant",
    path: ["variants"],
  })
  .refine((data) => data.isFoodProduct || data.foodDetails == null, {
    message: "foodDetails is only allowed for FOOD products",
    path: ["foodDetails"],
  })
  .refine((data) => !data.isFoodProduct || Boolean(data.foodConfig), {
    message: "foodConfig is required for FOOD products",
    path: ["foodConfig"],
  })
  .refine((data) => data.isFoodProduct || data.foodConfig == null, {
    message: "foodConfig is only allowed for FOOD products",
    path: ["foodConfig"],
  })
  .refine(
    (data) => data.isFoodProduct || (data.foodOptionGroups?.length ?? 0) === 0,
    {
      message: "Food option groups are only allowed for FOOD products",
      path: ["foodOptionGroups"],
    },
  )
  .superRefine((data, ctx) => {
    if (!data.isFoodProduct) {
      return;
    }

    const inventoryMode = data.foodConfig?.inventoryMode;
    if (inventoryMode === "STOCK_TRACKED") {
      const invalidStockIndex = data.variants.findIndex(
        (variant) => variant.stock < 0,
      );

      if (invalidStockIndex >= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", invalidStockIndex, "stock"],
          message: "Stock-tracked food items require a valid stock quantity.",
        });
      }
    }
  });

export type productSchemaType = z.infer<typeof productSchema>;

export const updateProductSchema = baseProductSchema
  .extend({
    variants: z
      .array(productVariantSchema)
      .min(1, "At least one variant is required"),
  })
  .refine((data) => !data.isFoodProduct || Boolean(data.foodDetails), {
    message: "foodDetails is required for FOOD products",
    path: ["foodDetails"],
  })
  .refine((data) => !data.isFoodProduct || data.variants.length === 1, {
    message: "FOOD products must have exactly one variant",
    path: ["variants"],
  })
  .refine((data) => data.isFoodProduct || data.foodDetails == null, {
    message: "foodDetails is only allowed for FOOD products",
    path: ["foodDetails"],
  })
  .refine((data) => !data.isFoodProduct || Boolean(data.foodConfig), {
    message: "foodConfig is required for FOOD products",
    path: ["foodConfig"],
  })
  .refine((data) => data.isFoodProduct || data.foodConfig == null, {
    message: "foodConfig is only allowed for FOOD products",
    path: ["foodConfig"],
  })
  .refine(
    (data) => data.isFoodProduct || (data.foodOptionGroups?.length ?? 0) === 0,
    {
      message: "Food option groups are only allowed for FOOD products",
      path: ["foodOptionGroups"],
    },
  )
  .superRefine((data, ctx) => {
    if (!data.isFoodProduct) {
      return;
    }

    if (data.foodConfig?.inventoryMode === "STOCK_TRACKED") {
      const invalidStockIndex = data.variants.findIndex(
        (variant) => variant.stock < 0,
      );

      if (invalidStockIndex >= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", invalidStockIndex, "stock"],
          message: "Stock-tracked food items require a valid stock quantity.",
        });
      }
    }
  });

export type updateProductSchemaType = z.infer<typeof updateProductSchema>;
