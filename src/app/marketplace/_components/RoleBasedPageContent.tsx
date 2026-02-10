"use client";

import RiderPage from "./RiderPage";
import { UserDTO } from "@/lib/types";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import {
  BuyerSettingsPage,
  SellerSettingsPage,
  RiderSettingsPage,
  AdminSettingsPage,
} from "./SettingsPage";

type Props = {
  initialUser: UserDTO | null;
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

export { RoleBasedSettingsPage };
