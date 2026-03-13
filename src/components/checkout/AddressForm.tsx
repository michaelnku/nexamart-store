"use client";

import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  createAddressAction,
  updateAddressAction,
} from "@/actions/checkout/addressAction";

import { Address } from "@/lib/types";
import { addressSchema, addressSchemaType } from "@/lib/zodValidation";
import {
  AddressSuggestion,
  useAddressAutocomplete,
} from "@/hooks/useAddressAutocomplete";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { reverseGeocodeFromCoords } from "@/actions/location/reverseGeocode";

type AddressLabel = "HOME" | "OFFICE" | "OTHER";

type Props = {
  onSuccess: () => void;
  initialData?: Partial<Address>;
  onBackToSelection?: () => void | Promise<void>;
};

function splitStoredPhone(phone?: string | null) {
  const raw = (phone ?? "").trim();
  if (!raw) return { countryCode: "", localNumber: "" };

  const normalized = raw.startsWith("+") ? raw.slice(1) : raw;
  const digits = normalized.replace(/\D/g, "");
  if (!digits) return { countryCode: "", localNumber: "" };

  const codeLength = digits.length > 10 ? Math.min(3, digits.length - 10) : 1;
  return {
    countryCode: digits.slice(0, codeLength),
    localNumber: digits.slice(codeLength),
  };
}

function buildNormalizedPhone(country: string, local: string): string {
  const cleanCountry = country.replace(/\D/g, "");
  const cleanLocal = local.replace(/\D/g, "");
  if (!cleanCountry || !cleanLocal) return "";
  return `+${cleanCountry}${cleanLocal}`;
}

