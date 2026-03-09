"use client";

import { useEffect, useState } from "react";
import VerificationProgressUI from "./VerificationProgressUI";
import { pusherClient } from "@/lib/pusher";

async function fetchProgress() {
  const res = await fetch("/api/verification/progress");

  if (!res.ok) throw new Error("Failed to fetch verification progress");

  return res.json();
}

export default function VerificationProgress() {
  const [progress, setProgress] = useState<any | null>(null);

  useEffect(() => {
    fetchProgress().then(setProgress);

    const channel = pusherClient.subscribe("user-channel");

    channel.bind("verification-updated", async () => {
      const updated = await fetchProgress();
      setProgress(updated);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  if (!progress) return null;

  return <VerificationProgressUI progress={progress} />;
}
