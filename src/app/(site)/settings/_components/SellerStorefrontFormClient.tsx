"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSellerStorefrontModule } from "@/actions/settings/sellerModules";
import { deleteBannerAction, deleteLogoAction } from "@/actions/actions";
import { UploadButton } from "@/utils/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";

type Props = {
  initialTagline: string;
  initialLogo: string;
  initialLogoKey: string;
  initialBanner: string;
  initialBannerKey: string;
};

export default function SellerStorefrontFormClient({
  initialTagline,
  initialLogo,
  initialLogoKey,
  initialBanner,
  initialBannerKey,
}: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogo);
  const [logoKey, setLogoKey] = useState(initialLogoKey);

  const [bannerUrl, setBannerUrl] = useState(initialBanner);
  const [bannerKey, setBannerKey] = useState(initialBannerKey);

  const [tagline, setTagline] = useState(initialTagline);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [addressSelectionValid, setAddressSelectionValid] = useState(true);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const { suggestions, loading, error, search, clear } =
    useAddressAutocomplete();

  const handleDeleteBanner = async () => {
    if (!bannerKey) return;

    setDeleting(true);

    try {
      await deleteBannerAction(bannerKey);

      setBannerUrl("");
      setBannerKey("");

      toast.success("Banner removed");
    } catch {
      toast.error("Failed to delete banner");
    }

    setDeleting(false);
  };

  const handleDeleteLogo = async () => {
    if (!logoKey) return;

    setDeleting(true);

    try {
      await deleteLogoAction(logoKey);

      setLogoUrl("");
      setLogoKey("");

      toast.success("Logo removed");
    } catch {
      toast.error("Failed to delete logo");
    }

    setDeleting(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();

        formData.append("tagline", tagline);
        formData.append("logo", logoUrl);
        formData.append("logoKey", logoKey);
        formData.append("bannerImage", bannerUrl);
        formData.append("bannerKey", bannerKey);

        await updateSellerStorefrontModule(formData);

        toast.success("Storefront updated");
      } catch {
        toast.error("Failed to update storefront");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storefront Appearance</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* LOGO */}
        <div className="space-y-3">
          <Label>Store Logo</Label>

          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border">
              {logoUrl ? (
                <Image src={logoUrl} alt="logo" fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Logo
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {logoUrl && (
                <Button variant="outline" size="sm" onClick={handleDeleteLogo}>
                  {deleting ? "Deleting..." : "Remove"}
                </Button>
              )}

              <UploadButton
                endpoint="storeLogo"
                onUploadBegin={() => setUploading(true)}
                onClientUploadComplete={(res) => {
                  setUploading(false);

                  const file = res[0];

                  setLogoUrl(file.url);
                  setLogoKey(file.key);

                  toast.success("Logo updated!");
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
          </div>
        </div>

        {/* BANNER */}
        <div className="space-y-3">
          <Label>Banner Image</Label>

          <div className="relative w-full h-40 bg-gray-100 border rounded-xl overflow-hidden">
            {bannerUrl ? (
              <Image
                src={bannerUrl}
                alt="banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Banner
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {bannerUrl && (
              <Button variant="outline" size="sm" onClick={handleDeleteBanner}>
                {deleting ? "Deleting..." : "Remove"}
              </Button>
            )}

            <UploadButton
              endpoint="storeBanner"
              onUploadBegin={() => setUploading(true)}
              onClientUploadComplete={(res) => {
                setUploading(false);

                const file = res[0];

                setBannerUrl(file.url);
                setBannerKey(file.key);

                toast.success("Banner updated!");
              }}
              className="
    ut-button:bg-muted
    ut-button:text-foreground
    ut-button:border
    ut-button:border-border
    ut-button:rounded-md
    ut-button:px-4
    ut-button:py-2
    ut-button:text-sm
    hover:ut-button:bg-muted/70
  "
            />
          </div>
        </div>

        {/* TAGLINE */}

        <div className="space-y-2">
          <Label>Storefront Tagline</Label>

          <Input
            placeholder="Example: Quality you can trust"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
