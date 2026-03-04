"use client";

import RiderPage from "./RiderPage";
import { UserDTO } from "@/lib/types";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { SellerSettingsPage } from "./SettingsPage";
import Link from "next/link";

type Props = {
  initialUser: UserDTO | null;
};

const RoleBasedSettingsPage = ({ initialUser }: Props) => {
  const { data: user } = useCurrentUserQuery(initialUser);

  return (
    <div>
      {user?.role === "SELLER" && <SellerSettingsPage />}

      {user?.role === "ADMIN" && (
        <Link href="/marketplace/dashboard/settings">Open Admin Settings</Link>
      )}
    </div>
  );
};

export { RoleBasedSettingsPage };
