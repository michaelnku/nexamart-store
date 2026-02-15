"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getDashboardRedirectForRole } from "@/lib/auth/roleRedirect";

type RoleHomeButtonProps = {
  className?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
};

export default function RoleHomeButton({
  className,
  label = "Go Home",
  variant = "default",
}: RoleHomeButtonProps) {
  const router = useRouter();
  const user = useCurrentUser();

  const destination = getDashboardRedirectForRole(user?.role) ?? "/";

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => router.push(destination)}
    >
      {label}
    </Button>
  );
}
