"use client";

import React from "react";
import { Message } from "@/types";
import { Check, CheckCheck, Clock } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  isGroup: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
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
  isFirstInGroup = true,
  isLastInGroup = true,
}) => {
  const timeText = formatMessageTime(message.created_at);

  // Signal-style corner radius: tail only on last message in a group
  const outgoingRadius = isLastInGroup ? "rounded-[18px] rounded-br-[4px]" : "rounded-[18px]";
  const incomingRadius = isLastInGroup ? "rounded-[18px] rounded-bl-[4px]" : "rounded-[18px]";

  // Tighter spacing for consecutive messages from same sender
  const spacing = isLastInGroup ? "mb-2" : "mb-[3px]";

  return (
    <div
      className={`flex flex-col ${spacing} ${
        isOutgoing ? "items-end" : "items-start"
      } group select-text`}
    >
      {/* Sender display name in group chats for incoming messages */}
      {!isOutgoing && isGroup && message.sender && isFirstInGroup && (
        <span className="text-[11px] font-semibold text-[#2C6BED] dark:text-blue-400 ml-3 mb-0.5 select-none">
          {message.sender.display_name}
        </span>
      )}

      {/* Bubble container */}
      <div
        className={`relative max-w-[75%] sm:max-w-[65%] md:max-w-[55%] px-3 py-[6px] text-[14px] leading-[20px] ${
          isOutgoing
            ? `bg-[#2C6BED] text-white ${outgoingRadius}`
            : `bg-[#e9ecf5] dark:bg-[#2a2a2e] text-zinc-900 dark:text-zinc-100 ${incomingRadius}`
        }`}
      >
        {/* Message body with inline timestamp */}
        <p className="whitespace-pre-wrap break-words">
          {message.content}
          {/* Invisible spacer to make room for the floating timestamp */}
          <span className="inline-block w-[70px]" aria-hidden="true">
            &nbsp;
          </span>
        </p>

        {/* Floating timestamp and delivery receipts */}
        <span
          className={`float-right -mt-[18px] ml-2 flex items-center gap-0.5 text-[10px] select-none whitespace-nowrap ${
            isOutgoing ? "text-white/70" : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          <span suppressHydrationWarning>{timeText}</span>

          {isOutgoing && (
            <span className="flex-shrink-0 flex items-center" title={`Status: ${message.status}`}>
              {message.status === "sending" ? (
                <Clock className="w-[13px] h-[13px] text-white/50 animate-pulse" />
              ) : message.status === "read" ? (
                <CheckCheck className="w-[14px] h-[14px] text-[#a5d0ff]" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="w-[14px] h-[14px] text-white/80" />
              ) : (
                <Check className="w-[14px] h-[14px] text-white/60" />
              )}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
