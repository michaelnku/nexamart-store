"use client";

import { updateSellerProfileModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StoreDTO } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function SellerStoreFormClient({ store }: { store: StoreDTO }) {
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: store.name,
    description: store.description ?? "",
    location: store.location ?? "",
    address: store.address ?? "",
  });

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("description", form.description);
        formData.append("location", form.location);
        formData.append("address", form.address);

        await updateSellerProfileModule(formData);

        toast.success("Store updated");
      } catch {
        toast.error("Failed to update store");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Store Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <Button onClick={handleSubmit} disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
