import { DisputeStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  getDisputeStatusClassName,
  getDisputeStatusLabel,
} from "@/lib/disputes/ui";

type Props = {
  status: DisputeStatus;
};

export default function DisputeStatusBadge({ status }: Props) {
  return (
    <Badge variant="outline" className={getDisputeStatusClassName(status)}>
      {getDisputeStatusLabel(status)}
    </Badge>
  );
}
