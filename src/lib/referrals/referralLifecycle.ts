import { Prisma } from "@/generated/prisma";
import { ReferralRewardStatus, ReferralStatus, WalletStatus } from "@/generated/prisma/client";
import {
  PROCESS_REFERRAL_REWARD_JOB_TYPE,
  REFERRAL_EXPIRY_JOB_TYPE,
  buildProcessReferralRewardJobId,
  buildReferralExpiryJobId,
} from "@/lib/jobs/jobTypes";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { calculateWalletBalanceByAccountType } from "@/lib/ledger/calculateWalletBalance";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { prisma } from "@/lib/prisma";
import { isReferralAwaitingRewardStatus } from "@/lib/referrals/status";

type Tx = Prisma.TransactionClient;

const REFERRAL_QUALIFICATION_WINDOW_DAYS = 30;
const REFERRAL_REWARD_RECHECK_MS = 60 * 60 * 1000;
const REFERRER_BONUS = 10;
const REFERRED_BONUS = 5;

type ReferralSnapshot = Prisma.ReferralGetPayload<{
  include: {
    referralCode: true;
    referrer: {
      select: {
        id: true;
        isBanned: true;
        isDeleted: true;
        deletedAt: true;
        softBlockedUntil: true;
      };
    };
    referred: {
      select: {
        id: true;
        isBanned: true;
        isDeleted: true;
        deletedAt: true;
        softBlockedUntil: true;
      };
    };
    referralRewards: true;
  };
}>;

type ReferralRewardRow = ReferralSnapshot["referralRewards"][number];
type RewardSideRole = "REFERRER" | "REFERRED";
type RewardSideUser = ReferralSnapshot["referrer"] | ReferralSnapshot["referred"];

type RewardSideDefinition = {
  role: RewardSideRole;
  beneficiaryId: string;
  beneficiary: RewardSideUser;
  amount: number;
  description: string;
  reference: string;
  transactionReference: string;
};

type RewardSideSettlementOutcome =
  | { status: "PAID"; rewardStatus: "PAID" }
  | { status: "VOID"; rewardStatus: "VOID" }
  | {
      status: "PENDING";
      rewardStatus: "PENDING" | "FAILED";
      reason: "WALLET_INACTIVE" | "TREASURY_INSUFFICIENT";
    };

export type ReferralJobPayload = {
  referralId: string;
};

export type ReferralJobOutcome =
  | { status: "COMPLETED"; reason: string }
  | { status: "DEFERRED"; reason: string; runAt: Date };

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function nextReferralRewardRecheckAt(now: Date) {
  return new Date(now.getTime() + REFERRAL_REWARD_RECHECK_MS);
}

function getQualificationDeadline(referralCreatedAt: Date) {
  return addDays(referralCreatedAt, REFERRAL_QUALIFICATION_WINDOW_DAYS);
}

function isPolicyBlocked(
  user: Pick<
    ReferralSnapshot["referrer"],
    "isBanned" | "softBlockedUntil"
  >,
  now: Date,
) {
  return Boolean(
    user.isBanned ||
      (user.softBlockedUntil && user.softBlockedUntil.getTime() > now.getTime()),
  );
}

function isStructurallyInvalid(
  user: Pick<ReferralSnapshot["referrer"], "isDeleted" | "deletedAt">,
) {
  return Boolean(user.isDeleted || user.deletedAt);
}

function getInvalidReferralStatus(
  referral: Pick<ReferralSnapshot, "status" | "referrerId" | "referredId"> & {
    referrer: Pick<
      ReferralSnapshot["referrer"],
      "isBanned" | "softBlockedUntil" | "isDeleted" | "deletedAt"
    >;
    referred: Pick<
      ReferralSnapshot["referred"],
      "isBanned" | "softBlockedUntil" | "isDeleted" | "deletedAt"
    >;
  },
  now: Date,
): ReferralStatus | null {
  if (referral.referrerId === referral.referredId) {
    return ReferralStatus.REJECTED;
  }

  if (
    isStructurallyInvalid(referral.referrer) ||
    isStructurallyInvalid(referral.referred)
  ) {
    return ReferralStatus.VOID;
  }

  if (
    isPolicyBlocked(referral.referrer, now) ||
    isPolicyBlocked(referral.referred, now)
  ) {
    return referral.status === ReferralStatus.PENDING_QUALIFICATION
      ? ReferralStatus.REJECTED
      : ReferralStatus.VOID;
  }

  return null;
}

