"use client";

import { updateSellerPreferencesModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StoreDTO } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

export default function SellerPreferencesClient({
  store,
}: {
  store: StoreDTO;
}) {
  const [isActive, setIsActive] = useState(store.isActive);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    store.emailNotificationsEnabled,
  );

  const save = async () => {
    const formData = new FormData();

    if (isActive) formData.append("isActive", "on");
    if (emailNotificationsEnabled)
      formData.append("emailNotificationsEnabled", "on");

    await updateSellerPreferencesModule(formData);

    toast.success("Preferences updated");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Preferences</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex justify-between">
          <Label>Enable Storefront</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <div className="flex justify-between">
          <Label>Email Notifications</Label>
          <Switch
            checked={emailNotificationsEnabled}
            onCheckedChange={setEmailNotificationsEnabled}
          />
        </div>

        <Button onClick={save}>Save</Button>
      </CardContent>
    </Card>
  );
}
