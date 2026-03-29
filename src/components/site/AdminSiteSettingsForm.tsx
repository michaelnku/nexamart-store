"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { deleteFileAction } from "@/actions/actions";
import { updatePlatformSettings } from "@/actions/admin/updatePlatformSettings";
import { SiteSettingsBrandingSection } from "@/components/site/SiteSettingsBrandingSection";
import { SiteSettingsContactSection } from "@/components/site/SiteSettingsContactSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { normalizePhoneToE164, splitNormalizedPhone } from "@/lib/otp/phone";
import {
  siteSettingsFormSchema,
  toSiteSettingsFormDefaults,
} from "@/lib/site-config/siteConfig.schema";
import type {
  AdminSiteConfiguration,
  SiteSettingsFormValues,
} from "@/lib/site-config/siteConfig.types";
import type { JsonFile } from "@/lib/types";

type AdminSiteSettingsFormProps = {
  config: AdminSiteConfiguration;
};

type PhoneFieldKey = "sitePhone" | "supportPhone" | "whatsappPhone";

function normalizeUrlWithHttps(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function AdminSiteSettingsForm({ config }: AdminSiteSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [siteLogo, setSiteLogo] = useState<JsonFile | null>(
    config.siteLogo && config.siteLogoKey
      ? {
          url: config.siteLogo,
          key: config.siteLogoKey,
        }
      : null,
  );
  const [phoneFields, setPhoneFields] = useState<
    Record<PhoneFieldKey, { countryCode: string; localNumber: string }>
  >({
    sitePhone: splitNormalizedPhone(config.sitePhone),
    supportPhone: splitNormalizedPhone(config.supportPhone),
    whatsappPhone: splitNormalizedPhone(config.whatsappPhone),
  });

  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsFormSchema),
    defaultValues: toSiteSettingsFormDefaults(config),
  });

  const initialLogoKey = config.siteLogoKey ?? "";
  const isBusy = isPending;
  const brandingValue = useMemo(() => siteLogo, [siteLogo]);

  const syncPhoneValue = (
    field: PhoneFieldKey,
    nextValue: { countryCode: string; localNumber: string },
  ) => {
    setPhoneFields((current) => ({
      ...current,
      [field]: nextValue,
    }));

    try {
      const normalized = normalizePhoneToE164(nextValue);
      form.setValue(field, normalized, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch {
      form.setValue(field, "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const renderPhoneField = ({
    field,
    label,
    error,
  }: {
    field: PhoneFieldKey;
    label: string;
    error?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={`${field}-local`}>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <Label htmlFor={`${field}-country`} className="sr-only">
            {label} country code
          </Label>
          <div className="flex items-center rounded-md border border-input px-3">
            <span className="text-sm text-muted-foreground">+</span>
            <Input
              id={`${field}-country`}
              type="tel"
              inputMode="numeric"
              value={phoneFields[field].countryCode}
              disabled={isBusy}
              onChange={(event) =>
                syncPhoneValue(field, {
                  countryCode: event.target.value.replace(/\D/g, ""),
                  localNumber: phoneFields[field].localNumber,
                })
              }
              placeholder="1"
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${field}-local`} className="sr-only">
            {label} local number
          </Label>
          <Input
            id={`${field}-local`}
            type="tel"
            inputMode="numeric"
            value={phoneFields[field].localNumber}
            disabled={isBusy}
            onChange={(event) =>
              syncPhoneValue(field, {
                countryCode: phoneFields[field].countryCode,
                localNumber: event.target.value.replace(/\D/g, ""),
              })
            }
            placeholder="Phone number"
          />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );

  const handleDeleteLogo = async () => {
    const currentKey = siteLogo?.key ?? "";

    if (!currentKey) {
      return;
    }

    if (currentKey !== initialLogoKey) {
      const result = await deleteFileAction(currentKey);

      if (result?.error) {
        toast.error(result.error);
        return;
      }
    }

    setSiteLogo(null);
    form.setValue("siteLogoUrl", "");
    form.setValue("siteLogoKey", "");
    toast.success("Logo removed from the draft.");
  };

  const normalizeSocialField = (
    field:
      | "facebookUrl"
      | "instagramUrl"
      | "twitterUrl"
      | "youtubeUrl"
      | "tiktokUrl",
    value: string,
  ) => {
    form.setValue(field, normalizeUrlWithHttps(value), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();

      formData.set("siteName", values.siteName);
      formData.set("siteEmail", values.siteEmail);
      formData.set("sitePhone", values.sitePhone);
      formData.set("siteLogoUrl", values.siteLogoUrl);
      formData.set("siteLogoKey", values.siteLogoKey);
      formData.set("supportEmail", values.supportEmail);
      formData.set("supportPhone", values.supportPhone);
      formData.set("whatsappPhone", values.whatsappPhone);
      formData.set("facebookUrl", normalizeUrlWithHttps(values.facebookUrl));
      formData.set("instagramUrl", normalizeUrlWithHttps(values.instagramUrl));
      formData.set("twitterUrl", normalizeUrlWithHttps(values.twitterUrl));
      formData.set("youtubeUrl", normalizeUrlWithHttps(values.youtubeUrl));
      formData.set("tiktokUrl", normalizeUrlWithHttps(values.tiktokUrl));
      formData.set("seoTitle", values.seoTitle);
      formData.set("seoDescription", values.seoDescription);

      const result = await updatePlatformSettings(formData);

      if (result.success) {
        toast.success("Site settings updated.");
        return;
      }

      toast.error(
        result.error ??
          "We couldn't save your site settings. Please review the form and try again.",
      );
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              disabled={isBusy}
              {...form.register("siteName")}
            />
            {form.formState.errors.siteName ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.siteName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteEmail-readonly-hint">Public Identity</Label>
            <div
              id="siteEmail-readonly-hint"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground"
            >
              This information is used to identify your site to customers and in
              communications.
            </div>
          </div>
        </CardContent>
      </Card>

      <SiteSettingsBrandingSection
        value={brandingValue}
        disabled={isBusy}
        onChange={(file) => {
          setSiteLogo(file);
          form.setValue("siteLogoUrl", file?.url ?? "", {
            shouldDirty: true,
            shouldValidate: true,
          });
          form.setValue("siteLogoKey", file?.key ?? "", {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
        onDelete={handleDeleteLogo}
      />

      <SiteSettingsContactSection
        siteEmail={form.watch("siteEmail")}
        siteEmailError={form.formState.errors.siteEmail?.message}
        disabled={isBusy}
        onSiteEmailChange={(value) =>
          form.setValue("siteEmail", value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />

      {renderPhoneField({
        field: "sitePhone",
        label: "Site Phone",
        error: form.formState.errors.sitePhone?.message,
      })}

      <Card>
        <CardHeader>
          <CardTitle>Support Channels</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-2 ">
          <div className="space-y-2 sm:col-span-2 xl:col-span-1">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              disabled={isBusy}
              {...form.register("supportEmail")}
            />
            {form.formState.errors.supportEmail ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.supportEmail.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:col-span-2 xl:col-span-2 xl:grid-cols-2 xl:items-start">
            {renderPhoneField({
              field: "supportPhone",
              label: "Support Phone",
              error: form.formState.errors.supportPhone?.message,
            })}
            {renderPhoneField({
              field: "whatsappPhone",
              label: "WhatsApp Phone",
              error: form.formState.errors.whatsappPhone?.message,
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input
              id="facebookUrl"
              disabled={isBusy}
              {...form.register("facebookUrl")}
              onBlur={(event) =>
                normalizeSocialField("facebookUrl", event.target.value)
              }
            />
            {form.formState.errors.facebookUrl ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.facebookUrl.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input
              id="instagramUrl"
              disabled={isBusy}
              {...form.register("instagramUrl")}
              onBlur={(event) =>
                normalizeSocialField("instagramUrl", event.target.value)
              }
            />
            {form.formState.errors.instagramUrl ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.instagramUrl.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterUrl">Twitter/X URL</Label>
            <Input
              id="twitterUrl"
              disabled={isBusy}
              {...form.register("twitterUrl")}
              onBlur={(event) =>
                normalizeSocialField("twitterUrl", event.target.value)
              }
            />
            {form.formState.errors.twitterUrl ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.twitterUrl.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube URL</Label>
            <Input
              id="youtubeUrl"
              disabled={isBusy}
              {...form.register("youtubeUrl")}
              onBlur={(event) =>
                normalizeSocialField("youtubeUrl", event.target.value)
              }
            />
            {form.formState.errors.youtubeUrl ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.youtubeUrl.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tiktokUrl">TikTok URL</Label>
            <Input
              id="tiktokUrl"
              disabled={isBusy}
              {...form.register("tiktokUrl")}
              onBlur={(event) =>
                normalizeSocialField("tiktokUrl", event.target.value)
              }
            />
            {form.formState.errors.tiktokUrl ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.tiktokUrl.message}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              disabled={isBusy}
              {...form.register("seoTitle")}
            />
            {form.formState.errors.seoTitle ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.seoTitle.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              rows={4}
              disabled={isBusy}
              {...form.register("seoDescription")}
            />
            {form.formState.errors.seoDescription ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.seoDescription.message}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isBusy}>
          {isBusy ? "Saving..." : "Save Site Settings"}
        </Button>
      </div>
    </form>
  );
}
