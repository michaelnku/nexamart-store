import { StaffProfileDTO } from "@/lib/types";
import { Button } from "../ui/button";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User, Briefcase, Calendar, ShieldCheck, IdCard } from "lucide-react";

type StaffProfileCardProps = {
  staffProfile?: StaffProfileDTO;
};

export function StaffProfileCard({ staffProfile }: StaffProfileCardProps) {
  const prettify = (value: string) => value.replaceAll("_", " ");

  const joinedAt = staffProfile
    ? new Date(staffProfile.joinedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const initials =
    staffProfile?.firstName && staffProfile?.lastName
      ? `${staffProfile.firstName[0]}${staffProfile.lastName[0]}`
      : "ST";

  return (
    <section className="rounded-2xl border bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Staff Profile
        </h2>

        {staffProfile && (
          <Badge variant="secondary" className="text-xs">
            {prettify(staffProfile.verificationStatus)}
          </Badge>
        )}
      </div>

      {staffProfile ? (
        <>
          <span className="text-gray-600 inline-flex gap-2 items-center">
            Department:
            <p className="text-sm text-gray-500">
              {staffProfile.department ?? "No department assigned"}
            </p>
          </span>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <IdCard size={16} />
              <span>{staffProfile.staffId}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Briefcase size={16} />
              <span>
                {staffProfile.employmentType
                  ? prettify(staffProfile.employmentType)
                  : "Not set"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Calendar size={16} />
              <span>{joinedAt}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <ShieldCheck size={16} />
              <span>{prettify(staffProfile.status)}</span>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2">
            <Button asChild className="w-full">
              <Link href="/profile/staff">Manage Staff Profile</Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <p>Staff profile information will appear here once created.</p>

          <Button asChild variant="outline" className="w-full">
            <Link href="/profile/staff">Create Staff Profile</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
