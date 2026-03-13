import SupportTicketsPage from "@/components/inbox/SupportTicketsPage";
import { CurrentUserId } from "@/lib/currentUser";
import getUserTickets from "@/lib/support/getUserTickets";

export default async function SupportPage() {
  const userId = await CurrentUserId();
  if (!userId) return null;

  const tickets = await getUserTickets(userId);

  return (
    <div className="bg-white dark:bg-neutral-950">
      <SupportTicketsPage tickets={tickets} />
    </div>
  );
}
