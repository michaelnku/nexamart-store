import z from "zod";
import { fileSchema } from "./shared.schemas";

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
