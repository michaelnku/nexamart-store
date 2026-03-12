import { DisputeReason } from "@/generated/prisma/client";
import { getDisputeReasonLabel } from "@/lib/disputes/ui";

type Props = {
  reason: DisputeReason;
  className?: string;
};

export default function DisputeReasonLabel({ reason, className }: Props) {
  return <span className={className}>{getDisputeReasonLabel(reason)}</span>;
}
