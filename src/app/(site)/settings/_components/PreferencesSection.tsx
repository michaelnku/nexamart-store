"use client";

import SettingsCard from "@/components/settings/SettingsCard";
import { Switch } from "@/components/ui/switch";
import { useCurrencyStore } from "@/stores/useCurrencyStore";
import { Globe, Mail, Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { updatePreferencesAction } from "@/actions/preferenceActions";
import { PreferencesInput } from "@/lib/types";

export default function PreferencesSection() {
  const { currency, setCurrency } = useCurrencyStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [emailPrefs, setEmailPrefs] = useState({
    emailOrderUpdates: true,
    emailWalletAlerts: true,
    emailPromotions: false,
    emailRecommendations: false,
  });

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const onToggle = (key: keyof PreferencesInput, value: boolean) => {
    setEmailPrefs((p) => ({ ...p, [key]: value }));
    updatePreferencesAction({ [key]: value });
  };

  return (
    <SettingsCard title="Preferences">
      <div className="space-y-10">
        {/* ================= CURRENCY ================= */}
        <div className="flex items-start gap-4">
          <Globe className="w-5 h-5 text-[var(--brand-blue)]" />
          <div className="flex-1">
            <p className="font-medium">Currency</p>
            <p className="text-sm text-gray-500">
              Choose how prices are displayed across NexaMart.
            </p>

            <select
              value={currency}
              onChange={(e) => {
                const value = e.target.value;
                setCurrency(value);
                updatePreferencesAction({ currency: value });
              }}
              className="
                mt-2 w-full max-w-xs rounded-md border px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]
              "
            >
              <option value="USD">USD – US Dollar</option>
              <option value="NGN">NGN – Nigerian Naira</option>
              <option value="GBP">GBP – Pounds Sterling</option>
              <option value="EUR">EUR – Euro</option>
            </select>
          </div>
        </div>

        {/* ================= EMAIL ================= */}
        <div className="flex items-start gap-4">
          <Mail className="w-5 h-5 text-[var(--brand-blue)]" />
          <div className="flex-1 space-y-4">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">
                Control which emails you receive from NexaMart.
              </p>
            </div>

            <PreferenceRow
              label="Order & Delivery Updates"
              description="Order confirmations, shipping and delivery updates."
              checked={emailPrefs.emailOrderUpdates}
              onChange={(v) => onToggle("emailOrderUpdates", v)}
            />

            <PreferenceRow
              label="Wallet & Payment Alerts"
              description="Wallet funding, payments, refunds and withdrawals."
              checked={emailPrefs.emailWalletAlerts}
              onChange={(v) => onToggle("emailWalletAlerts", v)}
            />

            <PreferenceRow
              label="Promotions & Deals"
              description="Discounts, sales, special offers."
              checked={emailPrefs.emailPromotions}
              onChange={(v) => onToggle("emailPromotions", v)}
            />

            <PreferenceRow
              label="Product Recommendations"
              description="Personalized product suggestions."
              checked={emailPrefs.emailRecommendations}
              onChange={(v) => onToggle("emailRecommendations", v)}
            />

            {/* SECURITY (LOCKED) */}
            <div className="flex items-center justify-between rounded-lg border bg-gray-50 dark:bg-background p-3">
              <div>
                <p className="font-medium text-sm">Security Alerts</p>
                <p className="text-xs text-gray-500">
                  Password changes and suspicious activity (always enabled).
                </p>
              </div>
              <Switch checked disabled />
            </div>
          </div>
        </div>

        {/* ================= THEME ================= */}
        <div className="flex items-start gap-4">
          <Moon className="w-5 h-5 text-[var(--brand-blue)]" />
          <div className="flex-1">
            <p className="font-medium">Appearance</p>
            <p className="text-sm text-gray-500">
              Choose how NexaMart looks on your device.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2 max-w-sm">
              {[
                { key: "light", label: "Light", icon: Sun },
                { key: "dark", label: "Dark", icon: Moon },
                { key: "system", label: "System", icon: Laptop },
              ].map(({ key, label, icon: Icon }) => {
                const active =
                  theme === key ||
                  (theme === "system" && resolvedTheme === key);

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme(key);
                      updatePreferencesAction({ theme: key as any });
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
                      active
                        ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
