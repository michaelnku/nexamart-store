"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createHeroBannerAction,
  deleteHeroBannerImageAction,
} from "@/actions/banner/banners";
import { UploadButton } from "@/utils/uploadthing";
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
                  <FormLabel>Background Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {backgroundImage?.url ? (
                        <Image
                          src={backgroundImage.url}
                          alt="Background preview"
                          width={800}
                          height={400}
                          className="rounded-xl border"
                        />
                      ) : null}

                      <UploadButton
                        endpoint="heroBanner"
                        onClientUploadComplete={(result) => {
                          const file = result?.[0];
                          if (!file) {
                            return;
                          }

                          form.setValue("backgroundImage", {
                            url: file.url,
                            key: file.key,
                          });
                          toast.success("Background image uploaded");
                        }}
                      />

                      {backgroundImage?.key ? (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => deleteSingleImage("backgroundImage")}
                        >
                          Remove Background
                        </Button>
                      ) : null}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productImage"
              render={() => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {productImage?.url ? (
                        <Image
                          src={productImage.url}
                          alt="Product preview"
                          width={320}
                          height={320}
                          className="rounded-xl border"
                        />
                      ) : null}

                      <UploadButton
                        endpoint="heroBanner"
                        onClientUploadComplete={(result) => {
                          const file = result?.[0];
                          if (!file) {
                            return;
                          }

                          form.setValue("productImage", {
                            url: file.url,
                            key: file.key,
                          });
                          toast.success("Product image uploaded");
                        }}
                      />

                      {productImage?.key ? (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => deleteSingleImage("productImage")}
                        >
                          Remove Product Image
                        </Button>
                      ) : null}
                    </div>
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
