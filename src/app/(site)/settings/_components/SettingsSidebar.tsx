"use client";

import { settingsNav } from "@/constants/settingsNav";

type Props = {
  active: string;
  onChange: (key: string) => void;
};

export default function SettingsSidebar({ active, onChange }: Props) {
  return (
    <aside className="hidden md:block w-64 shrink-0 border-r bg-background hidden md:block">
      <ul className="p-4 space-y-1">
        {settingsNav.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.key}>
              <button
                onClick={() => onChange(item.key)}
                className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-md text-sm font-medium transition
                  ${
                    active === item.key
                      ? "bg-[#3c9ee0]/10 text-[#3c9ee0]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
