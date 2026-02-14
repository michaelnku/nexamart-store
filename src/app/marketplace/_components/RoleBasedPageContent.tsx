"use client";

import RiderPage from "./RiderPage";
import { UserDTO } from "@/lib/types";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { SellerSettingsPage, AdminSettingsPage } from "./SettingsPage";

type Props = {
  initialUser: UserDTO | null;
};

const RoleBasedSettingsPage = ({ initialUser }: Props) => {
  const { data: user } = useCurrentUserQuery(initialUser);

  return (
    <div>
      {user?.role === "SELLER" && <SellerSettingsPage />}

      {user?.role === "ADMIN" && <AdminSettingsPage />}
    </div>
  );
};

export { RoleBasedSettingsPage };
