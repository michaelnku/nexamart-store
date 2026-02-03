"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";
import type { PresenceChannel } from "pusher-js";

type Role = "ADMIN" | "MODERATOR" | "SELLER" | "RIDER" | "USER";
type PresenceMember = { info?: { role?: Role; isAgent?: boolean } };
type PresenceMembersPayload = {
  members?: Record<string, PresenceMember>;
  presence?: { hash?: Record<string, PresenceMember> };
};
type PresenceMembersCollection = {
  each: (callback: (member: PresenceMember) => void) => void;
};

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
      "SELLER",
      "RIDER",
    ];

    const hasTargetRole = (member: PresenceMember) => {
      if (member?.info?.isAgent) return true;
      return !!member?.info?.role && targetRoles.includes(member.info.role);
    };

    const extractMembersFromPayload = (
      payload?: PresenceMembersPayload | PresenceMembersCollection,
    ): PresenceMember[] => {
      if (!payload) return [];
      if ("each" in payload) {
        const list: PresenceMember[] = [];
        payload.each((m: PresenceMember) => list.push(m));
        return list;
      }
      if (payload.members) {
        return Object.values(payload.members) as PresenceMember[];
      }
      if (payload.presence?.hash) {
        return Object.values(payload.presence.hash) as PresenceMember[];
      }
      return [];
    };

    const getMembersList = (
      payload?: PresenceMembersPayload | PresenceMembersCollection,
    ) => {
      const fromPayload = extractMembersFromPayload(payload);
      if (fromPayload.length) return fromPayload;
      return Object.values(channel.members?.members ?? {}) as PresenceMember[];
    };

    const updateOnline = (
      payload?: PresenceMembersPayload | PresenceMembersCollection,
    ) => {
      const members = getMembersList(payload);
      if (process.env.NODE_ENV !== "production") {
        console.log("[presence] members", members);
      }
      setOnline(members.some(hasTargetRole));
    };

    channel.bind(
      "pusher:subscription_succeeded",
      (payload: PresenceMembersPayload | PresenceMembersCollection) => {
        updateOnline(payload);
      },
    );
    channel.bind("pusher:member_added", (member: PresenceMember) => {
      if (hasTargetRole(member)) {
        setOnline(true);
      } else {
        updateOnline();
      }
    });
    channel.bind("pusher:member_removed", () => updateOnline());
    channel.bind("pusher:subscription_error", (status: unknown) => {
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
