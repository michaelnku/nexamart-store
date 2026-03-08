"use client";

import { startVerification } from "@/actions/verification/startVerification";
import { VerificationRole } from "@/generated/prisma";
import { useTransition } from "react";

export default function StartVerificationButton({
  role,
}: {
  role: VerificationRole;
}) {
  const [pending, startTransition] = useTransition();

  const handleStart = () => {
    startTransition(async () => {
      const result = await startVerification(role);

      if (result?.url) {
        window.location.href = result.url;
      }
    });
  };

  return (
    <button
      onClick={handleStart}
      disabled={pending}
      className="px-4 py-2 rounded bg-blue-600 text-white"
    >
      {pending ? "Starting..." : "Start Verification"}
    </button>
  );
}
