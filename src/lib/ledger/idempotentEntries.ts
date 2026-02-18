import { Prisma } from "@/generated/prisma";

function isUniqueConstraintError(error: unknown): boolean {
  const knownError = error as Prisma.PrismaClientKnownRequestError;
  return (
    knownError instanceof Prisma.PrismaClientKnownRequestError &&
    knownError.code === "P2002"
  );
}

type TxLike = Prisma.TransactionClient;

type LedgerDirection = "CREDIT" | "DEBIT";
type LedgerEntryType =
  | "ESCROW_DEPOSIT"
  | "ESCROW_RELEASE"
  | "SELLER_PAYOUT"
  | "RIDER_PAYOUT"
  | "REFUND"
  | "PLATFORM_FEE";

type EscrowRole = "BUYER" | "SELLER" | "RIDER" | "PLATFORM";
type EscrowEntryType =
  | "FUND"
  | "SELLER_EARNING"
  | "RIDER_EARNING"
  | "PLATFORM_COMMISSION"
  | "RELEASE"
  | "REFUND";
type EscrowStatus = "PENDING" | "HELD" | "RELEASED" | "CANCELLED";

export async function createLedgerEntryIdempotent(
  tx: TxLike,
  input: {
    orderId?: string;
    userId?: string;
    walletId?: string;
    entryType: LedgerEntryType;
    direction: LedgerDirection;
    amount: number;
    reference: string;
  },
) {
  const existing = await tx.ledgerEntry.findUnique({
    where: { reference: input.reference },
    select: { id: true },
  });
  if (existing) return { created: false };

  try {
    await tx.ledgerEntry.create({
      data: input,
    });
    return { created: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { created: false };
    throw error;
  }
}

export async function createEscrowEntryIdempotent(
  tx: TxLike,
  input: {
    orderId: string;
    userId?: string;
    role: EscrowRole;
    entryType: EscrowEntryType;
    amount: number;
    status: EscrowStatus;
    reference: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  const existing = await tx.escrowLedger.findUnique({
    where: { reference: input.reference },
    select: { id: true },
  });
  if (existing) return { created: false };

  try {
    await tx.escrowLedger.create({
      data: input,
    });
    return { created: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { created: false };
    throw error;
  }
}
