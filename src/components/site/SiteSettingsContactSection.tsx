"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SiteSettingsContactSectionProps = {
  siteEmail: string;
  siteEmailError?: string;
  disabled?: boolean;
  onSiteEmailChange: (value: string) => void;
};

export function SiteSettingsContactSection({
  siteEmail,
  siteEmailError,
  disabled = false,
  onSiteEmailChange,
}: SiteSettingsContactSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Support</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="siteEmail">Site Email</Label>
          <Input
            id="siteEmail"
            type="email"
            value={siteEmail}
            disabled={disabled}
            onChange={(event) => onSiteEmailChange(event.target.value)}
          />
          {siteEmailError ? (
            <p className="text-sm text-destructive">{siteEmailError}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
