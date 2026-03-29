"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updatePlatformSettings } from "@/actions/admin/updatePlatformSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminMarketingSettingsFormProps = {
  defaultSiteName: string;
};

export function AdminMarketingSettingsForm({
  defaultSiteName,
}: AdminMarketingSettingsFormProps) {
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
            toast.success("Marketing settings updated.");
            return;
          }

          toast.error(
            result.error ??
              "We couldn't save your marketing settings. Please try again.",
          );
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="siteName">Public Brand Name</Label>
        <Input
          id="siteName"
          name="siteName"
          defaultValue={defaultSiteName}
          disabled={isPending}
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Marketing Settings"}
      </Button>
    </form>
  );
}
