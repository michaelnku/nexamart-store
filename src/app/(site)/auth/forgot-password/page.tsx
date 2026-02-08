"use client";

import { useState, useTransition } from "react";
import { forgotPassword } from "@/actions/password";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      await forgotPassword(email);
      setSuccess("If an account exists, a password reset link has been sent.");
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
        <h1
          className="text-xl sm:text-2xl font-semibold"
          style={{ color: "var(--brand-blue)" }}
        >
          Forgot password
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Enter your email and we’ll send you a reset link.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 rounded border px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded font-semibold text-white shadow-md transition bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] disabled:opacity-70"
          >
            {isPending ? (
              <span className="inline-flex gap-2 items-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p>Sending...</p>
              </span>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>

        {success && (
          <p className="text-sm text-green-600 mt-4 px-2">{success}</p>
        )}
      </div>
    </main>
  );
}
