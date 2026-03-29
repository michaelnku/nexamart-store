import z from "zod";

export const supportFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email"),
  issueType: z.enum(["billing", "delivery", "product", "technical", "other"]),
  referenceId: z.string().optional(),
  message: z.string().min(10, "Please describe your issue"),
});

export type SupportFormValues = z.infer<typeof supportFormSchema>;
