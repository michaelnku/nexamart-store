import { Check, CheckCheck } from "lucide-react";

type Props = {
  deliveredAt?: string | null;
  readAt?: string | null;
};

export function MessageStatus({ deliveredAt, readAt }: Props) {
  if (readAt) {
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  }

  if (deliveredAt) {
    return <Check className="h-3 w-3 text-gray-400" />;
  }

  return null;
}
