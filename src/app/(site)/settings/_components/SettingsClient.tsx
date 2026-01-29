"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Address } from "@/lib/types";
import AccountSection from "./AccountSection";
import AddressSection from "./AddressSection";
import PreferencesSection from "./PreferencesSection";
import SecuritySection from "./SecuritySection";
import SettingsMobileNav from "./SettingsMobileNav";
import SettingsSidebar from "./SettingsSidebar";
import WalletSection from "./WalletSection";

const contentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function SettingsClient({
  addresses,
}: {
  addresses: Address[];
}) {
  const [active, setActive] = useState("account");

  return (
    <div className="min-h-screen bg-background py-4">
      <SettingsMobileNav active={active} onChange={setActive} />

      <div className="max-w-6xl mx-auto flex gap-8 px-4 py-12">
        <SettingsSidebar active={active} onChange={setActive} />

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {active === "account" && <AccountSection />}
              {active === "addresses" && (
                <AddressSection addresses={addresses} />
              )}
              {active === "wallet" && <WalletSection />}
              {active === "preferences" && <PreferencesSection />}
              {active === "security" && <SecuritySection />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
