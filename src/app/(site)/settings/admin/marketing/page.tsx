import { updatePlatformSettings } from "@/actions/admin/updatePlatformSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          <form action={updatePlatformSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Public Brand Name</Label>
              <Input
                id="siteName"
                name="siteName"
                defaultValue={config?.siteName ?? "NexaMart"}
                required
              />
            </div>
            <Button type="submit">Save Marketing Settings</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
