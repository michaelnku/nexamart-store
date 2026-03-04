"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { updateSellerStorefrontModule } from "@/actions/settings/sellerModules";
import { deleteBannerAction, deleteLogoAction } from "@/actions/actions";
import { UploadButton } from "@/utils/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [logo, setLogo] = useState(initialLogo);
  const [logoKey, setLogoKey] = useState(initialLogoKey);
  const [banner, setBanner] = useState(initialBanner);
  const [bannerKey, setBannerKey] = useState(initialBannerKey);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const removeLogo = async () => {
    if (!logoKey) return;
    const res = await deleteLogoAction(logoKey);
    if ((res as { error?: string })?.error) {
      toast.error((res as { error?: string }).error);
      return;
    }
    setLogo("");
    setLogoKey("");
    toast.success("Logo removed");
  };

  const removeBanner = async () => {
    if (!bannerKey) return;
    const res = await deleteBannerAction(bannerKey);
    if ((res as { error?: string })?.error) {
      toast.error((res as { error?: string }).error);
      return;
    }
    setBanner("");
    setBannerKey("");
    toast.success("Banner removed");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storefront</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateSellerStorefrontModule} className="space-y-6">
          <input type="hidden" name="logo" value={logo} readOnly />
          <input type="hidden" name="logoKey" value={logoKey} readOnly />
          <input type="hidden" name="bannerImage" value={banner} readOnly />
          <input type="hidden" name="bannerKey" value={bannerKey} readOnly />

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" defaultValue={initialTagline} />
          </div>

          <div className="space-y-3">
            <Label>Store Logo</Label>
            <div className="flex flex-wrap items-center gap-3">
              {logo ? (
                <Image
                  src={logo}
                  alt="Store logo"
                  width={72}
                  height={72}
                  className="rounded-full object-cover border"
                />
              ) : (
                <div className="h-[72px] w-[72px] rounded-full border bg-muted" />
              )}

              <UploadButton
                endpoint="storeLogo"
                onUploadBegin={() => setUploadingLogo(true)}
                onClientUploadComplete={(res) => {
                  setUploadingLogo(false);
                  const file = res[0];
                  setLogo(file.url);
                  setLogoKey(file.key);
                  toast.success("Logo uploaded");
                }}
                onUploadError={(error) => {
                  setUploadingLogo(false);
                  toast.error(error.message);
                }}
                content={{
                  button() {
                    if (uploadingLogo) return "Uploading...";
                    return logo ? "Replace Logo" : "Upload Logo";
                  },
                }}
              />

              {logo && (
                <Button type="button" variant="outline" onClick={removeLogo}>
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Store Banner</Label>
            <div className="space-y-3">
              {banner ? (
                <div className="relative h-40 w-full overflow-hidden rounded-xl border">
                  <Image
                    src={banner}
                    alt="Store banner"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 w-full rounded-xl border bg-muted" />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <UploadButton
                  endpoint="storeBanner"
                  onUploadBegin={() => setUploadingBanner(true)}
                  onClientUploadComplete={(res) => {
                    setUploadingBanner(false);
                    const file = res[0];
                    setBanner(file.url);
                    setBannerKey(file.key);
                    toast.success("Banner uploaded");
                  }}
                  onUploadError={(error) => {
                    setUploadingBanner(false);
                    toast.error(error.message);
                  }}
                  content={{
                    button() {
                      if (uploadingBanner) return "Uploading...";
                      return banner ? "Replace Banner" : "Upload Banner";
                    },
                  }}
                />
                {banner && (
                  <Button type="button" variant="outline" onClick={removeBanner}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Button type="submit">Save Storefront</Button>
        </form>
      </CardContent>
    </Card>
  );
}
