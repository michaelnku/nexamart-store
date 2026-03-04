import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function RiderPreferencesSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rider Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="deliveryNotifications">Delivery Notifications</Label>
          <Switch id="deliveryNotifications" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="autoAccept">Auto-Accept Nearby Orders</Label>
          <Switch id="autoAccept" />
        </div>
        <Button type="button">Save Preferences</Button>
      </CardContent>
    </Card>
  );
}
