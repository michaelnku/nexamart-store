import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketplaceSettingsModules } from "@/constants/settings-modules";

export default function SellerSettingsRoutePage() {
  const modules = MarketplaceSettingsModules.SELLER.cards;

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Seller Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your store profile, storefront, and seller preferences.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
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
