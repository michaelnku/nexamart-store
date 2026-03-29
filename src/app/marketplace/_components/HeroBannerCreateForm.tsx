"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createHeroBannerAction,
  deleteHeroBannerImageAction,
} from "@/actions/banner/banners";
import { CroppedImageUploadField } from "@/components/media/CroppedImageUploadField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { HeroBannerInput, heroBannerSchema } from "@/lib/zodValidation";

export default function HeroBannerCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<HeroBannerInput>({
    resolver: zodResolver(heroBannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      ctaText: "",
      ctaLink: "",
      backgroundImage: null,
      productImage: null,
      lottieUrl: "",
      position: 0,
      placement: "HOMEPAGE",
      isActive: true,
      startsAt: null,
      endsAt: null,
    },
  });

  const backgroundImage = form.watch("backgroundImage");
  const productImage = form.watch("productImage");

  const deleteSingleImage = async (
    field: "backgroundImage" | "productImage",
  ) => {
    const file = form.getValues(field);
    if (!file?.key) {
      return;
    }

    try {
      await deleteHeroBannerImageAction(file.key);
      form.setValue(field, null);
      toast.success("File removed");
    } catch {
      toast.error("Failed to remove file");
    }
  };

  const onSubmit = (values: HeroBannerInput) => {
    startTransition(async () => {
      const result = await createHeroBannerAction(values);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Banner created successfully");
      form.reset({
        title: "",
        subtitle: "",
        ctaText: "",
        ctaLink: "",
        backgroundImage: null,
        productImage: null,
        lottieUrl: "",
        position: 0,
        placement: "HOMEPAGE",
        isActive: true,
        startsAt: null,
        endsAt: null,
      });
      router.refresh();
    });
  };

  return (
    <div
      id="new-banner"
      className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-6 space-y-1">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Add New Banner
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Create a new hero banner placement for homepage or category campaigns.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="grid gap-4 md:grid-cols-2">
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
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <FormField
              control={form.control}
              name="backgroundImage"
              render={() => (
                <FormItem>
                  <FormControl>
                    <CroppedImageUploadField
                      label="Background Image"
                      value={backgroundImage}
                      onChange={(file) => form.setValue("backgroundImage", file)}
                      onDelete={() => deleteSingleImage("backgroundImage")}
                      endpoint="heroBanner"
                      aspect={2}
                      targetWidth={1600}
                      targetHeight={800}
                      previewWidth={800}
                      previewHeight={400}
                      previewAlt="Background preview"
                      helperText="Crop the hero background before upload so wide placements stay framed the way you expect."
                      emptyText="Upload a wide banner background. A crop step opens before the file is saved."
                      successMessage="Background image uploaded"
                      removeLabel="Remove Background"
                      replaceLabel="Replace Background"
                      uploadLabel="Choose Background"
                      previewClassName="rounded-xl"
                      cropDialogDescription="Adjust the framing before upload so wide banner placements stay composed the way you expect."
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productImage"
              render={() => (
                <FormItem>
                  <FormControl>
                    <CroppedImageUploadField
                      label="Product Image"
                      value={productImage}
                      onChange={(file) => form.setValue("productImage", file)}
                      onDelete={() => deleteSingleImage("productImage")}
                      endpoint="heroBanner"
                      aspect={1}
                      targetWidth={1200}
                      targetHeight={1200}
                      previewWidth={320}
                      previewHeight={320}
                      previewAlt="Product preview"
                      helperText="Crop the featured product art before upload so the focal subject stays centered in the hero."
                      emptyText="Upload an optional foreground product image. You can crop it before it uploads."
                      successMessage="Product image uploaded"
                      removeLabel="Remove Product Image"
                      replaceLabel="Replace Product Image"
                      uploadLabel="Choose Product Image"
                      previewClassName="rounded-xl"
                      cropDialogDescription="Crop the featured product image before upload so the focal subject stays centered in the hero."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority / Position</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? new Date(event.target.value)
                            : null,
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
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? new Date(event.target.value)
                            : null,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Spinner />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Banner
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
