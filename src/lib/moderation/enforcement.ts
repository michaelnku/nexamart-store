import {
  ModerationSeverity,
  type Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

type ModerationDbClient = Prisma.TransactionClient | PrismaClient;

export type ModerationEnforcementResult = {
  applied: boolean;
  strikeCount: number;
  riskScore: number;
  moderationState: string;
  softBlockedUntil: Date | null;
};

export function buildModerationState(
  strikeCount: number,
  softBlockedUntil: Date | null,
) {
  if (softBlockedUntil && softBlockedUntil > new Date()) return "SOFT_BLOCKED";
  if (strikeCount >= 3) return "RESTRICTED";
  if (strikeCount >= 1) return "WARNED";
  return "CLEAR";
}

export async function applyModerationEnforcement(
  db: ModerationDbClient,
  input: {
    userId: string;
    strikeWeight: number;
    severity: ModerationSeverity;
    now?: Date;
  },
): Promise<ModerationEnforcementResult> {
  const now = input.now ?? new Date();

  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      moderationStrikeCount: true,
      moderationRiskScore: true,
      softBlockedUntil: true,
    },
  });

  if (!user) {
    return {
      applied: false,
      strikeCount: 0,
      riskScore: 0,
      moderationState: "CLEAR",
      softBlockedUntil: null,
    };
  }

  const nextStrikeCount =
    (user.moderationStrikeCount ?? 0) + Math.max(0, input.strikeWeight);
  const nextRiskScore =
    (user.moderationRiskScore ?? 0) + Math.max(0, input.strikeWeight);

  const shouldSoftBlock =
    nextStrikeCount >= 3 || input.severity === "CRITICAL";
  const softBlockedUntil =
    shouldSoftBlock &&
    (!user.softBlockedUntil || user.softBlockedUntil <= now)
      ? new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3)
      : user.softBlockedUntil;

  const moderationState = buildModerationState(
    nextStrikeCount,
    softBlockedUntil,
  );

  await db.user.update({
    where: { id: user.id },
    data: {
      moderationStrikeCount: nextStrikeCount,
      moderationRiskScore: nextRiskScore,
      moderationLastIncidentAt: now,
      softBlockedUntil,
      moderationState,
    },
  });

  await db.userStrikeSnapshot.create({
    data: {
      userId: user.id,
      totalStrikes: nextStrikeCount,
      riskScore: nextRiskScore,
    },
  });

  return {
    applied: true,
    strikeCount: nextStrikeCount,
    riskScore: nextRiskScore,
    moderationState,
    softBlockedUntil,
  };
}
