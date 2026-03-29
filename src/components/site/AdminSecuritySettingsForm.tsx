"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updatePlatformSettings } from "@/actions/admin/updatePlatformSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizePhoneToE164, splitNormalizedPhone } from "@/lib/otp/phone";

type AdminSecuritySettingsFormProps = {
  defaultSiteEmail: string;
  defaultSitePhone: string;
};

export function AdminSecuritySettingsForm({
  defaultSiteEmail,
  defaultSitePhone,
}: AdminSecuritySettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [phoneField, setPhoneField] = useState(() =>
    splitNormalizedPhone(defaultSitePhone),
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await updatePlatformSettings(formData);

          if (result.success) {
            toast.success("Security settings updated.");
            return;
          }

          toast.error(
            result.error ??
              "We couldn't save your security settings. Please try again.",
          );
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="siteEmail">Security Contact Email</Label>
        <Input
          id="siteEmail"
          name="siteEmail"
          type="email"
          defaultValue={defaultSiteEmail}
          disabled={isPending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sitePhone-local">Security Contact Phone</Label>
        <input
          type="hidden"
          name="sitePhone"
          value={
            (() => {
              try {
                return normalizePhoneToE164(phoneField);
              } catch {
                return "";
              }
            })()
          }
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label htmlFor="sitePhone-country" className="sr-only">
              Security contact country code
            </Label>
            <div className="flex items-center rounded-md border border-input px-3">
              <span className="text-sm text-muted-foreground">+</span>
              <Input
                id="sitePhone-country"
                type="tel"
                inputMode="numeric"
                value={phoneField.countryCode}
                disabled={isPending}
                onChange={(event) =>
                  setPhoneField((current) => ({
                    ...current,
                    countryCode: event.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder="1"
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="sitePhone-local" className="sr-only">
              Security contact local number
            </Label>
            <Input
              id="sitePhone-local"
              type="tel"
              inputMode="numeric"
              value={phoneField.localNumber}
              disabled={isPending}
              onChange={(event) =>
                setPhoneField((current) => ({
                  ...current,
                  localNumber: event.target.value.replace(/\D/g, ""),
                }))
              }
              placeholder="Phone number"
            />
          </div>
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Security Settings"}
      </Button>
    </form>
  );
}
