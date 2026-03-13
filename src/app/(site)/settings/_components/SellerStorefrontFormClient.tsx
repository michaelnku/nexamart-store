"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { updateSellerStorefrontModule } from "@/actions/settings/sellerModules";
import { deleteBannerAction, deleteLogoAction } from "@/actions/actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketplaceMediaUploader } from "@/components/media/MarketplaceMediaUploader";

type Props = {
  initialTagline: string;
  initialLogo: string;
  initialLogoKey: string;
  initialBanner: string;
  initialBannerKey: string;
  isStoreVerified: boolean;
};

export default function SellerStorefrontFormClient({
  initialTagline,
  initialLogo,
  initialLogoKey,
  initialBanner,
  initialBannerKey,
  isStoreVerified,
}: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogo);
  const [logoKey, setLogoKey] = useState(initialLogoKey);

  const [bannerUrl, setBannerUrl] = useState(initialBanner);
  const [bannerKey, setBannerKey] = useState(initialBannerKey);

  const [tagline, setTagline] = useState(initialTagline);

  const [isLogoProcessing, setIsLogoProcessing] = useState(false);
  const [isBannerProcessing, setIsBannerProcessing] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);

  const [isPending, startTransition] = useTransition();

  const isProcessing = isLogoProcessing || isBannerProcessing;
  const isDeleting = isDeletingLogo || isDeletingBanner;
  const isBusy = isPending || isProcessing || isDeleting;

  const logoFiles = useMemo(
    () => (logoUrl && logoKey ? [{ url: logoUrl, key: logoKey }] : []),
    [logoUrl, logoKey],
  );

  const bannerFiles = useMemo(
    () => (bannerUrl && bannerKey ? [{ url: bannerUrl, key: bannerKey }] : []),
    [bannerUrl, bannerKey],
  );

  const runDelete = async ({
    key,
    setDeleting,
    deleteAction,
    reset,
    successMessage,
    errorMessage,
  }: {
    key: string;
    setDeleting: (value: boolean) => void;
    deleteAction: (fileKey: string) => Promise<unknown>;
    reset: () => void;
    successMessage: string;
    errorMessage: string;
  }) => {
    if (!key) return;

    setDeleting(true);

    try {
      await deleteAction(key);
      reset();
      toast.success(successMessage);
    } catch {
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteLogo = async () => {
    await runDelete({
      key: logoKey,
      setDeleting: setIsDeletingLogo,
      deleteAction: deleteLogoAction,
      reset: () => {
        setLogoUrl("");
        setLogoKey("");
      },
      successMessage: "Logo removed",
      errorMessage: "Failed to delete logo",
    });
  };

  const handleDeleteBanner = async () => {
    await runDelete({
      key: bannerKey,
      setDeleting: setIsDeletingBanner,
      deleteAction: deleteBannerAction,
      reset: () => {
        setBannerUrl("");
        setBannerKey("");
      },
      successMessage: "Banner removed",
      errorMessage: "Failed to delete banner",
    });
  };

  const handleSave = () => {
    if (isBusy) return;

    startTransition(async () => {
      try {
        const formData = new FormData();

        formData.append("tagline", tagline.trim());
        formData.append("logo", logoUrl ?? "");
        formData.append("logoKey", logoKey ?? "");
        formData.append("bannerImage", bannerUrl ?? "");
        formData.append("bannerKey", bannerKey ?? "");

        await updateSellerStorefrontModule(formData);

        toast.success("Storefront updated");
      } catch {
        toast.error("Failed to update storefront");
      }
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle>Storefront Appearance</CardTitle>

        <p className="text-sm text-muted-foreground">
          Verification status:{" "}
          <span
            className={
              isStoreVerified
                ? "font-medium text-green-600"
                : "font-medium text-yellow-600"
            }
          >
            {isStoreVerified ? "Verified" : "Pending"}
          </span>
          {" — "}
          <Link
            href="/settings/verification"
            className="font-medium text-blue-600 hover:underline"
          >
            {isStoreVerified ? "View details" : "Start verification process"}
          </Link>
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Store Logo</Label>

          <MarketplaceMediaUploader
            value={logoFiles}
            endpoint="storeLogo"
            maxImages={1}
            aspect={1}
            disabled={isPending || isDeletingLogo}
            title="Store logo"
            tip="A clean logo helps your storefront feel more credible."
            helperText="Crop, refine, resize, and upload one polished logo for your store identity."
            emptyText="No logo uploaded yet."
            uploadButtonText="Choose Logo"
            uploadSuccessMessage="Logo updated!"
            queuePrefixText="Preparing"
            previewLabel={() => "Logo"}
            previewContainerClassName="h-28 w-28 rounded-full"
            previewImageClassName="object-cover"
            gridClassName="grid-cols-1"
            onChange={(images) => {
              const nextLogo = images[0];
              setLogoUrl(nextLogo?.url ?? "");
              setLogoKey(nextLogo?.key ?? "");
            }}
            onDelete={handleDeleteLogo}
            onProcessingChange={setIsLogoProcessing}
          />
        </div>

        <div className="space-y-3">
          <Label>Banner Image</Label>

          <MarketplaceMediaUploader
            value={bannerFiles}
            endpoint="storeBanner"
            maxImages={1}
            aspect={16 / 7}
            disabled={isPending || isDeletingBanner}
            title="Store banner"
            tip="A clean branded banner improves storefront perception and trust."
            helperText="Crop, refine, resize, and upload one wide banner for your storefront header."
            emptyText="No banner uploaded yet."
            uploadButtonText="Choose Banner"
            uploadSuccessMessage="Banner updated!"
            queuePrefixText="Preparing"
            previewLabel={() => "Banner"}
            previewContainerClassName="aspect-[16/7] rounded-2xl"
            previewImageClassName="object-cover"
            gridClassName="grid-cols-1"
            onChange={(images) => {
              const nextBanner = images[0];
              setBannerUrl(nextBanner?.url ?? "");
              setBannerKey(nextBanner?.key ?? "");
            }}
            onDelete={handleDeleteBanner}
            onProcessingChange={setIsBannerProcessing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storefront-tagline">Storefront Tagline</Label>
          <Input
            id="storefront-tagline"
            placeholder="Example: Quality you can trust"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            disabled={isPending}
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground">
            Keep it short, clear, and brand-friendly.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isBusy} className="w-full">
          {isPending
            ? "Saving..."
            : isProcessing
              ? "Processing media..."
              : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
