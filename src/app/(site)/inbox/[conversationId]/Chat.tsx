"use client";

import React from "react";

const messages = [
  { id: 1, sender: "ai", text: "Hello 👋 How can I help you today?" },
  { id: 2, sender: "user", text: "I want to design a chat UI." },
  { id: 3, sender: "ai", text: "Sure! Let's build a clean one." },
  { id: 4, sender: "user", text: "Header and input should be fixed." },
  { id: 5, sender: "ai", text: "No problem 👍" },
];

const Chat = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* HEADER */}
      <header className="h-14 shrink-0 border-b bg-white flex items-center px-4 font-semibold">
        Chat Assistant
      </header>

      {/* MESSAGE LIST (SCROLLABLE) */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${
              msg.sender === "user"
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-white border"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </main>

      {/* INPUT (FIXED) */}
      <footer className="h-16 shrink-0 border-t bg-white flex items-center gap-2 px-4">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm">
          Send
        </button>
      </footer>
    </div>
  );
};

export default Chat;
