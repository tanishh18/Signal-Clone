"use client";

import React, { useState } from "react";
import { Conversation, User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Video, Search, MoreHorizontal, ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: User;
  onBack: () => void;
  onOpenDetails: () => void;
  onSearchInChat?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUser,
  onBack,
  onOpenDetails,
  onSearchInChat,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isGroup = conversation.type === "group";
  const otherMember = conversation.members.find((m) => m.user_id !== currentUser.id);
  const isOnline = !isGroup && otherMember?.user.is_online;

  const showPlaceholderToast = (featureName: string) => {
    setToastMessage(`${featureName} is coming soon`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <header className="h-[60px] px-4 py-2 bg-[#181818] border-b border-[#242424] flex items-center justify-between select-none relative z-10 flex-shrink-0">
      {/* Toast notification for placeholders */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#282828] text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg pointer-events-none transition-all z-50 border border-[#333333]">
          {toastMessage}
        </div>
      )}

      {/* Left section: Back button + Avatar + Details */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white hover:bg-[#242424] rounded-full transition-colors"
          title="Back to conversations"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenDetails}
          className="flex items-center gap-3 text-left min-w-0 group focus:outline-none"
        >
          <Avatar
            name={conversation.name || "Chat"}
            src={conversation.avatar_url}
            size="md"
            isGroup={isGroup}
            isOnline={isOnline}
          />
          <div className="min-w-0">
            <h2 className="font-semibold text-sm text-zinc-100 truncate group-hover:text-[#2C6BED] transition-colors">
              {conversation.name || "Conversation"}
            </h2>
            <p
              className={`text-[11px] truncate ${
                isOnline
                  ? "text-emerald-400 font-medium"
                  : "text-zinc-400"
              }`}
            >
              {isGroup
                ? `${conversation.members.length} members`
                : isOnline
                ? "Online"
                : otherMember?.user.last_seen
                ? "Offline"
                : ""}
            </p>
          </div>
        </button>
      </div>

      {/* Right section matching Screenshots 4 & 5: Video call, Search in chat, More options */}
      <div className="flex items-center gap-1 text-zinc-400">
        <button
          onClick={() => showPlaceholderToast("Video calling")}
          className="p-2 rounded-lg hover:bg-[#242424] hover:text-zinc-100 transition-colors"
          title="Video Call"
          aria-label="Video Call"
        >
          <Video className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            if (onSearchInChat) onSearchInChat();
            else showPlaceholderToast("Search in chat");
          }}
          className="p-2 rounded-lg hover:bg-[#242424] hover:text-zinc-100 transition-colors"
          title="Search in conversation"
          aria-label="Search in conversation"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenDetails}
          className="p-2 rounded-lg hover:bg-[#242424] hover:text-zinc-100 transition-colors"
          title="Conversation options"
          aria-label="Conversation options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
