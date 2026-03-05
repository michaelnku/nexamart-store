import { StaffProfileDTO } from "@/lib/types";
import { Button } from "../ui/button";
import Link from "next/link";

type StaffProfileCardProps = {
  staffProfile?: StaffProfileDTO;
};

export function StaffProfileCard({ staffProfile }: StaffProfileCardProps) {
  void staffProfile;

  return (
    <section className="rounded-2xl bg-white dark:bg-neutral-900 border p-6 space-y-5 shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-400">
        Staff Profile
      </h2>
      <div className="space-y-2">
        <p className=" text-sm text-gray-600">
          Staff profile information will appear here.
        </p>
        <Button variant={"outline"} className="text-gray-600">
          <Link href={"/profile/staff"}>Create Staff Profile</Link>
        </Button>
      </div>
    </section>
  );
}
