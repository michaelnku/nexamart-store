"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getSellerCancellationReasonLabel,
  SELLER_CANCELLATION_REASONS,
  sellerCancelOrderInputSchema,
  type SellerCancelOrderInput,
} from "@/lib/orders/sellerCancellation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerGroupId: string | null;
  storeName?: string | null;
  isSubmitting: boolean;
  onSubmit: (input: SellerCancelOrderInput) => void;
};

export default function SellerCancelOrderDialog({
  open,
  onOpenChange,
  sellerGroupId,
  storeName,
  isSubmitting,
  onSubmit,
}: Props) {
  const form = useForm<SellerCancelOrderInput>({
    resolver: zodResolver(sellerCancelOrderInputSchema),
    defaultValues: {
      sellerGroupId: sellerGroupId ?? "",
      reason: "OUT_OF_STOCK",
      note: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        sellerGroupId: sellerGroupId ?? "",
        reason: "OUT_OF_STOCK",
        note: "",
      });
      return;
    }

    form.setValue("sellerGroupId", sellerGroupId ?? "", {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [form, open, sellerGroupId]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cancel Seller Order</DialogTitle>
          <DialogDescription>
            Select a clear reason for the cancellation. The buyer will see the
            reason, your optional note, and the refund update on their order.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Customer-facing cancellation</p>
                  <p>
                    {storeName
                      ? `${storeName} will be shown as the cancelling seller.`
                      : "The customer will see that the seller cancelled this order."}
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation reason</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SELLER_CANCELLATION_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {getSellerCancellationReasonLabel(reason)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optional note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={5}
                      maxLength={300}
                      disabled={isSubmitting}
                      placeholder="Add a short note for the customer, for example when stock ran out or when the store cannot fulfill the order today."
                    />
                  </FormControl>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Keep it clear, factual, and customer-safe.</span>
                    <span>{(field.value ?? "").length}/300</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Keep Order
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting || !sellerGroupId}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
