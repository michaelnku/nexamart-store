import SettingsCard from "@/components/settings/SettingsCard";
import { Button } from "@/components/ui/button";

const AccountSection = () => {
  return (
    <SettingsCard title="Account Information">
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-500">Full Name</p>
          <p className="font-medium">Michael Nku</p>
        </div>

        <div>
          <p className="text-gray-500">Email</p>
          <p className="font-medium">michael@example.com</p>
        </div>

        <Button variant="outline" className="border-[#3c9ee0] text-[#3c9ee0]">
          Edit Profile
        </Button>
      </div>
    </SettingsCard>
  );
};

export default AccountSection;
