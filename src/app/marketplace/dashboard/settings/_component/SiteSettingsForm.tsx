"use client";

import { updateSiteConfiguration } from "@/actions/admin/siteConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  siteConfigurationSchema,
  siteConfigurationSchemaInput,
} from "@/lib/zodValidation";
import { SiteConfig } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTransition } from "react";

const FALLBACK_VALUES: siteConfigurationSchemaInput = {
  siteName: "",
  siteEmail: "",
  sitePhone: "",
  siteLogo: "",
  foodMinimumDeliveryFee: 2,
  generalMinimumDeliveryFee: 5,
  foodBaseDeliveryRate: 1.5,
  foodRatePerMile: 0.7,
  generalBaseDeliveryRate: 2,
  generalRatePerMile: 1,
  expressMultiplier: 1.5,
  pickupFee: 0,
};

type Props = {
  config: SiteConfig | null;
};

export default function SiteSettingsForm({ config }: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<siteConfigurationSchemaInput>({
    resolver: zodResolver(siteConfigurationSchema),
    defaultValues: {
      siteName: config?.siteName ?? FALLBACK_VALUES.siteName,
      siteEmail: config?.siteEmail ?? FALLBACK_VALUES.siteEmail,
      sitePhone: config?.sitePhone ?? FALLBACK_VALUES.sitePhone,
      siteLogo: config?.siteLogo ?? FALLBACK_VALUES.siteLogo,
      foodMinimumDeliveryFee:
        config?.foodMinimumDeliveryFee ?? FALLBACK_VALUES.foodMinimumDeliveryFee,
      generalMinimumDeliveryFee:
        config?.generalMinimumDeliveryFee ??
        FALLBACK_VALUES.generalMinimumDeliveryFee,
      foodBaseDeliveryRate:
        config?.foodBaseDeliveryRate ?? FALLBACK_VALUES.foodBaseDeliveryRate,
      foodRatePerMile: config?.foodRatePerMile ?? FALLBACK_VALUES.foodRatePerMile,
      generalBaseDeliveryRate:
        config?.generalBaseDeliveryRate ?? FALLBACK_VALUES.generalBaseDeliveryRate,
      generalRatePerMile:
        config?.generalRatePerMile ?? FALLBACK_VALUES.generalRatePerMile,
      expressMultiplier:
        config?.expressMultiplier ?? FALLBACK_VALUES.expressMultiplier,
      pickupFee: config?.pickupFee ?? FALLBACK_VALUES.pickupFee,
    },
  });

  const onSubmit = (values: siteConfigurationSchemaInput) => {
    startTransition(() => {
      const parsed = siteConfigurationSchema.safeParse(values);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid form data");
        return;
      }

      updateSiteConfiguration(parsed.data).then((res) => {
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success("Site configuration updated");
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="siteName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="siteEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sitePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Phone</FormLabel>
                <FormControl>
                  <Input
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="siteLogo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Logo URL</FormLabel>
                <FormControl>
                  <Input
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="foodMinimumDeliveryFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Food Minimum Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 0))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="generalMinimumDeliveryFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Minimum Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 0))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pickupFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 0))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="foodBaseDeliveryRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Food Base Rate</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 0))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="foodRatePerMile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Food Rate / Mile</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 0))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="generalBaseDeliveryRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Base Rate</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 0))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="generalRatePerMile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Rate / Mile</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 0))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expressMultiplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Express Multiplier</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 1))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Form>
  );
}
