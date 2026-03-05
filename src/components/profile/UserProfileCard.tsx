import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Mail } from "lucide-react";

type UserRole = "USER" | "ADMIN" | "RIDER" | "SELLER" | "MODERATOR" | "SYSTEM";

export type CurrentProfileUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  image: string | null;
  createdAt: Date;
};

type UserProfileCardProps = {
  user: CurrentProfileUser;
};

const ROLE_LABELS: Record<UserRole, string> = {
  USER: "User",
  ADMIN: "Admin",
  RIDER: "Rider",
  SELLER: "Seller",
  MODERATOR: "Moderator",
  SYSTEM: "System",
};

function getFullName(user: CurrentProfileUser) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || "Unnamed User";
}

function getInitials(user: CurrentProfileUser) {
  const fullName = getFullName(user);
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const fullName = getFullName(user);

  const joinedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(user.createdAt));

  const initials = getInitials(user);

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
      {/* subtle brand accent */}
      <div className="absolute top-0 left-0 h-1 w-full bg-[#3c9ee0]" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border border-[#3c9ee0]/20">
          <AvatarImage src={user.image ?? ""} alt={fullName} />
          <AvatarFallback className="bg-[#3c9ee0]/10 text-[#3c9ee0] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
            {fullName}
          </h2>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail size={14} />
            <span className="truncate">{user.email}</span>
          </div>

          <Badge
            variant="secondary"
            className="w-fit text-xs bg-[#3c9ee0]/10 text-[#3c9ee0]"
          >
            {ROLE_LABELS[user.role] ?? user.role}
          </Badge>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
        <div className="space-y-1">
          <p className="text-gray-500">Role</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">
            {ROLE_LABELS[user.role]}
          </p>
        </div>

        <div className="space-y-1 flex items-start gap-2">
          <CalendarDays size={16} className="text-gray-400 mt-[2px]" />
          <div>
            <p className="text-gray-500">Joined</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {joinedDate}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
