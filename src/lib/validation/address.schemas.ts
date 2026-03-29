import z from "zod";

export const addressLabelEnum = z.enum(["HOME", "OFFICE", "OTHER"]);

export const addressSchema = z.object({
  label: addressLabelEnum,

  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(6, "Phone number is required"),

  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),

  isDefault: z.boolean().optional(),
});

export type addressSchemaType = z.infer<typeof addressSchema>;
