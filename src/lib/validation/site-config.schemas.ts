import z from "zod";

const optionalNullableString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value && value.length > 0 ? value : null));

export const siteConfigurationSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required"),
  siteEmail: z.string().trim().email("Invalid site email address"),
  sitePhone: optionalNullableString,
  siteLogo: optionalNullableString,

  foodMinimumDeliveryFee: z.number().min(0),
  generalMinimumDeliveryFee: z.number().min(0),
  foodBaseDeliveryRate: z.number().min(0),
  foodRatePerMile: z.number().min(0),
  generalBaseDeliveryRate: z.number().min(0),
  generalRatePerMile: z.number().min(0),
  expressMultiplier: z.number().min(1),
  pickupFee: z.number().min(0),
});

export type siteConfigurationSchemaType = z.output<
  typeof siteConfigurationSchema
>;
export type siteConfigurationSchemaInput = z.input<
  typeof siteConfigurationSchema
>;
