import { updatePlatformSettings } from "@/actions/admin/updatePlatformSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrentRole } from "@/lib/currentUser";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { redirect } from "next/navigation";

export default async function MarketingSettingsPage() {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    redirect("/403");
  }

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
            <div className="space-y-2">
              <Label htmlFor="siteLogo">Brand Logo URL</Label>
              <Input
                id="siteLogo"
                name="siteLogo"
                defaultValue={config?.siteLogo ?? ""}
              />
            </div>
            <Button type="submit">Save Marketing Settings</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
