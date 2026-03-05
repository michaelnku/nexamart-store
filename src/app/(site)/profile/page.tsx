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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeleteAcountModal from "@/components/modal/DeleteAcountModal";
import ReferralCodeCard from "../_components/ReferralCodeCard";
import { getUserByEmail } from "@/components/helper/data";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffProfileDTO } from "@/lib/types";

function ProfilePageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-4">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-2 h-4 w-72" />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <Skeleton className="h-5 w-16" />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:w-52" />
            <Skeleton className="h-10 w-full sm:w-32" />
          </div>
        </section>
      </div>
    </main>
  );
}

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
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-black dark:text-gray-400">
            My Profile
          </h1>
          <p className="text-sm text-gray-500">
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
