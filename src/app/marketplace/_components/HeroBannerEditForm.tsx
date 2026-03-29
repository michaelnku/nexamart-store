"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HeroBannerImageField } from "@/app/marketplace/_components/HeroBannerImageField";
import { heroBannerSchema, HeroBannerInput } from "@/lib/zodValidation";
import { HeroBannerWithFiles } from "@/lib/types";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  updateHeroBannerAction,
  deleteHeroBannerImageAction,
  deleteHeroBannerAction,
} from "@/actions/banner/banners";

import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  banner: HeroBannerWithFiles;
};

export default function HeroBannerEditForm({ banner }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());

  const form = useForm<HeroBannerInput>({
    resolver: zodResolver(heroBannerSchema),
    defaultValues: {
      title: banner.title,
      subtitle: banner.subtitle,
      ctaText: banner.ctaText,
      ctaLink: banner.ctaLink,
      backgroundImage: banner.backgroundImage,
      productImage: banner.productImage,
      lottieUrl: banner.lottieUrl,
      position: banner.position,
      placement: banner.placement,
      isActive: banner.isActive,
      startsAt: banner.startsAt,
      endsAt: banner.endsAt,
    },
  });

  const { getValues, setValue } = form;

  const deleteSingleImage = async (
    field: "backgroundImage" | "productImage",
  ) => {
    const file = getValues(field);
    if (!file?.key) return;

    setDeletingKeys((prev) => new Set(prev).add(file.key));

    try {
      await deleteHeroBannerImageAction(file.key);
      setValue(field, null);
      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeletingKeys((prev) => {
        const next = new Set(prev);
        next.delete(file.key);
        return next;
      });
    }
  };

  const onSubmit = (values: HeroBannerInput) => {
    startTransition(async () => {
      const res = await updateHeroBannerAction(banner.id, values);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Banner updated successfully");
      router.refresh();
    });
  };

  const deleteBanner = () => {
    startTransition(async () => {
      const res = await deleteHeroBannerAction(banner.id);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Banner deleted");
      router.push("/marketplace/dashboard/admin/marketing/banners");
      router.refresh();
    });
  };

  const backgroundImage = form.watch("backgroundImage");
  const productImage = form.watch("productImage");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Edit Banner</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* TITLE */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banner Title</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SUBTITLE */}
          <FormField
            control={form.control}
            name="subtitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtitle</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* CTA TEXT */}
          <FormField
            control={form.control}
            name="ctaText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTA Text</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* CTA LINK */}
          <FormField
            control={form.control}
            name="ctaLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTA Link</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* BACKGROUND IMAGE */}
          <FormField
            control={form.control}
            name="backgroundImage"
            render={() => (
              <FormItem>
                <FormControl>
                  <HeroBannerImageField
                    label="Background Image"
                    value={backgroundImage}
                    onChange={(file) => form.setValue("backgroundImage", file)}
                    onDelete={() => deleteSingleImage("backgroundImage")}
                    aspect={2}
                    targetWidth={1600}
                    targetHeight={800}
                    previewWidth={800}
                    previewHeight={400}
                    previewAlt="Background preview"
                    helperText="Replace the hero background with a cropped wide image so the live banner framing stays consistent."
                    emptyText="Upload a wide banner background. A crop step opens before the file is saved."
                    successMessage="Background replaced"
                    removeLabel="Remove Background"
                    replaceLabel="Replace Background"
                    uploadLabel="Choose Background"
                    disabled={deletingKeys.size > 0}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* PRODUCT IMAGE */}
          <FormField
            control={form.control}
            name="productImage"
            render={() => (
              <FormItem>
                <FormControl>
                  <HeroBannerImageField
                    label="Product Image"
                    value={productImage}
                    onChange={(file) => form.setValue("productImage", file)}
                    onDelete={() => deleteSingleImage("productImage")}
                    aspect={1}
                    targetWidth={1200}
                    targetHeight={1200}
                    previewWidth={320}
                    previewHeight={320}
                    previewAlt="Product preview"
                    helperText="Replace the featured product art with a cropped square image so the subject remains centered."
                    emptyText="Upload an optional foreground product image. You can crop it before it uploads."
                    successMessage="Product image replaced"
                    removeLabel="Remove Product Image"
                    replaceLabel="Replace Product Image"
                    uploadLabel="Choose Product Image"
                    disabled={deletingKeys.size > 0}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* PLACEMENT */}
          <FormField
            control={form.control}
            name="placement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placement</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="HOMEPAGE">Homepage</SelectItem>
                    <SelectItem value="CATEGORY">Category</SelectItem>
                    <SelectItem value="FOOD">Food</SelectItem>
                    <SelectItem value="GLOBAL">Global</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* POSITION */}
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* DATES */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null,
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ACTIVE */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel>Active</FormLabel>
              </FormItem>
            )}
          />

          {/* ACTION BUTTONS */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="destructive" onClick={deleteBanner}>
              {isPending ? <Spinner /> : "Delete Banner"}
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Banner"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
