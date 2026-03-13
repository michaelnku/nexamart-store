import "server-only";

import { Prisma, PrismaClient } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { CreateAuditLogInput, type AuditMetadata } from "@/lib/audit/types";

type AuditDbClient = PrismaClient | Prisma.TransactionClient;

function sanitizeAuditMetadataValue(
  value: AuditMetadata | Date | undefined,
  depth = 0,
): Prisma.InputJsonValue | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (depth > 4) return "[max-depth]";

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return typeof value === "string" ? value.slice(0, 500) : value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeAuditMetadataValue(entry, depth + 1))
      .filter((entry) => entry !== undefined) as Prisma.InputJsonArray;
  }

  const next: Prisma.InputJsonObject = {};

  for (const [key, entry] of Object.entries(value)) {
    const sanitized = sanitizeAuditMetadataValue(entry, depth + 1);
    if (sanitized !== undefined) {
      next[key] = sanitized;
    }
  }

  return next;
}

function sanitizeAuditMetadataObject(
  value: Record<string, AuditMetadata>,
): Prisma.InputJsonObject {
  const next: Prisma.InputJsonObject = {};

  for (const [key, entry] of Object.entries(value)) {
    const sanitized = sanitizeAuditMetadataValue(entry);
    if (sanitized !== undefined) {
      next[key] = sanitized;
    }
  }

  return next;
}

export async function createAuditLog(
  input: CreateAuditLogInput,
  db: AuditDbClient = prisma,
) {
  const summary = input.summary.trim().slice(0, 255);

  if (!summary) {
    throw new Error("Audit log summary is required.");
  }

  const metadata = input.metadata
    ? sanitizeAuditMetadataObject(input.metadata)
    : undefined;

  return db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorRole: input.actorRole,
      actionType: input.actionType,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId ?? null,
      summary,
      metadata: metadata ?? undefined,
    },
  });
}
