import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StaffProfileForm from "@/components/staff/StaffProfileForm";
import { CurrentUser } from "@/lib/currentUser";
import { UserRole } from "@/generated/prisma/client";
import { getStaffProfile } from "@/actions/staff/getStaffProfile";

export default async function StaffProfilePage() {
  const user = await CurrentUser();
  const userId = user?.id;
  if (!userId) {
    redirect("/auth/login");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
    redirect("/profile");
  }

  const result = await getStaffProfile();
  const profile = "error" in result ? null : result.profile;
  const fullName = (user.name ?? "").trim();
  const [initialFirstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
  const initialLastName = rest.join(" ");

  return (
    <main className="mx-auto w-full max-w-3xl px-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {profile ? "Edit Staff Profile" : "Create Staff Profile"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StaffProfileForm
            userId={userId}
            profile={profile}
            initialFirstName={initialFirstName ?? ""}
            initialLastName={initialLastName}
            initialUser={user}
          />
        </CardContent>
      </Card>
    </main>
  );
}
