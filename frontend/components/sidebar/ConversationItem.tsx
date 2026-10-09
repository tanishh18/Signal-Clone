"use client";

import React from "react";
import { Conversation } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Check, CheckCheck, Clock } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: number;
  onClick: () => void;
}

function formatConversationTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Now";
  if (diffMins < 60) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function DeliveryStatus({ status }: { status?: string }) {
  if (!status) return null;
  if (status === "sending") return <Clock className="w-3 h-3 text-zinc-500" />;
  if (status === "read") return <CheckCheck className="w-3 h-3 text-[#2C6BED]" />;
  if (status === "delivered") return <CheckCheck className="w-3 h-3 text-zinc-400" />;
  if (status === "sent") return <Check className="w-3 h-3 text-zinc-400" />;
  return null;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  currentUserId,
  onClick,
}) => {
  const isGroup = conversation.type === "group";
  const latest = conversation.latest_message;
  const timeText = formatConversationTime(latest?.created_at || conversation.updated_at);
  const isOutgoing = latest?.sender_id === currentUserId;
  const hasUnread = (conversation.unread_count || 0) > 0;

  // Determine online state: for direct chats, check other member's online state
  const otherMember = conversation.members.find((m) => m.user_id !== currentUserId);
  const isOnline = !isGroup && otherMember?.user.is_online;

  // Build preview text
  const buildPreview = () => {
    if (!latest) return null;
    if (latest.message_type === "system") return latest.content;
    const prefix = isGroup && latest.sender && !isOutgoing
      ? `${latest.sender.display_name.split(" ")[0]}: `
      : isOutgoing ? "You: " : "";
    return prefix + (latest.content || "");
  };
  const preview = buildPreview();

  return (
    <div className="px-1.5 py-0.5">
      <button
        onClick={onClick}
        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2.5 transition-colors relative outline-none focus-visible:ring-1 focus-visible:ring-[#2C6BED] ${
          isSelected
            ? "bg-[#2a2a2a] text-white"
            : "hover:bg-[#1e1e1e] text-zinc-300"
        }`}
      >
        <div className="flex-shrink-0">
          <Avatar
            name={conversation.name || "Chat"}
            src={conversation.avatar_url}
            size="md"
            isGroup={isGroup}
            isOnline={isOnline}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: name + time */}
          <div className="flex items-baseline justify-between gap-1">
            <span
              className={`font-semibold text-[13px] truncate ${
                isSelected ? "text-white" : "text-zinc-100"
              }`}
            >
              {conversation.name || "Conversation"}
            </span>
            <span
              className={`text-[11px] font-normal flex-shrink-0 ml-1 ${
                hasUnread && !isSelected ? "text-[#2C6BED] font-semibold" : "text-zinc-500"
              }`}
              suppressHydrationWarning
            >
              {timeText}
            </span>
          </div>

          {/* Bottom row: preview + unread badge */}
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {isOutgoing && latest && (
                <span className="flex-shrink-0">
                  <DeliveryStatus status={latest.status} />
                </span>
              )}
              <span
                className={`text-[12px] truncate leading-tight ${
                  hasUnread && !isSelected
                    ? "text-zinc-200 font-medium"
                    : "text-zinc-500"
                }`}
              >
                {preview || <span className="italic text-zinc-600 font-normal">No messages yet</span>}
              </span>
            </div>

            {hasUnread && (
              <span className="flex-shrink-0 ml-1.5 min-w-[18px] h-[18px] px-1.5 text-center text-[10px] font-bold text-white bg-[#2C6BED] rounded-full flex items-center justify-center">
                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};
