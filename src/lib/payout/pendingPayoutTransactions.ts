import { Prisma, TransactionStatus, TransactionType } from "@/generated/prisma";

type Tx = Prisma.TransactionClient;

type PendingPayoutInput = {
  reference: string;
  walletUserId: string;
  orderId: string;
  type: Extract<TransactionType, "SELLER_PAYOUT" | "RIDER_PAYOUT">;
  amount: number;
  description: string;
};

type PendingPayoutResult = {
  reference: string;
  walletId: string;
  created: boolean;
  status: TransactionStatus;
};

async function ensureWallet(tx: Tx, userId: string) {
  return tx.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
}

export async function ensurePendingPayoutTransaction(
  tx: Tx,
  input: PendingPayoutInput,
): Promise<PendingPayoutResult> {
  const existing = await tx.transaction.findUnique({
    where: { reference: input.reference },
    select: {
      id: true,
      status: true,
    },
  });

  const wallet = await ensureWallet(tx, input.walletUserId);

  if (existing && existing.status !== "PENDING") {
    return {
      reference: input.reference,
      walletId: wallet.id,
      created: false,
      status: existing.status,
    };
  }

  const transaction = await tx.transaction.upsert({
    where: { reference: input.reference },
    update: {
      walletId: wallet.id,
      userId: input.walletUserId,
      orderId: input.orderId,
      type: input.type,
      status: "PENDING",
      amount: input.amount,
      description: input.description,
    },
    create: {
      walletId: wallet.id,
      userId: input.walletUserId,
      orderId: input.orderId,
      type: input.type,
      status: "PENDING",
      amount: input.amount,
      reference: input.reference,
      description: input.description,
    },
    select: {
      status: true,
    },
  });

  return {
    reference: input.reference,
    walletId: wallet.id,
    created: !existing,
    status: transaction.status,
  };
}

export async function settlePendingPayoutTransaction(
  tx: Tx,
  input: PendingPayoutInput & {
    status: Extract<TransactionStatus, "SUCCESS" | "CANCELLED">;
  },
): Promise<PendingPayoutResult> {
  const existing = await tx.transaction.findUnique({
    where: { reference: input.reference },
    select: {
      id: true,
    },
  });

  const wallet = await ensureWallet(tx, input.walletUserId);

  const transaction = await tx.transaction.upsert({
    where: { reference: input.reference },
    update: {
      walletId: wallet.id,
      userId: input.walletUserId,
      orderId: input.orderId,
      type: input.type,
      status: input.status,
      amount: input.amount,
      description: input.description,
    },
    create: {
      walletId: wallet.id,
      userId: input.walletUserId,
      orderId: input.orderId,
      type: input.type,
      status: input.status,
      amount: input.amount,
      reference: input.reference,
      description: input.description,
    },
    select: {
      status: true,
    },
  });

  return {
    reference: input.reference,
    walletId: wallet.id,
    created: !existing,
    status: transaction.status,
  };
}
