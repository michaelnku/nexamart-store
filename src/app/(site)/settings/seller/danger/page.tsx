"use client";

import { deleteStoreAction } from "@/actions/auth/store";
import { deleteSellerStoreModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoreState } from "@/lib/types";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

export default function SellerDangerSettingsPage() {
  const router = useRouter();

  const [deletingStore, setDeletingStore] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const [storeState, setStoreState] = useState<StoreState>({
    status: "loading",
  });

  if (storeState.status !== "active") return null;

  const store = storeState.store;

  //delete store
  const handleDeleteStore = async () => {
    if (!store) return;

    setDeletingStore(true);

    startTransition(async () => {
      try {
        const res = await deleteStoreAction(store.id);

        if (res?.error) {
          toast.error(res.error);
          setDeletingStore(false);
          return;
        }

        toast.success("Store deleted successfully");

        router.replace("/marketplace/dashboard");
      } catch {
        toast.error("Failed to delete store");
        setDeletingStore(false);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={deleteSellerStoreModule} className="space-y-4">
          <span className="text-sm text-muted-foreground">
            This action is <strong>permanent</strong> and cannot be undone.
          </span>
          <span>
            Your store, products, and storefront visibility will be removed.
          </span>

          <div className="space-y-2">
            <Label>Type &quot;DELETE MY STORE&quot; to confirm</Label>

            <Input
              value={confirmText}
              placeholder="DELETE MY STORE"
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="destructive"
            onClick={(e) => {
              handleDeleteStore();
            }}
            disabled={deletingStore || confirmText !== "DELETE MY STORE"}
          >
            {deletingStore ? "Deleting…" : "Delete my store"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
