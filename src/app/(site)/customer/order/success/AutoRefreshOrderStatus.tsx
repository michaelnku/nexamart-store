"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefreshOrderStatus() {
  const router = useRouter();

  useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh();
    }, 3000);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 120000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [router]);

  return null;
}
