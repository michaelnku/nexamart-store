import z from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  parentId: z.string().optional().nullable(),
  iconImage: z.string().optional().nullable(),
  bannerImage: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export type CategorySchemaType = z.infer<typeof categorySchema>;
