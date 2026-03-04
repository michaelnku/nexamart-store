import { updateSellerProfileModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import Link from "next/link";

export default async function SellerProfileSettingsPage() {
  const store = await getCurrentSellerStore();

  if (!store) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Your Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You do not have a store yet. Create one to manage seller settings.
          </p>
          <Button asChild>
            <Link href="/marketplace/dashboard/seller/store/create-store">
              Create Store
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateSellerProfileModule} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Store Name
            </label>
            <Input id="name" name="name" defaultValue={store.name} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              name="description"
              defaultValue={store.description ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Location
            </label>
            <Input
              id="location"
              name="location"
              defaultValue={store.location ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Address
            </label>
            <Input id="address" name="address" defaultValue={store.address ?? ""} />
          </div>
          <Button type="submit">Save Profile</Button>
        </form>
      </CardContent>
    </Card>
  );
}
