import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrentRole } from "@/lib/currentUser";
import { redirect } from "next/navigation";

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

export default async function AdminRoleSettingsPage() {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    redirect("/403");
  }

  return (
    <main className="space-y-6">
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
