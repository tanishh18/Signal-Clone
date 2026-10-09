"use client";

import React, { useState } from "react";
import { Message } from "@/types";
import { Check, CheckCheck, Clock, Pin } from "lucide-react";
import { MessageHoverActions } from "./MessageHoverActions";
import { MessageContextMenu } from "./MessageContextMenu";
import { ReactionPicker } from "./ReactionPicker";

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  isGroup: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  currentUserId?: number;
  searchHighlight?: string;
  onReply?: (message: Message) => void;
  onCopy?: (text: string) => void;
  onDelete?: (id: number) => void;
  onTogglePin?: (id: number) => void;
  onReact?: (id: number, emoji: string) => void;
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
  currentUserId,
  searchHighlight,
  onReply,
  onCopy,
  onDelete,
  onTogglePin,
  onReact,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReactionOpen, setIsReactionOpen] = useState(false);
  const timeText = formatMessageTime(message.created_at);

  // REFINEMENT 12: SYSTEM EVENT BUBBLES
  if (message.message_type === "system") {
    return (
      <div className="flex justify-center my-3 select-none">
        <span className="text-[11px] font-medium text-zinc-400 bg-[#1c1c1c] border border-[#262626] px-3 py-1 rounded-full shadow-xs">
          {message.content}
        </span>
      </div>
    );
  }

  const outgoingRadius = isLastInGroup ? "rounded-[18px] rounded-br-[4px]" : "rounded-[18px]";
  const incomingRadius = isLastInGroup ? "rounded-[18px] rounded-bl-[4px]" : "rounded-[18px]";
  const spacing = isLastInGroup ? "mb-2" : "mb-[3px]";

  const handleCopyText = () => {
    navigator.clipboard?.writeText(message.content);
    onCopy?.(message.content);
  };

  // Content rendering with keyword highlight
  const renderContent = () => {
    if (!searchHighlight || !searchHighlight.trim()) {
      return message.content;
    }
    const q = searchHighlight.trim().toLowerCase();
    const parts = message.content.split(new RegExp(`(${q})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q ? (
        <mark key={i} className="bg-amber-400 text-black px-0.5 rounded-xs">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className={`flex flex-col ${spacing} ${
        isOutgoing ? "items-end" : "items-start"
      } group select-text relative`}
    >
      {/* Sender display name in group chats for incoming messages */}
      {!isOutgoing && isGroup && message.sender && isFirstInGroup && (
        <span className="text-[11px] font-semibold text-[#2C6BED] dark:text-blue-400 ml-3 mb-0.5 select-none">
          {message.sender.display_name}
        </span>
      )}

      {/* Bubble container + Hover action bar */}
      <div className="relative group/bubble max-w-[75%] sm:max-w-[65%] md:max-w-[55%]">
        {/* Floating Hover Action Buttons */}
        <MessageHoverActions
          isOutgoing={isOutgoing}
          onCopy={handleCopyText}
          onReply={() => onReply?.(message)}
          onReact={() => setIsReactionOpen(!isReactionOpen)}
          onMore={() => setIsMenuOpen(!isMenuOpen)}
        />

        {/* Floating Quick Reaction Picker */}
        <ReactionPicker
          isOpen={isReactionOpen}
          onClose={() => setIsReactionOpen(false)}
          onSelectReaction={(emoji) => onReact?.(message.id, emoji)}
          isOutgoing={isOutgoing}
        />

        {/* Floating Context Menu */}
        <MessageContextMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onCopy={handleCopyText}
          onDelete={() => onDelete?.(message.id)}
          onPin={() => onTogglePin?.(message.id)}
          isPinned={Boolean(message.is_pinned)}
          isOutgoing={isOutgoing}
        />

        {/* Bubble itself */}
        <div
          className={`px-3 py-[6px] text-[14px] leading-[20px] shadow-xs relative ${
            isOutgoing
              ? `bg-[#2C6BED] text-white ${outgoingRadius}`
              : `bg-[#202020] text-zinc-100 ${incomingRadius} border border-[#262626]`
          }`}
        >
          {/* Pinned Icon Indicator */}
          {message.is_pinned && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400/90 mb-1 select-none font-medium">
              <Pin className="w-2.5 h-2.5 rotate-45" />
              <span>Pinned</span>
            </div>
          )}

          {/* Message body with inline timestamp space */}
          <p className="whitespace-pre-wrap break-words">
            {renderContent()}
            <span className="inline-block w-[65px]" aria-hidden="true">
              &nbsp;
            </span>
          </p>

          {/* Floating timestamp and delivery receipts */}
          <span
            className={`float-right -mt-[18px] ml-2 flex items-center gap-0.5 text-[10px] select-none whitespace-nowrap ${
              isOutgoing ? "text-white/70" : "text-zinc-400"
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

        {/* REFINEMENT 7: MESSAGE REACTION BADGES */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 select-none">
            {message.reactions.map((r, idx) => {
              const hasMine = currentUserId && (r.user_id === currentUserId || (r.users && r.users.includes(currentUserId)));
              return (
                <button
                  key={`${r.emoji}-${idx}`}
                  onClick={() => onReact?.(message.id, r.emoji)}
                  className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 transition-transform hover:scale-110 ${
                    hasMine
                      ? "bg-[#2C6BED]/20 border-[#2C6BED]/40 text-[#2C6BED]"
                      : "bg-[#242424] border-[#333333] text-zinc-300"
                  }`}
                  title={`${r.count || 1} reaction`}
                >
                  <span>{r.emoji}</span>
                  {(r.count || 1) > 1 && (
                    <span className="text-[10px] font-medium">{r.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
