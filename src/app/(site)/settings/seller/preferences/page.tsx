"use client";

import { updateSellerPreferencesModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import { StoreDTO, StoreState } from "@/lib/types";
import { useState } from "react";

export default function SellerPreferencesSettingsPage() {
  const [storeState, setStoreState] = useState<StoreState>({
    status: "loading",
  });

  const setStore = (updates: Partial<StoreDTO>) => {
    setStoreState((prev) => {
      if (prev.status !== "active") return prev;

      return {
        status: "active",
        store: {
          ...prev.store,
          ...updates,
        },
      };
    });
  };

  if (storeState.status !== "active") return null;

  const store = storeState.store;

  return (
    <>
      {/* PREFERENCES SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Store Preferences</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Label>Enable Storefront</Label>
            <Switch
              checked={store.isActive}
              onCheckedChange={(checked) =>
                setStore({ ...store, isActive: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label>Email Notifications</Label>
            <Switch
              checked={store.emailNotificationsEnabled}
              onCheckedChange={(checked) =>
                setStore({ ...store, emailNotificationsEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
