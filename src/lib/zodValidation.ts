import z from "zod";

//register a user
export const registerSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    username: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
    email: z.string().email({ message: "Invalid email address." }),
    password: z
      .string()
      .min(6)
      .regex(/^(?=.*[A-Z])(?=.*\d)/, {
        message:
          "Password must contain at least one uppercase letter and one number.",
      }),
    confirmPassword: z
      .string()
      .min(4, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type registerSchemaType = z.infer<typeof registerSchema>;

//login a user
export const loggedInUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(4, {
    message: "Password must be at least 4 characters.",
  }),
});

export type loggedInUserSchemaType = z.infer<typeof loggedInUserSchema>;

//update user schema
export const updateUserSchema = z
  .object({
    name: z
      .string({ message: "name must be a string." })
      .min(2, { message: "name must be at least 2 characters." })
      .optional(),

    profileImage: z.string().optional(),

    username: z
      .string({ message: "Username must be a string." })
      .min(2, { message: "Username must be at least 2 characters." })
      .optional(),

    userAddress: z.string({ message: "address must be valid." }).optional(),

    email: z
      .string({ message: "Email must be valid." })
      .email({ message: "Invalid email address." })
      .optional(),

    password: z
      .string()
      .min(4, { message: "Password must be at least 4 characters." })
      .or(z.literal("")) // ← allow empty string
      .optional(),

    confirmPassword: z.string().or(z.literal("")).optional(),
  })
  .refine(
    (data) => {
      // If no password typed → skip validation
      if (!data.password || data.password.trim() === "") return true;

      // Password typed → confirmPassword must match
      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }
  );

export type updateUserSchemaType = z.infer<typeof updateUserSchema>;

// Product Variant Schema
export const productVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(1, "Price must be greater than 0"),
  stock: z.number().min(0, "Stock cannot be negative"),
  color: z.string().optional(),
  size: z.string().optional(),
  oldPrice: z.number().optional(),
  discount: z.number().optional(),
});

// Product Schema
export const productSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  description: z.string().min(1),
  specifications: z.string().optional(),
  technicalDetails: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional(),
  categoryId: z.string().min(1),
  currency: z.string().min(1),
  shippingFee: z.number().min(0),
  oldPrice: z.number().optional(),
  discount: z.number().optional(),
  nonVariantStock: z.number().optional(),

  images: z
    .array(
      z.object({
        url: z.string().url(),
        key: z.string(),
      })
    )
    .min(1),

  variants: z.array(productVariantSchema).optional(),
});

export type productSchemaType = z.infer<typeof productSchema>;

// Updating Product
export const updateProductSchema = productSchema.extend({
  variants: z.array(productVariantSchema).min(1, "Add at least one variant"),
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

//create store
export const storeSchema = z.object({
  name: z.string().min(2, "Store name is required."),
  location: z.string().min(2, "Business location is required."),
  address: z.string().min(2, "Business address is required."),
  description: z.string().min(5, "Description is required."),
  logo: z.string().optional(),
});

export type storeFormType = z.infer<typeof storeSchema>;

//update store
export const updateStoreSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),

  logo: z.string().nullable().optional(),
  logoKey: z.string().nullable().optional(),

  bannerImage: z.string().nullable().optional(),
  bannerKey: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),

  isActive: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
});

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
