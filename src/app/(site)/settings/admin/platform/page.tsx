import { updatePlatformSettings } from "@/actions/admin/updatePlatformSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSiteConfig } from "@/lib/getSiteConfig";

export default async function PlatformSettingsPage() {
  const config = await getSiteConfig();

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage the core platform information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Platform Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePlatformSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                name="siteName"
                defaultValue={config?.siteName ?? "NexaMart"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteEmail">Site Email</Label>
              <Input
                id="siteEmail"
                name="siteEmail"
                type="email"
                defaultValue={config?.siteEmail ?? "support@nexamart.com"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sitePhone">Site Phone</Label>
              <Input
                id="sitePhone"
                name="sitePhone"
                defaultValue={config?.sitePhone ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteLogo">Site Logo URL</Label>
              <Input
                id="siteLogo"
                name="siteLogo"
                defaultValue={config?.siteLogo ?? ""}
              />
            </div>

            <Button type="submit">Save Platform Settings</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
