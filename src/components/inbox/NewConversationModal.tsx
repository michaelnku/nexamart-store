"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createConversationAction } from "@/actions/inbox/createConversationAction";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { SupportFormValues, supportFormSchema } from "@/lib/zodValidation";
import { NewConversation } from "@/lib/types";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";

type Props = {
  onCreated: (conversation: NewConversation) => void;
  onClose: () => void;
};

export default function NewConversationModal({ onCreated, onClose }: Props) {
  const { data: user } = useCurrentUserQuery();
  const [isPending, startTransition] = useTransition();

  const role = user?.role?.toLowerCase() ?? "user";

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      fullName: user?.name ?? "",
      email: user?.email ?? "",
      issueType: undefined,
      referenceId: "",
      message: "",
    },
  });

  const ISSUE_LABEL: Record<string, string> = {
    user: "Order ID (Optional)",
    seller: "Order/Product ID (Optional)",
    rider: "Delivery ID or Route Issue (Optional)",
    admin: "Support ID Issue (Optional)",
    moderator: "Support ID Issue (Optional)",
  };

  const ISSUE_PLACEHOLDER: Record<string, string> = {
    user: "e.g. ORD-921",
    seller: "e.g. ORD-2013 / PDT-5511",
    rider: "e.g. DLV-119",
    admin: "e.g SUP-124",
    moderator: "e.g SUP-134",
  };

  function onSubmit(values: SupportFormValues) {
    startTransition(async () => {
      const subject = values.referenceId
        ? `${values.issueType} • ${values.referenceId}`
        : values.issueType;

      const res = await createConversationAction({
        subject,
        message: values.message,
      });

      if (!res?.ok) {
        toast.error(res?.error ?? "Failed to submit ticket");
        return;
      }

      toast.success("Support ticket submitted");

      onCreated(res.conversation);
      onClose();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* NAME */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* EMAIL */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ISSUE TYPE */}
        <FormField
          control={form.control}
          name="issueType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type of Issue</FormLabel>
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose issue type" />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* REFERENCE */}
        <FormField
          control={form.control}
          name="referenceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {ISSUE_LABEL[role] ?? "Reference ID (Optional)"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={ISSUE_PLACEHOLDER[role] ?? "Enter reference ID"}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* MESSAGE */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe your issue</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button disabled={isPending} className="bg-[var(--brand-blue)]">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting
              </>
            ) : (
              "Submit Ticket"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
