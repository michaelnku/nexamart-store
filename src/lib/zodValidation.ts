import z from "zod";

export const registerSchema = z
  .object({
    username: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
    email: z.string().email({ message: "Invalid email address." }),

    role: z.enum(["USER", "SELLER", "RIDER", "ADMIN"]),

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

export const loggedInUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(4, {
    message: "Password must be at least 4 characters.",
  }),
});

export type loggedInUserSchemaType = z.infer<typeof loggedInUserSchema>;

//creating products
export const productSchema = z.object({
  name: z.string({ message: "product name is required." }),
  description: z.string({ message: "product description is required." }),
  images: z.array(z.string()),
  // categoryId: z.string({ message: "product category is required." }),
  price: z.number({ message: "product price is required." }),
  quantity: z.number({
    message: "specify the quantity of products available.",
  }),
});

export type productSchemaType = z.infer<typeof productSchema>;
