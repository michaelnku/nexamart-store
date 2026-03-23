import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, MailX, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VerifyEmailClient from "./VerifyEmailClient";
import { verifyEmailVerificationToken } from "@/lib/email-verification/service";
import { CurrentUser } from "@/lib/currentUser";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string;
    email?: string;
    next?: string;
  }>;
};

function resolveNextPath(nextPath?: string, isLoggedIn?: boolean) {
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }

  return isLoggedIn ? "/auth/redirecting" : "/auth/login";
}

function VerifyStateCard(props: {
  title: string;
  description: string;
  icon: ReactNode;
  toneClassName: string;
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <main className="flex min-h-[calc(100dvh-8rem)] items-center justify-center bg-gray-50 px-4 py-10 dark:bg-neutral-950">
      <Card className="w-full max-w-lg border-slate-200 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <CardHeader className="space-y-4 text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${props.toneClassName}`}
          >
            {props.icon}
          </div>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          <p className="text-sm leading-6 text-muted-foreground">
            {props.description}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)]"
            >
              <Link href={props.primaryHref}>{props.primaryLabel}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token, email, next } = await searchParams;
  const currentUser = await CurrentUser();
  const nextPath = resolveNextPath(next, Boolean(currentUser?.id));

  if (token) {
    const result = await verifyEmailVerificationToken(token);

    if (result.status === "verified") {
      return (
        <VerifyStateCard
          title="Email verified!"
          description="Your email is now verified. You can continue using your NexaMart account."
          icon={<CheckCircle2 className="h-7 w-7" />}
          toneClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
          primaryHref={nextPath}
          primaryLabel="Continue"
        />
      );
    }

    if (result.status === "already_verified") {
      return (
        <VerifyStateCard
          title="Email already verified!"
          description="This email address has already been verified. You can continue using your NexaMart account."
          icon={<CheckCircle2 className="h-7 w-7" />}
          toneClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
          primaryHref={nextPath}
          primaryLabel="Continue"
        />
      );
    }

    if (result.status === "expired") {
      return (
        <VerifyStateCard
          title="Verification link expired!"
          description="This verification link has expired. Return to the verification page and request a fresh email."
          icon={<ShieldAlert className="h-7 w-7" />}
          toneClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
          primaryHref={`/auth/verify-email${email ? `?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}` : ""}`}
          primaryLabel="Back to verification"
        />
      );
    }

    if (result.status === "consumed") {
      return (
        <VerifyStateCard
          title="Verification link already used"
          description="This verification link has already been used. If your account still looks unverified, request a fresh email."
          icon={<ShieldAlert className="h-7 w-7" />}
          toneClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
          primaryHref={`/auth/verify-email${email ? `?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}` : ""}`}
          primaryLabel="Back to verification"
        />
      );
    }

    return (
      <VerifyStateCard
        title="Verification link is invalid"
        description="This verification link is not valid anymore. Return to the verification page and request a new email."
        icon={<MailX className="h-7 w-7" />}
        toneClassName="bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
        primaryHref={`/auth/verify-email${email ? `?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}` : ""}`}
        primaryLabel="Back to verification"
      />
    );
  }

  const resolvedEmail = currentUser?.email ?? email?.toLowerCase().trim();

  if (!resolvedEmail) {
    return (
      <VerifyStateCard
        title="Verification page unavailable"
        description="Open this page from your signup flow or verification email so NexaMart can continue the email verification process."
        icon={<MailX className="h-7 w-7" />}
        toneClassName="bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
        primaryHref={nextPath}
        primaryLabel="Continue"
      />
    );
  }

  return <VerifyEmailClient email={resolvedEmail} nextPath={nextPath} />;
}
