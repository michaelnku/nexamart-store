export function getTicketId(id: string) {
  return `SUP-${id.slice(-5).toUpperCase()}`;
}
