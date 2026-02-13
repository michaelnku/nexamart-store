import { CurrentUser } from "@/lib/currentUser";
import Dashboard from "../../../components/layout/Dashboard";
import { redirect } from "next/navigation";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await CurrentUser();

  if (!user) redirect("/auth/login");
  if (user.role !== "USER") redirect("/marketplace/dashboard");

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-background">
      <aside className="hidden md:flex h-full w-64 shrink-0 border-r bg-white dark:bg-neutral-950">
        <Dashboard />
      </aside>

      <main className="h-full min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8">
        {children}
      </main>
    </div>
  );
}
