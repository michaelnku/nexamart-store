"use client";

const settingsNav = [
  { key: "account", label: "Account Information" },
  { key: "addresses", label: "Addresses" },
  { key: "wallet", label: "Payments & Wallet" },
  { key: "preferences", label: "Preferences" },
  { key: "security", label: "Security" },
];

export default function SettingsSidebar({
  active,
  onChange,
}: {
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <aside className="w-64 shrink-0 border-r bg-white hidden md:block">
      <ul className="p-4 space-y-1">
        {settingsNav.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => onChange(item.key)}
              className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition
                ${
                  active === item.key
                    ? "bg-[#3c9ee0]/10 text-[#3c9ee0]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
