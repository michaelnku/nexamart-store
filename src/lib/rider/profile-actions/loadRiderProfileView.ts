import { prisma } from "@/lib/prisma";
import { mapRiderProfileToDTO } from "./riderProfileAction.mappers";

export async function loadRiderProfileView(userId: string) {
  const profile = await prisma.riderProfile.findUnique({
    where: { userId },
  });

  if (!profile) return { error: "Rider profile not found" } as const;

  return {
    success: mapRiderProfileToDTO(profile),
  } as const;
}
