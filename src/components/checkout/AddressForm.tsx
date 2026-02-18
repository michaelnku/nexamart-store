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
import { Loader2, MapPin } from "lucide-react";

type AddressLabel = "HOME" | "OFFICE" | "OTHER";

type Props = {
  onSuccess: () => void;
  initialData?: Partial<Address>;
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

export default function AddressForm({ onSuccess, initialData }: Props) {
  const { data: user } = useCurrentUserQuery();
  const [pending, startTransition] = useTransition();
  const [addressQuery, setAddressQuery] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AddressSuggestion | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null);
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState(() =>
    splitStoredPhone(initialData?.phone).countryCode,
  );
  const [localPhoneNumber, setLocalPhoneNumber] = useState(() =>
    splitStoredPhone(initialData?.phone).localNumber,
  );

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isEdit = Boolean(initialData?.id);
  const { suggestions, loading, error, search, clear } = useAddressAutocomplete();

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
    return [initialData.street, initialData.city, initialData.state, initialData.country]
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

    const place = getContext("place")?.text ?? getContext("locality")?.text ?? "";
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

  const handleManualFieldEdit = (value: string) => {
    if (selectedSuggestion || selectedCoordinates || selectedPlaceName) {
      resetSelection();
      setSelectionError("Please select a valid address from suggestions.");
    }
    return value;
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
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      onSelectSuggestion(suggestions[activeIndex]);
    }
  };

  const onSubmit = (values: addressSchemaType) => {
    const cleanCountryCode = countryCode.replace(/\D/g, "");
    const cleanLocalNumber = localPhoneNumber.replace(/\D/g, "");

    if (!cleanCountryCode || !cleanLocalNumber) {
      form.setError("phone", {
        type: "manual",
        message: "Enter country code and phone number.",
      });
      return;
    }

    const normalizedPhone = `+${cleanCountryCode}${cleanLocalNumber}`;
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
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
          render={() => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
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
                      onChange={(event) =>
                        setCountryCode(event.target.value.replace(/\D/g, ""))
                      }
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
                      onChange={(event) =>
                        setLocalPhoneNumber(event.target.value.replace(/\D/g, ""))
                      }
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
          <Label htmlFor="address-autocomplete">Search Address</Label>
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
                activeIndex >= 0 ? `address-suggestion-${activeIndex}` : undefined
              }
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500" />
            ) : (
              <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            )}
          </div>

          {openSuggestions && (
            <div
              id="address-suggestions-list"
              role="listbox"
              className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-white shadow-lg"
            >
              {loading && (
                <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
              )}

              {!loading && error && (
                <div className="px-3 py-2 text-sm text-red-500">{error}</div>
              )}

              {!loading && !error && suggestions.length === 0 && addressQuery.trim() && (
                <div className="px-3 py-2 text-sm text-gray-500">No results found.</div>
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
                        : "hover:bg-gray-100"
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
                  onChange={(event) =>
                    field.onChange(handleManualFieldEdit(event.target.value))
                  }
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
                    onChange={(event) =>
                      field.onChange(handleManualFieldEdit(event.target.value))
                    }
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
                    onChange={(event) =>
                      field.onChange(handleManualFieldEdit(event.target.value))
                    }
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
                    onChange={(event) =>
                      field.onChange(handleManualFieldEdit(event.target.value))
                    }
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
                  onChange={(event) =>
                    field.onChange(handleManualFieldEdit(event.target.value))
                  }
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
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Set as default address</p>
                <p className="text-xs text-gray-500">
                  Used automatically during checkout.
                </p>
              </div>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />

        {/* SUBMIT */}
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
