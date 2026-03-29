import { z } from "zod";

import type { JsonFile } from "@/lib/types";
import type {
  SiteConfigurationMutableInput,
  SiteSettingsFormValues,
} from "./siteConfig.types";

const trimmedString = z.string().trim();

const optionalTrimmedString = trimmedString.transform((value) => value || "");

const nullableOptionalString = optionalTrimmedString.transform((value) =>
  value.length > 0 ? value : null,
);
const phoneRegex = /^[+0-9()\-.\s]{7,20}$/;

const boundedOptionalString = (max: number, message: string) =>
  trimmedString.max(max, message).transform((value) => value || "");
const optionalUrlString = (message = "Enter a valid URL.") =>
  optionalTrimmedString.refine(
    (value) => value.length === 0 || z.string().url().safeParse(value).success,
    message,
  );
const optionalPhoneString = (message = "Enter a valid phone number.") =>
  optionalTrimmedString.refine(
    (value) => value.length === 0 || phoneRegex.test(value),
    message,
  );

export const siteLogoUploadSchema = z
  .object({
    url: z.string().trim().url("Logo URL must be a valid upload URL."),
    key: z
      .string()
      .trim()
      .min(1, "Logo asset key is required.")
      .max(255, "Logo asset key is too long."),
  })
  .strict();

export const siteSettingsFormSchema = z.object({
  siteName: trimmedString
    .min(2, "Site name is required.")
    .max(80, "Site name must be 80 characters or fewer."),
  siteEmail: trimmedString
    .email("Enter a valid site email address.")
    .max(120, "Site email must be 120 characters or fewer."),
  sitePhone: optionalPhoneString(),
  siteLogoUrl: optionalUrlString("Logo URL must be valid."),
  siteLogoKey: boundedOptionalString(
    255,
    "Logo storage key must be 255 characters or fewer.",
  ),
  supportEmail: boundedOptionalString(
    120,
    "Support email must be 120 characters or fewer.",
  ).refine(
    (value) => value.length === 0 || z.string().email().safeParse(value).success,
    "Enter a valid support email address.",
  ),
  supportPhone: optionalPhoneString("Enter a valid support phone number."),
  whatsappPhone: optionalPhoneString("Enter a valid WhatsApp phone number."),
  facebookUrl: optionalUrlString("Enter a valid Facebook URL."),
  instagramUrl: optionalUrlString("Enter a valid Instagram URL."),
  twitterUrl: optionalUrlString("Enter a valid Twitter/X URL."),
  youtubeUrl: optionalUrlString("Enter a valid YouTube URL."),
  tiktokUrl: optionalUrlString("Enter a valid TikTok URL."),
  seoTitle: boundedOptionalString(
    120,
    "SEO title must be 120 characters or fewer.",
  ),
  seoDescription: boundedOptionalString(
    320,
    "SEO description must be 320 characters or fewer.",
  ),
});

