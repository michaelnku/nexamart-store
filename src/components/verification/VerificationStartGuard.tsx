import { CurrentUserId } from "@/lib/currentUser";
import { hasVerificationDocuments } from "@/lib/verification/hasVerificationDocuments";
import StartVerificationButton from "./StartVerificationButton";

export default async function VerificationStartGuard({
  role,
}: {
  role: "SELLER" | "RIDER" | "STAFF";
}) {
  const userId = await CurrentUserId();

  if (!userId) return null;

  const hasDocs = await hasVerificationDocuments(userId);

  if (!hasDocs) {
    return (
      <div className="border rounded-lg p-4 text-sm text-muted-foreground bg-muted/40">
        Upload verification documents first before starting identity
        verification.
      </div>
    );
  }

  return <StartVerificationButton role={role} />;
}
