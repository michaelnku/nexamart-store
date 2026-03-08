import { CurrentUser } from "@/lib/currentUser";
import {
  getAdminStats,
  getRiderStats,
  getSellerStats,
} from "@/actions/dashboardState";
import AdminPage from "@/app/marketplace/_components/AdminPage";
import RiderPage from "@/app/marketplace/_components/RiderPage";
import SellerPage from "@/app/marketplace/_components/SellerPage";
import Link from "next/link";
import { redirect } from "next/navigation";

const page = async () => {
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role === "ADMIN") {
    const stats = await getAdminStats();
    return <AdminPage stats={stats} />;
  }

  if (user.role === "SELLER") {
    const stats = await getSellerStats();
    return <SellerPage stats={stats} />;
  }

  if (user.role === "RIDER") {
    const stats = await getRiderStats();
    return <RiderPage stats={stats} />;
  }

  if (user.role === "MODERATOR") {
    return (
      <main className="space-y-8 max-w-7xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Moderator Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Access moderation tools and monitor flagged platform activity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/marketplace/dashboard/moderator/reports"
            className="rounded-xl border bg-card p-5 hover:bg-muted/30"
          >
            <p className="text-sm font-medium">User Reports</p>
            <p className="text-xs text-muted-foreground mt-1">
              Review new and open reports
            </p>
          </Link>

          <Link
            href="/marketplace/dashboard/moderator/users"
            className="rounded-xl border bg-card p-5 hover:bg-muted/30"
          >
            <p className="text-sm font-medium">Moderate Users</p>
            <p className="text-xs text-muted-foreground mt-1">
              Inspect user status and actions
            </p>
          </Link>

          <Link
            href="/marketplace/dashboard/moderator/products"
            className="rounded-xl border bg-card p-5 hover:bg-muted/30"
          >
            <p className="text-sm font-medium">Products Review</p>
            <p className="text-xs text-muted-foreground mt-1">
              Validate listings and flags
            </p>
          </Link>

          <Link
            href="/marketplace/dashboard/moderator/ai"
            className="rounded-xl border bg-card p-5 hover:bg-muted/30"
          >
            <p className="text-sm font-medium">AI Moderation Center</p>
            <p className="text-xs text-muted-foreground mt-1">
              Manage automated moderation queues
            </p>
          </Link>
        </div>
      </main>
    );
  }

  redirect("/403");
};

export default page;
