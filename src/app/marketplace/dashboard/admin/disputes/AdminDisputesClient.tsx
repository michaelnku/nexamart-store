"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import DisputeEvidenceGallery from "@/components/disputes/DisputeEvidenceGallery";
import DisputeReasonLabel from "@/components/disputes/DisputeReasonLabel";
import DisputeResolutionActions from "@/components/disputes/DisputeResolutionActions";
import DisputeStatusBadge from "@/components/disputes/DisputeStatusBadge";
import DisputeSummaryCard from "@/components/disputes/DisputeSummaryCard";
import DisputeTimeline from "@/components/disputes/DisputeTimeline";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildDisputeTimeline } from "@/lib/disputes/ui";
import { AdminDisputeDetailDTO } from "@/lib/types";

type Props = {
  disputes: AdminDisputeDetailDTO[];
};

type FoodFilter = "all" | "food" | "non-food";

export default function AdminDisputesClient({ disputes }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [foodFilter, setFoodFilter] = useState<FoodFilter>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    disputes[0]?.id ?? null,
  );

  const filtered = useMemo(() => {
    return disputes.filter((dispute) => {
      const normalizedQuery = query.trim().toLowerCase();
      const sellerMatch = dispute.sellers.some((seller) =>
        [seller.sellerName, seller.storeName, seller.sellerGroupId]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      );

      const customerName = dispute.customer.name?.toLowerCase() ?? "";
      const customerEmail = dispute.customer.email.toLowerCase();
      const orderMatch = dispute.orderId.toLowerCase().includes(normalizedQuery);

      const matchesQuery =
        normalizedQuery.length === 0 ||
        orderMatch ||
        customerName.includes(normalizedQuery) ||
        customerEmail.includes(normalizedQuery) ||
        sellerMatch;

      const matchesStatus =
        status === "all" ? true : dispute.status === status;
      const matchesFood =
        foodFilter === "all"
          ? true
          : foodFilter === "food"
            ? dispute.isFoodOrder
            : !dispute.isFoodOrder;
      const matchesDate = dateFilter
        ? new Date(dispute.createdAt).toISOString().slice(0, 10) === dateFilter
        : true;

      return matchesQuery && matchesStatus && matchesFood && matchesDate;
    });
  }, [dateFilter, disputes, foodFilter, query, status]);

  const selected =
    filtered.find((dispute) => dispute.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-[1.5fr,0.7fr,0.7fr,0.8fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by order ID, customer, seller, or store"
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
            <SelectItem value="WAITING_FOR_RETURN">Waiting for return</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={foodFilter}
          onValueChange={(value) => setFoodFilter(value as FoodFilter)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Order type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orders</SelectItem>
            <SelectItem value="food">Food only</SelectItem>
            <SelectItem value="non-food">Non-food only</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          No disputes match the selected filters.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="border-b bg-muted/30 px-4 py-3 text-sm font-medium">
              Dispute Queue
            </div>
            <div className="divide-y">
              {filtered.map((dispute) => (
                <button
                  key={dispute.id}
                  type="button"
                  onClick={() => setSelectedId(dispute.id)}
                  className={`w-full px-4 py-4 text-left transition hover:bg-muted/30 ${
                    selected?.id === dispute.id ? "bg-muted/40" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">Order {dispute.orderId}</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.customer.name ?? dispute.customer.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <DisputeReasonLabel reason={dispute.reason} />
                      </p>
                    </div>

                    <DisputeStatusBadge status={dispute.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{dispute.isFoodOrder ? "Food" : "Non-food"}</span>
                    <span>
                      ${Number(dispute.refundAmount ?? 0).toFixed(2)} / $
                      {Number(dispute.totalAmount).toFixed(2)}
                    </span>
                    <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="space-y-6">
              <DisputeSummaryCard dispute={selected} title="Admin Dispute Summary" />

              <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-6">
                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">
                          Customer
                        </p>
                        <p className="font-medium">
                          {selected.customer.name ?? "Customer"}
                        </p>
                        <p className="text-muted-foreground">
                          {selected.customer.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-muted-foreground">
                          Delivery
                        </p>
                        <p className="font-medium">
                          {selected.delivery?.status.replaceAll("_", " ") ?? "N/A"}
                        </p>
                        <p className="text-muted-foreground">
                          {selected.delivery?.riderName ??
                            selected.delivery?.riderEmail ??
                            "No rider assigned"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Timeline</h2>
                    <DisputeTimeline
                      items={buildDisputeTimeline(selected, selected.orderTimelines)}
                    />
                  </div>

                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Payout State</h2>
                    <div className="space-y-3">
                      {selected.sellers.map((seller) => (
                        <div
                          key={seller.sellerGroupId}
                          className="rounded-lg border p-3 text-sm"
                        >
                          <p className="font-medium">
                            {seller.storeName ?? seller.sellerName ?? seller.sellerGroupId}
                          </p>
                          <p>Group ID: {seller.sellerGroupId}</p>
                          <p>Payout status: {seller.payoutStatus ?? "N/A"}</p>
                          <p>Payout locked: {seller.payoutLocked ? "Yes" : "No"}</p>
                          <p>
                            Payout released at:{" "}
                            {seller.payoutReleasedAt
                              ? new Date(seller.payoutReleasedAt).toLocaleString()
                              : "Pending"}
                          </p>
                        </div>
                      ))}
                      {selected.delivery ? (
                        <div className="rounded-lg border p-3 text-sm">
                          <p className="font-medium">Delivery payout</p>
                          <p>Status: {selected.delivery.status.replaceAll("_", " ")}</p>
                          <p>
                            Locked: {selected.delivery.payoutLocked ? "Yes" : "No"}
                          </p>
                          <p>
                            Released:{" "}
                            {selected.delivery.payoutReleasedAt
                              ? new Date(
                                  selected.delivery.payoutReleasedAt,
                                ).toLocaleString()
                              : "Pending"}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Actions</h2>
                    <DisputeResolutionActions dispute={selected} />
                  </div>

                  <DisputeEvidenceGallery evidence={selected.evidence} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