async function loadReferralSnapshot(tx: Tx, referralId: string) {
  return tx.referral.findUnique({
    where: { id: referralId },
    include: {
      referralCode: true,
      referrer: {
        select: {
          id: true,
          isBanned: true,
          isDeleted: true,
          deletedAt: true,
          softBlockedUntil: true,
        },
      },
      referred: {
        select: {
          id: true,
          isBanned: true,
          isDeleted: true,
          deletedAt: true,
          softBlockedUntil: true,
        },
      },
      referralRewards: true,
    },
  });
}

async function ensureReferralRewardRows(tx: Tx, referral: ReferralSnapshot) {
  await tx.referralReward.createMany({
    data: [
      {
        referralId: referral.id,
        beneficiaryId: referral.referrerId,
        role: "REFERRER",
        amount: REFERRER_BONUS,
        status: "PENDING",
      },
      {
        referralId: referral.id,
        beneficiaryId: referral.referredId,
        role: "REFERRED",
        amount: REFERRED_BONUS,
        status: "PENDING",
      },
    ],
    skipDuplicates: true,
  });
}

async function getReferralRewardRows(
  tx: Tx,
  referralId: string,
): Promise<ReferralRewardRow[]> {
  return tx.referralReward.findMany({
    where: { referralId },
  });
}

async function voidPendingReferralRewards(tx: Tx, referralId: string) {
  await tx.referralReward.updateMany({
    where: {
      referralId,
      status: { in: [ReferralRewardStatus.PENDING, ReferralRewardStatus.FAILED] },
    },
    data: {
      status: ReferralRewardStatus.VOID,
      transactionId: null,
      issuedAt: null,
    },
  });
}

async function setReferralStatus(
  tx: Tx,
  referralId: string,
  status: ReferralStatus,
  data?: Prisma.ReferralUpdateInput,
) {
  await tx.referral.update({
    where: { id: referralId },
    data: {
      status,
      ...data,
    },
  });
}

async function expireReferralIfDueInTx(
  tx: Tx,
  referral: ReferralSnapshot,
  now: Date,
): Promise<boolean> {
  if (referral.status !== ReferralStatus.PENDING_QUALIFICATION) {
    return false;
  }

  if (getQualificationDeadline(referral.createdAt).getTime() > now.getTime()) {
    return false;
  }

  await setReferralStatus(tx, referral.id, ReferralStatus.EXPIRED);
  await voidPendingReferralRewards(tx, referral.id);
  return true;
}

async function invalidateReferralInTx(
  tx: Tx,
  referral: ReferralSnapshot,
  status: ReferralStatus,
) {
  await setReferralStatus(tx, referral.id, status);
  await voidPendingReferralRewards(tx, referral.id);
}

async function getActiveWalletByUserId(
  tx: Tx,
  userId: string,
): Promise<{ id: string; status: WalletStatus } | null> {
  const wallet = await tx.wallet.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });

  if (!wallet || wallet.status !== WalletStatus.ACTIVE) {
    return null;
  }

  return wallet;
}

function getRewardSideDefinitions(
  referral: ReferralSnapshot,
): RewardSideDefinition[] {
  return [
    {
      role: "REFERRER",
      beneficiaryId: referral.referrerId,
      beneficiary: referral.referrer,
      amount: REFERRER_BONUS,
      description: "Referral bonus",
      reference: `referral-referrer-${referral.id}`,
      transactionReference: `referral-reward-referrer-${referral.id}`,
    },
    {
      role: "REFERRED",
      beneficiaryId: referral.referredId,
      beneficiary: referral.referred,
      amount: REFERRED_BONUS,
      description: "Referral signup bonus",
      reference: `referral-referred-${referral.id}`,
      transactionReference: `referral-reward-referred-${referral.id}`,
    },
  ];
}