export default function AddressForm({
  onSuccess,
  initialData,
  onBackToSelection,
}: Props) {
  const { data: user } = useCurrentUserQuery();
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState(
    () => splitStoredPhone(initialData?.phone).countryCode,
  );
  const [localPhoneNumber, setLocalPhoneNumber] = useState(
    () => splitStoredPhone(initialData?.phone).localNumber,
  );

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isEdit = Boolean(initialData?.id);
  const { suggestions, loading, error, search, clear } =
    useAddressAutocomplete();

  const form = useForm<addressSchemaType>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: (initialData?.label as AddressLabel) ?? "HOME",
      fullName: initialData?.fullName ?? "",
      phone: initialData?.phone ?? "",
      street: initialData?.street ?? "",
      city: initialData?.city ?? "",
      state: initialData?.state ?? "",
      country: initialData?.country ?? "",
      postalCode: initialData?.postalCode ?? "",
      isDefault: initialData?.isDefault ?? false,
    },
  });

  const formattedInitialAddress = useMemo(() => {
    if (!initialData?.street || !initialData?.city || !initialData?.country) {
      return "";
    }
    return [
      initialData.street,
      initialData.city,
      initialData.state,
      initialData.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [initialData]);

  useEffect(() => {
    if (!formattedInitialAddress) return;
    setAddressQuery(formattedInitialAddress);
    if (
      typeof initialData?.latitude === "number" &&
      typeof initialData?.longitude === "number"
    ) {
      setSelectedCoordinates({
        latitude: initialData.latitude,
        longitude: initialData.longitude,
      });
      setSelectedPlaceName(formattedInitialAddress);
      setSelectionError(null);
    }
  }, [formattedInitialAddress, initialData?.latitude, initialData?.longitude]);

  useEffect(() => {
    const parsed = splitStoredPhone(initialData?.phone);
    setCountryCode(parsed.countryCode);
    setLocalPhoneNumber(parsed.localNumber);
  }, [initialData?.phone]);

  useEffect(() => {
    if (isEdit) return;
    const currentFullName = form.getValues("fullName").trim();
    if (currentFullName) return;

    const prefillName = user?.name?.trim() || user?.username?.trim() || "";
    if (!prefillName) return;

    form.setValue("fullName", prefillName, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [form, isEdit, user?.name, user?.username]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target as Node)) return;
      setOpenSuggestions(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

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

  const resetSelection = () => {
    setSelectedSuggestion(null);
    setSelectedCoordinates(null);
    setSelectedPlaceName(null);
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

  const onAddressInputChange = (value: string) => {
    setAddressQuery(value);
    setOpenSuggestions(true);
    setSelectionError(null);

    if (selectedSuggestion || selectedCoordinates || selectedPlaceName) {
      resetSelection();
    }

    search(value);
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

    form.setValue("street", parsed.street, { shouldValidate: true });
    form.setValue("city", parsed.city, { shouldValidate: true });
    form.setValue("state", parsed.state, { shouldValidate: true });
    form.setValue("country", parsed.country, { shouldValidate: true });
    form.setValue("postalCode", parsed.postalCode, { shouldValidate: true });

    clear();
  };

  const onAddressInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!openSuggestions || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      onSelectSuggestion(suggestions[activeIndex]);
    }
  };

  const onSubmit = (values: addressSchemaType) => {
    const normalizedPhone = buildNormalizedPhone(countryCode, localPhoneNumber);

    if (!normalizedPhone) {
      form.setError("phone", {
        type: "manual",
        message: "Enter country code and phone number.",
      });
      return;
    }

    if (normalizedPhone.length < 7) {
      form.setError("phone", {
        type: "manual",
        message: "Phone number is invalid.",
      });
      return;
    }

    form.clearErrors("phone");

    if (!selectedCoordinates || !selectedPlaceName) {
      setSelectionError("Please select a valid address from suggestions.");
      return;
    }

    startTransition(async () => {
      const payload: addressSchemaType = {
        ...values,
        phone: normalizedPhone,
      };

      const res = isEdit
        ? await updateAddressAction(initialData!.id!, payload)
        : await createAddressAction(payload);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success(isEdit ? "Address updated" : "Address added");
      onSuccess();
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 max-h-[calc(100dvh-12rem)] overflow-y-auto pr-1"
      >
        {/* ADDRESS LABEL */}
        <div className="space-y-2">
          <Label>Address Type</Label>

          <div className="grid grid-cols-3 gap-2">
            {(["HOME", "OFFICE", "OTHER"] as AddressLabel[]).map((label) => {
              const active = form.watch("label") === label;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => form.setValue("label", label)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition
                    ${
                      active
                        ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                >
                  {label === "HOME" && "🏠 Home"}
                  {label === "OFFICE" && "🏢 Office"}
                  {label === "OTHER" && "📍 Other"}
                </button>
              );
            })}
          </div>
        </div>

        {/* FULL NAME */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PHONE */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <input type="hidden" {...field} value={field.value ?? ""} />
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label htmlFor="country-code" className="sr-only">
                    Country code
                  </Label>
                  <div className="flex items-center rounded-md border border-input px-3">
                    <span className="text-sm text-muted-foreground">+</span>
                    <Input
                      id="country-code"
                      type="tel"
                      inputMode="numeric"
                      value={countryCode}
                      onChange={(event) => {
                        const nextCountry = event.target.value.replace(
                          /\D/g,
                          "",
                        );
                        setCountryCode(nextCountry);
                        field.onChange(
                          buildNormalizedPhone(nextCountry, localPhoneNumber),
                        );
                      }}
                      placeholder="1"
                      className="border-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="phone-number" className="sr-only">
                    Phone number
                  </Label>
                  <FormControl>
                    <Input
                      id="phone-number"
                      type="tel"
                      inputMode="numeric"
                      value={localPhoneNumber}
                      onChange={(event) => {
                        const nextLocal = event.target.value.replace(/\D/g, "");
                        setLocalPhoneNumber(nextLocal);
                        field.onChange(
                          buildNormalizedPhone(countryCode, nextLocal),
                        );
                      }}
                      placeholder="Phone number"
                    />
                  </FormControl>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* STREET */}
        <div className="space-y-2 relative" ref={wrapperRef}>
          <div className="flex items-center justify-between">
            <Label htmlFor="address-autocomplete">Search Address</Label>

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

          <div className="relative">
            <Input
              id="address-autocomplete"
              value={addressQuery}
              onChange={(event) => onAddressInputChange(event.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setOpenSuggestions(true);
              }}
              onKeyDown={onAddressInputKeyDown}
              placeholder="Start typing full address..."
              autoComplete="off"
              role="combobox"
              aria-expanded={openSuggestions}
              aria-controls="address-suggestions-list"
              aria-activedescendant={
                activeIndex >= 0
                  ? `address-suggestion-${activeIndex}`
                  : undefined
              }
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500 dark:text-zinc-400" />
            ) : (
              <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            )}
          </div>

          {openSuggestions && (
            <div
              id="address-suggestions-list"
              role="listbox"
              className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
            >
              {loading && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-zinc-400">
                  Loading...
                </div>
              )}

              {!loading && error && (
                <div className="px-3 py-2 text-sm text-red-500">{error}</div>
              )}

              {!loading &&
                !error &&
                suggestions.length === 0 &&
                addressQuery.trim() && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-zinc-400">
                    No results found.
                  </div>
                )}

              {!loading &&
                !error &&
                suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    id={`address-suggestion-${index}`}
                    role="option"
                    type="button"
                    aria-selected={index === activeIndex}
                    className={`w-full px-3 py-2 text-left text-sm transition ${
                      index === activeIndex
                        ? "bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                        : "hover:bg-gray-100 dark:hover:bg-zinc-900"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => onSelectSuggestion(suggestion)}
                  >
                    {suggestion.place_name}
                  </button>
                ))}
            </div>
          )}

          {selectionError && (
            <p className="text-sm text-red-500">{selectionError}</p>
          )}
        </div>

        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CITY / STATE / COUNTRY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DEFAULT TOGGLE */}
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-lg border p-3 dark:border-zinc-800">
              <div>
                <p className="font-medium text-sm">Set as default address</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Used automatically during checkout.
                </p>
              </div>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />

        {/* SUBMIT */}
        {onBackToSelection ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void onBackToSelection()}
            className="w-full"
          >
            Saved Addresses
          </Button>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="w-full bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
        >
          {pending ? "Saving..." : isEdit ? "Update Address" : "Save Address"}
        </Button>
      </form>
    </Form>
  );
}
