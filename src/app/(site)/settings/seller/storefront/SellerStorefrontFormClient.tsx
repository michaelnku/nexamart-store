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
import { Loader2 } from "lucide-react";
import { StoreDTO, StoreState } from "@/lib/types";

type Props = {
  initialTagline: string;
  initialLogo: string;
  initialLogoKey: string;
  initialBanner: string;
  initialBannerKey: string;
};

export default function SellerStorefrontFormClient() {
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoKey, setLogoKey] = useState<string | undefined>(undefined);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(undefined);
  const [bannerKey, setBannerKey] = useState<string | undefined>(undefined);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [storeState, setStoreState] = useState<StoreState>({
    status: "loading",
  });

  const setStore = (updates: Partial<StoreDTO>) => {
    setStoreState((prev) => {
      if (prev.status !== "active") return prev;

      return {
        status: "active",
        store: {
          ...prev.store,
          ...updates,
        },
      };
    });
  };

  const handleDeleteBanner = async () => {
    if (!bannerKey) return;

    setDeleting(true);
    try {
      await deleteBannerAction(bannerKey);
      setBannerUrl(undefined);
      setBannerKey(undefined);
      setStore({ bannerImage: null, bannerKey: null });
      toast.success("Banner removed");
    } catch {
      toast.error("Failed to delete banner");
    }
    setDeleting(false);
  };

  if (storeState.status !== "active") return null;

  const store = storeState.store;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storefront Appearance</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Banner Image Upload */}
        {/* Banner Upload */}
        <div className="space-y-3">
          <Label>Banner Image</Label>

          <div className="relative w-full h-40 sm:h-48 bg-gray-100 border rounded-xl overflow-hidden group">
            {bannerUrl ? (
              <Image
                src={bannerUrl}
                alt="Banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Banner – Add one
              </div>
            )}

            {/* 🔥 Uploading overlay (ALWAYS visible during upload) */}
            {uploading && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl text-white gap-2 z-20">
                <Loader2 className="animate-spin w-6 h-6" />
                <span className="text-xs">Uploading...</span>
              </div>
            )}

            {/* Hover panel */}
            {!uploading && (
              <div className="hidden sm:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-xl transition flex-col items-center justify-center gap-3 text-white text-sm cursor-pointer z-10">
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteBanner}
                    className="hover:text-red-300"
                  >
                    {deleting ? "Deleting..." : "Remove"}
                  </button>
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
                  appearance={{
                    button:
                      "text-xs font-medium text-white hover:text-gray-100",
                    container: "flex flex-col items-center",
                  }}
                  content={{
                    button: () => (bannerUrl ? "Change Banner" : "Add Banner"),
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile-visible banner controls */}
          {!uploading && (
            <div className="flex sm:hidden items-center gap-2">
              {bannerUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteBanner}
                >
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
                appearance={{
                  button: "text-xs font-medium",
                  container: "flex items-center",
                }}
                content={{
                  button: () => (bannerUrl ? "Change Banner" : "Add Banner"),
                }}
              />
            </div>
          )}
        </div>

        {/* Storefront Tagline */}
        <div className="space-y-2">
          <Label>Storefront Tagline / Slogan (optional)</Label>
          <Input
            placeholder="Example: Quality you can trust."
            value={store.tagline || ""}
            onChange={(e) =>
              setStore({
                ...store,
                tagline: e.target.value,
              })
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            Appears under your store name on the public storefront.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
