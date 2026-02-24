"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AddressOption = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string | null;
  country?: string;
  isDefault?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: AddressOption[];
  selectedAddressId?: string;
  onSelectAddress: (address: AddressOption) => void;
  onAddNewAddress: () => void;
};

export default function AddressSelectionModal({
  open,
  onOpenChange,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Delivery Address</DialogTitle>
          <DialogDescription>
            Choose one of your saved addresses for this checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55dvh] space-y-2 overflow-y-auto">
          {addresses.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectAddress(item)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                selectedAddressId === item.id
                  ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{item.fullName}</p>
                {item.isDefault ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    DEFAULT
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-gray-600">{item.phone}</p>
              <p className="text-sm text-gray-600">
                {item.street}, {item.city}
                {item.state ? `, ${item.state}` : ""}
                {item.country ? `, ${item.country}` : ""}
              </p>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAddNewAddress}>Add New Address</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
