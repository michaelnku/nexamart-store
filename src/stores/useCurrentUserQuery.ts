"use client";

import { UserDTO } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export function useCurrentUserQuery(initialUser?: UserDTO | null) {
  return useQuery<UserDTO | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/current-user", { credentials: "include" });

      if (!res.ok) return null;
      return (await res.json()) as UserDTO;
    },
    initialData: initialUser,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
