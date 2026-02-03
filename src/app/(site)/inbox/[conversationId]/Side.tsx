"use client";

import React, { useState } from "react";

const mockConversations = [
  {
    id: "1",
    title: "Chat with AI",
    lastMessage: "Sure! Let's build a clean one.",
    updatedAt: "2m ago",
    unread: true,
  },
  {
    id: "2",
    title: "Project Help",
    lastMessage: "Use flex-1 and overflow-y-auto.",
    updatedAt: "10m ago",
    unread: false,
  },
  {
    id: "3",
    title: "Design Ideas",
    lastMessage: "Minimal UI works best.",
    updatedAt: "1h ago",
    unread: false,
  },
  {
    id: "4",
    title: "Random Chat",
    lastMessage: "Haha that makes sense 😂",
    updatedAt: "Yesterday",
    unread: false,
  },
];

const Side = () => {
  const [activeId, setActiveId] = useState("1");
  const [items, setItems] = useState(mockConversations);

  const clearAll = () => {
    setItems([]);
    setActiveId("");
  };

  const newConversation = () => {
    const newItem = {
      id: Date.now().toString(),
      title: "New Conversation",
      lastMessage: "Start chatting...",
      updatedAt: "now",
      unread: false,
    };

    setItems([newItem, ...items]);
    setActiveId(newItem.id);
  };

  return (
    <aside className="w-72 h-screen flex flex-col border-r bg-white">
      {/* HEADER */}
      <div className="h-14 shrink-0 border-b px-4 flex items-center justify-between">
        <h2 className="font-semibold">Messages</h2>
        <button
          onClick={newConversation}
          className="text-sm text-blue-600 hover:underline"
        >
          New
        </button>
      </div>

      {/* CONVERSATION LIST */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && (
          <p className="text-sm text-gray-400 p-4 text-center">
            No conversations
          </p>
        )}

        {items.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${
              activeId === c.id ? "bg-gray-100" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm truncate">{c.title}</span>
              <span className="text-xs text-gray-400">{c.updatedAt}</span>
            </div>

            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500 truncate max-w-[180px]">
                {c.lastMessage}
              </p>
              {c.unread && (
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="border-t p-3">
        <button
          onClick={clearAll}
          className="w-full text-sm text-red-500 hover:underline"
        >
          Clear all conversations
        </button>
      </div>
    </aside>
  );
};

export default Side;
