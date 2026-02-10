"use client";

import { useState } from "react";
import { updateRiderSchedule } from "@/actions/rider/updateScheduleAction";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Schedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function RiderScheduleClient({
  initialSchedules,
}: {
  initialSchedules: Schedule[];
}) {
  const [loading, setLoading] = useState(false);

  const [schedules, setSchedules] = useState<Schedule[]>(
    DAYS.map((_, day) => {
      const existing = initialSchedules.find((s) => s.dayOfWeek === day);

      return (
        existing ?? {
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "18:00",
          isActive: false,
        }
      );
    }),
  );

  const updateField = (day: number, field: keyof Schedule, value: any) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s)),
    );
  };

  const saveSchedule = async () => {
    setLoading(true);

    try {
      for (const schedule of schedules) {
        if (!schedule.isActive) continue;

        await updateRiderSchedule(
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime,
        );
      }

      toast.success("Schedule updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <div
          key={schedule.dayOfWeek}
          className="flex items-center justify-between border rounded-lg p-4"
        >
          <div>
            <div className="font-medium">{DAYS[schedule.dayOfWeek]}</div>
            <div className="flex gap-2 mt-2">
              <Input
                type="time"
                value={schedule.startTime}
                disabled={!schedule.isActive}
                onChange={(e) =>
                  updateField(schedule.dayOfWeek, "startTime", e.target.value)
                }
              />
              <Input
                type="time"
                value={schedule.endTime}
                disabled={!schedule.isActive}
                onChange={(e) =>
                  updateField(schedule.dayOfWeek, "endTime", e.target.value)
                }
              />
            </div>
          </div>

          <Switch
            checked={schedule.isActive}
            onCheckedChange={(checked) =>
              updateField(schedule.dayOfWeek, "isActive", checked)
            }
          />
        </div>
      ))}

      <div className="pt-4">
        <Button onClick={saveSchedule} disabled={loading}>
          {loading ? "Saving..." : "Save Schedule"}
        </Button>
      </div>
    </div>
  );
}
