"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { pusherClient } from "@/lib/pusher";
import { VerificationUpdatedEvent } from "@/lib/types/pusher";

export default function VerificationSuccessPage({
  verificationId,
  userId,
}: {
  verificationId: string;
  userId: string;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<"PROCESSING" | "VERIFIED" | "REJECTED">(
    "PROCESSING",
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const res = await fetch("/api/verification/status");
      const data = await res.json();

      if (!mounted) return;

      if (data.status === "VERIFIED") {
        setStatus("VERIFIED");

        setTimeout(() => {
          router.push("/settings/verification");
        }, 1500);

        return;
      }

      if (data.status === "REJECTED") {
        setStatus("REJECTED");
      }
    };

    init();

    const channel = pusherClient.subscribe(`user-${userId}`);

    channel.bind("verification-updated", (data: VerificationUpdatedEvent) => {
      if (data.status === "VERIFIED") {
        setStatus("VERIFIED");

        setTimeout(() => {
          router.push("/settings/verification");
        }, 1500);
      }

      if (data.status === "REJECTED") {
        setStatus("REJECTED");
      }
    });

    return () => {
      mounted = false;
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId, router]);

  return (
    <div className="max-w-xl mx-auto py-20 text-center space-y-6">
      {status === "PROCESSING" && (
        <>
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>

          <h1 className="text-2xl font-semibold">Verification Submitted</h1>

          <p className="text-muted-foreground">
            Stripe is reviewing your identity. This usually takes a few seconds.
          </p>

          <p className="text-xs text-muted-foreground">
            Verification ID: {verificationId}
          </p>
        </>
      )}

      {status === "VERIFIED" && (
        <div className="relative space-y-6">
          {/* Success icon */}
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in fade-in" />

              {/* Glow ring */}
              <span className="absolute inset-0 rounded-full bg-green-400 opacity-20 blur-xl animate-ping"></span>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-green-600">
            Verification Complete
          </h1>

          <p className="text-muted-foreground">
            Your identity has been successfully verified.
          </p>

          <p className="text-sm text-muted-foreground">
            Redirecting you to your dashboard...
          </p>
        </div>
      )}

      {status === "REJECTED" && (
        <>
          <h1 className="text-2xl font-semibold text-red-600">
            Verification Failed
          </h1>

          <p className="text-muted-foreground">
            Please return to the verification page and upload new documents.
          </p>

          <button
            onClick={() => router.push("/settings/verification")}
            className="mt-4 px-5 py-2 rounded-lg bg-primary text-white"
          >
            Retry Verification
          </button>
        </>
      )}
    </div>
  );
}

<style jsx>{`
  @keyframes confetti {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-60px) scale(0.5);
    }
  }
`}</style>;
