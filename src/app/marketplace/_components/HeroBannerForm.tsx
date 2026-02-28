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

export default function HeroBannerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [uploading, setUploading] = useState(false);

  const form = useForm<HeroBannerInput>({
    resolver: zodResolver(heroBannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      ctaText: "",
      ctaLink: "",
      backgroundImage: "",
      productImage: "",
      lottieUrl: "",
      position: 0,
      placement: "HOMEPAGE",
      isActive: true,
      startsAt: null,
      endsAt: null,
    },
  });

  const { control, handleSubmit, setValue, getValues } = form;
  const onSubmit = (values: HeroBannerInput) => {
    startTransition(async () => {
      await createHeroBannerAction(values);
      form.reset();
      router.refresh();
    });
  };

  const heroBannerImage = form.watch("backgroundImage");

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
                  <Input placeholder="NexaMart Mega Sale" {...field} />
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
                  <Textarea
                    placeholder="Up to 50% off limited time"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CTA Text */}
          <FormField
            control={form.control}
            name="ctaText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTA Text</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Shop Now"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* CTA Link */}
          <FormField
            control={form.control}
            name="ctaLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTA Link</FormLabel>
                <FormControl>
                  <Input
                    placeholder="/sale"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Background Image */}
          <FormField
            control={form.control}
            name="backgroundImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Background Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

              setValue(
                "backgroundImage",
                {
                  url: file.url,
                  key: file.key,
                },
                { shouldDirty: true },
              );

              toast.success("Hero banner image uploaded");
            }}
            className="
     ut-button:bg-[var(--brand-blue)]
        ut-button:text-white
        ut-button:border
        ut-button:border-blue-500/30
        ut-button:rounded-full
        ut-button:px-6
        ut-button:py-2
        ut-button:text-sm
        hover:ut-button:bg-blue-500/20
      "
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
                      <SelectValue placeholder="Select placement" />
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

          {/* Position */}
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Dates */}
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

          {/* Active */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Active</FormLabel>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#3c9ee0] hover:bg-[#3389c5]"
          >
            {isPending ? "Saving..." : "Create Banner"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
