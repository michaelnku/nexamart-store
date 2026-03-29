"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Camera, Loader2, LocateFixed } from "lucide-react";
import { toast } from "sonner";

import { reverseGeocodeFromCoords } from "@/actions/location/reverseGeocode";
import { deleteLogoAction } from "@/actions/actions";
import { createStoreAction } from "@/actions/auth/store";
import { CroppedImageUploadField } from "@/components/media/CroppedImageUploadField";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  AddressSuggestion,
  useAddressAutocomplete,
} from "@/hooks/useAddressAutocomplete";
import { storeSchema, storeFormType } from "@/lib/zodValidation";

export default function CreateStoreForm() {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading, error, search, clear } =
    useAddressAutocomplete();

  const form = useForm<storeFormType>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      address: "",
      logo: "",
      type: "GENERAL",
      fulfillmentType: "PHYSICAL",
    },
  });

  const fulfillmentType = form.watch("fulfillmentType");
  const storeType = form.watch("type");

  useEffect(() => {
    if (fulfillmentType === "DIGITAL") {
      form.clearErrors("address");
      setSelectedAddressId(null);
      setShowSuggestions(false);
      clear();
    }
  }, [clear, form, fulfillmentType]);

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    form.setValue("address", suggestion.place_name, { shouldValidate: true });
    setSelectedAddressId(suggestion.id);
    setShowSuggestions(false);
    form.clearErrors("address");
    clear();
  };

  const handleDeleteLogo = async () => {
    if (!logoKey) return;

    try {
      await deleteLogoAction(logoKey);
      setLogoUrl(null);
      setLogoKey(null);
      form.setValue("logo", "");
      toast.success("Logo removed");
    } catch {
      toast.error("Unable to delete logo");
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);

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

          handleSelectAddressSuggestion({
            id: feature.id ?? "current-location",
            place_name: feature.place_name,
            text: feature.text ?? "",
            address: feature.address ?? "",
            center: feature.center as [number, number],
            context: feature.context ?? [],
          });
        } catch (error) {
          console.error(error);
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

  const onSubmit = (values: storeFormType) => {
    const requiresAddress = values.fulfillmentType !== "DIGITAL";

    if (requiresAddress && !selectedAddressId) {
      form.setError("address", {
        type: "manual",
        message: "Please select a valid address from suggestions.",
      });
      return;
    }

    startTransition(async () => {
      const res = await createStoreAction(values);

      if (res?.error) {
        if ("code" in res && res.code === "EMAIL_NOT_VERIFIED") {
          router.refresh();
        }

        toast.error(res.error);
        return;
      }

      toast.success("Store created successfully!");
      router.push("/marketplace/dashboard/seller/store");
    });
  };

  return (
    <main className="flex justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-3xl space-y-8 rounded-2xl border bg-white p-4 shadow dark:bg-neutral-900 sm:space-y-10 sm:p-6 md:p-10">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Create Your Storefront
          </h1>
          <p className="text-sm text-muted-foreground">
            Add your brand details customers will see before ordering.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            <section className="space-y-6">
              <h2 className="border-b pb-2 text-xl font-semibold">
                Store Information
              </h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Nexa Fashion Hub" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (City / State)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lagos, Nigeria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <section className="space-y-4">
                <h2 className="border-b pb-2 text-xl font-semibold">
                  Store Type
                </h2>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                        >
                          <label className="cursor-pointer rounded-xl border p-4 transition hover:border-[#146EB4]">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value="GENERAL" />
                              <div>
                                <p className="font-semibold">General Store</p>
                                <p className="text-sm text-muted-foreground">
                                  Fashion, electronics, digital goods, services,
                                  and more.
                                </p>
                              </div>
                            </div>
                          </label>

                          <label className="cursor-pointer rounded-xl border p-4 transition hover:border-[#146EB4]">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value="FOOD" />
                              <div>
                                <p className="font-semibold">Food Store</p>
                                <p className="text-sm text-muted-foreground">
                                  Restaurants, groceries, catering. Requires
                                  pickup address.
                                </p>
                              </div>
                            </div>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className="space-y-4">
                <div className="border-b pb-2">
                  <h2 className="text-xl font-semibold">How do you deliver?</h2>
                  <p className="text-sm text-muted-foreground">
                    This determines whether riders, pickup, or digital delivery
                    is used.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="fulfillmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        >
                          <label className="cursor-pointer rounded-xl border p-4 hover:border-[#146EB4]">
                            <RadioGroupItem value="PHYSICAL" />
                            <p className="mt-2 font-semibold">Physical</p>
                            <p className="text-sm text-muted-foreground">
                              Requires a pickup or warehouse address.
                            </p>
                          </label>

                          <label className="cursor-pointer rounded-xl border p-4 hover:border-[#146EB4]">
                            <RadioGroupItem value="DIGITAL" />
                            <p className="mt-2 font-semibold">Digital</p>
                            <p className="text-sm text-muted-foreground">
                              No physical delivery (ebooks, services,
                              subscriptions).
                            </p>
                          </label>

                          <label className="cursor-pointer rounded-xl border p-4 hover:border-[#146EB4]">
                            <RadioGroupItem value="HYBRID" />
                            <p className="mt-2 font-semibold">Hybrid</p>
                            <p className="text-sm text-muted-foreground">
                              Both physical and digital products.
                            </p>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {fulfillmentType !== "DIGITAL" ? (
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <FormLabel>
                          {storeType === "FOOD"
                            ? "Pickup / Kitchen Address"
                            : "Pickup / Warehouse Address"}
                        </FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleUseCurrentLocation}
                          disabled={locating}
                          className="text-[var(--brand-blue)]"
                        >
                          {locating ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <LocateFixed className="mr-1 h-4 w-4" />
                          )}
                          Use my location
                        </Button>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="Required for physical fulfillment"
                          {...field}
                          onFocus={() => setShowSuggestions(true)}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value);

                            if (selectedAddressId) {
                              setSelectedAddressId(null);
                            }

                            form.setError("address", {
                              type: "manual",
                              message:
                                "Please select a valid address from suggestions.",
                            });
                            search(value);
                            setShowSuggestions(true);
                          }}
                        />
                      </FormControl>
                      {showSuggestions &&
                      (loading || suggestions.length > 0 || error) ? (
                        <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-sm">
                          {loading ? (
                            <p className="px-3 py-2 text-sm text-muted-foreground">
                              Loading suggestions...
                            </p>
                          ) : null}
                          {!loading
                            ? suggestions.map((suggestion) => (
                                <button
                                  key={suggestion.id}
                                  type="button"
                                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() =>
                                    handleSelectAddressSuggestion(suggestion)
                                  }
                                >
                                  {suggestion.place_name}
                                </button>
                              ))
                            : null}
                          {!loading && !suggestions.length && !error ? (
                            <p className="px-3 py-2 text-sm text-muted-foreground">
                              No suggestions found.
                            </p>
                          ) : null}
                          {!loading && error ? (
                            <p className="px-3 py-2 text-sm text-red-500">
                              {error}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Your Store</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Tell customers what makes your store unique..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4">
              <CroppedImageUploadField
                label="Store Logo"
                value={
                  logoUrl
                    ? {
                        url: logoUrl,
                        key: logoKey ?? "pending-store-logo",
                      }
                    : null
                }
                onChange={(file) => {
                  setLogoUrl(file?.url ?? null);
                  setLogoKey(file?.key ?? null);
                  form.setValue("logo", file?.url ?? "");
                }}
                onDelete={handleDeleteLogo}
                endpoint="storeLogo"
                aspect={1}
                targetWidth={800}
                targetHeight={800}
                previewWidth={128}
                previewHeight={128}
                previewAlt="Store logo preview"
                helperText="Crop your logo before upload so storefront branding stays clean across cards, headers, and mobile views."
                emptyText="Upload a square logo. A crop step opens before the image is saved."
                successMessage="Logo uploaded!"
                removeLabel="Remove Logo"
                replaceLabel="Replace Logo"
                uploadLabel="Choose Logo"
                previewWrapperClassName="mx-auto"
                previewClassName="h-32 w-32 rounded-full shadow object-cover"
                emptyIcon={<Camera className="h-6 w-6" />}
                emptyStateClassName="mx-auto max-w-sm"
                cropDialogDescription="Adjust the logo crop before upload so your storefront branding stays sharp and centered."
                allowTransparentBackground
                transparentBackgroundLabel="Keep logo background transparent"
              />

              <FormMessage>{form.formState.errors.logo?.message}</FormMessage>
            </section>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#146EB4] py-4 text-lg font-medium text-white hover:bg-[#125c99]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Store"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
