import { z } from "zod";

export function firstSearchParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseSearchParam<T>(
  schema: z.ZodType<T>,
  value: string | undefined,
  fallback: T,
) {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