export const platformSettingsFormSchema = z
  .object({
    siteName: z.string().trim().min(1).max(80).optional(),
    siteEmail: z.string().trim().email().max(120).optional(),
    sitePhone: optionalPhoneString().transform((value) => value || null).optional(),
    supportEmail: boundedOptionalString(
      120,
      "Support email must be 120 characters or fewer.",
    )
      .refine(
        (value) =>
          value.length === 0 || z.string().email().safeParse(value).success,
        "Enter a valid support email address.",
      )
      .transform((value) => value || null)
      .optional(),
    supportPhone: optionalPhoneString("Enter a valid support phone number.")
      .transform((value) => value || null)
      .optional(),
    whatsappPhone: optionalPhoneString("Enter a valid WhatsApp phone number.")
      .transform((value) => value || null)
      .optional(),
    facebookUrl: optionalUrlString("Enter a valid Facebook URL.")
      .transform((value) => value || null)
      .optional(),
    instagramUrl: optionalUrlString("Enter a valid Instagram URL.")
      .transform((value) => value || null)
      .optional(),
    twitterUrl: optionalUrlString("Enter a valid Twitter/X URL.")
      .transform((value) => value || null)
      .optional(),
    youtubeUrl: optionalUrlString("Enter a valid YouTube URL.")
      .transform((value) => value || null)
      .optional(),
    tiktokUrl: optionalUrlString("Enter a valid TikTok URL.")
      .transform((value) => value || null)
      .optional(),
    seoTitle: boundedOptionalString(
      120,
      "SEO title must be 120 characters or fewer.",
    )
      .transform((value) => value || null)
      .optional(),
    seoDescription: boundedOptionalString(
      320,
      "SEO description must be 320 characters or fewer.",
    )
      .transform((value) => value || null)
      .optional(),
    siteLogoUrl: optionalTrimmedString.optional(),
    siteLogoKey: optionalTrimmedString.optional(),
    platformCommissionPercent: optionalTrimmedString
      .transform((value) => (value.length > 0 ? Number(value) : undefined))
      .refine(
        (value) => value === undefined || Number.isFinite(value),
        "Platform commission must be a valid number.",
      )
      .refine(
        (value) => value === undefined || value >= 0,
        "Platform commission must be zero or greater.",
      )
      .optional(),
  })
  .transform((value) => {
    const updates: SiteConfigurationMutableInput = {};

    if (value.siteName !== undefined) updates.siteName = value.siteName;
    if (value.siteEmail !== undefined) updates.siteEmail = value.siteEmail;
    if (value.sitePhone !== undefined) updates.sitePhone = value.sitePhone;
    if (value.supportEmail !== undefined) updates.supportEmail = value.supportEmail;
    if (value.supportPhone !== undefined) updates.supportPhone = value.supportPhone;
    if (value.whatsappPhone !== undefined) {
      updates.whatsappPhone = value.whatsappPhone;
    }
    if (value.facebookUrl !== undefined) updates.facebookUrl = value.facebookUrl;
    if (value.instagramUrl !== undefined) {
      updates.instagramUrl = value.instagramUrl;
    }
    if (value.twitterUrl !== undefined) updates.twitterUrl = value.twitterUrl;
    if (value.youtubeUrl !== undefined) updates.youtubeUrl = value.youtubeUrl;
    if (value.tiktokUrl !== undefined) updates.tiktokUrl = value.tiktokUrl;
    if (value.seoTitle !== undefined) updates.seoTitle = value.seoTitle;
    if (value.seoDescription !== undefined) {
      updates.seoDescription = value.seoDescription;
    }

    if (value.siteLogoUrl !== undefined || value.siteLogoKey !== undefined) {
      if (value.siteLogoUrl && value.siteLogoKey) {
        updates.siteLogo = siteLogoUploadSchema.parse({
          url: value.siteLogoUrl,
          key: value.siteLogoKey,
        });
      } else {
        updates.siteLogo = null;
      }
    }

    if (value.platformCommissionPercent !== undefined) {
      updates.platformCommissionRate = value.platformCommissionPercent;
    }

    return updates;
  });

const numericField = z
  .string()
  .trim()
  .transform((value) => Number(value))
  .refine((value) => Number.isFinite(value), { message: "Invalid number" })
  .refine((value) => value >= 0, {
    message: "Value must be greater than or equal to 0",
  });

export const shippingSettingsFormSchema = z.object({
  foodMinimumDeliveryFee: numericField,
  generalMinimumDeliveryFee: numericField,
  foodBaseDeliveryRate: numericField,
  foodRatePerMile: numericField,
  generalBaseDeliveryRate: numericField,
  generalRatePerMile: numericField,
  expressMultiplier: numericField.refine((value) => value >= 1, {
    message: "Express multiplier must be at least 1",
  }),
  pickupFee: numericField,
});

export function toSiteSettingsFormDefaults(input: {
  siteName?: string | null | undefined;
  siteEmail?: string | null | undefined;
  sitePhone?: string | null | undefined;
  siteLogo?: string | null | undefined;
  siteLogoKey?: string | null | undefined;
  supportEmail?: string | null | undefined;
  supportPhone?: string | null | undefined;
  whatsappPhone?: string | null | undefined;
  facebookUrl?: string | null | undefined;
  instagramUrl?: string | null | undefined;
  twitterUrl?: string | null | undefined;
  youtubeUrl?: string | null | undefined;
  tiktokUrl?: string | null | undefined;
  seoTitle?: string | null | undefined;
  seoDescription?: string | null | undefined;
}): SiteSettingsFormValues {
  return {
    siteName: input.siteName ?? "",
    siteEmail: input.siteEmail ?? "",
    sitePhone: input.sitePhone ?? "",
    siteLogoUrl: input.siteLogo ?? "",
    siteLogoKey: input.siteLogoKey ?? "",
    supportEmail: input.supportEmail ?? "",
    supportPhone: input.supportPhone ?? "",
    whatsappPhone: input.whatsappPhone ?? "",
    facebookUrl: input.facebookUrl ?? "",
    instagramUrl: input.instagramUrl ?? "",
    twitterUrl: input.twitterUrl ?? "",
    youtubeUrl: input.youtubeUrl ?? "",
    tiktokUrl: input.tiktokUrl ?? "",
    seoTitle: input.seoTitle ?? "",
    seoDescription: input.seoDescription ?? "",
  };
}

export function formValuesToSiteLogo(
  values: Pick<SiteSettingsFormValues, "siteLogoUrl" | "siteLogoKey">,
): JsonFile | null {
  if (!values.siteLogoUrl || !values.siteLogoKey) {
    return null;
  }

  return siteLogoUploadSchema.parse({
    url: values.siteLogoUrl,
    key: values.siteLogoKey,
  });
}
