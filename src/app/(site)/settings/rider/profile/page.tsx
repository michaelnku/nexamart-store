import { saveRiderProfileModule } from "@/actions/settings/riderModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentRiderProfile } from "@/lib/settings/getCurrentRiderProfile";
import { CurrentUser } from "@/lib/currentUser";
import { EmailVerificationGate } from "@/components/email-verification/EmailVerificationGate";

export default async function RiderProfileSettingsPage() {
  const user = await CurrentUser();
  const profile = await getCurrentRiderProfile();

  if (!user?.isEmailVerified) {
    return (
      <EmailVerificationGate
        email={user?.email ?? null}
        description="Rider profile setup is available only after you verify the email address on your NexaMart account."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rider Profile</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={saveRiderProfileModule} className="space-y-4">
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <Input
              name="vehicleType"
              defaultValue={profile?.vehicleType ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Plate Number</Label>
            <Input
              name="plateNumber"
              defaultValue={profile?.plateNumber ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>License Number</Label>
            <Input
              name="licenseNumber"
              defaultValue={profile?.licenseNumber ?? ""}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Model</Label>
              <Input
                name="vehicleModel"
                defaultValue={profile?.vehicleModel ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Vehicle Color</Label>
              <Input
                name="vehicleColor"
                defaultValue={profile?.vehicleColor ?? ""}
              />
            </div>
          </div>

          <Button type="submit">
            {profile ? "Save Changes" : "Submit Registration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
