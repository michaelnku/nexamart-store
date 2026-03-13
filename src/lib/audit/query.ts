import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  AUDIT_ACTION_TYPES,
  AUDIT_ENTITY_TYPES,
  type AuditActionType,
  type AuditEntityType,
  type AuditLogListItem,
  type AuditMetadata,
} from "@/lib/audit/types";

export const ADMIN_AUDIT_LOGS_PAGE_SIZE = 20;

const auditLogsSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  query: z.string().trim().max(120).default(""),
  actor: z.string().trim().max(120).default(""),
  actionType: z.enum(AUDIT_ACTION_TYPES).optional(),
  entityType: z.enum(AUDIT_ENTITY_TYPES).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseDateBoundary(value: string | undefined, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeMetadata(
  metadata: Prisma.JsonValue | null,
): Record<string, AuditMetadata> | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  return metadata as Record<string, AuditMetadata>;
}

function mapAuditLog(
  log: Prisma.AuditLogGetPayload<{
    select: {
      id: true;
      createdAt: true;
      actionType: true;
      targetEntityType: true;
      targetEntityId: true;
      summary: true;
      metadata: true;
      actorRole: true;
      actor: {
        select: {
          id: true;
          name: true;
          email: true;
        };
      };
    };
  }>,
): AuditLogListItem {
  return {
    id: log.id,
    createdAt: log.createdAt.toISOString(),
    actor: {
      id: log.actor?.id ?? null,
      role: log.actorRole,
      name: log.actor?.name ?? null,
      email: log.actor?.email ?? null,
    },
    actionType: log.actionType as AuditActionType,
    targetEntityType: log.targetEntityType as AuditEntityType,
    targetEntityId: log.targetEntityId,
    summary: log.summary,
    metadata: normalizeMetadata(log.metadata),
  };
}

export function parseAdminAuditLogsSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
) {
  const parsed = auditLogsSearchParamsSchema.safeParse({
    page: firstValue(searchParams?.page),
    query: firstValue(searchParams?.query ?? searchParams?.q),
    actor: firstValue(searchParams?.actor),
    actionType: firstValue(searchParams?.actionType) || undefined,
    entityType: firstValue(searchParams?.entityType) || undefined,
    from: firstValue(searchParams?.from) || undefined,
    to: firstValue(searchParams?.to) || undefined,
  });

  if (!parsed.success) {
    return {
      page: 1,
      query: "",
      actor: "",
      actionType: undefined,
      entityType: undefined,
      from: undefined,
      to: undefined,
    };
  }

  return parsed.data;
}

export async function getAdminAuditLogs(input: {
  page?: number;
  query?: string;
  actor?: string;
  actionType?: AuditActionType;
  entityType?: AuditEntityType;
  from?: string;
  to?: string;
}) {
  const page = Math.max(1, input.page ?? 1);
  const query = input.query?.trim() ?? "";
  const actor = input.actor?.trim() ?? "";
  const from = parseDateBoundary(input.from);
  const to = parseDateBoundary(input.to, true);

  const where: Prisma.AuditLogWhereInput = {
    ...(query
      ? {
          OR: [
            { summary: { contains: query, mode: "insensitive" } },
            { targetEntityId: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(actor
      ? {
          actor: {
            is: {
              OR: [
                { name: { contains: actor, mode: "insensitive" } },
                { email: { contains: actor, mode: "insensitive" } },
                { username: { contains: actor, mode: "insensitive" } },
              ],
            },
          },
        }
      : {}),
    ...(input.actionType ? { actionType: input.actionType } : {}),
    ...(input.entityType ? { targetEntityType: input.entityType } : {}),
    ...((from || to)
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const totalItems = await prisma.auditLog.count({ where });
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / ADMIN_AUDIT_LOGS_PAGE_SIZE),
  );
  const effectivePage = Math.min(page, totalPages);

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (effectivePage - 1) * ADMIN_AUDIT_LOGS_PAGE_SIZE,
    take: ADMIN_AUDIT_LOGS_PAGE_SIZE,
    select: {
      id: true,
      createdAt: true,
      actionType: true,
      targetEntityType: true,
      targetEntityId: true,
      summary: true,
      metadata: true,
      actorRole: true,
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    items: logs.map(mapAuditLog),
    pagination: {
      page: effectivePage,
      pageSize: ADMIN_AUDIT_LOGS_PAGE_SIZE,
      totalItems,
      totalPages,
      hasNextPage: effectivePage < totalPages,
      hasPreviousPage: effectivePage > 1,
    },
    filters: {
      query,
      actor,
      actionType: input.actionType ?? null,
      entityType: input.entityType ?? null,
      from: input.from ?? "",
      to: input.to ?? "",
    },
  };
}
