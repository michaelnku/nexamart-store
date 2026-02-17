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
  Heart,
  HistoryIcon,
  Mail,
  ShoppingCartIcon,
  StoreIcon,
  Ticket,
  MessageSquareOffIcon,
  User,
} from "lucide-react";

export const DashboardMenu = {
  SELLER: [
    {
      title: "Store Management",
      links: [
        { name: "Dashboard", href: "/marketplace/dashboard", icon: Home },
        {
          name: "Products",
          href: "/marketplace/dashboard/seller/products",
          icon: Package,
        },
        {
          name: "Store",
          href: "/marketplace/dashboard/seller/store",
          icon: Store,
        },
        {
          name: "Orders",
          href: "/marketplace/dashboard/seller/orders",
          icon: ShoppingBag,
        },
        {
          icon: Bell,
          name: "Alerts",
          href: "/marketplace/dashboard/seller/notifications",
        },
        {
          name: "Wallet",
          href: "/marketplace/dashboard/seller/wallet",
          icon: Wallet,
        },
      ],
    },
    {
      title: "Insights",
      links: [
        {
          name: "Analytics",
          href: "/marketplace/dashboard/seller/analytics",
          icon: BarChart2,
        },
        {
          name: "Sales Reports",
          href: "/marketplace/dashboard/seller/reports",
          icon: FileChartColumn,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Messages",
          href: "/marketplace/dashboard/seller/messages",
          icon: MessageSquare,
        },
        {
          name: "Support",
          href: "/marketplace/dashboard/seller/support",
          icon: HelpCircle,
        },
        {
          name: "Profile",
          href: "/marketplace/dashboard/profile",
          icon: User,
        },

        {
          name: "Settings",
          href: "/marketplace/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ],

  RIDER: [
    {
      title: "Deliveries",
      links: [
        { name: "Dashboard", href: "/marketplace/dashboard", icon: Home },
        {
          name: "Deliveries",
          href: "/marketplace/dashboard/rider/deliveries",
          icon: Bike,
        },
        {
          name: "Earnings",
          href: "/marketplace/dashboard/rider/earnings",
          icon: DollarSign,
        },
        {
          name: "Wallet",
          href: "/marketplace/dashboard/rider/wallet",
          icon: Wallet,
        },
        {
          name: "Schedule",
          href: "/marketplace/dashboard/rider/schedule",
          icon: Clock,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Messages",
          href: "/marketplace/dashboard/rider/messages",
          icon: MessageSquare,
        },
        {
          name: "Support",
          href: "/marketplace/dashboard/rider/support",
          icon: HelpCircle,
        },
        {
          name: "Profile",
          href: "/marketplace/dashboard/profile",
          icon: User,
        },
        {
          name: "Settings",
          href: "/marketplace/dashboard/settings",
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
          href: "/marketplace/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Manage Users",
          href: "/marketplace/dashboard/admin/users",
          icon: Users,
        },
        {
          name: "Referrals",
          href: "/marketplace/dashboard/admin/referrals",
          icon: Users,
        },
        {
          name: "Categories",
          href: "/marketplace/dashboard/admin/categories",
          icon: Package,
        },
        {
          name: "Coupons",
          href: "/marketplace/dashboard/admin/coupons",
          icon: Ticket,
        },
        {
          name: "Transactions",
          href: "/marketplace/dashboard/admin/transactions",
          icon: Receipt,
        },
        {
          name: "Reports",
          href: "/marketplace/dashboard/admin/reports",
          icon: FileChartColumn,
        },
        {
          name: "Platform Analytics",
          href: "/marketplace/dashboard/admin/analytics",
          icon: BarChart2,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Support Tickets",
          href: "/marketplace/dashboard/admin/support",
          icon: HelpCircle,
        },
        {
          name: "Profile",
          href: "/marketplace/dashboard/profile",
          icon: User,
        },
        {
          name: "Settings",
          href: "/marketplace/dashboard/settings",
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
          href: "/marketplace/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "User Reports",
          href: "/marketplace/dashboard/moderator/reports",
          icon: AlertTriangle,
        },
        {
          name: "Moderate Users",
          href: "/marketplace/dashboard/moderator/users",
          icon: Users,
        },
        {
          name: "Products",
          href: "/marketplace/dashboard/moderator/products",
          icon: Package,
        },
        {
          name: "Content Review",
          href: "/marketplace/dashboard/moderator/content",
          icon: Eye,
        },
        {
          name: "AI Moderation Center",
          href: "/marketplace/dashboard/moderator/ai",
          icon: ShieldCheck,
        },
        {
          name: "Warnings Log",
          href: "/marketplace/dashboard/moderator/warnings",
          icon: FileChartColumn,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Messages",
          href: "/marketplace/dashboard/moderator/messages",
          icon: MessageSquare,
        },
        {
          name: "Support",
          href: "/marketplace/dashboard/moderator/support",
          icon: HelpCircle,
        },
        {
          name: "Profile",
          href: "/marketplace/dashboard/profile",
          icon: User,
        },
        {
          name: "Settings",
          href: "/marketplace/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ],
} as const;

export const DashboardMenuItems = {
  USER: [
    { href: "/help", icon: HelpCircle, label: "Help Center" },
    {
      href: "/customer/order/history",
      icon: ShoppingBag,
      label: "Orders",
    },
    {
      href: "/customer/order/track",
      icon: Package,
      label: "Track Order",
    },
    {
      href: "/customer/wishlist",
      icon: Heart,
      label: "Wishlist",
    },
    {
      href: "/customer/cart",
      icon: ShoppingCartIcon,
      label: "Cart",
    },
    {
      href: "/customer/coupons",
      icon: Ticket,
      label: "Coupons",
    },
    {
      label: "Pending Reviews",
      href: "/customer/reviewsratings",
      icon: MessageSquareOffIcon,
    },
    { label: "Wallet", href: "/customer/wallet", icon: Wallet },
    {
      href: "/customer/referrals",
      icon: Users,
      label: "Referrals",
    },
    { href: "/inbox", icon: Mail, label: "Inbox" },
    {
      href: "/customer/followed-seller",
      icon: StoreIcon,
      label: "Followed Sellers",
    },
    { href: "/customer/history", icon: HistoryIcon, label: "Recently Viewed" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ],
} as const;
