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
  const [uploading, setUploading] = useState(false);

  const form = useForm<HeroBannerInput>({
    resolver: zodResolver(heroBannerSchema),
    defaultValues: {
      title: "",
      subtitle: null,
      ctaText: null,
      ctaLink: null,
      backgroundImage: undefined as any,
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

      toast.success("Banner created");
      form.reset();
      router.refresh();
    });
  };

  const backgroundImage = form.watch("backgroundImage");

  return (
    <div className="max-w-3xl space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
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

          {/* Subtitle */}
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

          {/* Upload Background */}
          <FormField
            control={form.control}
            name="backgroundImage"
            render={() => (
              <FormItem>
                <FormLabel>Background Image</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {backgroundImage?.url && (
                      <Image
                        src={backgroundImage.url}
                        alt="Preview"
                        width={600}
                        height={300}
                        className="rounded-xl border"
                      />
                    )}

                    <UploadButton
                      endpoint="heroBanner"
                      onUploadBegin={() => setUploading(true)}
                      onClientUploadComplete={(res) => {
                        setUploading(false);
                        const file = res[0];
                        if (!file) {
                          toast.error("Upload failed");
                          return;
                        }

                        form.setValue("backgroundImage", {
                          url: file.url,
                          key: file.key,
                        });

                        toast.success("Uploaded successfully");
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Placement */}
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

          {/* Active */}
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
