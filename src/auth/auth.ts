import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@/generated/prisma/client";
import { getUserById } from "../components/helper/data";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";
import { createWelcomeCouponForUser } from "@/lib/coupons/createWelcomeCoupon";
import { createReferralCodeForUser } from "@/lib/referrals/createReferralCode";
import { processReferralSignup } from "@/lib/referrals/processReferralSignup";
import { cookies } from "next/headers";
import { sendEmailVerificationEmail } from "@/lib/email-verification/service";

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
      if (user?.id && user.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        const cookieStore = await cookies();
        const refCode = cookieStore.get("ref_code")?.value;
        await createReferralCodeForUser(user.id);
        await createWelcomeCouponForUser(user.id);
        if (refCode) await processReferralSignup(user.id, refCode);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: normalizedEmail,
            emailVerified: null,
          },
        });
        try {
          await sendEmailVerificationEmail({
            id: user.id,
            email: normalizedEmail,
            name: user.name,
            emailVerified: null,
          });
        } catch (verificationError) {
          console.error(
            "Failed to send signup verification email for OAuth user",
            user.id,
            verificationError,
          );
        }
      }
    },
  },

  ...authConfig,
});
