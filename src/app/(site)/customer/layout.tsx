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
    <div className="h-screen overflow-hidden flex bg-background">
      <aside className="hidden md:flex h-full w-64 shrink-0 bg-white dark:bg-neutral-950 border-r">
        <Dashboard />
      </aside>

      <main className="flex-1 h-full overflow-y-auto px-4 md:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
