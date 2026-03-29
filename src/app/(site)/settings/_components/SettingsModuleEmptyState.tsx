import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  icon: LucideIcon;
};

export default function SettingsModuleEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  icon: Icon,
}: Props) {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        <Button asChild>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
