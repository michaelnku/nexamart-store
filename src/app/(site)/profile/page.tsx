import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeleteAcountModal from "@/components/modal/DeleteAcountModal";
import ReferralCodeCard from "../_components/ReferralCodeCard";
import { getUserInitials } from "@/lib/user";

export default async function ProfilePage() {
  const user = await CurrentUser();
  if (!user) return null;

  const avatar = user?.profileAvatar?.url ?? user?.image ?? null;
  const initials = getUserInitials({
    name: user?.name ?? null,
    username: user?.username ?? null,
    email: user?.email ?? null,
  });
  const referralCode = await prisma.referralCode.findUnique({
    where: { userId: user.id },
    select: { code: true },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-black">My Profile</h1>
        <p className="text-sm text-gray-500">
          Manage your personal account information and security.
        </p>
      </header>

      <Card className="border-gray-200">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0">
            {avatar ? (
              <Image
                src={avatar}
                alt={user?.name ?? "Profile image"}
                width={128}
                height={128}
                className="rounded-full object-cover border-2 border-[var(--brand-blue)]"
              />
            ) : (
              <div className="w-full h-full rounded-full border-2 border-dashed border-[var(--brand-blue)] flex items-center justify-center">
                <div className="uppercase text-lg sm:text-xl font-semibold text-[var(--brand-blue)]">
                  {initials}
                </div>
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold">
              {user.name ?? "Your Profile"}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

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

      {referralCode?.code && (
        <ReferralCodeCard code={referralCode.code} />
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium text-black">Actions</h3>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Button
              asChild
              className="w-full sm:w-auto bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
            >
              <Link href="/profile/update">Update Profile & Password</Link>
            </Button>

            <DeleteAcountModal userId={user.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
