import { CurrentUserId } from "@/lib/currentUser";
import { isVerificationLocked } from "@/lib/verification/isVerificationLocked";
import VerificationDocumentForm from "@/app/(site)/settings/_components/VerificationDocumentForm";

export default async function VerificationUploadGuard() {
  const userId = await CurrentUserId();

  if (!userId) return null;

  const locked = await isVerificationLocked(userId);

  if (locked) {
    return (
      <div className="border rounded-lg p-4 bg-muted/40 text-sm text-muted-foreground">
        Your verification is currently under review. Document uploads are locked
        until verification is completed.
      </div>
    );
  }

  return <VerificationDocumentForm />;
}
