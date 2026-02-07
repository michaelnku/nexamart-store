"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type Props = {
  code: string;
  link: string;
};

export default function ReferralCodeCard({ code, link }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="text-sm text-muted-foreground">Your referral code</div>
        <div className="text-lg font-semibold">{code}</div>
        <div className="text-xs text-gray-500 break-all">{link}</div>
        <Button
          onClick={handleCopy}
          className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
      </CardContent>
    </Card>
  );
}
