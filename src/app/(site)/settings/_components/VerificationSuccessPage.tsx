export default function VerificationSuccessPage({
  verificationId,
}: {
  verificationId: string;
}) {
  return (
    <div className="max-w-xl mx-auto py-16 text-center">
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
