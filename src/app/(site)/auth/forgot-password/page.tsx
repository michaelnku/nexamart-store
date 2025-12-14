"use client";

import { useState, useTransition } from "react";
import { forgotPassword } from "@/actions/password";

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
    <div className="max-w-md mx-auto mt-24">
      <h1 className="text-2xl font-semibold mb-4">Forgot password</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <button
          disabled={isPending}
          className="w-full bg-black text-white py-2 rounded"
        >
          {isPending ? "Sending..." : "Send reset link"}
        </button>
      </form>

      {success && <p className="text-sm text-green-600 mt-4">{success}</p>}
    </div>
  );
}
