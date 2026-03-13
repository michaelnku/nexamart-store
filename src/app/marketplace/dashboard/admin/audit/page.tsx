import { redirect } from "next/navigation";

export default function AdminAuditRedirectPage() {
  redirect("/marketplace/dashboard/admin/audit-logs");
}
