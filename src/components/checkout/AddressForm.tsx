"use client";

import { useTransition } from "react";
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

type AddressLabel = "HOME" | "OFFICE" | "OTHER";

type Props = {
  onSuccess: () => void;
  initialData?: Partial<Address>;
};

export default function AddressForm({ onSuccess, initialData }: Props) {
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initialData?.id);

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
      isDefault: initialData?.isDefault ?? false,
    },
  });

  const onSubmit = (values: addressSchemaType) => {
    startTransition(async () => {
      const res = isEdit
        ? await updateAddressAction(initialData!.id!, values)
        : await createAddressAction(values);

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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* STREET */}
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
