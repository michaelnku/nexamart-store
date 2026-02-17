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
    <div className="mx-auto h-[calc(100dvh-4rem)] w-full max-w-7xl overflow-hidden px-4 py-4 sm:px-6 md:py-6 lg:px-8">
      <div className="flex h-full items-start gap-6 overflow-hidden">
        <Dashboard />

        <main className="min-w-0 h-full flex-1 overflow-y-auto pb-2 pr-1 md:pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}
