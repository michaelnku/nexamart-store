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
import { useState, useTransition, useEffect } from "react";
import { createUser } from "@/actions/auth/user";
import Link from "next/link";
import SocialLogin from "@/components/auth/SocialLogin";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isPending, startTransition] = useTransition();

  const form = useForm<registerSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      role: "USER",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    const code = ref.toUpperCase();
    document.cookie = `ref_code=${encodeURIComponent(code)}; path=/; max-age=604800`;
  }, [searchParams, form]);

  const handleSubmit = (values: registerSchemaType) => {
    startTransition(async () => {
      createUser(values).then((res) => {
        if (res?.error) {
          setError(res.error);
          setSuccess("");
        } else if (res?.success) {
          setSuccess(res.success);
          setError("");
          document.cookie = "ref_code=; path=/; max-age=0";
          form.reset();
          router.push("/auth/login");
        }
      });
    });
  };

  return (
    <main className="min-h-full flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--brand-blue)" }}
          >
            Create your account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You're just a step away from shopping on NexaMart.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              disabled={isPending}
              name="role"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              disabled={isPending}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Doe123"
                      {...field}
                      className="rounded-lg h-11 focus:ring-2 focus:ring-[var(--brand-blue)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              disabled={isPending}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@email.com"
                      type="email"
                      {...field}
                      className="rounded-lg h-11 focus:ring-2 focus:ring-[var(--brand-blue)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        placeholder="At least 6 characters"
                        type={showPassword ? "text" : "password"}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
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
                        placeholder="Re-enter password"
                        type={showConfirm ? "text" : "password"}
                        {...field}
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

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 text-center">{success}</p>
            )}

            <Button
              disabled={isPending}
              type="submit"
              className="w-full h-11 rounded-lg font-semibold text-white shadow-md bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] transition disabled:opacity-70"
            >
              {isPending ? "Creating account..." : "Create your account"}
            </Button>
          </form>

          <SocialLogin />
        </Form>

        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--brand-blue)] hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

