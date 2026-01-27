import { Button } from "@/components/ui/button";

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-[#3c9ee0]">{title}</h2>
      {children}
    </div>
  );
}

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
