"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import SettingsCard from "@/components/settings/SettingsCard";
import { Plus, MapPin, Star, Trash2, Edit, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import AddressForm from "@/components/checkout/AddressForm";
import { useRouter } from "next/navigation";
import { Address } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/actions/checkout/addressAction";
import DeleteAddressModal from "@/components/modal/DeleteAddressModal";

type Props = {
  addresses: Address[];
};

export default function AddressSection({ addresses }: Props) {
  const router = useRouter();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);

  const [isPending, startTransition] = useTransition();

  const setDefault = (id: string) => {
    startTransition(async () => {
      const res = await setDefaultAddressAction(id);
      if ("error" in res) return;
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await deleteAddressAction(deleteTarget.id);
      if ("error" in res) return;

      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <>
      <SettingsCard title="Addresses">
        <div className="space-y-5">
          {addresses.length === 0 ? (
            <p className="text-sm text-gray-500">
              You have not added any delivery addresses yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  className={cn(
                    "relative min-w-0 border bg-white transition",
                    address.isDefault && "border-[#3c9ee0] bg-[#3c9ee0]/5",
                  )}
                >
                  {/* BADGES */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {/* LABEL */}
                    <span className="rounded-full bg-gray-100 px-2 py-[2px] text-xs font-medium text-gray-700">
                      {address.label}
                    </span>

                    {/* DEFAULT */}
                    {address.isDefault && (
                      <span className="flex items-center gap-1 rounded-full bg-[#3c9ee0]/10 px-2 py-[2px] text-xs font-medium text-[#3c9ee0]">
                        <Star className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-4 min-w-0">
                    {/* INFO */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin className="w-4 h-4 text-[#3c9ee0]" />
                        <span className="truncate">{address.fullName}</span>
                      </div>

                      <p className="text-sm text-gray-700 break-words">
                        {address.street}, {address.city}
                        {address.state && `, ${address.state}`}
                      </p>

                      <p className="text-sm text-gray-500">{address.phone}</p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-wrap justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(address);
                          setOpenForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => setDeleteTarget(address)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ADD */}
          <Button
            variant="outline"
            className="w-full border-dashed border-[#3c9ee0] text-[#3c9ee0] py-6 hover:bg-[#3c9ee0]/10"
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add new address
          </Button>
        </div>
      </SettingsCard>

      {/* ADD / EDIT MODAL */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Address" : "Add Delivery Address"}
            </DialogTitle>
            <DialogDescription>
              This address will be used for checkout and deliveries.
            </DialogDescription>
          </DialogHeader>

          <AddressForm
            initialData={editing ?? undefined}
            onSuccess={() => {
              setOpenForm(false);
              setEditing(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <DeleteAddressModal
        open={!!deleteTarget}
        address={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </>
  );
}
