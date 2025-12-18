"use client";

import BuyerPage from "./BuyerPage";
import AdminPage from "./AdminPage";
import RiderPage from "./RiderPage";
import SellerPage from "./SellerPage";
import { UserDTO } from "@/lib/types";
import { useCurrentUserQuery } from "@/stores/useGetCurrentUserQuery";
import {
  BuyerSettingsPage,
  SellerSettingsPage,
  RiderSettingsPage,
  AdminSettingsPage,
} from "./SettingsPage";

type Props = {
  initialUser: UserDTO | null;
};

const RoleBasedPageContent = ({ initialUser }: Props) => {
  const { data: user } = useCurrentUserQuery(initialUser);

  if (user === undefined) {
    return <p className="p-10 text-center">Loading...</p>;
  }

  return (
    <div>
      {user?.role === "USER" && <BuyerPage />}
      {user?.role === "SELLER" && <SellerPage />}
      {user?.role === "RIDER" && <RiderPage />}
      {user?.role === "ADMIN" && <AdminPage />}
      {user?.role === "MODERATOR" && <AdminPage />}
    </div>
  );
};

const RoleBasedSettingsPage = ({ initialUser }: Props) => {
  const { data: user } = useCurrentUserQuery(initialUser);

  return (
    <div>
      {user?.role === "USER" && <BuyerSettingsPage />}
      {user?.role === "SELLER" && <SellerSettingsPage />}
      {user?.role === "RIDER" && <RiderSettingsPage />}
      {user?.role === "ADMIN" && <AdminSettingsPage />}
    </div>
  );
};

export { RoleBasedPageContent, RoleBasedSettingsPage };
