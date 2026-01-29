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
          <p className="text-gray-500">Full Name</p>
          <p className="font-medium">{user?.name || user?.username}</p>
        </div>

        <div>
          <p className="text-gray-500">Email</p>
          <p className="font-medium">{user?.email} </p>
        </div>

        <Link href={"/profile"}>
          <Button variant="outline" className="border-[#3c9ee0] text-[#3c9ee0]">
            Edit Profile
          </Button>
        </Link>
      </div>
    </SettingsCard>
  );
};

export default AccountSection;
