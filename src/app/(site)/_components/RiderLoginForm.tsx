"use client";

import {
  loggedInUserSchema,
  loggedInUserSchemaType,
} from "@/lib/zodValidation";
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
import { loggedInUser } from "@/actions/auth/user";
import Link from "next/link";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RiderLoginForm() {
  const router = useRouter();

  const [error, setError] = useState<string | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<loggedInUserSchemaType>({
    resolver: zodResolver(loggedInUserSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSubmit = (values: loggedInUserSchemaType) => {
    startTransition(() => {
      loggedInUser(values).then((res) => {
        if (res?.error) {
          setError(res.error);
          form.reset();
          return;
        }

        router.push("/auth/redirecting");
        router.refresh();
      });
    });
  };

  return (
    <main className="min-h-full flex items-center justify-center bg-orange-100 dark:bg-neutral-950 px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-lg p-8 space-y-7">
        {/* Error */}
        {error && (
          <Alert variant="destructive" className="text-sm rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {/* Title */}
        <div className="text-center space-y-1">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--brand-blue)" }}
          >
            Delivery Partner Login
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to manage deliveries and accept jobs
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            onKeyUp={() => setError("")}
            className="space-y-5"
          >
            {/* Email */}
            <FormField
              control={form.control}
              disabled={isPending}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="rider@email.com"
                      {...field}
                      className="rounded-lg h-11 focus:ring-2 focus:ring-[var(--brand-blue)]"
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
                  <FormLabel className="text-sm font-medium">
                    Password
                  </FormLabel>

                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        className="pr-12 rounded-lg h-11 focus:ring-2 focus:ring-[var(--brand-blue)]"
                      />
                    </FormControl>

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

                  <div className="flex justify-end mt-1">
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-medium text-[var(--brand-blue)] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-lg font-semibold text-white shadow-md transition bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] disabled:opacity-70"
            >
              {isPending ? (
                <span className="inline-flex gap-2 items-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing inâ€¦
                </span>
              ) : (
                "Sign in as Rider"
              )}
            </Button>
          </form>
        </Form>

        {/* Footer */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            New delivery partner?{" "}
            <Link
              href="/auth/rider/register"
              className="text-[var(--brand-blue)] hover:underline font-semibold"
            >
              Apply to become a rider
            </Link>
          </p>

          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>{" "}
            &{" "}
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

