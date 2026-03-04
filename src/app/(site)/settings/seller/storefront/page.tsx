import { updateSellerStorefrontModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";

export default async function SellerStorefrontSettingsPage() {
  const store = await getCurrentSellerStore();
  if (!store) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storefront</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateSellerStorefrontModule} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" defaultValue={store.tagline ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input id="logo" name="logo" defaultValue={store.logo ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bannerImage">Banner URL</Label>
            <Input
              id="bannerImage"
              name="bannerImage"
              defaultValue={store.bannerImage ?? ""}
            />
          </div>
          <Button type="submit">Save Storefront</Button>
        </form>
      </CardContent>
    </Card>
  );
}
