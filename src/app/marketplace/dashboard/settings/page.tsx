import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import {
  AdminSettingsPage,
  ModeratorSettingsPage,
  SellerSettingsPage,
} from "../../_components/SettingsPage";
import { RiderSettingsPage } from "./_component/RiderSettingsPage";

const page = async () => {
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const role = user.role;

  if (role === "ADMIN") {
    return (
      <div className="min-h-full bg-background py-4">
        <AdminSettingsPage />
      </div>
    );
  }
  if (role === "SELLER") {
    return (
      <div className="min-h-full bg-background py-4">
        <SellerSettingsPage />
      </div>
    );
  }
  if (role === "RIDER") {
    return (
      <div className="min-h-full bg-background py-4">
        <RiderSettingsPage />
      </div>
    );
  }

  if (role === "MODERATOR") {
    return (
      <div className="min-h-full bg-background py-4">
        <ModeratorSettingsPage />
      </div>
    );
  }

  redirect("/403");
};

export default page;
