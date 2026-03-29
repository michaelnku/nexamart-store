import { AdminSiteSettingsForm } from "@/components/site/AdminSiteSettingsForm";
import { getAdminSiteConfiguration } from "@/lib/site-config/siteConfig.service";

export default async function PlatformSettingsPage() {
  const config = await getAdminSiteConfiguration();

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage the core platform information, branding, and public-facing
          identity.
        </p>
      </div>
      <AdminSiteSettingsForm config={config} />
    </main>
  );
}
