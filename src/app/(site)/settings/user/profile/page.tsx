import AccountSection from "../../_components/AccountSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserProfileSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <AccountSection />
      </CardContent>
    </Card>
  );
}
