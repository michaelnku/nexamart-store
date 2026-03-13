"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";

const SocialLogin = () => {
  const [loading, setLoading] = useState(false);

  const loginSocial = async (provider: string) => {
    setLoading(true);
    try {
      await signIn(provider, {
        callbackUrl: `/auth/redirecting`,
      });
    } catch (error) {
      console.error("Error logging in:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center my-5">
        <div className="flex-grow border-t border-gray-300 dark:border-zinc-700" />
        <span className="mx-3 text-sm text-gray-500 dark:text-zinc-400">or</span>
        <div className="flex-grow border-t border-gray-300 dark:border-zinc-700" />
      </div>

      <button
        type="button"
        onClick={() => loginSocial("google")}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 py-2 transition dark:border-zinc-700 dark:bg-zinc-950 ${
          loading
            ? "cursor-not-allowed bg-gray-100 dark:bg-zinc-900"
            : "hover:bg-gray-100 dark:hover:bg-zinc-900"
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 animate-spin text-gray-600 dark:text-zinc-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
            <span className="font-medium text-gray-700 dark:text-zinc-200">
              Redirecting...
            </span>
          </div>
        ) : (
          <>
            <FcGoogle className="text-xl" />
            <span className="font-medium text-gray-700 dark:text-zinc-200">
              Continue with Google
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default SocialLogin;
