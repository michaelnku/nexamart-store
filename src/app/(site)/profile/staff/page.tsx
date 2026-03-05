import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StaffProfileForm from "@/components/staff/StaffProfileForm";
import { CurrentUserId } from "@/lib/currentUser";
import { getStaffProfile } from "@/actions/staff/getStaffProfile";

export default async function StaffProfilePage() {
  const userId = await CurrentUserId();
  if (!userId) {
    redirect("/auth/login");
  }

  const result = await getStaffProfile();
  const profile = "error" in result ? null : result.profile;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {profile ? "Edit Staff Profile" : "Create Staff Profile"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StaffProfileForm userId={userId} profile={profile} />
        </CardContent>
      </Card>
    </main>
  );
}
