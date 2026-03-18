import { redirect } from "next/navigation";
import { CurrentUser } from "@/lib/currentUser";

export async function requireModerator() {
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const allowedRoles = new Set(["ADMIN", "MODERATOR", "SYSTEM"]);
  if (!allowedRoles.has(user.role)) {
    redirect("/marketplace/dashboard");
  }

  return user;
}