function shouldVoidRewardSide(
  beneficiary: RewardSideUser,
  now: Date,
): boolean {
  return Boolean(
    beneficiary.isDeleted ||
      beneficiary.deletedAt ||
      beneficiary.isBanned ||
      (beneficiary.softBlockedUntil &&
        beneficiary.softBlockedUntil.getTime() > now.getTime()),
  );
}

async function hasLedgerPairForReference(tx: Tx, reference: string) {
  const refs = [`${reference}-debit`, `${reference}-credit`];
  const count = await tx.ledgerEntry.count({
    where: {
      reference: { in: refs },
    },
  });

  return count === 2;
}

async function settleReferralRewardSideInTx(
  tx: Tx,
  referral: ReferralSnapshot,
  reward: ReferralRewardRow,
  side: RewardSideDefinition,
  treasuryAccount: { userId: string; walletId: string },
  treasuryState: { availableBalance: number },
  now: Date,
): Promise<RewardSideSettlementOutcome> {
  if (reward.status === ReferralRewardStatus.PAID) {
    return { status: "PAID", rewardStatus: reward.status };
  }

  if (reward.status === ReferralRewardStatus.VOID) {
    return { status: "VOID", rewardStatus: reward.status };
  }

  if (shouldVoidRewardSide(side.beneficiary, now)) {
    await tx.referralReward.update({
      where: { id: reward.id },
      data: {
        status: ReferralRewardStatus.VOID,
        transactionId: null,
        issuedAt: null,
      },
    });

    return { status: "VOID", rewardStatus: ReferralRewardStatus.VOID };
  }

  const beneficiaryWallet = await getActiveWalletByUserId(tx, side.beneficiaryId);
  if (!beneficiaryWallet) {
    return {
      status: "PENDING",
      rewardStatus: reward.status,
      reason: "WALLET_INACTIVE",
    };
  }

  const hasExistingLedgerPair = await hasLedgerPairForReference(tx, side.reference);
  if (!hasExistingLedgerPair && treasuryState.availableBalance < side.amount) {
    return {
      status: "PENDING",
      rewardStatus: reward.status,
      reason: "TREASURY_INSUFFICIENT",
    };
  }

  await createDoubleEntryLedger(tx, {
    orderId: referral.orderId ?? undefined,
    fromUserId: treasuryAccount.userId,
    fromWalletId: treasuryAccount.walletId,
    toUserId: side.beneficiaryId,
    toWalletId: beneficiaryWallet.id,
    entryType: "REFERRAL_BONUS",
    amount: side.amount,
    reference: side.reference,
    fromAccountType: "REFERRAL",
    toAccountType: "REFERRAL",
    debitBalanceAccountType: "REFERRAL",
    resolveFromWallet: false,
    resolveToWallet: false,
  });

  if (!hasExistingLedgerPair) {
    treasuryState.availableBalance -= side.amount;
  }

  const payoutTransaction = await tx.transaction.upsert({
    where: { reference: side.transactionReference },
    update: {
      walletId: beneficiaryWallet.id,
      userId: side.beneficiaryId,
      amount: side.amount,
      type: "EARNING",
      status: "SUCCESS",
      description: side.description,
    },
    create: {
      walletId: beneficiaryWallet.id,
      userId: side.beneficiaryId,
      amount: side.amount,
      type: "EARNING",
      status: "SUCCESS",
      reference: side.transactionReference,
      description: side.description,
    },
    select: { id: true },
  });

  await tx.referralReward.update({
    where: { id: reward.id },
    data: {
      status: ReferralRewardStatus.PAID,
      issuedAt: now,
      transactionId: payoutTransaction.id,
    },
  });

  return { status: "PAID", rewardStatus: ReferralRewardStatus.PAID };
}

