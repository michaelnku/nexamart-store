"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, RefreshCw, ShieldCheck } from "lucide-react";

import {
  getEmailVerificationStatus,
  getEmailVerificationResendState,
  resendEmailVerificationForCurrentUser,
} from "@/actions/email-verification/emailVerification";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VerifyEmailClientProps = {
  email: string;
  nextPath: string;
};

export default function VerifyEmailClient({
  email,
  nextPath,
}: VerifyEmailClientProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [cooldownNow, setCooldownNow] = useState(() => Date.now());
  const [isResending, startResendTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    const checkStatus = async () => {
      const result = await getEmailVerificationStatus({ email });

      if (!cancelled && result.verified) {
        router.replace(nextPath);
        router.refresh();
      }
    };

    void checkStatus();
    const interval = window.setInterval(() => {
      void checkStatus();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [email, nextPath, router]);

  useEffect(() => {
    let cancelled = false;

    const syncCooldown = async () => {
      const result = await getEmailVerificationResendState({ email });

      if (cancelled) return;

      setCooldownNow(Date.now());
      setCooldownEndsAt(
        result.cooldownEndsAt
          ? new Date(result.cooldownEndsAt).getTime()
          : null,
      );
    };

    void syncCooldown();

    return () => {
      cancelled = true;
    };
  }, [email]);

  const secondsRemaining = useMemo(() => {
    if (!cooldownEndsAt) return 0;
    return Math.max(0, Math.ceil((cooldownEndsAt - cooldownNow) / 1000));
  }, [cooldownEndsAt, cooldownNow]);

  useEffect(() => {
    if (!cooldownEndsAt) return;

    const interval = window.setInterval(() => {
      setCooldownNow(Date.now());
      if (Date.now() >= cooldownEndsAt) {
        setCooldownEndsAt(null);
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [cooldownEndsAt]);

  const handleResend = () => {
    startResendTransition(async () => {
      const result = await resendEmailVerificationForCurrentUser({ email });
      setMessage(result.message);
      setCooldownNow(Date.now());
      setCooldownEndsAt(
        result.cooldownEndsAt
          ? new Date(result.cooldownEndsAt).getTime()
          : null,
      );
    });
  };

  return (
    <main className="flex min-h-[calc(100dvh-8rem)] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(60,158,224,0.12),_transparent_38%),linear-gradient(180deg,_#f8fbfe_0%,_#ffffff_48%,_#f8fafc_100%)] px-4 py-10 dark:bg-neutral-950">
      <Card className="mx-auto w-full max-w-xl overflow-hidden border-slate-200/80 bg-white shadow-[0_24px_70px_-32px_rgba(15,23,42,0.32)] dark:border-zinc-800 dark:bg-zinc-950">
        <CardHeader className="space-y-5 border-b bg-gradient-to-br from-[#3c9ee0]/10 via-white to-white pb-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3c9ee0]/10 text-[#3c9ee0]">
              <MailCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3c9ee0]">
                NexaMart
              </p>
              <p className="text-xs text-muted-foreground">Verify your email</p>
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
              Verify your email to continue
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600 dark:text-zinc-400">
              We sent a verification link to{" "}
              <span className="font-medium text-slate-900 dark:text-zinc-100">
                {email}
              </span>
              . Please check your inbox.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="rounded-2xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[#3c9ee0]" />
              <div className="space-y-2 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                <p className="font-medium text-slate-900 dark:text-zinc-100">
                  Verify later.
                </p>
                <p>You can always verify your email later.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
            <p>1. Open your inbox</p>
            <p>2. Click the verification link</p>
            <p>3. Return here to continue using NexaMart </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                Didn&apos;t get a link?
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                {secondsRemaining > 0
                  ? `Resend available in ${secondsRemaining}s`
                  : "You can request a fresh verification email now."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={isResending || secondsRemaining > 0}
                className="gap-2 border-[#3c9ee0]/20 text-[#3c9ee0] hover:bg-[#3c9ee0]/5 hover:text-[#3c9ee0]"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`}
                />
                {secondsRemaining > 0
                  ? `Resend in ${secondsRemaining}s`
                  : isResending
                    ? "Sending..."
                    : "Resend verification email"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.replace(nextPath)}
                className="text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                Verify later
              </Button>
            </div>
          </div>

          {message ? (
            <p className="text-sm text-slate-600 dark:text-zinc-300">
              {message}
            </p>
          ) : null}
        </CardContent>

        <CardFooter className="border-t bg-slate-50/70 text-sm leading-6 text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          Your email is not verified yet. Email verification is only required to
          use some features.
        </CardFooter>
      </Card>
    </main>
  );
}
