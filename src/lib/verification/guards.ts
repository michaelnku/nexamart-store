import { prisma } from "@/lib/prisma";

export async function ensureVerifiedSeller(userId: string) {
  const store = await prisma.store.findUnique({
    where: { userId },
    select: {
      isVerified: true,
      isActive: true,
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  if (!store.isVerified) {
    throw new Error("Seller account is not verified");
  }

  if (!store.isActive) {
    throw new Error("Store is not active");
  }

  return true;
}

export async function ensureVerifiedRider(userId: string) {
  const rider = await prisma.riderProfile.findUnique({
    where: { userId },
    select: {
      isVerified: true,
    },
  });

  if (!rider) {
    throw new Error("Rider profile not found");
  }

  if (!rider.isVerified) {
    throw new Error("Rider verification required");
  }

  return true;
}

export async function ensureVerifiedStaff(userId: string) {
  const staff = await prisma.staffProfile.findUnique({
    where: { userId },
    select: {
      verificationStatus: true,
    },
  });

  if (!staff) {
    throw new Error("Staff profile not found");
  }

  if (staff.verificationStatus !== "VERIFIED") {
    throw new Error("Staff verification required");
  }

  return true;
}
