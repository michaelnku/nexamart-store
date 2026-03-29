import z from "zod";
import { fileSchema } from "./shared.schemas";

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
