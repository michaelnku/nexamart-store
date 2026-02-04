import { Check, CheckCheck } from "lucide-react";

type Props = {
  deliveredAt?: string | null;
  readAt?: string | null;
  sent?: boolean;
};

export function MessageStatus({ deliveredAt, readAt, sent }: Props) {
  if (readAt) {
    return (
      <CheckCheck className="h-3.5 w-3.5 text-[#3c9ee0]" strokeWidth={2.3} />
    );
  }

  if (deliveredAt || sent) {
    return (
      <Check className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.3} />
    );
  }

  return null;
}
