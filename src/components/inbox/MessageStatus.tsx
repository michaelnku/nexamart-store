import { Check, CheckCheck } from "lucide-react";

type Props = {
  deliveredAt?: string | null;
  readAt?: string | null;
  sent?: boolean;
};

export function MessageStatus({ deliveredAt, readAt, sent }: Props) {
  if (readAt) {
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  }

  if (deliveredAt || sent) {
    return <Check className="h-3 w-3 text-gray-400" />;
  }

  return null;
}
