"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { MailCheck, RefreshCcw } from "lucide-react";

import {
  getEmailVerificationStatus,
  resendEmailVerificationForCurrentUser,
} from "@/actions/email-verification/emailVerification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserDTO } from "@/lib/types";

type EmailVerificationGateProps = {
  description: string;
  email?: string | null;
  title?: string;
};

export function EmailVerificationGate({
  description,
  email,
  title = "Verify your email to continue",
}: EmailVerificationGateProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"neutral" | "success" | "error">(
    "neutral",
  );
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();

  const handleResend = () => {
    startTransition(async () => {
      const result = await resendEmailVerificationForCurrentUser();

      setFeedback(result.message);
      setFeedbackTone(
        result.success
          ? "success"
          : result.code === "EMAIL_VERIFICATION_COOLDOWN"
            ? "neutral"
            : "error",
      );
    });
  };

  const handleRefresh = () => {
    startRefreshTransition(async () => {
      const result = await getEmailVerificationStatus(
        email ? { email } : undefined,
      );

      if (!result.verified) {
        setFeedback(
          "We still show your email as unverified. Open the latest verification link in your inbox, then try again.",
        );
        setFeedbackTone("neutral");
        return;
      }

      queryClient.setQueryData<UserDTO | null>(
        ["currentUser"],
        (currentUser) =>
          currentUser
            ? {
                ...currentUser,
                isEmailVerified: true,
                emailVerifiedAt: new Date().toISOString(),
              }
            : currentUser,
      );
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      setFeedback("Email verified. Refreshing your access now.");
      setFeedbackTone("success");
      router.refresh();
    });
  };

  const feedbackClassName =
    feedbackTone === "success"
      ? "text-emerald-600"
      : feedbackTone === "error"
        ? "text-red-600"
        : "text-slate-600";

  return (
    <Card className="border-slate-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <CardHeader className="space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-[var(--brand-blue)] dark:bg-sky-950/40">
          <MailCheck className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          {email ? (
            <p className="text-sm text-slate-700 dark:text-zinc-300">
              Verification email destination: <span className="font-medium">{email}</span>
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleResend}
            disabled={isPending}
            className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)]"
          >
            {isPending ? "Sending..." : "Resend verification email"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {isRefreshing ? "Checking..." : "I've already verified"}
          </Button>
        </div>

        {feedback ? <p className={`text-sm ${feedbackClassName}`}>{feedback}</p> : null}
      </CardContent>
    </Card>
  );
}
