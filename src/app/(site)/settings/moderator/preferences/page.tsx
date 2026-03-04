import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function ModeratorPreferencesSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Moderator Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="emailDigest">Daily Email Digest</Label>
          <Switch id="emailDigest" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="soundAlerts">Sound Alerts</Label>
          <Switch id="soundAlerts" />
        </div>
        <Button type="button">Save Preferences</Button>
      </CardContent>
    </Card>
  );
}
