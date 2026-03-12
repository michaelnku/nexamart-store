import { updateRiderOperationsModule } from "@/actions/settings/riderModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getCurrentRiderProfile } from "@/lib/settings/getCurrentRiderProfile";
import Link from "next/link";
import SubmitOperationsButton from "./SubmitOperationsButton";

export default async function RiderOperationsSettingsPage() {
  const profile = await getCurrentRiderProfile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operations</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={updateRiderOperationsModule} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Verification status:
            <span
              className={
                profile?.isVerified ? "text-green-600" : "text-yellow-600"
              }
            >
              {profile?.isVerified ? " Verified" : " Pending"}
            </span>{" "}
            -{" "}
            {profile?.isVerified === false && (
              <Link
                href="/settings/verification"
                className="text-blue-600 hover:underline"
              >
                {" "}
                Start verification process
              </Link>
            )}
            {profile?.isVerified === true && (
              <Link
                href="/settings/verification"
                className="text-blue-600 hover:underline"
              >
                {" "}
                View Details
              </Link>
            )}
          </p>

          <div className="flex items-center justify-between">
            <Label>Go Online</Label>
            <Switch
              name="isAvailable"
              defaultChecked={profile?.isAvailable ?? false}
              disabled={!profile?.isVerified}
            />
          </div>

          <SubmitOperationsButton disabled={!profile?.isVerified} />
        </form>

        <div className="mt-4">
          <Link
            href="/marketplace/dashboard/rider/schedule"
            className="text-sm text-blue-600"
          >
            Edit Weekly Schedule
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
