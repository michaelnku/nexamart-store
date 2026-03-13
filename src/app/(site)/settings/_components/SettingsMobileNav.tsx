"use client";

import { settingsNav } from "@/constants/settingsNav";

type Props = {
  active: string;
  onChange: (key: string) => void;
};

export default function SettingsMobileNav({ active, onChange }: Props) {
  return (
    <div className="sticky top-0 z-20 border-b bg-background px-2 dark:border-zinc-800 md:hidden">
      <div className="flex gap-2 overflow-x-auto px-2 py-3 scrollbar-hide">
        {settingsNav.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition
                ${
                  active === item.key
                    ? "bg-[#3c9ee0] text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
