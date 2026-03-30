"use client";

import { useState, useTransition } from "react";
import { Heart, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  storeId: string;
  userId?: string;
  isFollowing: boolean;
  followerCount: number;
};

const FollowStoreClient = ({
  storeId,
  userId,
  isFollowing,
  followerCount,
}: Props) => {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(isFollowing);
  const [count, setCount] = useState(followerCount);

  const toggleFollow = async () => {
    if (!userId) return toast.error("Login to follow this store");

    startTransition(() => setState((previous) => previous));

    const res = await fetch(`/api/store/${storeId}/follow-toggle`, {
      method: "POST",
    });

    let data;
    try {
      data = await res.json();
    } catch {
      return toast.error("Unexpected response");
    }

    if (data.error) return toast.error(data.error);

    setState(data.following);
    setCount((previous) => previous + (data.following ? 1 : -1));
    toast.success(data.following ? "Store followed" : "Store unfollowed");
  };

  const formatFollowers = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)] dark:border-zinc-800 dark:bg-zinc-950">
      <Button
        variant={state ? "secondary" : "default"}
        onClick={toggleFollow}
        disabled={pending}
        className={`rounded-xl px-4 text-sm font-medium ${
          state
            ? "border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            : "bg-[#3c9ee0] text-white hover:bg-[#2d8fd4]"
        }`}
      >
        <Heart
          className={`h-4 w-4 ${
            state ? "fill-[#3c9ee0] text-[#3c9ee0]" : ""
          }`}
        />
        {pending ? "Updating..." : state ? "Following" : "Follow Store"}
      </Button>

      <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-left">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-900 dark:text-zinc-300">
          <Users className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
            {formatFollowers(count)}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {count === 1 ? "Follower" : "Followers"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FollowStoreClient;
