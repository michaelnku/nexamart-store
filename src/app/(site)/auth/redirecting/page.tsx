"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthstore";
import Image from "next/image";
import { DEFAULT_LOGIN_REDIRECT, MARKET_PLACE_LOGIN_REDIRECT } from "@/routes";

export default function RedirectingPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/current-user", { cache: "no-store" });
      return res.ok ? res.json() : null;
    },
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      });
    }
  }, [user, setUser]);

  useEffect(() => {
    if (!user) return;

    const isMarketplaceRole = [
      "ADMIN",
      "SELLER",
      "RIDER",
      "MODERATOR",
    ].includes(user.role);
    router.push(
      isMarketplaceRole ? MARKET_PLACE_LOGIN_REDIRECT : DEFAULT_LOGIN_REDIRECT
    );
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Image
        src="https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlnNw2KuOByscQRmqV3jX4rStz8G2Mv0IpxKJA"
        alt="logo"
        width={75}
        height={75}
        className="rounded-full shadow-lg animate-pulse ring-2 ring-brand ring-offset-2"
      />
      <p className="text-gray-600 text-sm">Preparing your experience...</p>
    </div>
  );
}
