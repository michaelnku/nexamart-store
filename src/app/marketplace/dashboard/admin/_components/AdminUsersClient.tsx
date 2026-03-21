"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Bike,
  Building2,
  CheckCircle2,
  Mail,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { updateAdminManagedUserRole } from "@/actions/admin/updateUserRole";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADMIN_ASSIGNABLE_USER_ROLES,
  ADMIN_ROLE_FILTER_LABELS,
  ADMIN_USERS_SORT_LABELS,
  type AdminManageableUser,
  type AdminManageableUsersResult,
  type AdminUsersPageConfig,
  type AdminUsersSort,
  USER_ROLE_LABELS,
} from "@/lib/admin/user-management.shared";
import { cn } from "@/lib/utils";

type Props = {
  data: AdminManageableUsersResult;
  config: AdminUsersPageConfig;
  currentAdminId: string;
};

function buildQueryString(
  current: URLSearchParams,
  updates: Record<string, string | number | null | undefined>,
) {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }

  return next.toString();
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function getRoleBadgeClass(role: AdminManageableUser["role"]) {
  switch (role) {
    case "SELLER":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "RIDER":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "MODERATOR":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "ADMIN":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "SYSTEM":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "USER":
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getInitials(user: AdminManageableUser) {
  const source = user.name?.trim() || user.email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function UserIndicators({ user }: { user: AdminManageableUser }) {
  return (
    <div className="flex flex-wrap gap-2">
      {user.emailVerified ? (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Email verified
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Email unverified
        </Badge>
      )}

      {user.isBanned ? (
        <Badge
          variant="outline"
          className="border-rose-200 bg-rose-50 text-rose-700"
        >
          Banned
        </Badge>
      ) : null}

      {user.store ? (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <Store className="h-3.5 w-3.5" />
          {user.store.isVerified ? "Verified store" : "Store on file"}
        </Badge>
      ) : null}

      {user.riderProfile ? (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          <Bike className="h-3.5 w-3.5" />
          {user.riderProfile.isAvailable ? "Available rider" : "Rider profile"}
        </Badge>
      ) : null}

      {user.staffProfile ? (
        <Badge
          variant="outline"
          className="border-sky-200 bg-sky-50 text-sky-700"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {user.staffProfile.department || "Staff profile"}
        </Badge>
      ) : null}
    </div>
  );
}

function UserRoleMenu({
  currentAdminId,
  user,
}: {
  currentAdminId: string;
  user: AdminManageableUser;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const disabledReason =
    currentAdminId === user.id
      ? "You cannot change your own role."
      : user.isRoleProtected
        ? "Protected accounts are managed outside this panel."
        : null;

  const handleRoleUpdate = (role: (typeof ADMIN_ASSIGNABLE_USER_ROLES)[number]) => {
    if (disabledReason || role === user.role) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = await updateAdminManagedUserRole({
          userId: user.id,
          role,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success(result.success);
        router.refresh();
      })();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={Boolean(disabledReason) || isPending}
          className="min-w-[7rem] justify-between"
        >
          {disabledReason ? "Locked" : isPending ? "Saving..." : "Change role"}
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Assign access</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ADMIN_ASSIGNABLE_USER_ROLES.map((role) => (
          <DropdownMenuItem
            key={role}
            disabled={role === user.role}
            onSelect={(event) => {
              event.preventDefault();
              handleRoleUpdate(role);
            }}
          >
            <span>{USER_ROLE_LABELS[role]}</span>
            {role === user.role ? (
              <span className="ml-auto text-xs text-muted-foreground">
                Current
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
        {disabledReason ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {disabledReason}
            </DropdownMenuLabel>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserIdentity({ user }: { user: AdminManageableUser }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar size="lg" className="ring-2 ring-slate-100">
        <AvatarImage
          src={user.profileAvatar?.url || undefined}
          alt={user.name || user.email}
        />
        <AvatarFallback>{getInitials(user)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
            {user.name?.trim() || user.email}
          </p>
          <Badge
            variant="outline"
            className={cn("border", getRoleBadgeClass(user.role))}
          >
            {USER_ROLE_LABELS[user.role]}
          </Badge>
          {user.isRoleProtected ? (
            <Badge
              variant="outline"
              className="border-violet-200 bg-violet-50 text-violet-700"
            >
              Protected
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </span>
          {user.username ? (
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />@{user.username}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function UserSignals({ user }: { user: AdminManageableUser }) {
  const items: ReactNode[] = [];

  if (user.store) {
    items.push(
      <div key="store" className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Store
        </p>
        <div className="text-sm text-slate-700 dark:text-zinc-300">
          <p className="font-medium">{user.store.name}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {user.store.isSuspended
              ? "Suspended"
              : user.store.isActive
                ? "Active storefront"
                : "Setup in progress"}
          </p>
        </div>
      </div>,
    );
  }

  if (user.riderProfile) {
    items.push(
      <div key="rider" className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Rider
        </p>
        <div className="text-sm text-slate-700 dark:text-zinc-300">
          <p className="font-medium">
            {user.riderProfile.vehicleType || "Operations profile"}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {user.riderProfile.isVerified ? "Verified" : "Verification pending"}
          </p>
        </div>
      </div>,
    );
  }

  if (user.staffProfile) {
    items.push(
      <div key="staff" className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Staff
        </p>
        <div className="text-sm text-slate-700 dark:text-zinc-300">
          <p className="font-medium">{user.staffProfile.department || "Ops team"}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {user.staffProfile.status.toLowerCase()}
          </p>
        </div>
      </div>,
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Account
        </p>
        <div className="text-sm text-slate-700 dark:text-zinc-300">
          <p className="font-medium">Marketplace user</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            No seller, rider, or staff profile attached
          </p>
        </div>
      </div>
    );
  }

  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items}</div>;
}

export default function AdminUsersClient({
  data,
  config,
  currentAdminId,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigation] = useTransition();
  const [query, setQuery] = useState(data.filters.query);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();

    if (data.filters.query) {
      params.set("query", data.filters.query);
    }

    if (data.filters.sort !== "newest") {
      params.set("sort", data.filters.sort);
    }

    if (data.pagination.page > 1) {
      params.set("page", String(data.pagination.page));
    }

    return params;
  }, [data.filters.query, data.filters.sort, data.pagination.page]);

  const navigateWith = (updates: Record<string, string | number | null>) => {
    const nextQuery = buildQueryString(searchParams, updates);

    startNavigation(() => {
      router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    });
  };

  const handleSearchSubmit = () => {
    navigateWith({
      query: query.trim() || null,
      page: null,
    });
  };

  const pageLinks = {
    previous: buildQueryString(searchParams, {
      page: data.pagination.page - 1,
    }),
    next: buildQueryString(searchParams, {
      page: data.pagination.page + 1,
    }),
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr]">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              placeholder="Search by name, email, username, or store"
              className="h-11 rounded-xl border-slate-200 pl-9"
            />
          </div>
          <Button
            onClick={handleSearchSubmit}
            className="h-11 rounded-xl px-4"
            disabled={isNavigating}
          >
            Search
          </Button>
        </div>

        <Select
          value={data.filters.sort}
          onValueChange={(value) =>
            navigateWith({ sort: value, page: null })
          }
          disabled={isNavigating}
        >
          <SelectTrigger className="h-11 w-full rounded-xl border-slate-200">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Sort users" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ADMIN_USERS_SORT_LABELS) as AdminUsersSort[]).map(
              (sort) => (
                <SelectItem key={sort} value={sort}>
                  {ADMIN_USERS_SORT_LABELS[sort]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        <div className="flex items-center rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
          <Building2 className="mr-2 h-4 w-4 text-slate-400" />
          {ADMIN_ROLE_FILTER_LABELS[config.roleFilter]}
          <span className="ml-auto font-semibold text-slate-900 dark:text-white">
            {data.pagination.totalItems}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
        <Badge
          variant="outline"
          className="border-slate-200 bg-white text-slate-600"
        >
          {data.pagination.totalItems} total matches
        </Badge>
        <Badge
          variant="outline"
          className="border-slate-200 bg-white text-slate-600"
        >
          Page {data.pagination.page} of {data.pagination.totalPages}
        </Badge>
        {data.filters.query ? (
          <Badge
            variant="outline"
            className="border-sky-200 bg-sky-50 text-sky-700"
          >
            Query: {data.filters.query}
          </Badge>
        ) : null}
      </div>

      {data.items.length === 0 ? (
        <Empty className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 py-16 dark:border-zinc-800 dark:bg-zinc-950/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No users found</EmptyTitle>
            <EmptyDescription>{config.emptyStateText}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-950 lg:block">
            <table className="min-w-full divide-y divide-slate-200/80 dark:divide-zinc-800">
              <thead className="bg-slate-50/80 dark:bg-zinc-900/60">
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                  <th className="px-6 py-4 font-medium">Identity</th>
                  <th className="px-6 py-4 font-medium">Profile signals</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800">
                {data.items.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="px-6 py-5">
                      <div className="space-y-3">
                        <UserIdentity user={user} />
                        <UserIndicators user={user} />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <UserSignals user={user} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2 text-sm text-slate-600 dark:text-zinc-300">
                        <p>{user.isBanned ? "Restricted account" : "Active access"}</p>
                        <p>
                          {user.isRoleProtected
                            ? "Admin-protected"
                            : USER_ROLE_LABELS[user.role]}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-zinc-300">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end">
                        <UserRoleMenu
                          currentAdminId={currentAdminId}
                          user={user}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {data.items.map((user) => (
              <Card
                key={user.id}
                className="gap-0 overflow-hidden rounded-[24px] border-slate-200/80 py-0 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-950"
              >
                <CardHeader className="grid gap-4 p-5 sm:p-6 @[28rem]/card-header:grid-cols-[minmax(0,1fr)_auto] @[28rem]/card-header:items-start">
                  <UserIdentity user={user} />
                  <CardAction className="col-auto row-auto justify-self-start self-auto @[28rem]/card-header:justify-self-end">
                    <UserRoleMenu currentAdminId={currentAdminId} user={user} />
                  </CardAction>
                </CardHeader>

                <CardContent className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
                  <UserIndicators user={user} />

                  <div className="rounded-[20px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <UserSignals user={user} />
                  </div>

                  <div className="grid gap-3 rounded-[20px] border border-slate-200/70 bg-white/80 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950/60 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Status
                      </p>
                      <div className="text-sm text-slate-700 dark:text-zinc-300">
                        <p className="font-medium">
                          {user.isBanned ? "Restricted account" : "Active access"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          {user.isRoleProtected
                            ? "Admin-protected"
                            : USER_ROLE_LABELS[user.role]}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Joined
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-slate-200/70 px-5 py-4 text-sm text-slate-500 dark:border-zinc-800 dark:text-zinc-400 sm:px-6">
                  Review and update access
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {data.pagination.totalPages > 1 ? (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              {data.pagination.hasPreviousPage ? (
                <PaginationPrevious
                  href={pageLinks.previous ? `${pathname}?${pageLinks.previous}` : pathname}
                />
              ) : (
                <PaginationPrevious
                  aria-disabled="true"
                  className="pointer-events-none opacity-50"
                />
              )}
            </PaginationItem>
            <PaginationItem>
              <Badge
                variant="outline"
                className="h-9 rounded-md border-slate-200 px-3 text-slate-600"
              >
                {data.pagination.page} / {data.pagination.totalPages}
              </Badge>
            </PaginationItem>
            <PaginationItem>
              {data.pagination.hasNextPage ? (
                <PaginationNext
                  href={pageLinks.next ? `${pathname}?${pageLinks.next}` : pathname}
                />
              ) : (
                <PaginationNext
                  aria-disabled="true"
                  className="pointer-events-none opacity-50"
                />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
