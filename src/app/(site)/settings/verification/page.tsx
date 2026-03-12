import { redirect } from "next/navigation";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

import VerificationProgress from "./_components/VerificationProgress";
import VerificationStartGuard from "@/components/verification/VerificationStartGuard";
import VerificationUploadGuard from "@/lib/verification/VerificationUploadGuard";
import { mapUserRoleToVerificationRole } from "@/lib/verification/mapUserRoleToVerificationRole";

export default async function VerificationPage() {
  const user = await CurrentUser();

  if (!user) redirect("/auth/login");

  const role = mapUserRoleToVerificationRole(user.role);

  if (!role) redirect("/settings");

  const [verification, docsCount] = await Promise.all([
    prisma.verification.findFirst({
      where: { userId: user.id, role },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        rejectionReason: true,
      },
    }),

    prisma.verificationDocument.count({
      where: { userId: user.id },
    }),
  ]);

  return (
    <div className="max-w-4xl px-4 pb-8 space-y-8 mx-auto">
      <VerificationProgress userId={user.id} />

      {verification?.status === "REJECTED" && (
        <div className="border border-red-300 bg-red-50 p-4 rounded-lg">
          <p className="font-medium text-red-600">Verification failed</p>

          <p className="text-sm text-muted-foreground mt-1">
            {verification.rejectionReason ??
              "Please upload new documents and retry verification."}
          </p>
        </div>
      )}

      <VerificationUploadGuard />

      <VerificationStartGuard
        role={role}
        userId={user.id}
        initialHasDocs={docsCount > 0}
        initialVerificationStarted={
          verification?.status === "PENDING" ||
          verification?.status === "IN_REVIEW"
        }
      />
    </div>
  );
}
