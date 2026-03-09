"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";
import StartVerificationButton from "./StartVerificationButton";
import { VerificationRole } from "@/generated/prisma";
import { VerificationUpdatedEvent } from "@/lib/types/pusher";

export default function VerificationStartGuard({
  role,
  userId,
  initialHasDocs,
  initialVerificationStarted,
}: {
  role: VerificationRole;
  userId: string;
  initialHasDocs: boolean;
  initialVerificationStarted: boolean;
}) {
  const [hasDocs, setHasDocs] = useState(initialHasDocs);
  const [verificationStarted, setVerificationStarted] = useState(
    initialVerificationStarted,
  );

  useEffect(() => {
    const channel = pusherClient.subscribe(`user-${userId}`);

    channel.bind("verification-documents-updated", () => {
      setHasDocs(true);
    });

    channel.bind("verification-started", () => {
      setVerificationStarted(true);
    });

    channel.bind("verification-updated", (data: VerificationUpdatedEvent) => {
      if (data?.status === "VERIFIED" || data?.status === "REJECTED") {
        setVerificationStarted(true);
      }
    });

    return () => {
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId]);

  if (!hasDocs) {
    return (
      <div className="border rounded-lg p-4 text-sm text-muted-foreground bg-muted/40">
        Upload verification documents first before starting identity
        verification.
      </div>
    );
  }

  if (verificationStarted) {
    return (
      <div className="border rounded-lg p-4 text-sm text-muted-foreground bg-muted/40">
        Verification already started. Please complete the verification process.
      </div>
    );
  }

  return <StartVerificationButton role={role} />;
}
