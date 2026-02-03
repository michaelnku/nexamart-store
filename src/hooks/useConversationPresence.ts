"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";
import type { PresenceChannel } from "pusher-js";

type Role = "ADMIN" | "MODERATOR" | "SUPPORT" | "USER";
type PresenceMember = { info?: { role?: Role } };

export function useConversationPresence(
  conversationId: string,
  options?: { targetRoles?: Role[] },
) {
  const [online, setOnline] = useState(false);
  const [typing, setTyping] = useState(false);
  const [agentAssigned, setAgentAssigned] = useState(false);

  useEffect(() => {
    const channelName = `presence-conversation-${conversationId}`;
    const channel = pusherClient.subscribe(channelName) as PresenceChannel;

    const targetRoles = options?.targetRoles ?? [
      "ADMIN",
      "MODERATOR",
      "SUPPORT",
    ];

    const hasTargetRole = (member: PresenceMember) =>
      !!member?.info?.role && targetRoles.includes(member.info.role);

    const getMembersList = (payload?: {
      members?: Record<string, PresenceMember>;
    }) => {
      if (payload?.members) {
        return Object.values(payload.members);
      }
      return Object.values(channel.members?.members ?? {}) as PresenceMember[];
    };

    const updateOnline = (payload?: {
      members?: Record<string, PresenceMember>;
    }) => {
      const members = getMembersList(payload);
      setOnline(members.some(hasTargetRole));
    };

    channel.bind("pusher:subscription_succeeded", (payload: any) =>
      updateOnline(payload),
    );
    channel.bind("pusher:member_added", () => updateOnline());
    channel.bind("pusher:member_removed", () => updateOnline());
    channel.bind("pusher:subscription_error", (status: any) => {
      console.error("Presence subscription error", status);
    });

    channel.bind("agent-assigned", () => {
      setAgentAssigned(true);
      setOnline(true);
    });

    channel.bind("typing", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 1500);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [conversationId, options?.targetRoles?.join(",")]);

  return { online, typing, agentAssigned };
}
