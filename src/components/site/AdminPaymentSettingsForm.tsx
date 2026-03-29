"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updatePlatformSettings } from "@/actions/admin/updatePlatformSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminPaymentSettingsFormProps = {
  defaultPlatformCommissionPercent: number;
};

export function AdminPaymentSettingsForm({
  defaultPlatformCommissionPercent,
}: AdminPaymentSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await updatePlatformSettings(formData);

          if (result.success) {
            toast.success("Payment settings updated.");
            return;
          }

          toast.error(
            result.error ??
              "We couldn't save your payment settings. Please try again.",
          );
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="platformCommissionPercent">
          Platform Commission (%)
        </Label>
        <Input
          id="platformCommissionPercent"
          name="platformCommissionPercent"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultPlatformCommissionPercent}
          disabled={isPending}
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Payment Settings"}
      </Button>
    </form>
  );
}
