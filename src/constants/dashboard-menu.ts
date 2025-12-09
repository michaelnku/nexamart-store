import {
  Home,
  Package,
  Store,
  ShoppingBag,
  Wallet,
  BarChart2,
  HelpCircle,
  Settings,
  Bike,
  DollarSign,
  Clock,
  Users,
  MessageSquare,
  Receipt,
  FileChartColumn,
  LayoutDashboard,
  Bell,
  ShieldCheck,
  AlertTriangle,
  Eye,
} from "lucide-react";

export const DashboardMenu = {
  SELLER: [
    {
      title: "Store Management",
      links: [
        { name: "Dashboard", href: "/market-place/dashboard", icon: Home },
        {
          name: "My Products",
          href: "/market-place/dashboard/seller/products",
          icon: Package,
        },
        {
          name: "My Store",
          href: "/market-place/dashboard/seller/store",
          icon: Store,
        },
        {
          name: "Orders",
          href: "/market-place/dashboard/seller/orders",
          icon: ShoppingBag,
        },
        {
          icon: Bell,
          name: "Alerts",
          href: "/market-place/dashboard/seller/notifications",
        },
        {
          name: "Wallet",
          href: "/market-place/dashboard/seller/wallet",
          icon: Wallet,
        },
      ],
    },
    {
      title: "Insights",
      links: [
        {
          name: "Analytics",
          href: "/market-place/dashboard/seller/analytics",
          icon: BarChart2,
        },
        {
          name: "Sales Reports",
          href: "/market-place/dashboard/seller/reports",
          icon: FileChartColumn,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Messages",
          href: "/market-place/dashboard/seller/messages",
          icon: MessageSquare,
        },
        {
          name: "Support",
          href: "/market-place/dashboard/seller/support",
          icon: HelpCircle,
        },
        {
          name: "Settings",
          href: "/market-place/dashboard/seller/settings",
          icon: Settings,
        },
      ],
    },
  ],

  RIDER: [
    {
      title: "Deliveries",
      links: [
        { name: "Dashboard", href: "/market-place/dashboard", icon: Home },
        {
          name: "Deliveries",
          href: "/market-place/dashboard/rider/deliveries",
          icon: Bike,
        },
        {
          name: "Earnings",
          href: "/market-place/dashboard/rider/earnings",
          icon: DollarSign,
        },
        {
          name: "Wallet",
          href: "/market-place/dashboard/rider/wallet",
          icon: Wallet,
        },
        {
          name: "Schedule",
          href: "/market-place/dashboard/rider/schedule",
          icon: Clock,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Messages",
          href: "/market-place/dashboard/rider/messages",
          icon: MessageSquare,
        },
        {
          name: "Support",
          href: "/market-place/dashboard/rider/support",
          icon: HelpCircle,
        },
        {
          name: "Settings",
          href: "/market-place/dashboard/rider/settings",
          icon: Settings,
        },
      ],
    },
  ],

  ADMIN: [
    {
      title: "Management",
      links: [
        {
          name: "Dashboard",
          href: "/market-place/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Manage Users",
          href: "/market-place/dashboard/admin/users",
          icon: Users,
        },
        {
          name: "Products & Categories",
          href: "/market-place/dashboard/admin/products",
          icon: Package,
        },
        {
          name: "Transactions",
          href: "/market-place/dashboard/admin/transactions",
          icon: Receipt,
        },
        {
          name: "Reports",
          href: "/market-place/dashboard/admin/reports",
          icon: FileChartColumn,
        },
        {
          name: "Platform Analytics",
          href: "/market-place/dashboard/admin/analytics",
          icon: BarChart2,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Support Tickets",
          href: "/market-place/dashboard/admin/support",
          icon: HelpCircle,
        },
        {
          name: "System Settings",
          href: "/market-place/dashboard/admin/settings",
          icon: Settings,
        },
      ],
    },
  ],

  /* -----------------------------------------------------------
     NEW — MODERATOR MENU
     This role handles user moderation, reports, AI tools, etc.
  ------------------------------------------------------------ */
  MODERATOR: [
    {
      title: "Moderation Tools",
      links: [
        {
          name: "Dashboard",
          href: "/market-place/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "User Reports",
          href: "/market-place/dashboard/moderator/reports",
          icon: AlertTriangle,
        },
        {
          name: "Moderate Users",
          href: "/market-place/dashboard/moderator/users",
          icon: Users,
        },
        {
          name: "Content Review",
          href: "/market-place/dashboard/moderator/content",
          icon: Eye,
        },
        {
          name: "AI Moderation Center",
          href: "/market-place/dashboard/moderator/ai",
          icon: ShieldCheck,
        },
        {
          name: "Warnings Log",
          href: "/market-place/dashboard/moderator/warnings",
          icon: FileChartColumn,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Messages",
          href: "/market-place/dashboard/moderator/messages",
          icon: MessageSquare,
        },
        {
          name: "Support",
          href: "/market-place/dashboard/moderator/support",
          icon: HelpCircle,
        },
        {
          name: "Settings",
          href: "/market-place/dashboard/moderator/settings",
          icon: Settings,
        },
      ],
    },
  ],
} as const;
