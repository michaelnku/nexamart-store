export type SystemService =
  | "SELLER_PAYOUT_CRON"
  | "RIDER_PAYOUT_CRON"
  | "PLATFORM_WITHDRAWAL_ENGINE"
  | "ORDER_PAYMENT_WEBHOOK"
  | "WALLET_TOPUP_WEBHOOK"
  | "REFUND_ENGINE";

export interface ServiceContext {
  type: "SYSTEM";
  service: SystemService;
  executedAt: Date;
}

export function createServiceContext(service: SystemService): ServiceContext {
  return {
    type: "SYSTEM",
    service,
    executedAt: new Date(),
  };
}
