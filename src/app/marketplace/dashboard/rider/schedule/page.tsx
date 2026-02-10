import { prisma } from "@/lib/prisma";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import RiderScheduleClient from "@/components/rider/RiderScheduleClient";

export default async function RiderSchedulePage() {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId || role !== "RIDER") {
    redirect("/");
  }

  const schedules = await prisma.riderSchedule.findMany({
    where: { riderId: userId },
    orderBy: { dayOfWeek: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-900">Schedule</h1>
      <p className="py-2 text-sm text-zinc-600">
        Set your availability and delivery schedule.
      </p>

      <RiderScheduleClient initialSchedules={schedules} />
    </div>
  );
}
