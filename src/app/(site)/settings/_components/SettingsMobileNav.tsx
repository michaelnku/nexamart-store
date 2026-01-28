"use client";

import { settingsNav } from "@/constants/settingsNav";

type Props = {
  active: string;
  onChange: (key: string) => void;
};

export default function SettingsMobileNav({ active, onChange }: Props) {
  return (
    <div className="md:hidden px-2 sticky top-0 z-20 bg-background border-b">
      <div className="flex gap-2 overflow-x-auto px-2 py-3 scrollbar-hide">
        {settingsNav.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition
              ${
                active === item.key
                  ? "bg-[#3c9ee0] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
