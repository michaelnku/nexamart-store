import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketplaceSettingsModules } from "@/constants/settings-modules";

export default function AdminSettingsPage() {
  const adminModules = MarketplaceSettingsModules.ADMIN.cards;

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure NexaMart by module.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminModules.map((module) => (
          <Card key={module.href}>
            <CardHeader>
              <CardTitle className="text-base">{module.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {module.description}
              </p>
              <Button asChild>
                <Link href={module.href}>Open Module</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
