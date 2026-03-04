import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function UserNotificationsSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="orderUpdates">Order Updates</Label>
          <Switch id="orderUpdates" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="promotions">Promotions and Offers</Label>
          <Switch id="promotions" />
        </div>
        <Button type="button">Save Notification Settings</Button>
      </CardContent>
    </Card>
  );
}
