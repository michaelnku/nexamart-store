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
        <div className="flex-grow border-t border-gray-300" />
        <span className="mx-3 text-gray-500 text-sm">or</span>
        <div className="flex-grow border-t border-gray-300" />
      </div>

      <button
        type="button"
        onClick={() => loginSocial("google")}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-lg transition ${
          loading ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-100"
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-gray-600"
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
            <span className="text-gray-700 font-medium">Redirecting...</span>
          </div>
        ) : (
          <>
            <FcGoogle className="text-xl" />
            <span className="text-gray-700 font-medium">
              Continue with Google
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default SocialLogin;
