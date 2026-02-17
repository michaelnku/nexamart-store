import z from "zod";

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
export const foodDetailsSchema = z.object({
  ingredients: z
    .array(z.string().min(1))
    .min(1, "At least one ingredient is required"),

  preparationTimeMinutes: z
    .number()
    .min(1, "Preparation time must be at least 1 minute"),

  portionSize: z.string().min(1, "Portion size is required"),

  spiceLevel: z.enum(["MILD", "MEDIUM", "HOT"]).optional(),

  dietaryTags: z.array(z.string()).optional(),

  isPerishable: z.boolean().optional(),

  expiresAt: z.date().optional(),
}).strict();

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
  description: z.string().min(1),

  specifications: z.string().optional(),
  technicalDetails: z.array(technicalDetailSchema).optional(),

  categoryId: z.string().min(1),

  oldPriceUSD: z.number().optional(),
  discount: z.number().optional(),

  images: z.array(productImageSchema).min(1),

  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
  isFoodProduct: z.boolean().optional(),
  foodDetails: foodDetailsSchema.nullable().optional(),
});

export const productSchema = baseProductSchema
  .refine(
    (data) => !data.isFoodProduct || Boolean(data.foodDetails),
    {
      message: "foodDetails is required for FOOD products",
      path: ["foodDetails"],
    },
  )
  .refine(
    (data) => !data.isFoodProduct || data.variants.length === 1,
    {
      message: "FOOD products must have exactly one variant",
      path: ["variants"],
    },
  )
  .refine(
    (data) => data.isFoodProduct || data.foodDetails == null,
    {
      message: "foodDetails is only allowed for FOOD products",
      path: ["foodDetails"],
    },
  );

export type productSchemaType = z.infer<typeof productSchema>;

// Updating Product
export const updateProductSchema = baseProductSchema
  .extend({
    variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
  })
  .refine(
    (data) => !data.isFoodProduct || Boolean(data.foodDetails),
    {
      message: "foodDetails is required for FOOD products",
      path: ["foodDetails"],
    },
  )
  .refine(
    (data) => !data.isFoodProduct || data.variants.length === 1,
    {
      message: "FOOD products must have exactly one variant",
      path: ["variants"],
    },
  )
  .refine(
    (data) => data.isFoodProduct || data.foodDetails == null,
    {
      message: "foodDetails is only allowed for FOOD products",
      path: ["foodDetails"],
    },
  );

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

//create store
export const storeSchema = z.object({
  name: z.string().min(2, "Store name is required"),
  description: z.string().min(5, "Description is required"),

  location: z.string().min(2, "Business location is required"),

  address: z.string().optional(),

  logo: z.string().optional(),

  fulfillmentType: z.enum(["PHYSICAL", "DIGITAL", "HYBRID"]),

  type: z.enum(["GENERAL", "FOOD"]),
});

export type storeFormType = z.infer<typeof storeSchema>;

//update store
export const updateStoreSchema = storeSchema.extend({
  id: z.string(),

  logoKey: z.string().nullable().optional(),

  bannerImage: z.string().nullable().optional(),
  bannerKey: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),

  isActive: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
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
