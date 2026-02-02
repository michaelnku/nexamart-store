import { assignAgentAction } from "@/actions/inbox/admin/assignAgentAction";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AssignAgentButton({
  conversationId,
}: {
  conversationId: string;
}) {
  const assign = async () => {
    const res = await assignAgentAction(conversationId);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("You are now assigned to this conversation");
  };

  return (
    <Button size="sm" onClick={assign}>
      Assign to me
    </Button>
  );
}
