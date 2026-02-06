"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  createCouponAction,
  updateCouponAction,
} from "@/actions/coupons/createCouponAction";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCouponSchema,
  updateCouponSchema,
  createCouponSchemaType,
  updateCouponSchemaType,
} from "@/lib/zodValidation";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { CouponFormValues } from "@/lib/types";

type Props = {
  mode: "create" | "edit";
  initial?: CouponFormValues;
};

const formatDateInput = (value?: Date | null) => {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SUFFIX_RE = /-[A-Z0-9]{6}$/;

const generateSuffix = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export default function CouponForm({ mode, initial }: Props) {
  const router = useRouter();

  const form = useForm<createCouponSchemaType | updateCouponSchemaType>({
    resolver: zodResolver(
      mode === "create" ? createCouponSchema : updateCouponSchema,
    ),
    defaultValues: {
      ...(initial?.id ? { id: initial.id } : {}),
      code: initial?.code ?? "",
      type: initial?.type ?? "PERCENTAGE",
      value: initial?.value ?? 0,
      minOrderAmount: initial?.minOrderAmount ?? undefined,
      maxDiscount: initial?.maxDiscount ?? undefined,
      usageLimit: initial?.usageLimit ?? undefined,
      perUserLimit: initial?.perUserLimit ?? undefined,
      appliesTo: initial?.appliesTo ?? "ALL",
      validFrom: initial?.validFrom ? new Date(initial.validFrom) : undefined,
      validTo: initial?.validTo ? new Date(initial.validTo) : undefined,
      isActive: initial?.isActive ?? true,
    },
  });

  const onSubmit = async (
    values: createCouponSchemaType | updateCouponSchemaType,
  ) => {
    const payload = {
      ...values,
      code: values.code.trim().toUpperCase(),
    };

    const res =
      mode === "create"
        ? await createCouponAction(payload as createCouponSchemaType)
        : await updateCouponAction(payload as updateCouponSchemaType);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    toast.success(mode === "create" ? "Coupon created" : "Coupon updated");
    router.push("/marketplace/dashboard/admin/coupons");
  };

  return (
    <main className="py-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create Coupon" : "Edit Coupon"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Code (e.g., SALE)"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = String(field.value ?? "").toUpperCase();
                        if (!current.trim()) return;
                        if (SUFFIX_RE.test(current)) return;
                        const next = `${current.replace(/-+$/g, "")}-${generateSuffix()}`;
                        form.setValue("code", next, { shouldValidate: true });
                      }}
                    >
                      Add 6-char suffix
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const current = String(field.value ?? "").toUpperCase();
                        if (!SUFFIX_RE.test(current)) return;
                        const next = current.replace(SUFFIX_RE, "");
                        form.setValue("code", next, { shouldValidate: true });
                      }}
                    >
                      Remove suffix
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <select
                        className="w-full border rounded-md p-2"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED">Fixed</option>
                        <option value="FREE_SHIPPING">Free shipping</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Value"
                        value={String(field.value ?? "")}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appliesTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applies To</FormLabel>
                    <FormControl>
                      <select
                        className="w-full border rounded-md p-2"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="ALL">All users</option>
                        <option value="FIRST_ORDER">First order only</option>
                        <option value="NEW_USERS">New users</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minOrderAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min order amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Min order amount"
                        value={field.value?.toString() ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max discount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Max discount"
                        value={field.value?.toString() ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage limit (global)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Usage limit (global)"
                        value={field.value?.toString() ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perUserLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Per-user limit</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Per-user limit"
                        value={field.value?.toString() ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid from</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={formatDateInput(field.value as Date | undefined)}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid to</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={formatDateInput(field.value as Date | undefined)}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <FormLabel>Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
                >
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : mode === "create"
                      ? "Create Coupon"
                      : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
