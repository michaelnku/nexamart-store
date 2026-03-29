import { AdminShippingSettingsForm } from "@/components/site/AdminShippingSettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteConfig } from "@/lib/getSiteConfig";

export default async function ShippingSettingsPage() {
  const config = await getSiteConfig();

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Shipping Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure shipping rates and fee rules.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminShippingSettingsForm
            defaults={{
              foodMinimumDeliveryFee: config?.foodMinimumDeliveryFee ?? 2,
              generalMinimumDeliveryFee:
                config?.generalMinimumDeliveryFee ?? 5,
              foodBaseDeliveryRate: config?.foodBaseDeliveryRate ?? 1.5,
              foodRatePerMile: config?.foodRatePerMile ?? 0.7,
              generalBaseDeliveryRate: config?.generalBaseDeliveryRate ?? 2,
              generalRatePerMile: config?.generalRatePerMile ?? 1,
              expressMultiplier: config?.expressMultiplier ?? 1.5,
              pickupFee: config?.pickupFee ?? 0,
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
