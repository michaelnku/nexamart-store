"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateShippingSettings } from "@/actions/admin/updateShippingSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminShippingSettingsFormProps = {
  defaults: {
    foodMinimumDeliveryFee: number;
    generalMinimumDeliveryFee: number;
    foodBaseDeliveryRate: number;
    foodRatePerMile: number;
    generalBaseDeliveryRate: number;
    generalRatePerMile: number;
    expressMultiplier: number;
    pickupFee: number;
  };
};

export function AdminShippingSettingsForm({
  defaults,
}: AdminShippingSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await updateShippingSettings(formData);

          if (result.success) {
            toast.success("Shipping settings updated.");
            return;
          }

          toast.error(
            result.error ??
              "We couldn't save your shipping settings. Please try again.",
          );
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="foodMinimumDeliveryFee">Food Minimum Fee</Label>
        <Input
          id="foodMinimumDeliveryFee"
          name="foodMinimumDeliveryFee"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults.foodMinimumDeliveryFee}
          disabled={isPending}
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
          defaultValue={defaults.generalMinimumDeliveryFee}
          disabled={isPending}
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
          defaultValue={defaults.foodBaseDeliveryRate}
          disabled={isPending}
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
          defaultValue={defaults.foodRatePerMile}
          disabled={isPending}
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
          defaultValue={defaults.generalBaseDeliveryRate}
          disabled={isPending}
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
          defaultValue={defaults.generalRatePerMile}
          disabled={isPending}
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
          defaultValue={defaults.expressMultiplier}
          disabled={isPending}
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
          defaultValue={defaults.pickupFee}
          disabled={isPending}
          required
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Shipping Settings"}
        </Button>
      </div>
    </form>
  );
}
