import { AdminMarketingSettingsForm } from "@/components/site/AdminMarketingSettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteConfig } from "@/lib/getSiteConfig";

export default async function MarketingSettingsPage() {
  const config = await getSiteConfig();

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Marketing Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage branding values used in marketing surfaces.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Identity</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMarketingSettingsForm
            defaultSiteName={config?.siteName ?? "NexaMart"}
          />
        </CardContent>
      </Card>
    </main>
  );
}
