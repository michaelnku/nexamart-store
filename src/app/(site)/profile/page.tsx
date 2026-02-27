import { UserRole } from "@/generated/prisma/client";
import { StaffProfileCard } from "@/components/profile/StaffProfileCard";
import {
  UserProfileCard,
  type CurrentProfileUser,
} from "@/components/profile/UserProfileCard";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeleteAcountModal from "@/components/modal/DeleteAcountModal";
import ReferralCodeCard from "../_components/ReferralCodeCard";
import { getUserByEmail } from "@/components/helper/data";

export default async function ProfilePage() {
  const sessionUser = await CurrentUser();
  if (!sessionUser?.email) {
    redirect("/auth/login");
  }

  const dbUser = await getUserByEmail(sessionUser.email);
  if (!dbUser) {
    redirect("/auth/login");
  }

  const fullName = (dbUser.name ?? sessionUser.name ?? "").trim();
  const [firstName, ...rest] = fullName.split(/\s+/);
  const profileUser: CurrentProfileUser = {
    id: dbUser.id,
    email: dbUser.email,
    role: sessionUser.role,
    image: sessionUser.image ?? dbUser.image ?? null,
    createdAt: dbUser.createdAt,
    firstName: firstName || null,
    lastName: rest.length > 0 ? rest.join(" ") : null,
  };

  const referralCode = await prisma.referralCode.findUnique({
    where: { userId: profileUser.id },
    select: { code: true },
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-black">My Profile</h1>
          <p className="text-sm text-gray-500">
            Manage your personal account information and security.
          </p>
        </header>

        <UserProfileCard user={profileUser} />
        {profileUser.role !== UserRole.USER && <StaffProfileCard />}

        {referralCode?.code && <ReferralCodeCard code={referralCode.code} />}

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-medium text-black">Actions</h2>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                asChild
                className="w-full bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)] sm:w-auto"
              >
                <Link href="/profile/update">Update Profile</Link>
              </Button>

              <DeleteAcountModal userId={profileUser.id} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
