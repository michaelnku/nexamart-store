"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();

  const goHome = () => {
    router.push("/");
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">403 – Forbidden</h1>
      <p className="text-muted-foreground">
        You don't have permission to access this page.
      </p>
      <Button
        onClick={goHome}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Go Home
      </Button>
    </div>
  );
}
