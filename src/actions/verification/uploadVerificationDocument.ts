"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import {
  VerificationDocumentInput,
  verificationDocumentSchema,
} from "@/lib/zodValidation";

export async function uploadVerificationDocument(
  data: VerificationDocumentInput,
) {
  const userId = await CurrentUserId();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const parsed = verificationDocumentSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const { type, files } = parsed.data;

  try {
    const verification = await prisma.verification.findFirst({
      where: {
        userId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return { error: "Start verification first" };
    }

    await prisma.$transaction(
      files.map((file) =>
        prisma.verificationDocument.create({
          data: {
            userId,
            verificationId: verification.id,
            type,
            file,
          },
        }),
      ),
    );

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to upload document" };
  }
}
