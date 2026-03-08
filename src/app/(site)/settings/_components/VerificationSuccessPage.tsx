import { CircleCheck } from "lucide-react";

export default function VerificationSuccessPage({
  verificationId,
}: {
  verificationId: string;
}) {
  return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <div className="w-12 h-12 mx-auto rounded-full animate-spin border-t-2 border-b-2 border-brand"></div>
      <h1 className="text-2xl font-semibold mb-4">Verification Submitted</h1>

      <p className="text-gray-600 mb-2">
        Your identity verification has been submitted.
      </p>

      <p className="text-gray-500 text-sm">Verification ID: {verificationId}</p>

      <p className="text-gray-500 text-sm mt-2">
        We are processing your verification now.
      </p>
    </div>
  );
}
