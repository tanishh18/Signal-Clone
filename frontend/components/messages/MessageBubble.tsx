"use client";

import React from "react";
import { Message } from "@/types";
import { Check, CheckCheck, Clock } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  isGroup: boolean;
  onReply?: (message: Message) => void;
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOutgoing,
  isGroup,
}) => {
  const timeText = formatMessageTime(message.created_at);

  return (
    <div
      className={`flex flex-col mb-1.5 ${
        isOutgoing ? "items-end" : "items-start"
      } group select-text`}
    >
      {/* Sender display name in group chats for incoming messages */}
      {!isOutgoing && isGroup && message.sender && (
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 ml-3 mb-0.5 select-none">
          {message.sender.display_name}
        </span>
      )}

      {/* Bubble container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-3.5 py-2 text-sm shadow-sm transition-all ${
          isOutgoing
            ? "bg-[#2C6BED] text-white rounded-2xl rounded-tr-sm"
            : "bg-[#f1f3f5] dark:bg-[#282828] text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-tl-sm"
        }`}
      >
        {/* Message body */}
        <p className="whitespace-pre-wrap break-words leading-relaxed text-[13.5px]">
          {message.content}
        </p>

        {/* Timestamp and delivery receipts */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
            isOutgoing ? "text-white/80" : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          <span suppressHydrationWarning>{timeText}</span>

          {isOutgoing && (
            <span className="flex-shrink-0 flex items-center" title={`Status: ${message.status}`}>
              {message.status === "sending" ? (
                <Clock className="w-3 h-3 text-white/60 animate-pulse" />
              ) : message.status === "read" ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#93c5fd] drop-shadow-xs" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="w-3.5 h-3.5 text-white/90" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white/70" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
