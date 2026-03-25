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
  Ticket,
  User,
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
  Award,
  ShieldAlert,
  HardDrive,
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
          name: "Disputes",
          href: "/marketplace/dashboard/seller/disputes",
          icon: Scale,
        },
        {
          name: "Store",
          href: "/marketplace/dashboard/seller/store",
          icon: Store,
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
          name: "Sales Reports",
          href: "/marketplace/dashboard/seller/reports",
          icon: FileChartColumn,
        },
        {
          name: "Earnings",
          href: "/marketplace/dashboard/seller/earnings",
          icon: DollarSign,
        },
      ],
    },
    {
      title: "COMMUNICATION",
      links: [
        {
          href: "/messages",
          icon: Mail,
          name: "Messages",
        },
        {
          href: "/support",
          icon: HelpCircle,
          name: "Help & Support",
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Messages",
          href: "/messages",
          icon: MessageSquare,
        },
        {
          name: "Support",
          href: "/support",
          icon: HelpCircle,
        },
        {
          name: "Profile",
          href: "/profile",
          icon: User,
        },
        {
          name: "Settings",
          href: "/settings",
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
      title: "COMMUNICATION",
      links: [
        {
          name: "Messages",
          href: "/messages",
          icon: MessageSquare,
        },
        {
          name: "Support",
          href: "/support",
          icon: HelpCircle,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Profile",
          href: "/profile",
          icon: User,
        },
        {
          name: "Settings",
          href: "/settings",
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
          name: "Operations Analytics",
          href: "/marketplace/dashboard/admin/operations",
          icon: Activity,
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
        {
          name: "Marketing",
          href: "/marketplace/dashboard/admin/marketing",
          icon: Award,
        },
      ],
    },
    {
      title: "System Monitoring",
      links: [
        {
          name: "Audit Logs",
          href: "/marketplace/dashboard/admin/audit-logs",
          icon: FileChartColumn,
        },
        {
          name: "Background Jobs",
          href: "/marketplace/dashboard/admin/jobs",
          icon: Activity,
        },
        {
          name: "Storage Cleanup",
          href: "/marketplace/dashboard/admin/storage-cleanup",
          icon: HardDrive,
        },
      ],
    },
    {
      title: "COMMUNICATION",
      links: [
        {
          href: "/messages",
          icon: Mail,
          name: "Messages",
        },
        {
          name: "Support Tickets",
          href: "/marketplace/dashboard/admin/support",
          icon: HelpCircle,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Profile",
          href: "/profile",
          icon: User,
        },
        {
          name: "Settings",
          href: "/settings",
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
          name: "Incidents",
          href: "/marketplace/dashboard/moderator/incidents",
          icon: ShieldAlert,
        },
        {
          name: "User Reports",
          href: "/marketplace/dashboard/moderator/reports",
          icon: AlertTriangle,
        },
        {
          name: "User Moderation",
          href: "/marketplace/dashboard/moderator/users",
          icon: Users,
        },
        {
          name: "Product Moderation",
          href: "/marketplace/dashboard/moderator/products",
          icon: Package,
        },
        {
          name: "AI Review Queue",
          href: "/marketplace/dashboard/moderator/ai",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "Communication",
      links: [
        {
          name: "Moderator Messages",
          href: "/messages",
          icon: MessageSquare,
        },
        {
          name: "Support Tickets",
          href: "/support",
          icon: HelpCircle,
        },
      ],
    },
    {
      title: "Account",
      links: [
        {
          name: "Profile",
          href: "/profile",
          icon: User,
        },
        {
          name: "Settings",
          href: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
} as const;

export const DashboardMenuItems = {
  USER: [
    {
      title: "SHOPPING",
      links: [
        {
          href: "/customer/order/history",
          icon: ShoppingBag,
          name: "My Orders",
        },
        {
          href: "/customer/order/track",
          icon: Package,
          name: "Track a Package",
        },
        {
          href: "/cart",
          icon: ShoppingCartIcon,
          name: "My Cart",
        },
        {
          href: "/wishlist",
          icon: Heart,
          name: "Saved Items",
        },
      ],
    },

    {
      title: "FINANCE",
      links: [
        {
          href: "/customer/wallet",
          icon: Wallet,
          name: "Wallet & Balance",
        },
        {
          href: "/customer/coupons",
          icon: Ticket,
          name: "Promotions & Coupons",
        },
        {
          href: "/customer/referrals",
          icon: Users,
          name: "Referral Program",
        },
      ],
    },

    {
      title: "ENGAGEMENT",
      links: [
        {
          href: "/customer/followed-stores",
          icon: StoreIcon,
          name: "Followed Stores",
        },
        {
          href: "/customer/reviewsratings",
          icon: MessageSquareOffIcon,
          name: "Pending Reviews",
        },
        {
          href: "/history",
          icon: HistoryIcon,
          name: "Browsing History",
        },
      ],
    },

    {
      title: "COMMUNICATION",
      links: [
        {
          href: "/messages",
          icon: Mail,
          name: "Messages",
        },
        {
          href: "/support",
          icon: HelpCircle,
          name: "Help & Support",
        },
      ],
    },

    {
      title: "ACCOUNT",
      links: [
        {
          href: "/profile",
          icon: User,
          name: "My Profile ",
        },
        {
          href: "/settings",
          icon: Settings,
          name: "Account Settings",
        },
      ],
    },
  ],
} as const;
