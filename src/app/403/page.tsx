"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();
  const user = useCurrentUser();

  const goHome = () => {
    if (user?.role === "MODERATOR")
      router.push("/marketplace/dashboard/moderator");
    else if (user?.role === "ADMIN")
      router.push("/marketplace/dashboard/admin");
    else if (user?.role === "SELLER")
      router.push("/marketplace/dashboard/seller");
    else if (user?.role === "RIDER")
      router.push("/marketplace/dashboard/rider");
    else router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">403 – Forbidden</h1>
      <p className="text-muted-foreground">
        You don't have the permission to access this page.
      </p>
      <button onClick={goHome}>Go Home</button>
    </div>
  );
}
