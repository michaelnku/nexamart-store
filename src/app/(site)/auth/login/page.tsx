import LoginForm from "@/app/(site)/_components/LoginForm";
import {
  ADMIN_LOGIN_REDIRECT,
  DEFAULT_LOGIN_REDIRECT,
  MODERATOR_LOGIN_REDIRECT,
  RIDER_LOGIN_REDIRECT,
  SELLER_LOGIN_REDIRECT,
} from "@/routes";
import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: ADMIN_LOGIN_REDIRECT,
  SELLER: SELLER_LOGIN_REDIRECT,
  RIDER: RIDER_LOGIN_REDIRECT,
  MODERATOR: MODERATOR_LOGIN_REDIRECT,
  USER: DEFAULT_LOGIN_REDIRECT,
};

export default async function LoginPage() {
  const user = await CurrentUser();

  if (user?.role) {
    redirect(ROLE_DASHBOARD[user.role] ?? DEFAULT_LOGIN_REDIRECT);
  }

  return (
    <main>
      <LoginForm />
    </main>
  );
}
