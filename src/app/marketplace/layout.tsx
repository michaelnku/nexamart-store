import { redirect } from "next/navigation";
import { CurrentUser } from "@/lib/currentUser";
import MarketplaceLayoutClient from "./layout-client";
import NotificationListener from "@/components/notifications/NotificationListener";

export default async function MarketPlaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await CurrentUser();

  if (!user) redirect("/auth/login");
  if (user.role === "USER") redirect("/");

  const userId = user.id;

  return (
    <MarketplaceLayoutClient user={user}>
      <NotificationListener userId={userId!} />
      {children}
    </MarketplaceLayoutClient>
  );
}
