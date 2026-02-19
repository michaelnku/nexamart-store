"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Camera, Loader2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Image from "next/image";
import { toast } from "sonner";
import { UploadButton } from "@/utils/uploadthing";
import { deleteBannerAction, deleteLogoAction } from "@/actions/actions";
import { useRouter } from "next/navigation";
import { deleteStoreAction, UpdateStoreAction } from "@/actions/auth/store";
import { StoreDTO } from "@/lib/types";
import { StoreSettingsSkeleton } from "@/components/skeletons/StoreSettingsSkeleton";
import {
  AddressSuggestion,
  useAddressAutocomplete,
} from "@/hooks/useAddressAutocomplete";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type StoreState =
  | { status: "loading" }
  | { status: "active"; store: StoreDTO }
  | { status: "deleted" };

const SellerSettingsPage = () => {
  const user = useCurrentUser();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [storeState, setStoreState] = useState<StoreState>({
    status: "loading",
  });

  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoKey, setLogoKey] = useState<string | undefined>(undefined);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(undefined);
  const [bannerKey, setBannerKey] = useState<string | undefined>(undefined);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingStore, setDeletingStore] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressSelectionValid, setAddressSelectionValid] = useState(true);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const { suggestions, loading, error, search, clear } = useAddressAutocomplete();

  useEffect(() => {
    if (!user?.id) return;

    const fetchStore = async () => {
      try {
        const res = await fetch(`/api/user/${user.id}/store`);

        if (res.status === 404) {
          setStoreState({ status: "deleted" });
          return;
        }

        const data = await res.json();
        setStoreState({ status: "active", store: data });
        const requiresAddress = data.fulfillmentType !== "DIGITAL";
        const hasAddress = Boolean(data.address?.trim());
        setAddressSelectionValid(!requiresAddress || hasAddress);
        setSelectedAddressId(hasAddress ? `existing-${data.id}` : null);

        setLogoUrl(data.logo ?? undefined);
        setLogoKey(data.logoKey ?? undefined);
        setBannerUrl(data.bannerImage ?? undefined);
        setBannerKey(data.bannerKey ?? undefined);
      } catch {
        setStoreState({ status: "deleted" });
      }
    };

    fetchStore();
  }, [user?.id]);

  const refreshStore = async () => {
    try {
      if (!user?.id) return;
      const res = await fetch(`/api/user/${user.id}/store`);

      if (res.status === 404) {
        setStoreState({ status: "deleted" });
        return;
      }
      const data = await res.json();
      setStoreState({ status: "active", store: data });
      const requiresAddress = data.fulfillmentType !== "DIGITAL";
      const hasAddress = Boolean(data.address?.trim());
      setAddressSelectionValid(!requiresAddress || hasAddress);
      setSelectedAddressId(hasAddress ? `existing-${data.id}` : null);
      setShowAddressSuggestions(false);
      clear();

      setLogoUrl(data?.logo ?? undefined);
      setLogoKey(data?.logoKey ?? undefined);
    } catch {
      setStoreState({ status: "deleted" });
    }
  };

  // LOADING UI
  if (storeState.status === "loading") {
    return <StoreSettingsSkeleton />;
  }

  // DELETE LOGO & Banner
  const handleDeleteLogo = async () => {
    if (!logoKey) return;

    setDeleting(true);
    try {
      await deleteLogoAction(logoKey);
      setLogoUrl(undefined);
      setLogoKey(undefined);
      toast.success("Logo removed");
    } catch {
      toast.error("Unable to delete logo");
    }
    setDeleting(false);
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

  // SELLER WITHOUT A STORE
  const handleCreateStore = () => {
    startTransition(() => {
      router.push("/marketplace/dashboard/seller/store/create-store");
    });
  };

  if (storeState.status === "deleted") {
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 space-y-6 text-center py-10 sm:py-12">
        <h1 className="text-xl sm:text-2xl font-semibold">Store Closed</h1>

        <div>
          <p className="text-muted-foreground">
            Your store has been permanently closed and is no longer visible on
            NexaMart.
          </p>

          <p className="text-sm text-muted-foreground">
            If this was a mistake or you would like to reopen your store, please
            contact support.
          </p>
        </div>

        <Button variant="outline" asChild>
          <a href="mailto:support@nexamart.com">Contact Support</a>
        </Button>
      </main>
    );
  }

  if (storeState.status !== "active") return null;

  const store = storeState.store;

  if (store === null) {
    return (
      <main className="space-y-8 max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Your Store</h1>
        <p className="text-gray-500">
          You don&apos;t have a store yet. Set up your store to start selling on
          NexaMart.
        </p>
        <Button
          onClick={handleCreateStore}
          disabled={isPending}
          className="disabled:opacity-70 disabled:cursor-not-allowed bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white px-5 py-3 rounded-lg text-lg"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Please wait...</span>
            </div>
          ) : (
            "Create Store"
          )}
        </Button>
      </main>
    );
  }

  const handleSave = () => {
    const requiresAddress = store.fulfillmentType !== "DIGITAL";
    if (requiresAddress && (!store.address?.trim() || !addressSelectionValid)) {
      toast.error("Please select a valid address from suggestions.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await UpdateStoreAction({
          id: store.id,
          name: store.name,
          description: store.description,
          location: store.location,
          address: store.address ?? undefined,
          tagline: store.tagline ?? undefined,

          type: store.type,
          fulfillmentType: store.fulfillmentType,

          logo: logoUrl,
          logoKey,

          bannerImage: bannerUrl,
          bannerKey,

          isActive: store.isActive,
          emailNotificationsEnabled: store.emailNotificationsEnabled,
        });

        if (res?.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Store updated successfully!");
        await refreshStore();
      } catch {
        toast.error("Something went wrong.");
      }
    });
  };

  const handleSelectStoreAddress = (suggestion: AddressSuggestion) => {
    setStore({ address: suggestion.place_name });
    setSelectedAddressId(suggestion.id);
    setAddressSelectionValid(true);
    setShowAddressSuggestions(false);
    clear();
  };

  //delete store
  const handleDeleteStore = async () => {
    if (!store) return;

    setDeletingStore(true);

    startTransition(async () => {
      try {
        const res = await deleteStoreAction(store.id);

        if (res?.error) {
          toast.error(res.error);
          setDeletingStore(false);
          return;
        }

        toast.success("Store deleted successfully");
        setDeleteOpen(false);
        router.replace("/marketplace/dashboard");
      } catch {
        toast.error("Failed to delete store");
        setDeletingStore(false);
      }
    });
  };

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

  return (
    <main className="space-y-6 sm:space-y-8 max-w-4xl mx-auto px-4 sm:px-6 pb-8">
      <h1 className="text-2xl sm:text-3xl font-semibold">Store Settings</h1>

      {/* BUSINESS PROFILE */}
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={store.name}
                onChange={(e) => setStore({ ...store, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location (City/State)</Label>
            <Input
              value={store.location || ""}
              onChange={(e) => setStore({ ...store, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label>Store Type</Label>
              <Select
                value={store.type}
                onValueChange={(v) =>
                  setStore({ ...store, type: v as StoreDTO["type"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General Store</SelectItem>
                  <SelectItem value="FOOD">Food Store</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select
                value={store.fulfillmentType}
                onValueChange={(v) => {
                  setStore({
                    ...store,
                    fulfillmentType: v as StoreDTO["fulfillmentType"],
                  });
                  if (v === "DIGITAL") {
                    setAddressSelectionValid(true);
                    setSelectedAddressId(null);
                    setShowAddressSuggestions(false);
                    clear();
                  } else if (!store.address?.trim()) {
                    setAddressSelectionValid(false);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHYSICAL">Physical</SelectItem>
                  <SelectItem value="DIGITAL">Digital</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 relative">
            <Label>
              {store.fulfillmentType === "DIGITAL"
                ? "Store Address (Optional)"
                : "Store Address"}
            </Label>
            <Input
              value={store.address || ""}
              onFocus={() => setShowAddressSuggestions(true)}
              onChange={(e) => {
                const value = e.target.value;
                setStore({ ...store, address: value });
                if (selectedAddressId) {
                  setSelectedAddressId(null);
                }
                if (store.fulfillmentType !== "DIGITAL") {
                  setAddressSelectionValid(false);
                }
                search(value);
                setShowAddressSuggestions(true);
              }}
            />
            {store.fulfillmentType !== "DIGITAL" && !addressSelectionValid && (
              <p className="text-sm text-red-500">
                Please select a valid address from suggestions.
              </p>
            )}
            {showAddressSuggestions &&
              (loading || suggestions.length > 0 || error) && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-sm">
                  {loading && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Loading suggestions...
                    </p>
                  )}
                  {!loading &&
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => handleSelectStoreAddress(suggestion)}
                      >
                        {suggestion.place_name}
                      </button>
                    ))}
                  {!loading && !suggestions.length && !error && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      No suggestions found.
                    </p>
                  )}
                  {!loading && error && (
                    <p className="px-3 py-2 text-sm text-red-500">{error}</p>
                  )}
                </div>
              )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={store.description || ""}
              onChange={(e) =>
                setStore({ ...store, description: e.target.value })
              }
            />
          </div>

          {/* LOGO */}
          <div className="space-y-3">
            <Label>Store Logo</Label>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border shadow-sm flex items-center justify-center bg-gray-100">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="logo"
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  )}
                </div>

                {/* Desktop hover overlay */}
                <div className="hidden sm:flex absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex-col items-center justify-center cursor-pointer gap-1 text-white text-sm">
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="text-red-300"
                    >
                      {deleting ? "Deleting..." : "Remove"}
                    </button>
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
                    appearance={{
                      button: "bg-transparent text-white",
                      container: "flex items-center justify-center w-full h-full",
                    }}
                    content={{
                      button() {
                        return uploading
                          ? "Uploading..."
                          : logoUrl
                            ? "Edit"
                            : "Add Photo";
                      },
                    }}
                  />
                </div>
              </div>

              {/* Mobile-visible controls */}
              <div className="flex items-center gap-2 sm:hidden">
                {logoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteLogo}
                  >
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
                  appearance={{
                    button: "text-xs font-medium",
                    container: "flex items-center justify-center",
                  }}
                  content={{
                    button: () =>
                      uploading ? "Uploading..." : logoUrl ? "Change" : "Add",
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STOREFRONT APPEARANCE */}
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
                      button: () =>
                        bannerUrl ? "Change Banner" : "Add Banner",
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

      {/* PREFERENCES SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Store Preferences</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Label>Enable Storefront</Label>
            <Switch
              checked={store.isActive}
              onCheckedChange={(checked) =>
                setStore({ ...store, isActive: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label>Email Notifications</Label>
            <Switch
              checked={store.emailNotificationsEnabled}
              onCheckedChange={(checked) =>
                setStore({ ...store, emailNotificationsEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Button
          size="lg"
          className="w-full disabled:opacity-70 disabled:cursor-not-allowed text-lg py-3 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)]"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <p>Save Changes</p>
          )}
        </Button>

        {/*delete modal */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="w-full text-red-500 font-medium hover:underline"
            >
              DELETE MY STORE
            </button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">
                Delete your store?
              </AlertDialogTitle>
              <AlertDialogDescription className="flex flex-col">
                <span>
                  This action is <strong>permanent</strong> and cannot be
                  undone.
                </span>
                <span>
                  Your store, products, and storefront visibility will be
                  removed.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <Label>Type &quot;DELETE MY STORE&quot; to confirm</Label>

              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>

            {/* 🔥 Action feedback */}
            {deletingStore && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting your store…
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingStore}>
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteStore();
                }}
                disabled={deletingStore || confirmText !== "DELETE MY STORE"}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingStore ? "Deleting…" : "Yes, delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
};

const AdminSettingsPage = () => {
  // General site settings
  const [siteName, setSiteName] = useState("Nexamart");
  const [siteEmail, setSiteEmail] = useState("support@nexamart.com");
  const [sitePhone, setSitePhone] = useState("+234 800 000 0000");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Platform control toggles
  const [allowNewSellers, setAllowNewSellers] = useState(true);
  const [allowNewBuyers, setAllowNewBuyers] = useState(true);

  // Currency & branding
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [themeColor, setThemeColor] = useState("blue");
  const [logo, setLogo] = useState<File | null>(null);

  // Social media
  const [facebook, setFacebook] = useState("https://facebook.com/nexamart");
  const [instagram, setInstagram] = useState("https://instagram.com/nexamart");
  const [twitter, setTwitter] = useState("https://x.com/nexamart");
  const [whatsapp, setWhatsapp] = useState("https://wa.me/2348000000000");

  // Integrations
  const [paystackKey, setPaystackKey] = useState("pk_test_xxxxx");
  const [stripeKey, setStripeKey] = useState("sk_test_xxxxx");
  const [smtpEmail, setSmtpEmail] = useState("admin@nexamart.com");
  const [smtpPassword, setSmtpPassword] = useState("********");

  // Notification controls
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [adminAlerts, setAdminAlerts] = useState(true);

  // Support settings
  const [supportMessage, setSupportMessage] = useState(
    "Hello! How can we help you today?",
  );
  const [supportEmail, setSupportEmail] = useState("help@nexamart.com");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSave = () => {
    console.log({
      siteName,
      siteEmail,
      sitePhone,
      maintenanceMode,
      allowNewSellers,
      allowNewBuyers,
      defaultCurrency,
      themeColor,
      logo: logo?.name || "No file uploaded",
      facebook,
      instagram,
      twitter,
      whatsapp,
      paystackKey,
      stripeKey,
      smtpEmail,
      smtpPassword,
      emailNotifications,
      smsNotifications,
      adminAlerts,
      supportMessage,
      supportEmail,
    });
  };

  return (
    <main className="p-4 md:ml-62 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Site Settings</h1>
        <Button size="lg" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      {/* General Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>General Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Site Name</Label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div>
            <Label>Support Email</Label>
            <Input
              type="email"
              value={siteEmail}
              onChange={(e) => setSiteEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Support Phone</Label>
            <Input
              value={sitePhone}
              onChange={(e) => setSitePhone(e.target.value)}
            />
          </div>
          <div>
            <Label>Business Address</Label>
            <Input placeholder="Business Address" />
          </div>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Business Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="Terms of Service" />
          <Textarea placeholder="Privacy Policy" />
          <Textarea placeholder="Refund Policy" />
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Branding & Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Upload Logo</Label>
            <div className="flex items-center gap-4 mt-2">
              <Input type="file" accept="image/*" onChange={handleLogoUpload} />
              {logo && (
                <span className="text-sm text-muted-foreground">
                  {logo.name}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label>Theme Color</Label>
            <Select value={themeColor} onValueChange={setThemeColor}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Platform Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Maintenance Mode</Label>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Allow New Seller Signups</Label>
            <Switch
              checked={allowNewSellers}
              onCheckedChange={setAllowNewSellers}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Allow New Buyer Registrations</Label>
            <Switch
              checked={allowNewBuyers}
              onCheckedChange={setAllowNewBuyers}
            />
          </div>
        </CardContent>
      </Card>

      {/* Currency & Localization */}
      <Card>
        <CardHeader>
          <CardTitle>Currency & Localization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Default Currency</Label>
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="NGN">NGN (₦)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media & External Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Facebook URL"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
          />
          <Input
            placeholder="Instagram URL"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
          <Input
            placeholder="Twitter / X URL"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
          />
          <Input
            placeholder="WhatsApp Link"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations & API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Paystack Public Key"
            value={paystackKey}
            onChange={(e) => setPaystackKey(e.target.value)}
          />
          <Input
            placeholder="Stripe Secret Key"
            value={stripeKey}
            onChange={(e) => setStripeKey(e.target.value)}
          />
          <Input
            placeholder="SMTP Email"
            value={smtpEmail}
            onChange={(e) => setSmtpEmail(e.target.value)}
          />
          <Input
            placeholder="SMTP Password"
            type="password"
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Email Notifications</Label>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>SMS Notifications</Label>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Admin Alerts</Label>
            <Switch checked={adminAlerts} onCheckedChange={setAdminAlerts} />
          </div>
        </CardContent>
      </Card>

      {/* Support Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Support Email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
          <Input
            placeholder="Support Message"
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
          />
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </main>
  );
};

const ModeratorSettingsPage = () => {
  return (
    <main className="p-4 md:ml-62 py-12 space-y-6">
      <h1 className="text-2xl font-semibold">Moderator Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Receive Content Flag Notifications</Label>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Moderator Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Receive Content Flag Notifications</Label>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export { AdminSettingsPage, SellerSettingsPage, ModeratorSettingsPage };

