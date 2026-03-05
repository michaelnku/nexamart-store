"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EmploymentType,
  StaffProfile,
  StaffStatus,
} from "@/generated/prisma/client";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createStaffProfile } from "@/actions/staff/createStaffProfile";
import { updateStaffProfile } from "@/actions/staff/updateStaffProfile";
import { UploadButton } from "@/utils/uploadthing";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createStaffProfileSchema,
  updateStaffProfileSchema,
  type StaffProfileInput,
  type UpdateStaffProfileInput,
} from "@/lib/zodValidation";

type Props = {
  userId: string;
  profile?: StaffProfile | null;
};

export default function StaffProfileForm({ userId, profile }: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditMode = Boolean(profile);

  const form = useForm<StaffProfileInput | UpdateStaffProfileInput>({
    resolver: zodResolver(
      isEditMode ? updateStaffProfileSchema : createStaffProfileSchema,
    ),
    defaultValues: {
      staffId: profile?.staffId ?? "",
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      phone: profile?.phone ?? "",
      avatar: profile?.avatar ?? "",
      department: profile?.department ?? "",
      employmentType: profile?.employmentType ?? undefined,
      status: profile?.status ?? "ACTIVE",
    },
  });

  const onSubmit = (values: StaffProfileInput | UpdateStaffProfileInput) => {
    startTransition(async () => {
      const payload = {
        ...values,
        phone: values.phone?.trim() || undefined,
        avatar: values.avatar?.trim() || undefined,
        department: values.department?.trim() || undefined,
      };

      const result = isEditMode
        ? await updateStaffProfile(payload as UpdateStaffProfileInput)
        : await createStaffProfile(userId, payload as StaffProfileInput);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isEditMode ? "Staff profile updated" : "Staff profile created",
      );
    });
  };

  const avatar = form.watch("avatar");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <section className="border-t pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-24 w-24">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="Staff avatar"
                  fill
                  className="rounded-full border object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full border text-xs text-muted-foreground">
                  No avatar
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <UploadButton
                endpoint="profileAvatar"
                onClientUploadComplete={(res) => {
                  const file = res[0];
                  if (!file) {
                    toast.error("Upload failed");
                    return;
                  }
                  form.setValue("avatar", file.url, { shouldDirty: true });
                  toast.success("Avatar uploaded");
                }}
                onUploadError={() => {
                  toast.error("Upload failed");
                }}
                className="
ut-button:bg-blue-500/10
ut-button:text-blue-600
ut-button:border
ut-button:border-blue-500/30
ut-button:rounded-full
ut-button:px-5
ut-button:py-2
ut-button:text-sm
hover:ut-button:bg-blue-500/20
"
              />

              {avatar ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => form.setValue("avatar", "", { shouldDirty: true })}
                  className="text-sm text-red-600"
                >
                  Remove photo
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="staffId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Staff ID</FormLabel>
                <FormControl>
                  <Input placeholder="STF-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Operations" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 555 000 0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type</FormLabel>
                <Select
                  value={field.value ?? "NONE"}
                  onValueChange={(value) =>
                    field.onChange(value === "NONE" ? undefined : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NONE">Not set</SelectItem>
                    <SelectItem value={EmploymentType.FULL_TIME}>
                      Full Time
                    </SelectItem>
                    <SelectItem value={EmploymentType.PART_TIME}>
                      Part Time
                    </SelectItem>
                    <SelectItem value={EmploymentType.CONTRACT}>
                      Contract
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  value={field.value ?? StaffStatus.ACTIVE}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={StaffStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={StaffStatus.SUSPENDED}>
                      Suspended
                    </SelectItem>
                    <SelectItem value={StaffStatus.TERMINATED}>
                      Terminated
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
              ? "Update Staff Profile"
              : "Create Staff Profile"}
        </Button>
      </form>
    </Form>
  );
}
