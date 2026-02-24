"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrencyStore } from "@/stores/useCurrencyStore";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";

const currencies = ["USD", "NGN", "GBP", "EUR", "KES", "ZAR", "CAD"];

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:text-[#3c9ee0] text-gray-400 transition">
        <Globe className="w-4 h-4" /> {currency}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-32">
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c}
            onClick={() => setCurrency(c)}
            className={
              c === currency
                ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-semibold"
                : ""
            }
          >
            {c}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
