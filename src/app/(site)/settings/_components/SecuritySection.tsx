"use client";

import { useState } from "react";
import SettingsCard from "@/components/settings/SettingsCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Lock, ShieldCheck, LogOut, KeyRound } from "lucide-react";
import { signOut } from "next-auth/react";
import PasswordForm from "@/components/auth/PasswordForm";

export default function SecuritySection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SettingsCard title="Security">
        <div className="space-y-6">
          {/* PASSWORD */}
          <div className="flex items-start gap-4">
            <KeyRound className="w-5 h-5 text-[var(--brand-blue)]" />

            <div className="flex-1">
              <p className="font-medium">Password</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Change your password to keep your account secure.
              </p>

              <Button
                variant="outline"
                className="
                  mt-2
                  border-[var(--brand-blue)]
                  text-[var(--brand-blue)]
                  hover:bg-[var(--brand-blue)]
                  hover:text-white
                  dark:border-[var(--brand-blue)]/70
                  dark:hover:bg-[var(--brand-blue)]/90
                  transition
                "
                onClick={() => setOpen(true)}
              >
                Change Password
              </Button>
            </div>
          </div>

          {/* 2FA */}
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 text-[var(--brand-blue)]" />
            <div className="flex-1">
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Add an extra layer of security to your account.
              </p>

              <Button variant="outline" className="mt-2" disabled>
                Coming soon
              </Button>
            </div>
          </div>

          {/* SESSIONS */}
          <div className="flex items-start gap-4">
            <Lock className="w-5 h-5 text-[var(--brand-blue)]" />
            <div className="flex-1">
              <p className="font-medium">Active Sessions</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Manage devices currently logged into your account.
              </p>

              <Button variant="outline" className="mt-2" disabled>
                View sessions
              </Button>
            </div>
          </div>

          {/* SIGN OUT */}
          <div className="border-t pt-4 dark:border-zinc-800">
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

      {/* CHANGE PASSWORD MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md dark:border-zinc-800 dark:bg-neutral-950">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>

          <PasswordForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
