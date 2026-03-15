"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Globe, Mail, Moon, Sun, Laptop } from "lucide-react";
import { toast } from "sonner";

import { updatePreferencesAction } from "@/actions/preferenceActions";
import SettingsCard from "@/components/settings/SettingsCard";
import { Switch } from "@/components/ui/switch";
import {
  CURRENCY_LABELS,
  getCurrencyCookieValue,
  isSupportedCurrency,
  SUPPORTED_CURRENCIES,
  setCurrencyCookie,
} from "@/lib/currency/currencyConfig";
import { PreferencesInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCurrencyStore } from "@/stores/useCurrencyStore";

type Props = {
  preferences: PreferencesInput | null;
};

export default function PreferencesSection({ preferences }: Props) {
  const { currency, setCurrency } = useCurrencyStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [emailPrefs, setEmailPrefs] = useState({
    emailOrderUpdates: preferences?.emailOrderUpdates ?? true,
    emailWalletAlerts: preferences?.emailWalletAlerts ?? true,
    emailPromotions: preferences?.emailPromotions ?? false,
    emailRecommendations: preferences?.emailRecommendations ?? false,
  });

  useEffect(() => {
    setMounted(true);

    const cookieCurrency = getCurrencyCookieValue();

    if (cookieCurrency) {
      setCurrency(cookieCurrency);
    } else if (isSupportedCurrency(preferences?.currency)) {
      setCurrency(preferences.currency);
      setCurrencyCookie(preferences.currency);
    }

    if (preferences?.theme) {
      setTheme(preferences.theme);
    }
  }, [preferences, setCurrency, setTheme]);

  if (!mounted) return null;

  const onToggle = async (key: keyof PreferencesInput, value: boolean) => {
    try {
      setEmailPrefs((p) => ({ ...p, [key]: value }));
      await updatePreferencesAction({ [key]: value });
    } catch {
      setEmailPrefs((p) => ({ ...p, [key]: value }));
      toast.error("Failed to save preference");
    }
  };

  return (
    <SettingsCard title="Preferences">
      <div className="space-y-10">
        <div className="flex items-start gap-4">
          <Globe className="w-5 h-5 text-[var(--brand-blue)]" />
          <div className="flex-1">
            <p className="font-medium">Currency</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Choose how prices are displayed across NexaMart.
            </p>

            <select
              value={currency}
              onChange={(event) => {
                const value = event.target.value;
                if (!isSupportedCurrency(value)) {
                  return;
                }

                setCurrency(value);
                setCurrencyCookie(value);
                updatePreferencesAction({ currency: value });
              }}
              className="
                mt-2 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900
                focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]
                dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100
              "
            >
              {SUPPORTED_CURRENCIES.map((supportedCurrency) => (
                <option key={supportedCurrency} value={supportedCurrency}>
                  {supportedCurrency} - {CURRENCY_LABELS[supportedCurrency]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Mail className="w-5 h-5 text-[var(--brand-blue)]" />
          <div className="flex-1 space-y-4">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Control which emails you receive from NexaMart.
              </p>
            </div>

            <PreferenceRow
              label="Order & Delivery Updates"
              description="Order confirmations, shipping and delivery updates."
              checked={emailPrefs.emailOrderUpdates}
              onChange={(value) => onToggle("emailOrderUpdates", value)}
            />

            <PreferenceRow
              label="Wallet & Payment Alerts"
              description="Wallet funding, payments, refunds and withdrawals."
              checked={emailPrefs.emailWalletAlerts}
              onChange={(value) => onToggle("emailWalletAlerts", value)}
            />

            <PreferenceRow
              label="Promotions & Deals"
              description="Discounts, sales, special offers."
              checked={emailPrefs.emailPromotions}
              onChange={(value) => onToggle("emailPromotions", value)}
            />

            <PreferenceRow
              label="Product Recommendations"
              description="Personalized product suggestions."
              checked={emailPrefs.emailRecommendations}
              onChange={(value) => onToggle("emailRecommendations", value)}
            />

            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <p className="font-medium text-sm">Security Alerts</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Password changes and suspicious activity (always enabled).
                </p>
              </div>
              <Switch checked disabled />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Moon className="w-5 h-5 text-[var(--brand-blue)]" />
          <div className="flex-1">
            <p className="font-medium">Appearance</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Choose how NexaMart looks on your device.
            </p>

            <div className="mt-3 grid max-w-sm grid-cols-3 gap-2">
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
                        : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900",
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
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 dark:border-zinc-800">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-gray-500 dark:text-zinc-400">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
