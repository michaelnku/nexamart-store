"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateUserSchema, updateUserSchemaType } from "@/lib/zodValidation";
import { UploadButton } from "@/utils/uploadthing";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserDTO } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import {
  deleteProfileAvatarAction,
  updateUserProfile,
} from "@/actions/auth/user";
import { Eye } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  userData: UserDTO;
};

export default function ProfileForm({ userData }: Props) {
  const { data: user } = useCurrentUserQuery(userData);
  if (!user) return null;
  const [isPending, startTransition] = useTransition();

  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());

  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<updateUserSchemaType>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name ?? "",
      username: user.username ?? "",
      profileAvatar: user.profileAvatar ?? undefined,
    },
  });

  const { control, handleSubmit, setValue, getValues } = form;

  const onSubmit = (values: updateUserSchemaType) => {
    startTransition(async () => {
      await updateUserProfile(values).then((res) => {
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Profile updated");
        router.refresh();
      });
    });
  };

  const deleteProfileImage = async () => {
    const image = getValues("profileAvatar");
    if (!image || !image?.key) return;

    if (deletingKeys.has(image.key)) return;

    setDeletingKeys((p) => new Set(p).add(image.key));

    try {
      await deleteProfileAvatarAction();
      setValue("profileAvatar", null, {
        shouldDirty: true,
      });
      toast.success("Profile image removed");
      window.location.reload();
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

  const avatar =
    form.watch("profileAvatar")?.url ??
    user?.profileAvatar?.url ??
    user?.image ??
    null;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Profile Information</CardTitle>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={"/profile"}
              className="text-[var(--brand-blue)] hover:text-[var(--brand-blue-hover)]"
            >
              <Eye />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Profile</p>
          </TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* profile image */}
            <section className="border-t pt-6">
              <div className="flex flex-col items-center gap-4">
                {/* AVATAR */}
                <div className="relative w-32 h-32">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt="Profile image"
                      fill
                      className="rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full border flex items-center justify-center text-sm text-muted-foreground">
                      <div className="uppercase text-xl font-semibold">
                        {user.name?.[0] ?? user.email[0]}
                      </div>
                    </div>
                  )}
                </div>

                <span>
                  <UploadButton
                    endpoint="profileAvatar"
                    onClientUploadComplete={async (res) => {
                      const file = res[0];
                      if (!file) {
                        toast.error("Upload failed");
                        return;
                      }
                      setValue(
                        "profileAvatar",
                        { url: file.url, key: file.key },
                        {
                          shouldDirty: true,
                        },
                      );

                      await updateUserProfile({
                        profileAvatar: {
                          url: file.url,
                          key: file.key,
                        },
                      });

                      queryClient.invalidateQueries({
                        queryKey: ["currentUser"],
                      });
                      toast.success("Profile image updated");
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

                  {avatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={deletingKeys.has(
                        form.watch("profileAvatar")?.key ?? "",
                      )}
                      onClick={deleteProfileImage}
                      className="text-red-600 text-sm"
                    >
                      Remove photo
                    </Button>
                  )}
                </span>
              </div>
            </section>

            <FormField
              control={control}
              name="name"
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

            <FormField
              control={control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-muted-foreground">
              Email: <span className="font-medium">{user.email}</span>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
            >
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
