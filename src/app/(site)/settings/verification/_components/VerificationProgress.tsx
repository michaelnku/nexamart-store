"use client";

import { useEffect, useState } from "react";
import VerificationProgressUI from "./VerificationProgressUI";
import { pusherClient } from "@/lib/pusher";
import { VerificationProgressType } from "@/lib/types/verification";
import { VerificationUpdatedEvent } from "@/lib/types/pusher";

async function fetchProgress(): Promise<VerificationProgressType> {
  const res = await fetch("/api/verification/progress");

  if (!res.ok) {
    throw new Error("Failed to fetch verification progress");
  }

  return res.json();
}

export default function VerificationProgress({ userId }: { userId: string }) {
  const [progress, setProgress] = useState<VerificationProgressType | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await fetchProgress();
        if (mounted) setProgress(data);
      } catch (error) {
        console.error(error);
      }
    };

    load();

    const channel = pusherClient.subscribe(`user-${userId}`);

    const refreshProgress = async () => {
      try {
        const updated = await fetchProgress();
        if (mounted) setProgress(updated);
      } catch (error) {
        console.error(error);
      }
    };

    channel.bind(
      "verification-updated",
      async (_data: VerificationUpdatedEvent) => {
        await refreshProgress();
      },
    );

    channel.bind("verification-documents-updated", async () => {
      await refreshProgress();
    });

    return () => {
      mounted = false;
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId]);

  if (!progress) return null;

  return <VerificationProgressUI progress={progress} />;
}
