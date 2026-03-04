import { updatePlatformSettings } from "@/actions/admin/updatePlatformSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrentRole } from "@/lib/currentUser";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { redirect } from "next/navigation";

export default async function SecuritySettingsPage() {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    redirect("/403");
  }

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
          <form action={updatePlatformSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteEmail">Security Contact Email</Label>
              <Input
                id="siteEmail"
                name="siteEmail"
                type="email"
                defaultValue={config?.siteEmail ?? "support@nexamart.com"}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sitePhone">Security Contact Phone</Label>
              <Input
                id="sitePhone"
                name="sitePhone"
                defaultValue={config?.sitePhone ?? ""}
              />
            </div>
            <Button type="submit">Save Security Settings</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
