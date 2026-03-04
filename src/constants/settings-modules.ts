import {
  Shield,
  Store,
  Bike,
  ShieldCheck,
  Globe,
  Truck,
  CreditCard,
  Megaphone,
  Lock,
  User,
  Bell,
  BadgeCheck,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import type { ComponentType } from "react";

export type MarketplaceSettingsRole =
  | "ADMIN"
  | "SELLER"
  | "RIDER"
  | "MODERATOR"
  | "USER";

type SettingsNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type SettingsModuleCard = {
  title: string;
  description: string;
  href: string;
};

export const MarketplaceSettingsModules: Record<
  MarketplaceSettingsRole,
  {
    nav: SettingsNavItem[];
    cards: SettingsModuleCard[];
  }
> = {
  ADMIN: {
    nav: [
      { label: "Admin", href: "/settings/admin", icon: Shield },
      { label: "Platform", href: "/settings/admin/platform", icon: Globe },
      { label: "Shipping", href: "/settings/admin/shipping", icon: Truck },
      { label: "Payments", href: "/settings/admin/payments", icon: CreditCard },
      { label: "Marketing", href: "/settings/admin/marketing", icon: Megaphone },
      { label: "Security", href: "/settings/admin/security", icon: Lock },
    ],
    cards: [
      {
        href: "/settings/admin/platform",
        title: "Platform Settings",
        description: "Core platform identity and contact information.",
      },
      {
        href: "/settings/admin/shipping",
        title: "Shipping Settings",
        description: "Delivery fee, rate, and fulfillment pricing rules.",
      },
      {
        href: "/settings/admin/payments",
        title: "Payment Settings",
        description: "Platform-level commission configuration.",
      },
      {
        href: "/settings/admin/marketing",
        title: "Marketing Settings",
        description: "Brand assets and public-facing marketing identity.",
      },
      {
        href: "/settings/admin/security",
        title: "Security Settings",
        description: "Security contact and administrative communication channels.",
      },
    ],
  },
  SELLER: {
    nav: [
      { label: "Seller", href: "/settings/seller", icon: Store },
      { label: "Profile", href: "/settings/seller/profile", icon: User },
      {
        label: "Storefront",
        href: "/settings/seller/storefront",
        icon: BadgeCheck,
      },
      {
        label: "Preferences",
        href: "/settings/seller/preferences",
        icon: SlidersHorizontal,
      },
      { label: "Danger", href: "/settings/seller/danger", icon: TriangleAlert },
    ],
    cards: [
      {
        href: "/settings/seller/profile",
        title: "Store Profile",
        description: "Manage your store business identity and location details.",
      },
      {
        href: "/settings/seller/storefront",
        title: "Storefront",
        description: "Manage your public storefront banner and branding.",
      },
      {
        href: "/settings/seller/preferences",
        title: "Preferences",
        description: "Configure storefront visibility and notification options.",
      },
      {
        href: "/settings/seller/danger",
        title: "Danger Zone",
        description: "Delete your store and permanently remove it from listing.",
      },
    ],
  },
  RIDER: {
    nav: [
      { label: "Rider", href: "/settings/rider", icon: Bike },
      { label: "Profile", href: "/settings/rider/profile", icon: User },
      {
        label: "Operations",
        href: "/settings/rider/operations",
        icon: BadgeCheck,
      },
      {
        label: "Preferences",
        href: "/settings/rider/preferences",
        icon: SlidersHorizontal,
      },
    ],
    cards: [
      {
        href: "/settings/rider/profile",
        title: "Profile",
        description: "Update your rider profile and vehicle information.",
      },
      {
        href: "/settings/rider/operations",
        title: "Operations",
        description: "Control online status and operational availability.",
      },
      {
        href: "/settings/rider/preferences",
        title: "Preferences",
        description: "Manage rider notification and workflow preferences.",
      },
    ],
  },
  MODERATOR: {
    nav: [
      { label: "Moderator", href: "/settings/moderator", icon: ShieldCheck },
      {
        label: "Moderation",
        href: "/settings/moderator/moderation",
        icon: ShieldCheck,
      },
      {
        label: "Preferences",
        href: "/settings/moderator/preferences",
        icon: SlidersHorizontal,
      },
    ],
    cards: [
      {
        href: "/settings/moderator/moderation",
        title: "Moderation",
        description: "Configure moderation workflow and safety preferences.",
      },
      {
        href: "/settings/moderator/preferences",
        title: "Preferences",
        description: "Update personal moderation workspace preferences.",
      },
    ],
  },
  USER: {
    nav: [
      { label: "User", href: "/settings/user", icon: User },
      { label: "Profile", href: "/settings/user/profile", icon: User },
      { label: "Security", href: "/settings/user/security", icon: Lock },
      {
        label: "Notifications",
        href: "/settings/user/notifications",
        icon: Bell,
      },
    ],
    cards: [
      {
        href: "/settings/user/profile",
        title: "Profile",
        description: "Manage account information and personal details.",
      },
      {
        href: "/settings/user/security",
        title: "Security",
        description: "Update password and security controls.",
      },
      {
        href: "/settings/user/notifications",
        title: "Notifications",
        description: "Configure email and account notification preferences.",
      },
    ],
  },
};
