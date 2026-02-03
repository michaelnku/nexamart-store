"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";

export function useConversationPresence(conversationId: string) {
  const [online, setOnline] = useState(false);
  const [typing, setTyping] = useState(false);

  const [agentAssigned, setAgentAssigned] = useState(false);

  useEffect(() => {
    const channel = pusherClient.subscribe(
      `presence-conversation-${conversationId}`,
    );
    const isAgentMember = (member: any) => {
      const role = member?.info?.role;
      return role === "ADMIN" || role === "MODERATOR" || role === "SUPPORT";
    };

    const updateOnlineFromMembers = () => {
      const members = channel?.members?.members ?? {};
      const hasAgent = Object.values(members).some(isAgentMember);
      setOnline(hasAgent);
    };

    channel.bind("agent-assigned", () => {
      setAgentAssigned(true);
      setOnline(true);
    });

    channel.bind("pusher:subscription_succeeded", () => {
      updateOnlineFromMembers();
    });

    channel.bind("pusher:member_added", () => {
      updateOnlineFromMembers();
    });

    channel.bind("pusher:member_removed", () => {
      updateOnlineFromMembers();
    });

    channel.bind("typing", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 1500);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`presence-conversation-${conversationId}`);
    };
  }, [conversationId]);

  return { online, typing, agentAssigned };
}
