export default function formatTicketId(createdAt: Date) {
  const base = Math.floor(createdAt.getTime() / 100000);
  return `SUP-${base.toString().slice(-4)}`;
}
