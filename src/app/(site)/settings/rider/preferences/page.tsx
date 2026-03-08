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
        <div className="flex justify-between">
          <Label>Delivery Notifications</Label>
          <Switch defaultChecked />
        </div>

        <div className="flex justify-between">
          <Label>Auto-Accept Nearby Orders</Label>
          <Switch />
        </div>

        <Button>Save Preferences</Button>
      </CardContent>
    </Card>
  );
}
