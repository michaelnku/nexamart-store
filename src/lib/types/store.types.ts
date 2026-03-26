export type StoreDTO = {
  id: string;
  name: string;
  description: string;
  location: string;

  address?: string | null;

  type: "GENERAL" | "FOOD";
  fulfillmentType: "PHYSICAL" | "DIGITAL" | "HYBRID";

  logo?: string | null;
  logoKey?: string | null;

  bannerImage?: string | null;
  bannerKey?: string | null;

  tagline?: string | null;

  isActive: boolean;
  emailNotificationsEnabled: boolean;
};

export type StoreState =
  | { status: "loading" }
  | { status: "active"; store: StoreDTO }
  | { status: "deleted" };