async function settleQualifiedReferralInTx(
  tx: Tx,
  referral: ReferralSnapshot,
  now: Date,
): Promise<ReferralJobOutcome> {
  await ensureReferralRewardRows(tx, referral);
  const treasuryAccount = await getOrCreateSystemEscrowAccount(tx);
  const rewardRows = await getReferralRewardRows(tx, referral.id);
  const rewardByRole = new Map(
    rewardRows.map((reward) => [reward.role, reward] as const),
  );
  const sides = getRewardSideDefinitions(referral);
  const treasuryState = {
    availableBalance: await calculateWalletBalanceByAccountType(
      treasuryAccount.walletId,
      "REFERRAL",
      tx,
    ),
  };

  let hasPendingSide = false;

  for (const side of sides) {
    const reward = rewardByRole.get(side.role);
    if (!reward) {
      hasPendingSide = true;
      continue;
    }

    const result = await settleReferralRewardSideInTx(
      tx,
      referral,
      reward,
      side,
      treasuryAccount,
      treasuryState,
      now,
    );

    if (result.status === "PENDING") {
      hasPendingSide = true;
    }
  }

  const finalRewards = await getReferralRewardRows(tx, referral.id);
  const allTerminal = finalRewards.every(
    (reward) =>
      reward.status === ReferralRewardStatus.PAID ||
      reward.status === ReferralRewardStatus.VOID,
  );

  if (allTerminal) {
    await setReferralStatus(tx, referral.id, ReferralStatus.REWARDED, {
      rewardedAt: referral.rewardedAt ?? now,
    });
    return { status: "COMPLETED", reason: "REWARD_LIFECYCLE_COMPLETE" };
  }

  await setReferralStatus(tx, referral.id, ReferralStatus.AWAITING_REWARD);

  return hasPendingSide
    ? {
        status: "DEFERRED",
        reason: "REWARD_SIDES_PENDING",
        runAt: nextReferralRewardRecheckAt(now),
      }
    : {
        status: "DEFERRED",
        reason: "REWARD_RECHECK_REQUIRED",
        runAt: nextReferralRewardRecheckAt(now),
      };
}

async function ensureProcessReferralRewardJobInTx(
  tx: Tx,
  referralId: string,
  runAt: Date,
) {
  const jobId = buildProcessReferralRewardJobId(referralId);

  await tx.job.upsert({
    where: { id: jobId },
    update: {
      type: PROCESS_REFERRAL_REWARD_JOB_TYPE,
      status: "PENDING",
      runAt,
      attempts: 0,
      lastError: null,
      maxRetries: 10,
      payload: {
        referralId,
      },
    },
    create: {
      id: jobId,
      type: PROCESS_REFERRAL_REWARD_JOB_TYPE,
      status: "PENDING",
      runAt,
      attempts: 0,
      lastError: null,
      maxRetries: 10,
      payload: {
        referralId,
      },
    },
  });
}

export async function ensureReferralExpiryJobInTx(
  tx: Tx,
  referralId: string,
  referralCreatedAt: Date,
) {
  const runAt = getQualificationDeadline(referralCreatedAt);
  const jobId = buildReferralExpiryJobId(referralId);

  await tx.job.upsert({
    where: { id: jobId },
    update: {
      type: REFERRAL_EXPIRY_JOB_TYPE,
      status: "PENDING",
      runAt,
      attempts: 0,
      lastError: null,
      maxRetries: 5,
      payload: {
        referralId,
      },
    },
    create: {
      id: jobId,
      type: REFERRAL_EXPIRY_JOB_TYPE,
      status: "PENDING",
      runAt,
      attempts: 0,
      lastError: null,
      maxRetries: 5,
      payload: {
        referralId,
      },
    },
  });
}

