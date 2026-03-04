import { updateSellerPreferencesModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";

export default async function SellerPreferencesSettingsPage() {
  const store = await getCurrentSellerStore();
  if (!store) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seller Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateSellerPreferencesModule} className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Enable Storefront</Label>
            <Switch id="isActive" name="isActive" defaultChecked={store.isActive} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotificationsEnabled">
              Email Notifications
            </Label>
            <Switch
              id="emailNotificationsEnabled"
              name="emailNotificationsEnabled"
              defaultChecked={store.emailNotificationsEnabled}
            />
          </div>
          <Button type="submit">Save Preferences</Button>
        </form>
      </CardContent>
    </Card>
  );
}
