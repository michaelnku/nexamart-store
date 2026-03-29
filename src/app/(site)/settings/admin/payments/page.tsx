import { AdminPaymentSettingsForm } from "@/components/site/AdminPaymentSettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteConfig } from "@/lib/getSiteConfig";

export default async function PaymentSettingsPage() {
  const config = await getSiteConfig();

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Payment Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update payment and commission behavior.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Commission</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminPaymentSettingsForm
            defaultPlatformCommissionPercent={
              config?.platformCommissionRate ?? 10
            }
          />
        </CardContent>
      </Card>
    </main>
  );
}
