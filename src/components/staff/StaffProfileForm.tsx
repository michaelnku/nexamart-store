"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmploymentType, StaffProfile } from "@/generated/prisma/client";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createStaffProfile } from "@/actions/staff/createStaffProfile";
import { updateStaffProfile } from "@/actions/staff/updateStaffProfile";
import { UploadButton } from "@/utils/uploadthing";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import {
  deleteProfileAvatarAction,
  updateUserProfile,
} from "@/actions/auth/user";
import { getUserInitials } from "@/lib/user";
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
  type StaffProfileInput,
} from "@/lib/zodValidation";
import { UserDTO } from "@/lib/types";

type Props = {
  userId: string;
  profile?: StaffProfile | null;
  initialFirstName?: string;
  initialLastName?: string;
  initialUser: UserDTO;
};

type StaffProfileFormValues = z.input<typeof createStaffProfileSchema>;

function splitPhone(phone?: string | null) {
  if (!phone) return { countryCode: "+1", localPhone: "" };
  const digits = phone.replace(/\D/g, "");
  if (!digits) return { countryCode: "+1", localPhone: "" };

  const codeLength = Math.max(1, Math.min(3, digits.length - 10));
  const countryCode = `+${digits.slice(0, codeLength)}`;
  const localPhone = digits.slice(codeLength);
  return { countryCode, localPhone };
}

function composePhone(
  countryCode: string,
  localPhone: string,
): string | undefined {
  const cc = countryCode.replace(/\D/g, "");
  const local = localPhone.replace(/\D/g, "");
  if (!local) return undefined;
  return `+${cc}${local}`;
}

export default function StaffProfileForm({
  userId,
  profile,
  initialFirstName,
  initialLastName,
  initialUser,
}: Props) {
  const { data: user } = useCurrentUserQuery(initialUser);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const isEditMode = Boolean(profile);
  const parsedPhone = useMemo(
    () => splitPhone(profile?.phone),
    [profile?.phone],
  );
  const [countryCode, setCountryCode] = useState(parsedPhone.countryCode);
  const [localPhone, setLocalPhone] = useState(parsedPhone.localPhone);

  const form = useForm<StaffProfileFormValues>({
    resolver: zodResolver(createStaffProfileSchema),
    defaultValues: {
      firstName: profile?.firstName ?? initialFirstName ?? "",
      lastName: profile?.lastName ?? initialLastName ?? "",
      phone: "",
      department: profile?.department ?? "",
      employmentType: profile?.employmentType ?? undefined,
    },
  });

  const onSubmit = (values: StaffProfileFormValues) => {
    startTransition(async () => {
      if (
        localPhone.trim().length > 0 &&
        countryCode.replace(/\D/g, "").length === 0
      ) {
        toast.error("Country code is required when phone number is provided.");
        return;
      }

      const payload = {
        ...values,
        phone: composePhone(countryCode, localPhone),
        department: values.department?.trim() || undefined,
      };

      const result = isEditMode
        ? await updateStaffProfile(payload as StaffProfileInput)
        : await createStaffProfile(userId, payload as StaffProfileInput);

      if ("error" in result) {
        if ("code" in result && result.code === "EMAIL_NOT_VERIFIED") {
          router.refresh();
        }
        toast.error(result.error);
        return;
      }

      toast.success(
        isEditMode ? "Staff profile updated" : "Staff profile created",
      );
    });
  };

  const avatar = user?.profileAvatar?.url ?? user?.image ?? null;
  const initials = getUserInitials({
    name: user?.name ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
  });
  const isVerified = profile?.isVerified ?? false;
  const verifiedAt = profile?.verifiedAt
    ? new Date(profile.verifiedAt).toLocaleString()
    : null;
  const verificationMethod = profile?.verificationMethod ?? null;
  const verificationStatus = profile?.verificationStatus ?? "PENDING";

  const deleteProfileImage = async () => {
    const image = user?.profileAvatar;
    if (!image || !image?.key) return;
    if (deletingKeys.has(image.key)) return;

    setDeletingKeys((p) => new Set(p).add(image.key));

    try {
      const result = await deleteProfileAvatarAction();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
      toast.success("Profile image removed");
    } catch {
      toast.error("Failed to remove image");
    } finally {
      setDeletingKeys((p) => {
        const next = new Set(p);
        next.delete(image.key);
        return next;
      });
    }
  };

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
                  <div className="text-base font-semibold uppercase">
                    {initials}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <UploadButton
                endpoint="profileAvatar"
                onClientUploadComplete={async (res) => {
                  const file = res[0];
                  if (!file) {
                    toast.error("Upload failed");
                    return;
                  }
                  const updateResult = await updateUserProfile({
                    profileAvatar: {
                      url: file.url,
                      key: file.key,
                    },
                  });
                  if ("error" in updateResult) {
                    toast.error(updateResult.error);
                    return;
                  }
                  await queryClient.invalidateQueries({
                    queryKey: ["currentUser"],
                  });
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
                  disabled={deletingKeys.has(user?.profileAvatar?.key ?? "")}
                  onClick={deleteProfileImage}
                  className="text-sm text-red-600"
                >
                  Remove photo
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormItem>
            <FormLabel>Staff ID</FormLabel>
            <FormControl>
              <Input
                disabled
                value={
                  profile?.staffId ?? "Auto-generated after profile creation"
                }
                readOnly
              />
            </FormControl>
          </FormItem>

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
          <FormItem>
            <FormLabel>Country Code</FormLabel>
            <FormControl>
              <Input
                placeholder="+1"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input
                placeholder="5550000000"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
              />
            </FormControl>
          </FormItem>
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

          <FormItem>
            <FormLabel>Status</FormLabel>
            <FormControl>
              <Input disabled value={profile?.status ?? "ACTIVE"} readOnly />
            </FormControl>
          </FormItem>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormItem>
            <FormLabel>Verification</FormLabel>
            <FormControl>
              <Input
                disabled
                value={`${isVerified ? "Verified" : "Pending"} (${verificationStatus})`}
                readOnly
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>Verified At / Method</FormLabel>
            <FormControl>
              <Input
                disabled
                value={
                  isVerified
                    ? `${verifiedAt ?? "N/A"}${verificationMethod ? ` (${verificationMethod})` : ""}`
                    : "Not verified"
                }
                readOnly
              />
            </FormControl>
          </FormItem>
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

