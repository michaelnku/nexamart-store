import LoginForm from "@/app/(site)/_components/LoginForm";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import { getDashboardRedirectForRole } from "@/lib/auth/roleRedirect";

export default async function LoginPage() {
  const user = await CurrentUser();

  if (user?.role) {
    redirect(getDashboardRedirectForRole(user.role) ?? DEFAULT_LOGIN_REDIRECT);
  }

  return (
    <main>
      <LoginForm />
    </main>
  );
}
