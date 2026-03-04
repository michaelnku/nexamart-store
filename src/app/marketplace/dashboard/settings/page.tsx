import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ModeratorSettingsPage,
  SellerSettingsPage,
} from "../../_components/SettingsPage";
import { RiderSettingsPage } from "./_component/RiderSettingsPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const adminModules = [
  {
    href: "/marketplace/dashboard/settings/platform",
    title: "Platform Settings",
    description: "Core platform identity and contact information.",
  },
  {
    href: "/marketplace/dashboard/settings/shipping",
    title: "Shipping Settings",
    description: "Delivery fee, rate, and fulfillment pricing rules.",
  },
  {
    href: "/marketplace/dashboard/settings/payments",
    title: "Payment Settings",
    description: "Platform-level commission configuration.",
  },
  {
    href: "/marketplace/dashboard/settings/marketing",
    title: "Marketing Settings",
    description: "Brand assets and public-facing marketing identity.",
  },
  {
    href: "/marketplace/dashboard/settings/security",
    title: "Security Settings",
    description: "Security contact and administrative communication channels.",
  },
];

const page = async () => {
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const role = user.role;

  if (role === "ADMIN") {
    return (
      <main className="min-h-full bg-background py-4 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Admin Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure NexaMart by module.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminModules.map((module) => (
            <Card key={module.href}>
              <CardHeader>
                <CardTitle className="text-base">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
                <Button asChild>
                  <Link href={module.href}>Open Module</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }
  if (role === "SELLER") {
    return (
      <div className="min-h-full bg-background py-4">
        <SellerSettingsPage />
      </div>
    );
  }
  if (role === "RIDER") {
    return (
      <div className="min-h-full bg-background py-4">
        <RiderSettingsPage />
      </div>
    );
  }

  if (role === "MODERATOR") {
    return (
      <div className="min-h-full bg-background py-4">
        <ModeratorSettingsPage />
      </div>
    );
  }

  redirect("/403");
};

export default page;
