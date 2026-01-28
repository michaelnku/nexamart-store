"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import SettingsCard from "@/components/settings/SettingsCard";
import { Plus, MapPin, Star, Trash2, Edit, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state?: string | null;
  country?: string | null;
  isDefault?: boolean;
};

const mockAddresses: Address[] = [
  {
    id: "1",
    fullName: "Michael Nku",
    phone: "+234 801 234 5678",
    street: "12 Admiralty Way",
    city: "Lekki",
    state: "Lagos",
    country: "Nigeria",
    isDefault: true,
  },
];

export default function AddressSection() {
  const [addresses] = useState<Address[]>(mockAddresses);

  return (
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
                className={`relative flex min-w-0 flex-col justify-between ${
                  address.isDefault
                    ? "border-[#3c9ee0] bg-[#3c9ee0]/5"
                    : "border-gray-200"
                }`}
              >
                {/* DEFAULT BADGE */}
                {address.isDefault && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-[#3c9ee0]">
                    <Star className="w-3 h-3" />
                    Default
                  </span>
                )}

                <CardContent className="p-4 flex min-w-0 flex-col justify-between h-full">
                  {/* ADDRESS INFO */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-medium text-sm sm:text-base">
                      <MapPin className="w-4 h-4 text-[#3c9ee0]" />
                      {address.fullName}
                    </div>

                    <p className="text-sm text-gray-700 leading-snug">
                      {address.street}, {address.city}
                      {address.state && `, ${address.state}`}
                    </p>

                    <p className="text-sm text-gray-500">{address.phone}</p>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#3c9ee0] border-[#3c9ee0]"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      {!address.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-600"
                        >
                          Set default
                        </Button>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 self-start sm:self-auto"
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

        {/* ADD ADDRESS */}
        <Button
          variant="outline"
          className="w-full border-dashed border-[#3c9ee0] text-[#3c9ee0] hover:bg-[#3c9ee0]/10 py-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add new address
        </Button>
      </div>
    </SettingsCard>
  );
}
