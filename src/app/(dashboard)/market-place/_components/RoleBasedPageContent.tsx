"use client";

import { useCurrentUser } from "@/hooks/getCurrentUser";
import SellerPage from "../seller/page";
import RiderPage from "../rider/page";
import AdminPage from "../admin/page";
import BuyerPage from "./BuyerPage";

const RoleBasedPageContent = () => {
  const user = useCurrentUser();
  return (
    <div>
      {user?.role === "USER" && <BuyerPage />}
      {user?.role === "SELLER" && <SellerPage />}
      {user?.role === "RIDER" && <RiderPage />}
      {user?.role === "ADMIN" && <AdminPage />}
    </div>
  );
};

export default RoleBasedPageContent;
