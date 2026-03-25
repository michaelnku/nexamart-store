"use client";

import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";

import DisputeEvidenceGallery from "@/components/disputes/DisputeEvidenceGallery";
import DisputeResolutionActions from "@/components/disputes/DisputeResolutionActions";
import DisputeSummaryCard from "@/components/disputes/DisputeSummaryCard";
import DisputeTimeline from "@/components/disputes/DisputeTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDisputeAttentionBadgeClass } from "@/lib/disputes/admin-ui";
import {
  buildDisputeTimeline,
  getDisputeStatusLabel,
  humanizeDisputeValue,
} from "@/lib/disputes/ui";
import type { AdminDisputeDetailDTO } from "@/lib/types";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminDisputeCaseDetail({
  dispute,
  detailHref,
  showActions = true,
}: {
  dispute: AdminDisputeDetailDTO;
  detailHref?: string;
  showActions?: boolean;
}) {
  return (
    <div className="space-y-6">
      <DisputeSummaryCard dispute={dispute} title="Case Summary" />

      <div className="grid gap-6 2xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Case Context
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Order linkage, actors, refund recording, and queue attention signals.
                </p>
              </div>
              <Badge variant="outline" className={getDisputeAttentionBadgeClass(dispute.attentionLevel)}>
                {dispute.attentionLevel === "CRITICAL"
                  ? "Critical attention"
                  : dispute.attentionLevel === "HIGH"
                    ? "High attention"
                    : "Normal attention"}
              </Badge>
            </div>

            <div className="grid gap-4 text-sm md:grid-cols-2 2xl:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  Order reference
                </p>
                <p className="font-medium text-slate-950 dark:text-white">
                  {dispute.orderTrackingNumber ?? dispute.orderId}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  Delivery type
                </p>
                <p className="font-medium text-slate-950 dark:text-white">
                  {humanizeDisputeValue(dispute.deliveryType)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  Status
                </p>
                <p className="font-medium text-slate-950 dark:text-white">
                  {getDisputeStatusLabel(dispute.status)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  Opened by
                </p>
                <p className="font-medium text-slate-950 dark:text-white">
                  {dispute.openedByName ?? "Customer"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  Resolved by
                </p>
                <p className="font-medium text-slate-950 dark:text-white">
                  {dispute.resolvedByName ?? "Pending"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  Refund recorded
                </p>
                <p className="font-medium text-slate-950 dark:text-white">
                  {formatDateTime(dispute.refundRecordedAt)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
              Parties
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-zinc-800">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  Customer
                </p>
                <p className="mt-2 font-medium text-slate-950 dark:text-white">
                  {dispute.customer.name ?? "Customer"}
                </p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  {dispute.customer.email}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-zinc-800">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  Rider
                </p>
                <p className="mt-2 font-medium text-slate-950 dark:text-white">
                  {dispute.delivery?.riderName ??
                    dispute.delivery?.riderEmail ??
                    "No rider linked"}
                </p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  {dispute.delivery
                    ? humanizeDisputeValue(dispute.delivery.status)
                    : "No delivery record"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {dispute.sellers.map((seller) => (
                <div
                  key={seller.sellerGroupId}
                  className="rounded-2xl border border-slate-200/80 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950 dark:text-white">
                        {seller.storeName ?? seller.sellerName ?? seller.sellerGroupId}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">
                        Seller group {seller.sellerGroupId}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Refund exposure ${Number(seller.refundAmount ?? 0).toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
              Timeline
            </h2>
            <DisputeTimeline
              items={buildDisputeTimeline(dispute, dispute.orderTimelines)}
            />
          </section>

          <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
              Payout And Return State
            </h2>
            <div className="space-y-3">
              {dispute.sellers.map((seller) => (
                <div
                  key={`${seller.sellerGroupId}-payout`}
                  className="rounded-2xl border border-slate-200/80 p-4 text-sm dark:border-zinc-800"
                >
                  <p className="font-medium text-slate-950 dark:text-white">
                    {seller.storeName ?? seller.sellerName ?? seller.sellerGroupId}
                  </p>
                  <p className="mt-2 text-slate-600 dark:text-zinc-300">
                    Payout status: {seller.payoutStatus ?? "Pending"}
                  </p>
                  <p className="text-slate-600 dark:text-zinc-300">
                    Payout locked: {seller.payoutLocked ? "Yes" : "No"}
                  </p>
                  <p className="text-slate-600 dark:text-zinc-300">
                    Released at: {formatDateTime(seller.payoutReleasedAt)}
                  </p>
                </div>
              ))}

              {dispute.delivery ? (
                <div className="rounded-2xl border border-slate-200/80 p-4 text-sm dark:border-zinc-800">
                  <p className="font-medium text-slate-950 dark:text-white">
                    Rider payout
                  </p>
                  <p className="mt-2 text-slate-600 dark:text-zinc-300">
                    Delivery status: {humanizeDisputeValue(dispute.delivery.status)}
                  </p>
                  <p className="text-slate-600 dark:text-zinc-300">
                    Payout locked: {dispute.delivery.payoutLocked ? "Yes" : "No"}
                  </p>
                  <p className="text-slate-600 dark:text-zinc-300">
                    Released at: {formatDateTime(dispute.delivery.payoutReleasedAt)}
                  </p>
                </div>
              ) : null}

              {dispute.returnRequest ? (
                <div className="rounded-2xl border border-slate-200/80 p-4 text-sm dark:border-zinc-800">
                  <p className="font-medium text-slate-950 dark:text-white">
                    Return request
                  </p>
                  <p className="mt-2 text-slate-600 dark:text-zinc-300">
                    Status: {humanizeDisputeValue(dispute.returnRequest.status)}
                  </p>
                  <p className="text-slate-600 dark:text-zinc-300">
                    Tracking: {dispute.returnRequest.trackingNumber ?? "Not submitted"}
                  </p>
                  <p className="text-slate-600 dark:text-zinc-300">
                    Carrier: {dispute.returnRequest.carrier ?? "Not recorded"}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {showActions ? (
            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                    Actions
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">
                    Use the existing dispute resolution flow to move this case safely.
                  </p>
                </div>
                <ShieldCheck className="h-5 w-5 text-slate-400" />
              </div>
              <DisputeResolutionActions dispute={dispute} />
            </section>
          ) : null}

          <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Case Signals
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Queue age, evidence volume, and message activity for triage.
                </p>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400">Queue age</span>
                <span className="font-medium text-slate-950 dark:text-white">
                  {dispute.attentionAgeHours ?? 0}h
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400">Evidence items</span>
                <span className="font-medium text-slate-950 dark:text-white">
                  {dispute.evidence.length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400">Messages</span>
                <span className="font-medium text-slate-950 dark:text-white">
                  {dispute.messages.length}
                </span>
              </div>
            </div>

            {detailHref ? (
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href={detailHref}>
                  Open Full Case
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </section>

          <DisputeEvidenceGallery evidence={dispute.evidence} />
        </div>
      </div>
    </div>
  );
}
