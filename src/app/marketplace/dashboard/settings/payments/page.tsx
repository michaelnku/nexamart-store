import { updatePlatformSettings } from "@/actions/admin/updatePlatformSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrentRole } from "@/lib/currentUser";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { redirect } from "next/navigation";

export default async function PaymentSettingsPage() {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    redirect("/403");
  }

  const config = await getSiteConfig();

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Payment Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update payment and commission behavior.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Commission</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePlatformSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformCommissionPercent">
                Platform Commission (%)
              </Label>
              <Input
                id="platformCommissionPercent"
                name="platformCommissionPercent"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.platformCommissionPercent ?? 10}
                required
              />
            </div>
            <Button type="submit">Save Payment Settings</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
