"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const searchVariants = cva(
  "flex items-center w-full focus-within:ring-2 transition",
  {
    variants: {
      variant: {
        site: "h-11 rounded-md bg-white focus-within:ring-[#3c9ee0]",
        dashboard:
          "py-[5px] rounded-full border shadow focus-within:ring-[var(--brand-blue)]",
      },
    },
    defaultVariants: {
      variant: "site",
    },
  }
);

type SearchInputProps = VariantProps<typeof searchVariants> & {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  variant,
}: SearchInputProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn(searchVariants({ variant }))}
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "border-none focus-visible:ring-0",
          variant === "site" ? "rounded-none text-black" : "text-[15px]"
        )}
      />

      <Button
        type="submit"
        className={cn(
          "shrink-0",
          variant === "site"
            ? "h-full rounded-none bg-[#3c9ee0] hover:bg-[#318bc4]"
            : "rounded-full bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)]"
        )}
      >
        <Search className="w-4 h-4" />
      </Button>
    </form>
  );
}
