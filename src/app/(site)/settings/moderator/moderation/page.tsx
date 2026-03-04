import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function ModeratorModerationSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Moderation Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="contentFlags">Receive Content Flag Alerts</Label>
          <Switch id="contentFlags" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="priorityQueue">Enable Priority Queue</Label>
          <Switch id="priorityQueue" />
        </div>
        <Button type="button">Save Moderation Settings</Button>
      </CardContent>
    </Card>
  );
}
