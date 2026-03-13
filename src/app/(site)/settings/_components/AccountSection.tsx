"use client";

import SettingsCard from "@/components/settings/SettingsCard";
import AccountSectionSkeleton from "@/components/skeletons/AccountSectionSkeleton";
import { Button } from "@/components/ui/button";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import Link from "next/link";

const AccountSection = () => {
  const { data: user, isPending } = useCurrentUserQuery();

  if (isPending) return <AccountSectionSkeleton />;

  return (
    <SettingsCard title="Account Information">
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-500 dark:text-zinc-400">Full Name</p>
          <p className="font-medium dark:text-zinc-100">{user?.name || user?.username}</p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-zinc-400">Email</p>
          <p className="font-medium dark:text-zinc-100">{user?.email} </p>
        </div>

        <Link href={"/profile"}>
          <Button
            variant="outline"
            className="border-[#3c9ee0] text-[#3c9ee0] dark:border-[#3c9ee0]/70 dark:hover:bg-[#3c9ee0]/10"
          >
            Edit Profile
          </Button>
        </Link>
      </div>
    </SettingsCard>
  );
};

export default AccountSection;
