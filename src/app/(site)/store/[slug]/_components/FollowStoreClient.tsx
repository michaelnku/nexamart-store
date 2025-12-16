"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

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

    startTransition(() => setState((p) => p));

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
    setCount((prev) => prev + (data.following ? 1 : -1));
    toast.success(data.following ? "Followed store 🎉" : "Unfollowed");
  };

  const formatFollowers = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={state ? "secondary" : "default"}
        onClick={toggleFollow}
        disabled={pending}
        className="flex items-center gap-2 bg-[#146EB4] hover:bg-[#125c99]"
      >
        <Heart
          className={`w-4 h-4 ${state ? "fill-red-500 stroke-red-500" : ""}`}
        />
        {state ? "Following" : "Follow Store"}
      </Button>

      <span className="text-gray-500 text-sm">
        {formatFollowers(count)} followers
      </span>
    </div>
  );
};

export default FollowStoreClient;
