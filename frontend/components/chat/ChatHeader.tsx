"use client";

import React, { useState } from "react";
import { Conversation, User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowLeft, Phone, Video, Info } from "lucide-react";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: User;
  onBack: () => void;
  onOpenDetails: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUser,
  onBack,
  onOpenDetails,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isGroup = conversation.type === "group";
  const otherMember = conversation.members.find((m) => m.user_id !== currentUser.id);
  const isOnline = !isGroup && otherMember?.user.is_online;

  const showPlaceholderToast = (featureName: string) => {
    setToastMessage(`${featureName} is coming soon`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const subtitle = isGroup
    ? `${conversation.members.length} members`
    : isOnline
    ? "Online"
    : otherMember?.user.last_seen
    ? "Offline"
    : "Encrypted direct chat";

  return (
    <header className="h-[60px] px-4 py-2 bg-white dark:bg-[#181818] border-b border-zinc-200 dark:border-[#282828] flex items-center justify-between select-none relative z-10 flex-shrink-0">
      {/* Toast notification for placeholders */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs px-3.5 py-1.5 rounded-full shadow-lg pointer-events-none transition-all animate-fade-in z-50">
          {toastMessage}
        </div>
      )}

      {/* Left section: Back button + Avatar + Details */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
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
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#2C6BED] transition-colors">
              {conversation.name || "Conversation"}
            </h2>
            <p
              className={`text-[11px] truncate ${
                isOnline
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </button>
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
        <button
          onClick={() => showPlaceholderToast("Voice calling")}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
          title="Voice Call"
          aria-label="Voice Call"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={() => showPlaceholderToast("Video calling")}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
          title="Video Call"
          aria-label="Video Call"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenDetails}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
          title="Conversation Details"
          aria-label="Conversation Details"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
