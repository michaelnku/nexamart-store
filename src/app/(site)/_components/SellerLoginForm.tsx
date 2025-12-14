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
import { AlertCircleIcon, Eye, EyeOff, Store } from "lucide-react";
import { useRouter } from "next/navigation";

const SellerLoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        } else {
          router.push("/auth/redirecting");
          router.refresh();
        }
      });
    });
  };

  return (
    <main
      className="
        min-h-screen flex items-center justify-center px-4 py-12
        bg-gradient-to-br
        from-[var(--brand-blue-light)]/30
        via-white
        to-gray-100
        dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950
      "
    >
      <div className="w-full max-w-md">
        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircleIcon className="w-4 h-4" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-blue-light)] text-[var(--brand-blue)]">
              <Store className="w-6 h-6" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Seller Login
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Access your store dashboard and manage your business
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              onKeyUp={() => setError(undefined)}
              className="space-y-5"
            >
              {/* Email */}
              <FormField
                control={form.control}
                disabled={isPending}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seller@nexamart.com"
                        {...field}
                        className="
                          h-11 rounded-lg
                          focus:ring-2 focus:ring-[var(--brand-blue)]
                        "
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

                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="
                            h-11 rounded-lg pr-12
                            focus:ring-2 focus:ring-[var(--brand-blue)]
                          "
                        />
                      </FormControl>

                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="
                          absolute right-3 top-1/2 -translate-y-1/2
                          text-gray-500 hover:text-[var(--brand-blue)]
                          transition
                        "
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button
                type="submit"
                disabled={isPending}
                className="
                  w-full h-11 rounded-lg font-semibold
                  bg-[var(--brand-blue)]
                  hover:bg-[var(--brand-blue-hover)]
                  shadow-md
                "
              >
                {isPending ? "Signing in..." : "Sign in to Seller Center"}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="text-center space-y-2 pt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have a seller account?
            </p>

            <Link
              href="/auth/seller/register"
              className="
                text-sm font-semibold
                text-[var(--brand-blue)]
                hover:underline
              "
            >
              Apply to become a seller
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SellerLoginForm;
