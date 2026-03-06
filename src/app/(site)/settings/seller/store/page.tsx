"use client";

import { reverseGeocodeFromCoords } from "@/actions/location/reverseGeocode";
import { updateSellerProfileModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AddressSuggestion,
  useAddressAutocomplete,
} from "@/hooks/useAddressAutocomplete";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getCurrentSellerStore } from "@/lib/settings/getCurrentSellerStore";
import { StoreDTO, StoreState } from "@/lib/types";
import { Loader2, LocateFixed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function SellerProfileSettingsPage() {
  const user = useCurrentUser();
  const router = useRouter();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const [selectionError, setSelectionError] = useState<string | null>(null);

  const [locating, setLocating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [storeState, setStoreState] = useState<StoreState>({
    status: "loading",
  });

  const [addressSelectionValid, setAddressSelectionValid] = useState(true);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const { suggestions, loading, error, search, clear } =
    useAddressAutocomplete();

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

  // SELLER WITHOUT A STORE
  const handleCreateStore = () => {
    startTransition(() => {
      router.push("/marketplace/dashboard/seller/store/create-store");
    });
  };

  if (storeState.status === "deleted") {
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 space-y-6 text-center py-10 sm:py-12">
        <h1 className="text-xl sm:text-2xl font-semibold">Store Closed</h1>

        <div>
          <p className="text-muted-foreground">
            Your store has been permanently closed and is no longer visible on
            NexaMart.
          </p>

          <p className="text-sm text-muted-foreground">
            If this was a mistake or you would like to reopen your store, please
            contact support.
          </p>
        </div>

        <Button variant="outline" asChild>
          <a href="mailto:support@shopnexamart.com">Contact Support</a>
        </Button>
      </main>
    );
  }

  if (storeState.status !== "active") return null;

  const store = storeState.store;

  if (store === null) {
    return (
      <main className="space-y-8 max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Your Store</h1>
        <p className="text-gray-500">
          You don&apos;t have a store yet. Set up your store to start selling on
          NexaMart.
        </p>
        <Button
          onClick={handleCreateStore}
          disabled={isPending}
          className="disabled:opacity-70 disabled:cursor-not-allowed bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white px-5 py-3 rounded-lg text-lg"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Please wait...</span>
            </div>
          ) : (
            "Create Store"
          )}
        </Button>
      </main>
    );
  }

  const handleSelectStoreAddress = (suggestion: AddressSuggestion) => {
    setStore({ address: suggestion.place_name });
    setSelectedAddressId(suggestion.id);
    setAddressSelectionValid(true);
    setShowAddressSuggestions(false);
    clear();
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setSelectionError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const feature = await reverseGeocodeFromCoords({
            latitude,
            longitude,
          });

          if (!feature) {
            toast.error("Could not determine address from location.");
            return;
          }

          const typedSuggestion: AddressSuggestion = {
            id: feature.id ?? "current-location",
            place_name: feature.place_name,
            text: feature.text ?? "",
            address: feature.address ?? "",
            center: feature.center as [number, number],
            context: feature.context ?? [],
          };
          handleSelectStoreAddress(typedSuggestion);
        } catch (err) {
          console.error(err);
          toast.error("Failed to fetch address from location.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error("Permission denied or location unavailable.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  return (
    // <Card>
    //   <CardHeader>
    //     <CardTitle>Store Profile</CardTitle>
    //   </CardHeader>
    //   <CardContent>
    //     <form action={updateSellerProfileModule} className="space-y-4">
    //       <div className="space-y-2">
    //         <label htmlFor="name" className="text-sm font-medium">
    //           Store Name
    //         </label>
    //         <Input id="name" name="name" defaultValue={store.name} required />
    //       </div>
    //       <div className="space-y-2">
    //         <label htmlFor="description" className="text-sm font-medium">
    //           Description
    //         </label>
    //         <Input
    //           id="description"
    //           name="description"
    //           defaultValue={store.description ?? ""}
    //           required
    //         />
    //       </div>
    //       <div className="space-y-2">
    //         <label htmlFor="location" className="text-sm font-medium">
    //           Location
    //         </label>
    //         <Input
    //           id="location"
    //           name="location"
    //           defaultValue={store.location ?? ""}
    //           required
    //         />
    //       </div>
    //       <div className="space-y-2">
    //         <label htmlFor="address" className="text-sm font-medium">
    //           Address
    //         </label>
    //         <Input id="address" name="address" defaultValue={store.address ?? ""} />
    //       </div>
    //       <Button type="submit">Save Profile</Button>
    //     </form>
    //   </CardContent>
    // </Card>

    <>
      {/* BUSINESS PROFILE */}
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={store.name}
                onChange={(e) => setStore({ ...store, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location (City/State)</Label>
            <Input
              value={store.location || ""}
              onChange={(e) => setStore({ ...store, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label>Store Type</Label>
              <Select
                value={store.type}
                onValueChange={(v) =>
                  setStore({ ...store, type: v as StoreDTO["type"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General Store</SelectItem>
                  <SelectItem value="FOOD">Food Store</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select
                value={store.fulfillmentType}
                onValueChange={(v) => {
                  setStore({
                    ...store,
                    fulfillmentType: v as StoreDTO["fulfillmentType"],
                  });
                  if (v === "DIGITAL") {
                    setAddressSelectionValid(true);
                    setSelectedAddressId(null);
                    setShowAddressSuggestions(false);
                    clear();
                  } else if (!store.address?.trim()) {
                    setAddressSelectionValid(false);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHYSICAL">Physical</SelectItem>
                  <SelectItem value="DIGITAL">Digital</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <Label>
                {store.fulfillmentType === "DIGITAL"
                  ? "Store Address (Optional)"
                  : "Store Address"}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="text-[var(--brand-blue)] flex items-center gap-1"
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
                Use my location
              </Button>
            </div>

            <Input
              value={store.address || ""}
              onFocus={() => setShowAddressSuggestions(true)}
              onChange={(e) => {
                const value = e.target.value;
                setStore({ ...store, address: value });
                if (selectedAddressId) {
                  setSelectedAddressId(null);
                }
                if (store.fulfillmentType !== "DIGITAL") {
                  setAddressSelectionValid(false);
                }
                search(value);
                setShowAddressSuggestions(true);
              }}
            />
            {store.fulfillmentType !== "DIGITAL" && !addressSelectionValid && (
              <p className="text-sm text-red-500">
                Please select a valid address from suggestions.
              </p>
            )}
            {showAddressSuggestions &&
              (loading || suggestions.length > 0 || error) && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-sm">
                  {loading && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Loading suggestions...
                    </p>
                  )}
                  {!loading &&
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => handleSelectStoreAddress(suggestion)}
                      >
                        {suggestion.place_name}
                      </button>
                    ))}
                  {!loading && !suggestions.length && !error && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      No suggestions found.
                    </p>
                  )}
                  {!loading && error && (
                    <p className="px-3 py-2 text-sm text-red-500">{error}</p>
                  )}
                </div>
              )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={store.description || ""}
              onChange={(e) =>
                setStore({ ...store, description: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
