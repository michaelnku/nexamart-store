import z from "zod";

const foodInventoryModes = ["STOCK_TRACKED", "AVAILABILITY_ONLY"] as const;
const foodItemTypes = [
  "PREPARED_MEAL",
  "PACKAGED_FOOD",
  "FRESH_DRINK",
  "BAKED_ITEM",
] as const;
const foodOptionGroupTypes = ["SINGLE_SELECT", "MULTI_SELECT"] as const;
const foodAvailableDays = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

//for images and files
export const fileSchema = z.object({
  url: z.string().url(),
  key: z.string(),
});

//register a user
export const registerSchema = z
  .object({
    name: z.string().min(4, {
      message: "Name must be at least 4 characters.",
    }),
    username: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),

    role: z.enum(["USER", "SELLER", "RIDER", "MODERATOR", "ADMIN"]),

    email: z.string().email({ message: "Invalid email address." }),
    referralCode: z
      .string()
      .trim()
      .max(32, { message: "Referral code is too long." })
      .optional(),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" })
      .regex(/^(?=.*[A-Z])(?=.*\d)/, {
        message:
          "Password must contain at least one uppercase letter and one number.",
      }),
    confirmPassword: z
      .string()
      .min(6, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type registerSchemaType = z.infer<typeof registerSchema>;

//login a user
export const loggedInUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, {
    message: "Password must be at least 4 characters.",
  }),
});

export type loggedInUserSchemaType = z.infer<typeof loggedInUserSchema>;

//update user schema
export const updateUserSchema = z.object({
  name: z
    .string({ message: "name must be a string." })
    .min(2, { message: "name must be at least 2 characters." })
    .optional(),

  profileAvatar: fileSchema.nullable().optional(),

  username: z
    .string({ message: "Username must be a string." })
    .min(2, { message: "Username must be at least 2 characters." })
    .optional(),

  userAddress: z.string({ message: "address must be valid." }).optional(),

  email: z
    .string({ message: "Email must be valid." })
    .email({ message: "Invalid email address." })
    .optional(),
});

export type updateUserSchemaType = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>;

// FOOD DETAILS SCHEMA
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

// Product Variant Schema
export const productVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),

  priceUSD: z.number().min(1, "Price must be greater than 0"),

  stock: z.number().min(0, "Stock cannot be negative"),
  color: z.string().optional(),
  size: z.string().optional(),

  oldPriceUSD: z.number().optional(),
  discount: z.number().optional(),
});

export const technicalDetailSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const productImageSchema = z.object({
  url: z.string().url(),
  key: z.string(),
});

// Product Schema
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

// Updating Product
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

//product category
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  parentId: z.string().optional().nullable(),
  iconImage: z.string().optional().nullable(),
  bannerImage: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export type CategorySchemaType = z.infer<typeof categorySchema>;

/**
 * CREATE STORE
 */
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

/**
 * UPDATE STORE
 */
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

const optionalTrimmedField = z
  .string()
  .trim()
  .max(64, "Must be at most 64 characters")
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .refine(
    (value) => value === undefined || value.length >= 2,
    "Must be at least 2 characters",
  );

export const riderProfileSchema = z.object({
  vehicleType: z
    .string()
    .trim()
    .min(2, "Vehicle type is required")
    .max(40, "Vehicle type must be at most 40 characters"),
  plateNumber: z
    .string()
    .trim()
    .min(2, "Plate number is required")
    .max(30, "Plate number must be at most 30 characters"),
  licenseNumber: optionalTrimmedField,
  vehicleColor: optionalTrimmedField,
  vehicleModel: optionalTrimmedField,
  isAvailable: z.boolean().default(false),
});

export type riderProfileSchemaType = z.infer<typeof riderProfileSchema>;

//address
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

//hero banner schema
export const heroBannerSchema = z
  .object({
    title: z.string().optional().nullable(),
    subtitle: z.string().optional().nullable(),
    ctaText: z.string().optional().nullable(),
    ctaLink: z.string().optional().nullable(),

    backgroundImage: fileSchema.nullable(),

    productImage: fileSchema.nullable(),

    lottieUrl: z.string().optional().nullable(),

    position: z.number().min(0),
    placement: z.enum(["HOMEPAGE", "CATEGORY", "FOOD", "GLOBAL"]),
    isActive: z.boolean(),
    startsAt: z.date().optional().nullable(),
    endsAt: z.date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return data.endsAt > data.startsAt;
      }
      return true;
    },
    { message: "End date must be after start date", path: ["endsAt"] },
  );

export type HeroBannerInput = z.output<typeof heroBannerSchema>;

// site configuration schema
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

// staff profile
export const createStaffProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length ? value : undefined)),
  department: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length ? value : undefined)),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
});

export const updateStaffProfileSchema = createStaffProfileSchema.extend({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
});

export type StaffProfileInput = z.infer<typeof createStaffProfileSchema>;
export type UpdateStaffProfileInput = z.infer<typeof updateStaffProfileSchema>;

// support form
export const supportFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email"),
  issueType: z.enum(["billing", "delivery", "product", "technical", "other"]),
  referenceId: z.string().optional(),
  message: z.string().min(10, "Please describe your issue"),
});

export type SupportFormValues = z.infer<typeof supportFormSchema>;

// verification
export const verificationDocumentSchema = z.object({
  type: z.enum([
    "NATIONAL_ID",
    "PASSPORT",
    "DRIVER_LICENSE",
    "BUSINESS_LICENSE",
    "VEHICLE_REGISTRATION",
  ]),

  files: z.array(fileSchema).min(1).max(6),
});

export type VerificationDocumentInput = z.infer<
  typeof verificationDocumentSchema
>;
