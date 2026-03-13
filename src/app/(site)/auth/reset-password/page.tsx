"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resetPassword } from "@/actions/password";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <p className="mt-24 min-h-full py-62 text-center text-red-500 dark:text-red-400">
        Invalid reset link
      </p>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await resetPassword(token, password);
        router.push("/auth/login");
      } catch {
        setError("Reset link is invalid or expired");
      }
    });
  };

  return (
    <main className="flex min-h-full items-center justify-center bg-gray-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-7 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <h1
          className="text-2xl font-semibold mb-4"
          style={{ color: "var(--brand-blue)" }}
        >
          Reset password
        </h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            required
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-slate-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-zinc-100"
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11  rounded font-semibold text-white shadow-md transition bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] disabled:opacity-70"
          >
            {isPending ? (
              <span className="inline-flex gap-2 items-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p>Updating...</p>
              </span>
            ) : (
              "Update password"
            )}
          </Button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </main>
  );
}

