"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import {
  VerificationDocumentInput,
  verificationDocumentSchema,
} from "@/lib/zodValidation";

import { rateLimit } from "@/lib/security/rateLimit";
import { createImageFingerprint } from "@/lib/security/createImageFingerprint";
import { fetchImageBuffer } from "@/lib/verification/fetchImageBuffer";
import { validateDocumentAI } from "@/lib/verification/validateDocumentAI";
import { handleVerificationFraud } from "@/lib/verification/handleVerificationFraud";
import { pusherServer } from "@/lib/pusher";

export async function uploadVerificationDocument(
  data: VerificationDocumentInput,
) {
  const userId = await CurrentUserId();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const allowed = rateLimit(`verification-upload-${userId}`, 5, 60_000);

  if (!allowed) {
    return {
      error: "Too many upload attempts. Please wait a moment and try again.",
    };
  }

  const parsed = verificationDocumentSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const { type, files } = parsed.data;

  try {
    /**
     * STEP 1 — Download images ONCE
     */
    const buffers = await Promise.all(
      files.map((file) => fetchImageBuffer(file.url)),
    );

    /**
     * STEP 2 — Create fingerprints
     */
    const fingerprints = buffers.map((buffer) =>
      createImageFingerprint(buffer),
    );

    /**
     * STEP 3 — Duplicate check
     */
    const existing = await prisma.verificationDocument.findFirst({
      where: {
        fingerprint: { in: fingerprints },
      },
      select: {
        userId: true,
      },
    });

    if (existing && existing.userId !== userId) {
      const fraud = await handleVerificationFraud(userId);

      if (fraud?.banned) {
        return {
          error:
            "Your account has been suspended due to repeated fraudulent verification attempts.",
        };
      }

      return {
        error: `This document has already been used on another account. Attempt ${fraud?.attempts}/3.`,
      };
    }

    /**
     * STEP 4 — AI validation
     */
    const aiResults = await Promise.all(
      files.map((file) => validateDocumentAI(file.url)),
    );

    for (const result of aiResults) {
      if (!result.valid) {
        return {
          error: result.reason ?? "Invalid document upload",
        };
      }

      if (result.detectedType !== type) {
        return {
          error: `Uploaded document appears to be ${result.detectedType}. Please select the correct document type.`,
        };
      }
    }

    /**
     * STEP 5 — Save documents
     */
    await prisma.$transaction(
      files.map((file, index) =>
        prisma.verificationDocument.create({
          data: {
            userId,
            type,
            file,
            fingerprint: fingerprints[index],
          },
        }),
      ),
    );

    await pusherServer.trigger(
      `user-${userId}`,
      "verification-documents-updated",
      {},
    );

    return { success: true };
  } catch (error) {
    console.error("Verification upload error:", error);

    return { error: "Failed to upload document" };
  }
}
