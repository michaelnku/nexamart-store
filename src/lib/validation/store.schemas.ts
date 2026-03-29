import z from "zod";

export const storeSchema = z
  .object({
    name: z.string().min(2, "Store name is required"),
    description: z.string().min(5, "Description is required"),

    location: z.string().min(2, "Business location is required"),

    address: z.string().optional(),

    logo: z.string().optional(),

    fulfillmentType: z.enum(["PHYSICAL", "DIGITAL", "HYBRID"]),

    type: z.enum(["GENERAL", "FOOD"]),
  })
  .superRefine((data, ctx) => {
    const requiresAddress =
      data.fulfillmentType === "PHYSICAL" || data.fulfillmentType === "HYBRID";

    if (requiresAddress) {
      if (!data.address || data.address.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message:
            "A valid pickup / warehouse address is required for physical stores.",
        });
      }
    }

    if (data.fulfillmentType === "DIGITAL") {
      if (data.address && data.address.trim().length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Digital stores must not have a physical address.",
        });
      }
    }
  });

export type storeFormType = z.infer<typeof storeSchema>;

export const updateStoreSchema = storeSchema
  .extend({
    id: z.string(),

    logoKey: z.string().nullable().optional(),

    bannerImage: z.string().nullable().optional(),
    bannerKey: z.string().nullable().optional(),
    tagline: z.string().nullable().optional(),

    isActive: z.boolean(),
    emailNotificationsEnabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const requiresAddress =
      data.fulfillmentType === "PHYSICAL" || data.fulfillmentType === "HYBRID";

    if (requiresAddress) {
      if (!data.address || data.address.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message:
            "A valid pickup / warehouse address is required for physical stores.",
        });
      }
    }

    if (data.fulfillmentType === "DIGITAL") {
      if (data.address && data.address.trim().length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Digital stores must not have a physical address.",
        });
      }
    }
  });

export type updateStoreFormType = z.infer<typeof updateStoreSchema>;
