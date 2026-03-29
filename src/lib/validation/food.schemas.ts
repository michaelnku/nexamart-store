import z from "zod";

export const foodInventoryModes = [
  "STOCK_TRACKED",
  "AVAILABILITY_ONLY",
] as const;
export const foodItemTypes = [
  "PREPARED_MEAL",
  "PACKAGED_FOOD",
  "FRESH_DRINK",
  "BAKED_ITEM",
] as const;
export const foodOptionGroupTypes = ["SINGLE_SELECT", "MULTI_SELECT"] as const;
export const foodAvailableDays = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export const foodDetailsSchema = z
  .object({
    ingredients: z
      .array(z.string().min(1, "This field is required."))
      .min(1, "At least one ingredient is required"),

    preparationTimeMinutes: z
      .number()
      .min(1, "Preparation time must be at least 1 minute"),

    portionSize: z.string().min(1, "Portion size is required"),

    spiceLevel: z.enum(["MILD", "MEDIUM", "HOT"]).optional(),

    dietaryTags: z.array(z.string()).optional(),

    isPerishable: z.boolean().optional(),

    expiresAt: z.date().optional(),
  })
  .strict();

const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

export const foodProductConfigSchema = z
  .object({
    itemType: z.enum(foodItemTypes),
    inventoryMode: z.enum(foodInventoryModes),
    isAvailable: z.boolean(),
    isSoldOut: z.boolean(),
    preparationTimeMinutes: z.number().int().min(0).optional().nullable(),
    dailyOrderLimit: z.number().int().min(1).optional().nullable(),
    availableFrom: timeOfDaySchema.optional().nullable(),
    availableUntil: timeOfDaySchema.optional().nullable(),
    availableDays: z.array(z.enum(foodAvailableDays)).default([]),
    allowScheduledOrder: z.boolean(),
    allowSameDayPreorder: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.availableFrom && !data.availableUntil) ||
      (!data.availableFrom && data.availableUntil)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["availableFrom"],
        message: "Set both available-from and available-until times.",
      });
    }
  });

export const foodOptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Option name is required"),
  description: z.string().trim().optional().nullable(),
  priceDeltaUSD: z.number().min(0, "Price delta cannot be negative"),
  isDefault: z.boolean(),
  isAvailable: z.boolean(),
  stock: z.number().int().min(0).optional().nullable(),
  displayOrder: z.number().int().min(0),
});

export const foodOptionGroupSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Group name is required"),
    description: z.string().trim().optional().nullable(),
    type: z.enum(foodOptionGroupTypes),
    isRequired: z.boolean(),
    minSelections: z.number().int().min(0),
    maxSelections: z.number().int().min(1).optional().nullable(),
    displayOrder: z.number().int().min(0),
    isActive: z.boolean(),
    options: z.array(foodOptionSchema).min(1, "Add at least one option"),
  })
  .superRefine((data, ctx) => {
    if (data.maxSelections != null && data.maxSelections < data.minSelections) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxSelections"],
        message: "Maximum selections cannot be lower than minimum selections.",
      });
    }

    if (data.type === "SINGLE_SELECT") {
      if (data.minSelections > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minSelections"],
          message: "Single-select groups can require at most one selection.",
        });
      }

      if (data.maxSelections != null && data.maxSelections > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxSelections"],
          message: "Single-select groups can allow at most one selection.",
        });
      }
    }
  });
