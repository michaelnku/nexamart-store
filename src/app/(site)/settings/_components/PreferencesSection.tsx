"use client";

import SettingsCard from "@/components/settings/SettingsCard";
import { Switch } from "@/components/ui/switch";
import { useCurrencyStore } from "@/stores/useCurrencyStore";
import { Globe, Mail, Moon } from "lucide-react";

const currencies = ["USD", "NGN", "GBP", "EUR", "KES", "ZAR", "CAD"];

export default function PreferencesSection() {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <SettingsCard title="Preferences">
      <div className="space-y-6">
        {/* CURRENCY */}
        <div className="flex items-start gap-4">
          <Globe className="w-5 h-5 text-[#3c9ee0]" />
          <div className="flex-1">
            <p className="font-medium">Currency</p>
            <p className="text-sm text-gray-500">
              Choose how prices are displayed across NexaMart.
            </p>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-2 border rounded-md px-3 py-2 text-sm"
            >
              <option value="USD">USD – US Dollar</option>
              <option value="NGN">NGN – Nigerian Naira</option>
              <option value="EUR">GBP – Pounds Sterling</option>
              <option value="EUR">EUR – Euro</option>
              <option value="EUR">CAD – Canadian Dollar</option>
              <option value="EUR">KES – Kenyan Shilling</option>
              <option value="EUR">ZAR – South African Rand</option>
            </select>
          </div>
        </div>

        {/* EMAIL NOTIFICATIONS */}
        <div className="flex items-start gap-4">
          <Mail className="w-5 h-5 text-[#3c9ee0]" />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">
                Receive updates about orders and deliveries.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        {/* THEME */}
        <div className="flex items-start gap-4">
          <Moon className="w-5 h-5 text-[#3c9ee0]" />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-gray-500">
                Automatically match your system theme.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
