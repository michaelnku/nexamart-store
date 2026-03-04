import { updateShippingSettings } from "@/actions/admin/updateShippingSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          <form action={updateShippingSettings} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="foodMinimumDeliveryFee">Food Minimum Fee</Label>
              <Input
                id="foodMinimumDeliveryFee"
                name="foodMinimumDeliveryFee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.foodMinimumDeliveryFee ?? 2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalMinimumDeliveryFee">General Minimum Fee</Label>
              <Input
                id="generalMinimumDeliveryFee"
                name="generalMinimumDeliveryFee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.generalMinimumDeliveryFee ?? 5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foodBaseDeliveryRate">Food Base Rate</Label>
              <Input
                id="foodBaseDeliveryRate"
                name="foodBaseDeliveryRate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.foodBaseDeliveryRate ?? 1.5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foodRatePerMile">Food Rate Per Mile</Label>
              <Input
                id="foodRatePerMile"
                name="foodRatePerMile"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.foodRatePerMile ?? 0.7}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalBaseDeliveryRate">General Base Rate</Label>
              <Input
                id="generalBaseDeliveryRate"
                name="generalBaseDeliveryRate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.generalBaseDeliveryRate ?? 2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalRatePerMile">General Rate Per Mile</Label>
              <Input
                id="generalRatePerMile"
                name="generalRatePerMile"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.generalRatePerMile ?? 1}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expressMultiplier">Express Multiplier</Label>
              <Input
                id="expressMultiplier"
                name="expressMultiplier"
                type="number"
                step="0.01"
                min="1"
                defaultValue={config?.expressMultiplier ?? 1.5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupFee">Pickup Fee</Label>
              <Input
                id="pickupFee"
                name="pickupFee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.pickupFee ?? 0}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Button type="submit">Save Shipping Settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
