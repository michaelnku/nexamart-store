import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type UnverifiedEmailBannerProps = {
  description: string;
};

export function UnverifiedEmailBanner({
  description,
}: UnverifiedEmailBannerProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-950 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Verify your email</p>
            <p className="text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">
              {description}
            </p>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400"
        >
          <Link href="/auth/verify-email">Verify email</Link>
        </Button>
      </div>
    </div>
  );
}
