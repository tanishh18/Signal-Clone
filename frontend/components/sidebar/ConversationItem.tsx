"use client";

import React from "react";
import { Conversation } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Check, CheckCheck } from "lucide-react";

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
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

  // Determine online state: for direct chats, check other member's online state
  const otherMember = conversation.members.find((m) => m.user_id !== currentUserId);
  const isOnline = !isGroup && otherMember?.user.is_online;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors relative outline-none focus-visible:ring-1 focus-visible:ring-[#2C6BED] focus-visible:ring-inset ${
        isSelected
          ? "bg-[#2C6BED]/10 dark:bg-[#2C6BED]/15"
          : "hover:bg-zinc-50 dark:hover:bg-[#1e1e1e]"
      }`}
    >
      <Avatar
        name={conversation.name || "Chat"}
        src={conversation.avatar_url}
        size="lg"
        isGroup={isGroup}
        isOnline={isOnline}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5">
          <span
            className={`font-semibold text-[13px] truncate ${
              isSelected
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-800 dark:text-zinc-200"
            }`}
          >
            {conversation.name || "Conversation"}
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal ml-2 flex-shrink-0" suppressHydrationWarning>
            {timeText}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0 text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {isOutgoing && latest && (
              <span className="flex-shrink-0 text-zinc-400 dark:text-zinc-500">
                {latest.status === "read" ? (
                  <CheckCheck className="w-3.5 h-3.5 text-[#2C6BED]" />
                ) : latest.status === "delivered" ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </span>
            )}
            <span className="truncate">
              {latest ? (
                <>
                  {isGroup && latest.sender && !isOutgoing && (
                    <span className="font-medium text-zinc-600 dark:text-zinc-300 mr-1">
                      {latest.sender.display_name.split(" ")[0]}:
                    </span>
                  )}
                  {latest.content}
                </>
              ) : (
                <span className="italic text-zinc-400">No messages yet</span>
              )}
            </span>
          </div>

          {conversation.unread_count > 0 && (
            <span className="flex-shrink-0 ml-1.5 px-1.5 py-0.5 min-w-[18px] text-center text-[10px] font-bold text-white bg-[#2C6BED] rounded-full">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
