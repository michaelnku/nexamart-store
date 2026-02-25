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

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md">
      <div className="flex items-start gap-4">
        {user.image ? (
          <img
            src={user.image}
            alt={fullName}
            className="h-16 w-16 rounded-full border-2 border-[#3c9ee0]/20 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3c9ee0]/10 text-lg font-semibold text-[#3c9ee0]">
            {getInitials(user)}
          </div>
        )}

        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-xl font-semibold text-gray-900">
            {fullName}
          </h1>
          <p className="truncate text-sm text-gray-600">{user.email}</p>
          <span className="inline-flex rounded-full bg-[#3c9ee0]/10 px-3 py-1 text-xs font-medium text-[#3c9ee0]">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="text-sm text-gray-500">Joined</p>
        <p className="text-sm font-medium text-gray-800">{joinedDate}</p>
      </div>
    </section>
  );
}
