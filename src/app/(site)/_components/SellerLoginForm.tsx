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
import { AlertCircleIcon } from "lucide-react";
import SocialLogin from "@/components/auth/SocialLogin";
import { useRouter } from "next/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

const SellerLoginForm = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const form = useForm<loggedInUserSchemaType>({
    resolver: zodResolver(loggedInUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = (values: loggedInUserSchemaType) => {
    startTransition(async () => {
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
    <div>
      <main className="relative min-h-screen flex items-center justify-center bg-gray-300 px-4">
        <div className="top-1 absolute w-full max-w-xl">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
        </div>
        <div className="w-full max-w-md bg-teal-50 p-8 rounded-2xl shadow-md">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
            Login as a Vendor!
          </h1>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              onKeyUp={() => setError("")}
              className="space-y-5 mt-4"
            >
              <FormField
                control={form.control}
                disabled={isPending}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        {...field}
                        className="rounded-lg"
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter password"
                        type="password"
                        {...field}
                        className="rounded-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isPending}
                className="w-full mt-2 rounded-lg"
              >
                {isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>

          <SocialLogin />

          <p className="text-sm text-center text-gray-600 mt-5">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-600 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SellerLoginForm;
