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
  Ticket,
  User,
  Database,
  Briefcase,
  LineChart,
  Landmark,
  Scale,
  Activity,
  Heart,
  HistoryIcon,
  Mail,
  MessageSquareOffIcon,
  ShoppingCartIcon,
  StoreIcon,
} from "lucide-react";

export const DashboardMenu = {
  /* =========================================================
     SELLER
  ========================================================== */
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
          name: "Orders",
          href: "/marketplace/dashboard/seller/orders",
          icon: ShoppingBag,
        },
        {
          name: "Store Settings",
          href: "/marketplace/dashboard/seller/store",
          icon: Store,
        },
        {
          name: "Wallet",
          href: "/marketplace/dashboard/seller/wallet",
          icon: Wallet,
        },
        {
          name: "Notifications",
          href: "/marketplace/dashboard/seller/notifications",
          icon: Bell,
        },
      ],
    },
    {
      title: "Insights",
      links: [
        {
          name: "Analytics",
          href: "/marketplace/dashboard/seller/analytics",
          icon: LineChart,
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

  /* =========================================================
     RIDER
  ========================================================== */
  RIDER: [
    {
      title: "Delivery Management",
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

  /* =========================================================
     ADMIN — Business Oversight
  ========================================================== */
  ADMIN: [
    {
      title: "Platform Overview",
      links: [
        {
          name: "Dashboard",
          href: "/marketplace/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Platform Analytics",
          href: "/marketplace/dashboard/admin/analytics",
          icon: BarChart2,
        },
        {
          name: "Revenue Reports",
          href: "/marketplace/dashboard/admin/revenue",
          icon: Landmark,
        },
      ],
    },
    {
      title: "User & Store Management",
      links: [
        {
          name: "Users",
          href: "/marketplace/dashboard/admin/users",
          icon: Users,
        },
        {
          name: "Sellers",
          href: "/marketplace/dashboard/admin/sellers",
          icon: Store,
        },
        {
          name: "Riders",
          href: "/marketplace/dashboard/admin/riders",
          icon: Bike,
        },
        {
          name: "Moderators",
          href: "/marketplace/dashboard/admin/moderators",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "Commerce Controls",
      links: [
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
          name: "Escrow & Payouts",
          href: "/marketplace/dashboard/admin/escrow",
          icon: DollarSign,
        },
        {
          name: "Disputes",
          href: "/marketplace/dashboard/admin/disputes",
          icon: Scale,
        },
      ],
    },
    {
      title: "System Monitoring",
      links: [
        {
          name: "Background Jobs",
          href: "/marketplace/dashboard/admin/jobs",
          icon: Activity,
        },
        {
          name: "Audit Logs",
          href: "/marketplace/dashboard/admin/audit",
          icon: FileChartColumn,
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

  /* =========================================================
     MODERATOR
  ========================================================== */
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
          name: "Products Review",
          href: "/marketplace/dashboard/moderator/products",
          icon: Package,
        },
        {
          name: "AI Moderation Center",
          href: "/marketplace/dashboard/moderator/ai",
          icon: ShieldCheck,
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

  /* =========================================================
     SYSTEM — Internal Financial Engine
  ========================================================== */
  SYSTEM: [
    {
      title: "Financial Core",
      links: [
        {
          name: "Platform Wallet",
          href: "/marketplace/dashboard/system/wallet",
          icon: Wallet,
        },
        {
          name: "Escrow Ledger",
          href: "/marketplace/dashboard/system/ledger",
          icon: Database,
        },
        {
          name: "Commission Engine",
          href: "/marketplace/dashboard/system/commissions",
          icon: Briefcase,
        },
      ],
    },
    {
      title: "Automation & Jobs",
      links: [
        {
          name: "Release Payouts",
          href: "/marketplace/dashboard/system/payout-jobs",
          icon: DollarSign,
        },
        {
          name: "Cron Monitor",
          href: "/marketplace/dashboard/system/cron",
          icon: Clock,
        },
        {
          name: "Audit Logs",
          href: "/marketplace/dashboard/system/audit",
          icon: FileChartColumn,
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
