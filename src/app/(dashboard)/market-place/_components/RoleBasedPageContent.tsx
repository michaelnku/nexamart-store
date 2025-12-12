"use client";

import BuyerPage from "./BuyerPage";
import AdminPage from "./AdminPage";
import RiderPage from "./RiderPage";
import SellerPage from "./SellerPage";
import { UserDTO } from "@/lib/types";
import { useCurrentUserQuery } from "@/stores/useGetCurrentUserQuery";

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

export default RoleBasedPageContent;
