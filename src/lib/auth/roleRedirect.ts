import {
  ADMIN_LOGIN_REDIRECT,
  DEFAULT_LOGIN_REDIRECT,
  MODERATOR_LOGIN_REDIRECT,
  RIDER_LOGIN_REDIRECT,
  SELLER_LOGIN_REDIRECT,
} from "@/routes";

type KnownRole = "ADMIN" | "SELLER" | "RIDER" | "MODERATOR" | "USER";
type StaffRole = Exclude<KnownRole, "USER">;

const ROLE_DASHBOARD: Record<KnownRole, string> = {
  ADMIN: ADMIN_LOGIN_REDIRECT,
  MODERATOR: MODERATOR_LOGIN_REDIRECT,
  SELLER: SELLER_LOGIN_REDIRECT,
  RIDER: RIDER_LOGIN_REDIRECT,

  USER: DEFAULT_LOGIN_REDIRECT,
};

const STAFF_ROLES = new Set<StaffRole>([
  "ADMIN",
  "MODERATOR",
  "SELLER",
  "RIDER",
]);

export const getDashboardRedirectForRole = (
  role: string | null | undefined,
): string | null => {
  if (!role) return null;
  return ROLE_DASHBOARD[role as KnownRole] ?? null;
};

export const isStaffRole = (
  role: string | null | undefined,
): role is StaffRole => {
  if (!role) return false;
  return STAFF_ROLES.has(role as StaffRole);
};
