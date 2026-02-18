"use client";

import { registerSchema, registerSchemaType } from "@/lib/zodValidation";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRoleUserAction } from "@/actions/auth/auth";
import { Store, Loader2, Eye, EyeOff } from "lucide-react";

const SellerRegisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<registerSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "SELLER",
    },
  });

  const handleSubmit = (values: registerSchemaType) => {
    startTransition(() => {
      createRoleUserAction(values).then((res) => {
        if (res?.error) {
          setError(res.error);
          setSuccess(undefined);
        } else if (res?.success) {
          setSuccess(res.success);
          setError(undefined);
          form.reset({
            name: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "SELLER",
          });
          router.push("/auth/seller/login");
        }
      });
    });
  };

  return (
    <main
      className="min-h-full flex items-center justify-center px-4 py-10
      bg-gradient-to-br from-[var(--brand-blue-light)]/40 via-white to-gray-50
      dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-neutral-900
        border border-gray-200 dark:border-neutral-700
        rounded-2xl shadow-xl p-8 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="mx-auto w-12 h-12 rounded-full flex items-center justify-center
            bg-[var(--brand-blue-light)] text-[var(--brand-blue)]"
          >
            <Store className="w-6 h-6" />
          </div>

          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--brand-blue)" }}
          >
            Become a Seller
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create your seller account and start selling on NexaMart
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {/*name */}
            <FormField
              control={form.control}
              disabled={isPending}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      className="h-11 rounded-lg focus:ring-2 focus:ring-[var(--brand-blue)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Username */}
            <FormField
              control={form.control}
              disabled={isPending}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="seller_Doe"
                      {...field}
                      className="h-11 rounded-lg focus:ring-2 focus:ring-[var(--brand-blue)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              disabled={isPending}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seller@email.com"
                      {...field}
                      className="h-11 rounded-lg focus:ring-2 focus:ring-[var(--brand-blue)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              disabled={isPending}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        {...field}
                        className="h-11 rounded-lg pr-12 focus:ring-2 focus:ring-[var(--brand-blue)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
              text-gray-500 hover:text-[var(--brand-blue)] transition"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              disabled={isPending}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter password"
                        {...field}
                        className="h-11 rounded-lg pr-12 focus:ring-2 focus:ring-[var(--brand-blue)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
              text-gray-500 hover:text-[var(--brand-blue)] transition"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Feedback */}
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 text-center">{success}</p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-lg font-semibold text-white
                bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)]
                shadow-md transition disabled:opacity-70"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating seller account...
                </span>
              ) : (
                "Create Seller Account"
              )}
            </Button>
          </form>
        </Form>

        {/* Footer */}
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Already a seller?{" "}
          <Link
            href="/auth/seller/login"
            className="text-[var(--brand-blue)] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default SellerRegisterForm;

