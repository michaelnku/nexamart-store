"use client";

import { useState } from "react";
import { deleteRiderProfileModule } from "@/actions/settings/riderModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RiderDangerFormClient() {
  const [confirmText, setConfirmText] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={deleteRiderProfileModule} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will permanently delete your rider profile.
          </p>

          <div className="space-y-2">
            <Label>Type "CLEAR PROFILE"</Label>

            <Input
              name="confirmation"
              placeholder="CLEAR PROFILE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Deactivate Rider Profile</Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={confirmText !== "CLEAR PROFILE"}
            >
              Delete Rider Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