async function getEarliestPaidOrderIdForUser(tx: Tx, userId: string) {
  const firstPaidOrder = await tx.order.findFirst({
    where: {
      userId,
      isPaid: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  return firstPaidOrder?.id ?? null;
}

export async function processReferralQualificationForPaidOrder(
  orderId: string,
): Promise<void> {
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      isPaid: true,
    },
  });

  if (!order || !order.isPaid) return;

  const now = new Date();
  const outcome = await prisma.$transaction(async (tx) => {
    const referral = await tx.referral.findUnique({
      where: { referredId: order.userId },
      include: {
        referralCode: true,
        referrer: {
          select: {
            id: true,
            isBanned: true,
            isDeleted: true,
            deletedAt: true,
            softBlockedUntil: true,
          },
        },
        referred: {
          select: {
            id: true,
            isBanned: true,
            isDeleted: true,
            deletedAt: true,
            softBlockedUntil: true,
          },
        },
        referralRewards: true,
      },
    });

    if (!referral) {
      return null;
    }

    if (await expireReferralIfDueInTx(tx, referral, now)) {
      return { status: "COMPLETED", reason: "REFERRAL_EXPIRED" } satisfies ReferralJobOutcome;
    }

    if (referral.status !== ReferralStatus.PENDING_QUALIFICATION) {
      return null;
    }

    const invalidStatus = getInvalidReferralStatus(referral, now);
    if (invalidStatus) {
      await invalidateReferralInTx(tx, referral, invalidStatus);
      return {
        status: "COMPLETED",
        reason: `REFERRAL_${invalidStatus}`,
      } satisfies ReferralJobOutcome;
    }

    const earliestPaidOrderId = await getEarliestPaidOrderIdForUser(tx, order.userId);
    if (earliestPaidOrderId !== order.id) {
      return null;
    }

    if (getQualificationDeadline(referral.createdAt).getTime() <= now.getTime()) {
      await setReferralStatus(tx, referral.id, ReferralStatus.EXPIRED);
      return { status: "COMPLETED", reason: "QUALIFICATION_WINDOW_MISSED" } satisfies ReferralJobOutcome;
    }

    await setReferralStatus(tx, referral.id, ReferralStatus.AWAITING_REWARD, {
      qualifiedAt: now,
      order: { connect: { id: order.id } },
    });

    const qualifiedReferral = await loadReferralSnapshot(tx, referral.id);
    if (!qualifiedReferral) {
      return { status: "COMPLETED", reason: "REFERRAL_NOT_FOUND" } satisfies ReferralJobOutcome;
    }

    return settleQualifiedReferralInTx(tx, qualifiedReferral, now);
  });

  if (outcome?.status === "DEFERRED") {
    const referral = await prisma.referral.findUnique({
      where: { referredId: order.userId },
      select: { id: true },
    });

    if (!referral) return;

    await prisma.$transaction(async (tx) => {
      await ensureProcessReferralRewardJobInTx(tx, referral.id, outcome.runAt);
    });
  }
}

export async function expireReferralLifecycle(referralId: string): Promise<ReferralJobOutcome> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const referral = await loadReferralSnapshot(tx, referralId);
    if (!referral) {
      return { status: "COMPLETED", reason: "REFERRAL_NOT_FOUND" };
    }

    if (await expireReferralIfDueInTx(tx, referral, now)) {
      return { status: "COMPLETED", reason: "REFERRAL_EXPIRED" };
    }

    return { status: "COMPLETED", reason: "REFERRAL_STILL_ACTIVE" };
  });
}

export async function processPendingReferralReward(
  referralId: string,
): Promise<ReferralJobOutcome> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const referral = await loadReferralSnapshot(tx, referralId);
    if (!referral) {
      return { status: "COMPLETED", reason: "REFERRAL_NOT_FOUND" };
    }

    if (await expireReferralIfDueInTx(tx, referral, now)) {
      return { status: "COMPLETED", reason: "REFERRAL_EXPIRED" };
    }

    if (
      !isReferralAwaitingRewardStatus(referral.status)
    ) {
      return { status: "COMPLETED", reason: `REFERRAL_${referral.status}` };
    }

    if (referral.status === ReferralStatus.PENDING_REWARD) {
      await setReferralStatus(tx, referral.id, ReferralStatus.AWAITING_REWARD);
      referral.status = ReferralStatus.AWAITING_REWARD;
    }

    if (!referral.qualifiedAt) {
      await invalidateReferralInTx(tx, referral, ReferralStatus.VOID);
      return { status: "COMPLETED", reason: "QUALIFICATION_STATE_INVALID" };
    }

    return settleQualifiedReferralInTx(tx, referral, now);
  });
}

export async function processReferralRewardJob(
  jobId: string,
  payload: ReferralJobPayload,
) {
  const outcome = await processPendingReferralReward(payload.referralId);

  if (outcome.status === "DEFERRED") {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        runAt: outcome.runAt,
        attempts: 0,
        lastError: null,
        payload: {
          referralId: payload.referralId,
        },
      },
    });
  }

  return outcome;
}

export function isReferralJobPayload(payload: unknown): payload is ReferralJobPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return typeof candidate.referralId === "string";
}

export {
  REFERRAL_QUALIFICATION_WINDOW_DAYS,
  REFERRER_BONUS,
  REFERRED_BONUS,
};
