export function ensureAdmin(
  role: string | null,
  adminId: string | null,
): asserts adminId is string {
  if (role !== "ADMIN" || !adminId) {
    throw new Error("Forbidden");
  }
}

