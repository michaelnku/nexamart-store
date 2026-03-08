import StartVerificationButton from "@/components/verification/StartVerificationButton";

export default function RidererVerificationPage() {
  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-4">Verify Your Rider Profile</h1>

      <p className="text-gray-600 mb-6">
        Complete identity verification to activate your profile and start
        operating.
      </p>

      <StartVerificationButton role="RIDER" />
    </div>
  );
}
