import { getSiteConfig } from "@/lib/getSiteConfig";
import SiteSettingsForm from "../_component/SiteSettingsForm";

export default async function Page() {
  const config = await getSiteConfig();

  return (
    <div>
      <h1 className="text-xl font-semibold">Site Settings</h1>

      <SiteSettingsForm config={config} />
    </div>
  );
}
