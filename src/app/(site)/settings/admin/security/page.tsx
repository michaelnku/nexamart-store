import { AdminSecuritySettingsForm } from "@/components/site/AdminSecuritySettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteConfig } from "@/lib/getSiteConfig";

export default async function SecuritySettingsPage() {
  const config = await getSiteConfig();

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Security Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update admin communication channels for security workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminSecuritySettingsForm
            defaultSiteEmail={config?.siteEmail ?? "support@nexamart.com"}
            defaultSitePhone={config?.sitePhone ?? ""}
          />
        </CardContent>
      </Card>
    </main>
  );
}
