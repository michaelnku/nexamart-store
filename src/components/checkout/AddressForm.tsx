"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { saveAddressAction } from "@/actions/checkout/saveAddressAction";

export default function AddressForm({ onSuccess }: { onSuccess: () => void }) {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    latitude: lat,
    longitude: lng,
  });

  const handleChange = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () =>
    startTransition(async () => {
      const res = await saveAddressAction(form);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Address saved successfully!");
      onSuccess();
    });

  return (
    <div className="space-y-4">
      {/* Input Fields */}
      <div className="space-y-1">
        <Label>Full Name</Label>
        <Input
          value={form.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>Phone Number</Label>
        <Input
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>Street Address</Label>
        <Input
          value={form.street}
          onChange={(e) => handleChange("street", e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <div className="space-y-1 flex-1">
          <Label>City</Label>
          <Input
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>
        <div className="space-y-1 flex-1">
          <Label>State</Label>
          <Input
            value={form.state}
            onChange={(e) => handleChange("state", e.target.value)}
          />
        </div>
        <div className="space-y-1 flex-1">
          <Label>Country</Label>
          <Input
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
          />
        </div>
      </div>

      <Button disabled={pending} onClick={handleSubmit} className="w-full">
        {pending ? "Saving..." : "Save Address"}
      </Button>
    </div>
  );
}
