"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { heroBannerSchema, HeroBannerInput } from "@/lib/zodValidation";
import { updateHeroBannerAction } from "@/actions/banners";
import { UploadButton } from "@/utils/uploadthing";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HeroBannerImage } from "@/lib/types";
import { HeroBanner } from "@/generated/prisma";

type HeroBannerWithFiles = Omit<
  HeroBanner,
  "backgroundImage" | "productImage"
> & {
  backgroundImage: HeroBannerImage;
  productImage: HeroBannerImage | null;
};

type Props = {
  banner: HeroBannerWithFiles;
};

export default function HeroBannerEditForm({ banner }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<HeroBannerInput>({
    resolver: zodResolver(heroBannerSchema),
    defaultValues: {
      ...banner,
    },
  });

  const bgImage = form.watch("backgroundImage");

  const onSubmit = (values: HeroBannerInput) => {
    startTransition(async () => {
      const res = await updateHeroBannerAction(banner.id, values);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Updated successfully");
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {bgImage?.url && (
        <Image
          src={bgImage.url}
          alt="Preview"
          width={600}
          height={300}
          className="rounded-xl border"
        />
      )}

      <UploadButton
        endpoint="heroBanner"
        onClientUploadComplete={(res) => {
          const file = res[0];
          form.setValue("backgroundImage", {
            url: file.url,
            key: file.key,
          });
          toast.success("New image uploaded");
        }}
      />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update Banner"}
      </Button>
    </form>
  );
}
