import { redirect } from "next/navigation";

import AdminStorageCleanupClient from "@/app/marketplace/dashboard/admin/_components/AdminStorageCleanupClient";
import { CurrentUser } from "@/lib/currentUser";

export default async function AdminStorageCleanupPage() {
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/403");
  }

  return <AdminStorageCleanupClient />;
}
