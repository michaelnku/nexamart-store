import { auth } from "@/auth/auth";
import { normalizeUser } from "@/lib/normalizeUser";
import { SessionUser } from "./types";

export const CurrentUser = async () => {
  const session = await auth();
  return normalizeUser(session?.user as SessionUser);
};

export const CurrentUserId = async () => {
  const user = await CurrentUser();
  return user?.id ?? null;
};

export const CurrentRole = async () => {
  const user = await CurrentUser();
  return user?.role ?? null;
};

// import { auth } from "@/auth/auth";

// export const CurrentUser = async () => {
//   const session = await auth();

//   return session?.user;
// };

// export const CurrentUserId = async () => {
//   const session = await auth();

//   return session?.user.id;
// };

// export const CurrentRole = async () => {
//   const session = await auth();

//   return session?.user.role;
// };
