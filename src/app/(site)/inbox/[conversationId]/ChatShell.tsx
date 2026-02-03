"use client";

import React from "react";

type ChatShellProps = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  messages: React.ReactNode;
  input: React.ReactNode;
};

export function ChatShell({
  sidebar,
  header,
  messages,
  input,
}: ChatShellProps) {
  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* SIDEBAR */}
      <aside className="w-72 shrink-0 border-r bg-white">{sidebar}</aside>

      {/* CHAT COLUMN */}
      <section className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="shrink-0">{header}</div>

        {/* SCROLL AREA */}
        <div className="flex-1 overflow-y-auto">{messages}</div>

        {/* INPUT */}
        <div className="shrink-0">{input}</div>
      </section>
    </div>
  );
}
