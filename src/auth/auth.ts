import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@/generated/prisma/client";
import { getUserById } from "../components/helper/data";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";
import { createWelcomeCouponForUser } from "@/lib/coupons/createWelcomeCoupon";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      token.role = existingUser.role;

      return token;
    },
  },

  events: {
    async createUser({ user }) {
      if (user?.id) {
        await createWelcomeCouponForUser(user.id);
      }
    },
  },

  ...authConfig,
});
