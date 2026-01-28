"use client";

import { useState } from "react";
import AccountSection from "./_components/AccountSection";
import AddressSection from "./_components/AddressSection";
import PreferencesSection from "./_components/PreferencesSection";
import SecuritySection from "./_components/SecuritySection";
import SettingsSidebar from "./_components/SettingsSidebar";
import WalletSection from "./_components/WalletSection";
import SettingsMobileNav from "./_components/SettingsMobileNav";

export default function SettingsPage() {
  const [active, setActive] = useState("account");

  return (
    <div className="min-h-screen bg-background">
      {/* MOBILE NAV */}
      <SettingsMobileNav active={active} onChange={setActive} />

      <div className="max-w-6xl mx-auto flex gap-8 px-4 py-12">
        {/* DESKTOP SIDEBAR */}
        <SettingsSidebar active={active} onChange={setActive} />

        {/* CONTENT */}
        <main className="flex-1 space-y-6 min-w-0">
          {active === "account" && <AccountSection />}
          {active === "addresses" && <AddressSection />}
          {active === "wallet" && <WalletSection />}
          {active === "preferences" && <PreferencesSection />}
          {active === "security" && <SecuritySection />}
        </main>
      </div>
    </div>
  );
}
