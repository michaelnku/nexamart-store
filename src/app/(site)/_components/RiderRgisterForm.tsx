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
import { Bike, Eye, EyeOff, Loader2 } from "lucide-react";
import { createRoleUserAction } from "@/actions/auth/auth";

const RiderRgisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<registerSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (values: registerSchemaType) => {
    startTransition(() => {
      createRoleUserAction({ ...values, role: "RIDER" }).then((res) => {
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
            role: "RIDER",
          });
          router.push("/auth/rider/login");
        }
      });
    });
  };

  return (
    <main className="min-h-full flex items-center justify-center bg-orange-100  dark:bg-neutral-950 px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-blue-light)] text-[var(--brand-blue)]">
            <Bike className="w-6 h-6" />
          </div>

          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--brand-blue)" }}
          >
            Become a Rider
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Register to start delivering with NexaMart
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {/* FULL NAME */}
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
                      className="rounded-lg h-11 focus:ring-2 focus:ring-[var(--brand-blue)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* USERNAME */}
            <FormField
              control={form.control}
              disabled={isPending}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="rider_john"
                      {...field}
                      className="rounded-lg h-11 focus:ring-2 focus:ring-[var(--brand-blue)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* EMAIL */}
            <FormField
              control={form.control}
              disabled={isPending}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="rider@email.com"
                      type="email"
                      {...field}
                      className="rounded-lg h-11 focus:ring-2 focus:ring-[var(--brand-blue)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PASSWORD */}
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
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        className="rounded-lg h-11 focus:ring-2 focus:ring-[var(--brand-blue)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--brand-blue)] transition"
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

            {/* CONFIRM PASSWORD */}
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
                        {...field}
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter password"
                        className="rounded-lg h-11 focus:ring-2 focus:ring-[var(--brand-blue)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--brand-blue)] transition"
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

            {/* FEEDBACK */}
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 text-center">{success}</p>
            )}

            {/* SUBMIT */}
            <Button
              disabled={isPending}
              type="submit"
              className="w-full h-11 rounded-lg font-semibold text-white shadow-md bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] transition disabled:opacity-70"
            >
              {isPending ? (
                <span className="inline-flex gap-2 items-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <p>Submitting application...</p>
                </span>
              ) : (
                "Register as Rider"
              )}
            </Button>
          </form>
        </Form>

        {/* Footer */}
        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
          Already a rider?{" "}
          <Link
            href="/auth/rider/login"
            className="text-[var(--brand-blue)] hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};
export default RiderRgisterForm;

