"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

import {
  AnalyticsDatePreset,
  getPresetLabel,
  parseDateInputValue,
  toDateInputValue,
} from "@/lib/analytics/date-range";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AnalyticsDateRangeFilterProps = {
  preset: AnalyticsDatePreset;
  startDate: string;
  endDate: string;
  disabled?: boolean;
  onPresetChange: (preset: AnalyticsDatePreset) => void;
  onCustomRangeApply: (values: { startDate: string; endDate: string }) => void;
  className?: string;
};

const PRESETS: AnalyticsDatePreset[] = ["7d", "30d", "90d", "12m", "custom"];

export function AnalyticsDateRangeFilter({
  preset,
  startDate,
  endDate,
  disabled,
  onPresetChange,
  onCustomRangeApply,
  className,
}: AnalyticsDateRangeFilterProps) {
  const [draftStartDate, setDraftStartDate] = useState(
    toDateInputValue(new Date(startDate)),
  );
  const [draftEndDate, setDraftEndDate] = useState(
    toDateInputValue(new Date(endDate)),
  );

  useEffect(() => {
    setDraftStartDate(toDateInputValue(new Date(startDate)));
    setDraftEndDate(toDateInputValue(new Date(endDate)));
  }, [startDate, endDate]);

  const validationMessage = useMemo(() => {
    const parsedStartDate = parseDateInputValue(draftStartDate, "start");
    const parsedEndDate = parseDateInputValue(draftEndDate, "end");

    if (!draftStartDate || !draftEndDate) {
      return "Select both a start date and an end date.";
    }

    if (!parsedStartDate || !parsedEndDate) {
      return "Enter a valid date range.";
    }

    if (parsedStartDate > parsedEndDate) {
      return "Start date cannot be after end date.";
    }

    return null;
  }, [draftEndDate, draftStartDate]);

  const hasDraftChanges =
    draftStartDate !== toDateInputValue(new Date(startDate)) ||
    draftEndDate !== toDateInputValue(new Date(endDate));

  return (
    <div
      className={cn(
        "rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.4)] dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <Button
              key={item}
              type="button"
              variant={preset === item ? "default" : "outline"}
              size="sm"
              disabled={disabled}
              onClick={() => onPresetChange(item)}
              className={cn(
                "rounded-full",
                preset === item
                  ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  : "",
              )}
            >
              {item === "custom" ? (
                <CalendarDays className="h-3.5 w-3.5" />
              ) : null}
              {getPresetLabel(item)}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Start date
            </span>
            <Input
              type="date"
              value={draftStartDate}
              disabled={disabled}
              onChange={(event) => setDraftStartDate(event.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              End date
            </span>
            <Input
              type="date"
              value={draftEndDate}
              disabled={disabled}
              onChange={(event) => setDraftEndDate(event.target.value)}
            />
          </label>

          <Button
            type="button"
            variant="outline"
            disabled={disabled || !hasDraftChanges || validationMessage !== null}
            onClick={() => {
              const nextStart = parseDateInputValue(draftStartDate, "start");
              const nextEnd = parseDateInputValue(draftEndDate, "end");

              if (!nextStart || !nextEnd || nextStart > nextEnd) {
                return;
              }

              onCustomRangeApply({
                startDate: nextStart.toISOString(),
                endDate: nextEnd.toISOString(),
              });
            }}
            className="sm:min-w-24"
          >
            Apply
          </Button>
        </div>
      </div>

      {validationMessage ? (
        <p className="mt-3 text-xs text-rose-600 dark:text-rose-300">
          {validationMessage}
        </p>
      ) : hasDraftChanges ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
          Review the draft range, then apply it to refresh analytics.
        </p>
      ) : null}
    </div>
  );
}
