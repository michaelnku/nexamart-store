"use client";

import SettingsCard from "@/components/settings/SettingsCard";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck, LogOut, KeyRound } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SecuritySection() {
  return (
    <SettingsCard title="Security">
      <div className="space-y-6">
        {/* PASSWORD */}
        <div className="flex items-start gap-4">
          <KeyRound className="w-5 h-5 text-[#3c9ee0]" />
          <div className="flex-1">
            <p className="font-medium">Password</p>
            <p className="text-sm text-gray-500">
              Change your password to keep your account secure.
            </p>

            <Button variant="outline" className="mt-2 cursor-not-allowed">
              Change Password
            </Button>
          </div>
        </div>

        {/* 2FA */}
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-5 h-5 text-[#3c9ee0]" />
          <div className="flex-1">
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-gray-500">
              Add an extra layer of security to your account.
            </p>

            <Button
              variant="outline"
              className="mt-2 cursor-not-allowed"
              disabled
            >
              Coming soon
            </Button>
          </div>
        </div>

        {/* SESSIONS */}
        <div className="flex items-start gap-4">
          <Lock className="w-5 h-5 text-[#3c9ee0]" />
          <div className="flex-1">
            <p className="font-medium">Active Sessions</p>
            <p className="text-sm text-gray-500">
              Manage devices currently logged into your account.
            </p>

            <Button
              variant="outline"
              className="mt-2 cursor-not-allowed"
              disabled
            >
              View sessions
            </Button>
          </div>
        </div>

        {/* SIGN OUT */}
        <div className="border-t pt-4">
          <Button
            variant="destructive"
            className="w-full flex items-center gap-2"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4" />
            Sign out of all sessions
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}
