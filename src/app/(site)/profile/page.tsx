import { Suspense } from "react";
import { UserRole } from "@/generated/prisma/client";
import { StaffProfileCard } from "@/components/profile/StaffProfileCard";
import {
  UserProfileCard,
  type CurrentProfileUser,
} from "@/components/profile/UserProfileCard";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReferralCodeCard from "../_components/ReferralCodeCard";
import { getUserByEmail } from "@/components/helper/data";
import { StaffProfileDTO } from "@/lib/types";
import ProfilePageSkeleton from "@/components/skeletons/ProfilePageSkeleton";

async function ProfilePageContent() {
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

  const staffProfile: StaffProfileDTO | null =
    profileUser.role === UserRole.ADMIN ||
    profileUser.role === UserRole.MODERATOR
      ? await prisma.staffProfile.findUnique({
          where: { userId: profileUser.id },
        })
      : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            My Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Manage your personal account information and security.
          </p>
        </header>

        <UserProfileCard user={profileUser} />

        {referralCode?.code && <ReferralCodeCard code={referralCode.code} />}

        {(profileUser.role === UserRole.ADMIN ||
          profileUser.role === UserRole.MODERATOR) && (
          <StaffProfileCard staffProfile={staffProfile ?? undefined} />
        )}
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}
