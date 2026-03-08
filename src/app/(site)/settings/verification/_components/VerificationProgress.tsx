import { getVerificationProgress } from "@/lib/verification/getVerificationProgress";
import { CurrentUserId } from "@/lib/currentUser";
import VerificationProgressUI from "./VerificationProgressUI";

export default async function VerificationProgress() {
  const userId = await CurrentUserId();

  if (!userId) return null;

  const progress = await getVerificationProgress(userId);

  return <VerificationProgressUI progress={progress} />;
}
