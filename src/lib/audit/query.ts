import "server-only";

import { unstable_noStore as noStore } from "next/cache";
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
import {
  firstSearchParamValue,
  parseSearchParam,
} from "@/lib/moderation/searchParamHelpers";

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
  return {
    page: parseSearchParam(
      z.coerce.number().int().min(1).default(1),
      firstSearchParamValue(searchParams?.page),
      1,
    ),
    query: parseSearchParam(
      z.string().trim().max(120).default(""),
      firstSearchParamValue(searchParams?.q),
      "",
    ),
    actor: parseSearchParam(
      z.string().trim().max(120).default(""),
      firstSearchParamValue(searchParams?.actor),
      "",
    ),
    actionType: parseSearchParam(
      z.enum(AUDIT_ACTION_TYPES).optional(),
      firstSearchParamValue(searchParams?.actionType),
      undefined,
    ),
    entityType: parseSearchParam(
      z.enum(AUDIT_ENTITY_TYPES).optional(),
      firstSearchParamValue(searchParams?.entityType),
      undefined,
    ),
    from: parseSearchParam(
      z.string().trim().optional(),
      firstSearchParamValue(searchParams?.from),
      undefined,
    ),
    to: parseSearchParam(
      z.string().trim().optional(),
      firstSearchParamValue(searchParams?.to),
      undefined,
    ),
  };
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
  noStore();

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
