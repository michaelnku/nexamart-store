"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { heroBannerSchema, HeroBannerInput } from "@/lib/zodValidation";

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

import { createHeroBannerAction } from "@/actions/hero-banners";
import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";
import Image from "next/image";

export default function HeroBannerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingProduct, setUploadingProduct] = useState(false);

  const form = useForm<HeroBannerInput>({
    resolver: zodResolver(heroBannerSchema),
    defaultValues: {
      title: "",
      subtitle: null,
      ctaText: null,
      ctaLink: null,
      backgroundImage:
        undefined as unknown as HeroBannerInput["backgroundImage"],
      productImage: null,
      lottieUrl: null,
      position: 0,
      placement: "HOMEPAGE",
      isActive: true,
      startsAt: null,
      endsAt: null,
    },
  });

  const onSubmit = (values: HeroBannerInput) => {
    startTransition(async () => {
      const res = await createHeroBannerAction(values);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Banner created successfully");
      form.reset();
      router.refresh();
    });
  };

  const backgroundImage = form.watch("backgroundImage");
  const productImage = form.watch("productImage");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Create Hero Banner</h1>
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
                  <Input {...field} />
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
                <FormLabel>Background Image (Required)</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {backgroundImage?.url && (
                      <Image
                        src={backgroundImage.url}
                        alt="Background Preview"
                        width={800}
                        height={400}
                        className="rounded-xl border"
                      />
                    )}

                    <UploadButton
                      endpoint="heroBanner"
                      onUploadBegin={() => setUploadingBg(true)}
                      onClientUploadComplete={(res) => {
                        setUploadingBg(false);
                        const file = res?.[0];
                        if (!file) {
                          toast.error("Upload failed");
                          return;
                        }

                        form.setValue("backgroundImage", {
                          url: file.url,
                          key: file.key,
                        });

                        toast.success("Background uploaded");
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
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* PRODUCT IMAGE */}
          <FormField
            control={form.control}
            name="productImage"
            render={() => (
              <FormItem>
                <FormLabel>Product Image (Optional)</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {productImage?.url && (
                      <Image
                        src={productImage.url}
                        alt="Product Preview"
                        width={300}
                        height={300}
                        className="rounded-xl border"
                      />
                    )}

                    <UploadButton
                      endpoint="heroBanner"
                      onUploadBegin={() => setUploadingProduct(true)}
                      onClientUploadComplete={(res) => {
                        setUploadingProduct(false);
                        const file = res?.[0];
                        if (!file) {
                          toast.error("Upload failed");
                          return;
                        }

                        form.setValue("productImage", {
                          url: file.url,
                          key: file.key,
                        });

                        toast.success("Product image uploaded");
                      }}
                      className="
    ut-button:bg-black
    ut-button:text-white
    ut-button:rounded-lg
    ut-button:px-6
    ut-button:py-3
    ut-button:text-sm
    ut-button:font-medium
    hover:ut-button:bg-black/90
  "
                    />

                    {productImage && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => form.setValue("productImage", null)}
                      >
                        Remove Product Image
                      </Button>
                    )}
                  </div>
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
                <FormLabel>Position (Order)</FormLabel>
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

          {/* START & END DATES */}
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

          {/* ACTIVE TOGGLE */}
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

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Create Banner"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
