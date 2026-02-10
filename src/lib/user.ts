import { UserDTO } from "@/lib/types";

type UserInitialsSource = Pick<UserDTO, "name" | "username" | "email"> | null;

export const getUserInitials = (user?: UserInitialsSource) => {
  const fallback = user?.username || user?.email || "";
  const source = (user?.name || fallback).trim();
  if (!source) return "U";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
};
