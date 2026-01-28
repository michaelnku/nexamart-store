"use client";

import { Card } from "../ui/card";

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function SettingsCard({ title, children }: Props) {
  return (
    <Card className="rounded-xl shadow-sm">
      <div className="px-6 pt-5 pb-2">
        <h2 className="text-lg font-semibold text-[#3c9ee0]">{title}</h2>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </Card>
  );
}
