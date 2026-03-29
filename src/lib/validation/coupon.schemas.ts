import z from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0),
  minOrderAmount: z.number().optional(),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().optional(),
  perUserLimit: z.number().optional(),
  appliesTo: z.enum(["ALL", "FIRST_ORDER", "NEW_USERS", "CATEGORY"]),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  isActive: z.boolean().optional(),
});

export type createCouponSchemaType = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = createCouponSchema.extend({
  id: z.string().min(1),
  isDeleted: z.boolean().optional(),
});

export type updateCouponSchemaType = z.infer<typeof updateCouponSchema>;
