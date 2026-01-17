import { CurrentUser } from "@/lib/currentUser";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeleteAcountModal from "@/components/modal/DeleteAcountModal";

export default async function ProfilePage() {
  const user = await CurrentUser();
  if (!user) return null;

  const avatar = user?.profileAvatar?.url ?? user?.image ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal account information and security.
        </p>
      </header>

      {/* PROFILE CARD */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="relative w-32 h-32">
            {avatar ? (
              <Image
                src={avatar}
                alt={user?.name ?? "Profile image"}
                width={120}
                height={120}
                className="rounded-full object-cover border"
              />
            ) : (
              <div className="w-full h-full rounded-full border flex items-center justify-center text-sm text-muted-foreground">
                <div className="uppercase text-xl font-semibold">
                  {user?.name?.[0] ?? user?.email[0]}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ACCOUNT INFO */}
      <Card>
        <CardContent className="pt-6 space-y-2">
          <h3 className="font-medium">Account Information</h3>

          <p className="text-sm">
            <span className="text-muted-foreground">Email:</span> {user.email}
          </p>

          <p className="text-sm">
            <span className="text-muted-foreground">Role:</span> {user.role}
          </p>
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium">Actions</h3>

          <div className="flex justify-between">
            <Button asChild>
              <Link href="/dashboard/profile/update">
                Update Profile & Password
              </Link>
            </Button>
            <DeleteAcountModal userId={user.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
