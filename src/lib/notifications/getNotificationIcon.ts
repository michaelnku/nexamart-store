import { ShoppingBag, Truck, CreditCard, Megaphone, Bell } from "lucide-react";

import { NotificationType } from "@/lib/types";

export function getNotificationIcon(type?: NotificationType) {
  switch (type) {
    case "ORDER":
      return ShoppingBag;

    case "DELIVERY":
      return Truck;

    case "PAYMENT":
      return CreditCard;

    case "PROMOTION":
      return Megaphone;

    default:
      return Bell;
  }
}
