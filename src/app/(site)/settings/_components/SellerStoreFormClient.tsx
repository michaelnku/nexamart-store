"use client";

import { reverseGeocodeFromCoords } from "@/actions/location/reverseGeocode";
import { updateSellerProfileModule } from "@/actions/settings/sellerModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AddressSuggestion,
  useAddressAutocomplete,
} from "@/hooks/useAddressAutocomplete";
import { StoreDTO } from "@/lib/types";
import { Loader2, LocateFixed } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function SellerStoreFormClient({ store }: { store: StoreDTO }) {
  const [locating, setLocating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AddressSuggestion | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(
    null,
  );
  const [openSuggestions, setOpenSuggestions] = useState(false);

  const { suggestions, loading, error, search, clear } =
    useAddressAutocomplete();

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

  const parseSuggestion = (suggestion: AddressSuggestion) => {
    const context = suggestion.context ?? [];
    const getContext = (key: string) =>
      context.find((item) => item.id.startsWith(`${key}.`));

    const fallbackParts = suggestion.place_name
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const fallbackCity = fallbackParts[1] ?? "";

    const place =
      getContext("place")?.text ??
      getContext("locality")?.text ??
      getContext("district")?.text ??
      getContext("neighborhood")?.text ??
      fallbackCity;
    const region = getContext("region")?.text ?? "";
    const country = getContext("country")?.text ?? "";
    const postcode = getContext("postcode")?.text ?? "";

    const street = [suggestion.address, suggestion.text]
      .filter((part) => Boolean(part && part.trim()))
      .join(" ")
      .trim();

    return {
      street,
      city: place,
      state: region,
      country,
      postalCode: postcode,
      latitude: suggestion.center[1],
      longitude: suggestion.center[0],
    };
  };

  const onSelectSuggestion = (suggestion: AddressSuggestion) => {
    const parsed = parseSuggestion(suggestion);

    setAddressQuery(suggestion.place_name);
    setSelectedSuggestion(suggestion);
    setSelectedCoordinates({
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    });
    setSelectedPlaceName(suggestion.place_name);
    setSelectionError(null);
    setOpenSuggestions(false);

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

          onSelectSuggestion(typedSuggestion);
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
          <div className="flex items-center justify-between">
            <Label htmlFor="address-autocomplete">Address</Label>

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
