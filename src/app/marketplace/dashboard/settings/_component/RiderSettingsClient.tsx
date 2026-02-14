"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  deleteRiderProfileAction,
  getRiderProfileAction,
  saveRiderProfileAction,
  toggleRiderAvailabilityAction,
  updateRiderProfileAction,
} from "@/actions/rider/saveRiderProfileAction";
import {
  riderProfileSchema,
  riderProfileSchemaType,
} from "@/lib/zodValidation";
import type { RiderProfileDTO } from "@/lib/types";
import DeleteRiderProfileModal from "./DeleteRiderProfileModal";

const EMPTY_FORM_VALUES: riderProfileSchemaType = {
  vehicleType: "",
  plateNumber: "",
  licenseNumber: "",
  vehicleColor: "",
  vehicleModel: "",
  isAvailable: false,
};

export default function RiderSettingsClient({
  riderProfile,
}: {
  riderProfile: RiderProfileDTO | null;
}) {
  const [profile, setProfile] = useState<RiderProfileDTO | null>(riderProfile);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<riderProfileSchemaType>({
    defaultValues: {
      ...EMPTY_FORM_VALUES,
      vehicleType: riderProfile?.vehicleType ?? EMPTY_FORM_VALUES.vehicleType,
      plateNumber: riderProfile?.plateNumber ?? EMPTY_FORM_VALUES.plateNumber,
      licenseNumber:
        riderProfile?.licenseNumber ?? EMPTY_FORM_VALUES.licenseNumber,
      vehicleColor:
        riderProfile?.vehicleColor ?? EMPTY_FORM_VALUES.vehicleColor,
      vehicleModel:
        riderProfile?.vehicleModel ?? EMPTY_FORM_VALUES.vehicleModel,
      isAvailable: riderProfile?.isAvailable ?? EMPTY_FORM_VALUES.isAvailable,
    },
  });

  useEffect(() => {
    form.reset({
      ...EMPTY_FORM_VALUES,
      vehicleType: profile?.vehicleType ?? EMPTY_FORM_VALUES.vehicleType,
      plateNumber: profile?.plateNumber ?? EMPTY_FORM_VALUES.plateNumber,
      licenseNumber: profile?.licenseNumber ?? EMPTY_FORM_VALUES.licenseNumber,
      vehicleColor: profile?.vehicleColor ?? EMPTY_FORM_VALUES.vehicleColor,
      vehicleModel: profile?.vehicleModel ?? EMPTY_FORM_VALUES.vehicleModel,
      isAvailable: profile?.isAvailable ?? EMPTY_FORM_VALUES.isAvailable,
    });
  }, [form, profile]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const res = await getRiderProfileAction();
      if (!mounted) return;
      if (res.success) setProfile(res.success);
      if (res.error === "Rider profile not found") setProfile(null);
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const isRegistered = Boolean(profile);

  const onSubmit = (values: riderProfileSchemaType) => {
    startTransition(async () => {
      const parsed = riderProfileSchema.safeParse(values);
      if (!parsed.success) {
        toast.error(parsed.error.message || "Invalid form input");
        return;
      }

      const res = isRegistered
        ? await updateRiderProfileAction(parsed.data)
        : await saveRiderProfileAction(parsed.data);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      const latest = await getRiderProfileAction();
      if (latest.success) setProfile(latest.success);
      toast.success(
        isRegistered
          ? "Rider profile updated"
          : "Rider profile submitted for review",
      );
    });
  };

  const handleDeleteProfile = () => {
    startTransition(async () => {
      const res = await deleteRiderProfileAction();
      if (res?.error) {
        toast.error(res.error);
        return;
      }

      setProfile(null);
      form.reset(EMPTY_FORM_VALUES);
      setIsDeleteModalOpen(false);
      toast.success("Rider profile deleted");
    });
  };

  const handleToggleAvailability = (nextValue: boolean) => {
    if (!isRegistered || !profile?.isVerified) return;

    startTransition(async () => {
      const res = await toggleRiderAvailabilityAction(nextValue);
      if (res?.error) {
        toast.error(res.error);
        form.setValue("isAvailable", profile.isAvailable);
        return;
      }

      setProfile((prev) => (prev ? { ...prev, isAvailable: nextValue } : prev));
      form.setValue("isAvailable", nextValue);
      toast.success(nextValue ? "You are now online" : "You are now offline");
    });
  };

  return (
    <div className="space-y-8">
      {isRegistered && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.isVerified ? (
              <div className="text-green-600 font-medium">
                Verified - You can receive deliveries.
              </div>
            ) : (
              <div className="text-yellow-600 font-medium">
                Pending Verification - You cannot go online yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {isRegistered ? "Vehicle Information" : "Register as a Rider"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Bike, Car, Van" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plate Number</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Driver License ID"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Model</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Toyota Corolla"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Color</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Red"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isRegistered && profile?.isVerified && (
                <Card>
                  <CardHeader>
                    <CardTitle>Operational Settings</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isAvailable"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <Label>Go Online</Label>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={handleToggleAvailability}
                            disabled={isPending}
                          />
                        </div>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <Label>Manage Weekly Schedule</Label>
                      <Link
                        href="/rider/schedule"
                        className="text-blue-600 text-sm"
                      >
                        Edit Schedule
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" size="lg" disabled={isPending}>
                  {isPending
                    ? "Saving..."
                    : isRegistered
                      ? "Save Changes"
                      : "Submit Registration"}
                </Button>

                {isRegistered && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={isPending}
                  >
                    Clear Profile
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Receive Delivery Notifications</Label>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <Label>Auto-Accept Nearby Orders</Label>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <DeleteRiderProfileModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        isPending={isPending}
        onConfirm={handleDeleteProfile}
      />
    </div>
  );
}
