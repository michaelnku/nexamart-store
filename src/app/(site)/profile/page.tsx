import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeleteAcountModal from "@/components/modal/DeleteAcountModal";
import ReferralCodeCard from "../_components/ReferralCodeCard";

export default async function ProfilePage() {
  const user = await CurrentUser();
  if (!user) return null;

  const avatar = user?.profileAvatar?.url ?? user?.image ?? null;
  const referralCode = await prisma.referralCode.findUnique({
    where: { userId: user.id },
    select: { code: true },
  });
  const baseUrl = process.env.FRONTEND_STORE_URL ?? "";
  const referralLink = referralCode?.code
    ? `${baseUrl}/auth/register?ref=${referralCode.code}`
    : "";

  return (
    <div className="max-w-xl mx-auto space-y-10 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-black">My Profile</h1>
        <p className="text-sm text-gray-500">
          Manage your personal account information and security.
        </p>
      </header>

      {/* PROFILE CARD */}
      <Card className="border-gray-200">
        <CardContent className="pt-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="relative w-32 h-32">
            {avatar ? (
              <Image
                src={avatar}
                alt={user?.name ?? "Profile image"}
                width={120}
                height={120}
                className="rounded-full object-cover border-2 border-[var(--brand-blue)]"
              />
            ) : (
              <div className="w-full h-full rounded-full border-2 border-dashed border-[var(--brand-blue)] flex items-center justify-center">
                <div className="uppercase text-xl font-semibold text-[var(--brand-blue)]">
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

      {referralCode?.code && (
        <ReferralCodeCard code={referralCode.code} link={referralLink} />
      )}

      {/* ACTIONS */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium text-black">Actions</h3>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              asChild
              className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
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
