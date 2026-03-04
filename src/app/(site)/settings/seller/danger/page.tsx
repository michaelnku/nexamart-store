import { deleteSellerStoreModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SellerDangerSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={deleteSellerStoreModule} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This permanently deletes your store. Type{" "}
            <span className="font-semibold">DELETE MY STORE</span> to confirm.
          </p>
          <div className="space-y-2">
            <Label htmlFor="confirmation">Confirmation</Label>
            <Input
              id="confirmation"
              name="confirmation"
              placeholder="DELETE MY STORE"
              required
            />
          </div>
          <Button type="submit" variant="destructive">
            Delete Store
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
