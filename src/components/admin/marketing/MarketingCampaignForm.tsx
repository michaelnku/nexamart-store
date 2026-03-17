"use client";

import { MarketingCampaignStatus } from "@/generated/prisma";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type MarketingCampaignFormValues = {
  name: string;
  slug: string;
  description: string;
  status: MarketingCampaignStatus;
  themeKey: string;
  accentColor: string;
  notes: string;
  heroBannerId: string;
  startsAt: string;
  endsAt: string;
};

type HeroBannerOption = {
  id: string;
  label: string;
};

type MarketingCampaignFormProps = {
  mode: "create" | "edit";
  initialValues: MarketingCampaignFormValues;
  heroBannerOptions: HeroBannerOption[];
  disabled?: boolean;
  onSubmit: (values: MarketingCampaignFormValues) => void;
  onArchive?: () => void;
  onReset?: () => void;
};

const STATUS_OPTIONS = [
  MarketingCampaignStatus.DRAFT,
  MarketingCampaignStatus.ACTIVE,
  MarketingCampaignStatus.SCHEDULED,
  MarketingCampaignStatus.ARCHIVED,
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function labelEnumValue(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function MarketingCampaignForm({
  mode,
  initialValues,
  heroBannerOptions,
  disabled,
  onSubmit,
  onArchive,
  onReset,
}: MarketingCampaignFormProps) {
  const [values, setValues] = useState(initialValues);
  const [hasCustomSlug, setHasCustomSlug] = useState(
    Boolean(initialValues.slug),
  );

  useEffect(() => {
    setValues(initialValues);
    setHasCustomSlug(Boolean(initialValues.slug));
  }, [initialValues]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            Campaign name
          </label>
          <Input
            value={values.name}
            disabled={disabled}
            onChange={(event) => {
              const nextName = event.target.value;
              setValues((current) => ({
                ...current,
                name: nextName,
                slug: hasCustomSlug ? current.slug : slugify(nextName),
              }));
            }}
            placeholder="Black Friday"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            Campaign slug
          </label>
          <Input
            value={values.slug}
            disabled={disabled}
            onChange={(event) => {
              setHasCustomSlug(true);
              setValues((current) => ({
                ...current,
                slug: slugify(event.target.value),
              }));
            }}
            placeholder="black-friday"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900 dark:text-white">
          Description
        </label>
        <Textarea
          value={values.description}
          disabled={disabled}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Short summary for admins and merchandising context."
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            Status
          </label>
          <Select
            value={values.status}
            onValueChange={(status) =>
              setValues((current) => ({
                ...current,
                status: status as MarketingCampaignStatus,
              }))
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {labelEnumValue(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            Theme key
          </label>
          <Input
            value={values.themeKey}
            disabled={disabled}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                themeKey: event.target.value,
              }))
            }
            placeholder="holiday-emerald"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            Accent color
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="color"
              value={values.accentColor || "#1d4ed8"}
              disabled={disabled}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  accentColor: event.target.value,
                }))
              }
              className="h-11 w-16 p-1"
            />
            <Input
              value={values.accentColor}
              disabled={disabled}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  accentColor: event.target.value,
                }))
              }
              placeholder="#1d4ed8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            Hero banner
          </label>
          <Select
            value={values.heroBannerId || "__none__"}
            onValueChange={(value) =>
              setValues((current) => ({
                ...current,
                heroBannerId: value === "__none__" ? "" : value,
              }))
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="No linked banner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No linked banner</SelectItem>
              {heroBannerOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            Start date
          </label>
          <Input
            type="date"
            value={values.startsAt}
            disabled={disabled}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                startsAt: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            End date
          </label>
          <Input
            type="date"
            value={values.endsAt}
            disabled={disabled}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                endsAt: event.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900 dark:text-white">
          Internal notes
        </label>
        <Textarea
          value={values.notes}
          disabled={disabled}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              notes: event.target.value,
            }))
          }
          placeholder="Optional merchandising notes for the admin team."
          rows={3}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && onArchive ? (
            <Button
              type="button"
              variant="outline"
              onClick={onArchive}
              disabled={disabled || values.status === MarketingCampaignStatus.ARCHIVED}
            >
              Archive campaign
            </Button>
          ) : null}
          {onReset ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setValues(initialValues);
                setHasCustomSlug(Boolean(initialValues.slug));
                onReset();
              }}
              disabled={disabled}
            >
              Reset
            </Button>
          ) : null}
        </div>

        <Button type="submit" disabled={disabled}>
          {mode === "create" ? "Create campaign" : "Update campaign"}
        </Button>
      </div>
    </form>
  );
}
