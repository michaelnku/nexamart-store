export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case "READY":
      return "Ready for Pickup";
    case "IN_DELIVERY":
      return "Rider in Transit";
    default:
      return status.replaceAll("_", " ");
  }
}
