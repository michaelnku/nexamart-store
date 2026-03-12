import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DisputeReasonLabel from "@/components/disputes/DisputeReasonLabel";
import DisputeStatusBadge from "@/components/disputes/DisputeStatusBadge";
import { getDisputeResolutionLabel } from "@/lib/disputes/ui";
import { OrderDisputeSummaryDTO } from "@/lib/types";

type Props = {
  dispute: OrderDisputeSummaryDTO;
  title?: string;
};

export default function DisputeSummaryCard({
  dispute,
  title = "Dispute Summary",
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Opened {new Date(dispute.createdAt).toLocaleString()}
          </p>
        </div>

        <DisputeStatusBadge status={dispute.status} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Reason</p>
            <p className="text-sm font-medium">
              <DisputeReasonLabel reason={dispute.reason} />
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground">Resolution</p>
            <p className="text-sm font-medium">
              {getDisputeResolutionLabel(dispute.resolution)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground">Refund Amount</p>
            <p className="text-sm font-medium">
              {typeof dispute.refundAmount === "number"
                ? `$${dispute.refundAmount.toFixed(2)}`
                : "Pending"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground">Updated</p>
            <p className="text-sm font-medium">
              {new Date(dispute.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {dispute.description ? (
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            {dispute.description}
          </div>
        ) : null}

        {dispute.sellerImpacts.length ? (
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">
              Affected Seller Groups
            </p>
            <div className="grid gap-2">
              {dispute.sellerImpacts.map((impact) => (
                <div
                  key={impact.sellerGroupId}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {impact.storeName ?? impact.sellerName ?? impact.sellerGroupId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Group ID: {impact.sellerGroupId}
                    </p>
                  </div>

                  <span className="font-medium">
                    ${Number(impact.refundAmount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {dispute.returnRequest ? (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">Return Request</p>
            <p>Status: {dispute.returnRequest.status.replaceAll("_", " ")}</p>
            <p>Tracking: {dispute.returnRequest.trackingNumber ?? "N/A"}</p>
            <p>Carrier: {dispute.returnRequest.carrier ?? "N/A"}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
