"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resetPassword } from "@/actions/password";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return <p className="text-center mt-24">Invalid reset link</p>;
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await resetPassword(token, password);
        router.push("/login");
      } catch {
        setError("Reset link is invalid or expired");
      }
    });
  };

  return (
    <div className="max-w-md mx-auto mt-24">
      <h1 className="text-2xl font-semibold mb-4">Reset password</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          required
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <button
          disabled={isPending}
          className="w-full bg-black text-white py-2 rounded"
        >
          {isPending ? "Updating..." : "Update password"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
    </div>
  );
}
