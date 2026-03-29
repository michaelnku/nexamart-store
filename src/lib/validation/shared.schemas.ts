import z from "zod";

export const fileSchema = z.object({
  url: z.string().url(),
  key: z.string(),
});

export const technicalDetailSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const productImageSchema = z.object({
  url: z.string().url(),
  key: z.string(),
});
