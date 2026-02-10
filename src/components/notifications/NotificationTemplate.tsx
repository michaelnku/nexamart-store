"use client";

import Link from "next/link";
import React from "react";
import { NotificationDTO } from "@/lib/types";

type NotificationVariant = "info" | "success" | "warning" | "error";

type NotificationTemplateProps = {
  notification: NotificationDTO;
  time?: string;
  href?: string;
  variant?: NotificationVariant;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

const VARIANT_STYLES: Record<NotificationVariant, string> = {
  info: "bg-[#eaf5ff] text-[#1f74c7] border-[#cfe6ff]",
  success: "bg-[#e8f7ee] text-[#1e7a4f] border-[#cdeedb]",
  warning: "bg-[#fff5e6] text-[#a66300] border-[#ffe2bf]",
  error: "bg-[#fdeceb] text-[#b3261e] border-[#f7c9c6]",
};

const NotificationTemplate = ({
  notification,
  time,
  href,
  variant = "info",
  icon,
  actionLabel,
  onAction,
}: NotificationTemplateProps) => {
  const containerClass = notification.read
    ? "border border-gray-200 bg-white"
    : "border border-[#cfe6ff] bg-[#f7fbff]";

  return (
    <div
      className={`flex items-start gap-4 rounded-xl p-4 shadow-sm transition hover:shadow-md ${containerClass}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border ${VARIANT_STYLES[variant]}`}
      >
        {icon ?? (
          <span className="text-xs font-semibold">
            {variant.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-gray-900">
            {notification.title}
          </h4>
          {time ? (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {time}
            </span>
          ) : null}
        </div>

        {notification.message ? (
          <p className="text-sm text-gray-600 leading-relaxed">
            {notification.message}
          </p>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          {href ? (
            <Link
              href={href}
              className="text-sm font-medium text-[var(--brand-blue)] hover:underline"
            >
              View details
            </Link>
          ) : null}

          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>

      {!notification.read ? (
        <span className="mt-1 h-2 w-2 rounded-full bg-[#3c9ee0]" />
      ) : null}
    </div>
  );
};

export default NotificationTemplate;
