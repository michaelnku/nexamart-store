import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StaffProfileForm from "@/components/staff/StaffProfileForm";
import { CurrentUser } from "@/lib/currentUser";
import { UserRole } from "@/generated/prisma/client";
import { getStaffProfile } from "@/actions/staff/getStaffProfile";
import { EmailVerificationGate } from "@/components/email-verification/EmailVerificationGate";
import { UnverifiedEmailBanner } from "@/components/email-verification/UnverifiedEmailBanner";

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

  if (!user.isEmailVerified && !profile) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4">
        <EmailVerificationGate
          email={user.email}
          description="Staff profile setup is available only after you verify the email address on your NexaMart account."
        />
      </main>
    );
  }

  const fullName = (user.name ?? "").trim();
  const [initialFirstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
  const initialLastName = rest.join(" ");

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4">
      {!user.isEmailVerified && profile ? (
        <UnverifiedEmailBanner description="Your staff profile already exists, so you can keep using it. Verify your email to secure your account and complete the new rollout." />
      ) : null}
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
