import { Prisma } from "@/generated/prisma";
import { ServiceContext } from "@/lib/system/serviceContext";
import {
  EscrowEntryTypeValue,
  EscrowRoleValue,
  EscrowStatusValue,
  LedgerDirectionValue,
  LedgerEntryTypeValue,
} from "@/lib/ledger/types";

function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown };
  return candidate.code === "P2002";
}

type TxLike = Prisma.TransactionClient;

export async function createLedgerEntryIdempotent(
  tx: TxLike,
  input: {
    orderId?: string;
    userId?: string;
    walletId?: string;
    entryType: LedgerEntryTypeValue;
    direction: LedgerDirectionValue;
    amount: number;
    reference: string;
  },
) {
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
    role: EscrowRoleValue;
    entryType: EscrowEntryTypeValue;
    amount: number;
    status: EscrowStatusValue;
    reference: string;
    metadata?: Prisma.InputJsonValue;
    context?: ServiceContext;
  },
) {
  const { context, ...escrowInput } = input;

  const metadataWithContext = context
    ? ({
        ...(typeof escrowInput.metadata === "object" &&
        escrowInput.metadata !== null
          ? (escrowInput.metadata as Record<string, unknown>)
          : {}),
        executedBy: context.type,
        service: context.service,
        executedAt: context.executedAt.toISOString(),
      } satisfies Record<string, unknown>)
    : escrowInput.metadata;

  try {
    await tx.escrowLedger.create({
      data: {
        ...escrowInput,
        metadata: metadataWithContext,
      },
    });
    return { created: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { created: false };
    }
    throw error;
  }
}
