import { CurrentUser } from "@/lib/currentUser";
import PasswordForm from "../../_components/PasswordForm";
import ProfileForm from "../../_components/ProfileForm";

export default async function Page() {
  const user = await CurrentUser();
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Update Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal account information and password.
        </p>
      </header>

      <ProfileForm userData={user} />
      <PasswordForm />
    </div>
  );
}
