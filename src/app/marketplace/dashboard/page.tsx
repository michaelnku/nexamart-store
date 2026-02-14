import { CurrentUser } from "@/lib/currentUser";
import { getDashboardRedirectForRole, isStaffRole } from "@/lib/auth/roleRedirect";
import { redirect } from "next/navigation";

const page = async () => {
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (isStaffRole(user.role)) {
    const redirectTo = getDashboardRedirectForRole(user.role);
    if (redirectTo) {
      redirect(redirectTo);
    }
  }

  redirect("/403");
};

export default page;
