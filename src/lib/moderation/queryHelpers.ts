import { Prisma } from "@/generated/prisma/client";

export function normalizeSearchText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function omitAllFilter<T extends string>(value: T | "ALL" | undefined) {
  return value && value !== "ALL" ? value : undefined;
}

export function resolvePage(page: number | undefined) {
  return Math.max(1, page ?? 1);
}

export function createIlikePattern(value: string) {
  return `%${value}%`;
}

export function buildSqlWhere(conditions: Prisma.Sql[]) {
  if (conditions.length === 0) {
    return Prisma.empty;
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`;
}
