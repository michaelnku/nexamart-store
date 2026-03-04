import SecuritySection from "../../_components/SecuritySection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserSecuritySettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent>
        <SecuritySection />
      </CardContent>
    </Card>
  );
}
