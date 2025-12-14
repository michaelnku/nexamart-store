"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, LifeBuoy } from "lucide-react";

type SupportRole = "buyer" | "seller" | "rider";

interface SupportProps {
  role: SupportRole;
}

const SupportPage = ({ role }: SupportProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ISSUE_LABEL = {
    buyer: "Order ID (Optional)",
    seller: "Order/Product ID (Optional)",
    rider: "Delivery ID or Route Issue (Optional)",
  } as const;

  const ISSUE_PLACEHOLDER = {
    buyer: "e.g., #ORD-0921",
    seller: "e.g., #ORD-2013 / #PDT-5511",
    rider: "e.g., Delivery #DLV-119 or Failed Route",
  } as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      toast.success(
        "Support request submitted — our team will reach out shortly."
      );
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <main className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-2 justify-center">
          <LifeBuoy className="w-7 h-7 text-primary" />
          Customer Support
        </h1>
        <p className="text-sm text-muted-foreground">
          We typically respond within <strong>24 hours</strong>.
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Submit a Support Ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-1">
              <label className="font-medium text-sm">Full Name</label>
              <Input required placeholder="e.g., John Doe" />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="font-medium text-sm">Email Address</label>
              <Input type="email" required placeholder="your@email.com" />
            </div>

            {/* Issue Type */}
            <div className="space-y-1">
              <label className="font-medium text-sm">Type of Issue</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a support category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing">Billing / Payment</SelectItem>
                  <SelectItem value="delivery">Delivery & Shipping</SelectItem>
                  <SelectItem value="product">Product Issue</SelectItem>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order/Product/Delivery ID — dynamic per role */}
            <div className="space-y-1">
              <label className="font-medium text-sm">{ISSUE_LABEL[role]}</label>
              <Input placeholder={ISSUE_PLACEHOLDER[role]} />
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label className="font-medium text-sm">Describe Your Issue</label>
              <Textarea
                rows={5}
                required
                placeholder="Explain the problem in detail so we can assist faster..."
              />
            </div>

            {/* Submit */}
            <Button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-3 text-lg font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Ticket"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default SupportPage;
