"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Truck, LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  acceptOrderAction,
  cancelOrderAction,
  shipOrderAction,
} from "@/actions/order/sellerOrderActions";

type ActionResult =
  | { success: string; error?: never }
  | { error: string; success?: never };

type ActionButton = {
  label: string;
  disabled?: boolean;
  Icon: LucideIcon;
  action: (sellerGroupId: string) => Promise<ActionResult>;
  variant: React.ComponentProps<typeof Button>["variant"];
};

type Props = {
  groupId: string;
  status: string;
};

export default function SellerOrderActions({ groupId, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const actionButtons = [
    status === "PENDING_PICKUP" && {
      label: "Accept Order",
      Icon: CheckCircle2,
      action: acceptOrderAction,
      variant: "default",
    },
    status === "PENDING_PICKUP" && {
      label: "Cancel Order",
      Icon: XCircle,
      action: cancelOrderAction,
      variant: "destructive",
    },
    status === "CANCELLED" && {
      label: "Accept Order",
      Icon: CheckCircle2,
      action: acceptOrderAction,
      variant: "default",
      disabled: true,
    },
    status === "CANCELLED" && {
      label: "Cancelled",
      Icon: XCircle,
      action: cancelOrderAction,
      variant: "secondary",
      disabled: true,
    },
    status === "IN_TRANSIT_TO_HUB" && {
      label: "Mark as Shipped",
      Icon: Truck,
      action: shipOrderAction,
      variant: "default",
    },
  ].filter(Boolean) as ActionButton[];

  if (actionButtons.length === 0) return null;

  const handleAction = (action: ActionButton["action"]) => {
    startTransition(async () => {
      const res = await action(groupId);
      toast[res.error ? "error" : "success"](res.error || res.success);
      router.refresh();
    });
  };

  return (
    <div className="flex gap-3 flex-wrap">
      {actionButtons.map(({ label, Icon, action, variant, disabled }) => (
        <Button
          key={label}
          variant={variant}
          className="flex gap-2"
          onClick={() => handleAction(action)}
          disabled={pending || disabled}
        >
          <Icon className="w-4 h-4" /> {label}
        </Button>
      ))}
    </div>
  );
}
