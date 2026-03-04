import { saveRiderProfileModule } from "@/actions/settings/riderModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentRiderProfile } from "@/lib/settings/getCurrentRiderProfile";

export default async function RiderProfileSettingsPage() {
  const profile = await getCurrentRiderProfile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rider Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={saveRiderProfileModule} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Input
              id="vehicleType"
              name="vehicleType"
              defaultValue={profile?.vehicleType ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plateNumber">Plate Number</Label>
            <Input
              id="plateNumber"
              name="plateNumber"
              defaultValue={profile?.plateNumber ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              name="licenseNumber"
              defaultValue={profile?.licenseNumber ?? ""}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Vehicle Model</Label>
              <Input
                id="vehicleModel"
                name="vehicleModel"
                defaultValue={profile?.vehicleModel ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleColor">Vehicle Color</Label>
              <Input
                id="vehicleColor"
                name="vehicleColor"
                defaultValue={profile?.vehicleColor ?? ""}
              />
            </div>
          </div>
          <Button type="submit">Save Profile</Button>
        </form>
      </CardContent>
    </Card>
  );
}
