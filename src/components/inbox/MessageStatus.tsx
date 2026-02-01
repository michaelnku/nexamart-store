import { Check, CheckCheck } from "lucide-react";

export function MessageStatus({
  delivered,
  seen,
}: {
  delivered: boolean;
  seen: boolean;
}) {
  if (seen) {
    return <CheckCheck className="w-3 h-3 text-blue-500" />;
  }

  if (delivered) {
    return <Check className="w-3 h-3 text-gray-400" />;
  }

  return null;
}
