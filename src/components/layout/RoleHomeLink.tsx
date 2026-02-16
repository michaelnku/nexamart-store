import Link from "next/link";

import { CurrentUser } from "@/lib/currentUser";
import { getDashboardRedirectForRole } from "@/lib/auth/roleRedirect";
import { Button } from "@/components/ui/button";

type RoleHomeLinkProps = {
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
};

export default async function RoleHomeLink({
  label = "Go Home",
  className,
  variant = "default",
}: RoleHomeLinkProps) {
  const user = await CurrentUser();
  const href = getDashboardRedirectForRole(user?.role) ?? "/";

  return (
    <Button asChild variant={variant} className={className}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
