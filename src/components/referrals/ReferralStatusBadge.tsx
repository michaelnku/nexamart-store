import { ReferralStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  getReferralStatusClassName,
  getReferralStatusLabel,
} from "@/lib/referrals/status";

type Props = {
  status: ReferralStatus;
};

export default function ReferralStatusBadge({ status }: Props) {
  return (
    <Badge variant="outline" className={getReferralStatusClassName(status)}>
      {getReferralStatusLabel(status)}
    </Badge>
  );
}
