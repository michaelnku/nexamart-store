"use client";

import { ChatShell } from "./ChatShell";
import { useAutoScroll } from "./useAutoScroll";
import { useState } from "react";

const messagesMock = [
  { id: 1, sender: "ai", text: "Hello 👋" },
  { id: 2, sender: "user", text: "This feels like ChatGPT now." },
  { id: 3, sender: "ai", text: "Exactly." },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(messagesMock);
  const { containerRef, bottomRef } = useAutoScroll(messages);

  return (
    <ChatShell
      sidebar={
        <div className="h-14 border-b px-4 flex items-center font-semibold">
          Chats
        </div>
      }
      header={
        <div className="h-14 border-b px-4 flex items-center font-semibold bg-white">
          Chat with AI
        </div>
      }
      messages={
        <div ref={containerRef} className="px-4 py-3 space-y-3 bg-gray-100">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${
                m.sender === "user"
                  ? "ml-auto bg-blue-500 text-white"
                  : "mr-auto bg-white border"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      }
      input={
        <footer className="border-t bg-white px-4 py-2 pb-[env(safe-area-inset-bottom)] flex gap-2">
          <input
            className="flex-1 border rounded-md px-3 py-2 text-sm"
            placeholder="Type a message..."
          />
          <button
            onClick={() =>
              setMessages((m) => [
                ...m,
                {
                  id: Date.now(),
                  sender: "user",
                  text: "New message 🚀",
                },
              ])
            }
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
          >
            Send
          </button>
        </footer>
      }
    />
  );
}
