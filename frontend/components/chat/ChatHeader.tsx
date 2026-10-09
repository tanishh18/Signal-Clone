"use client";

import React, { useState } from "react";
import { Conversation, User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { ChatContextMenu } from "./ChatContextMenu";
import { Video, Search, MoreVertical, ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: User;
  onBack: () => void;
  onOpenDetails: () => void;
  onSearchInChat?: () => void;
  onStartCall?: (isVideo: boolean) => void;
  onVerifySafetyNumber?: () => void;
  onLeaveGroup?: () => void;
  onMarkUnread?: () => void;
  onPinChat?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onBlock?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUser,
  onBack,
  onOpenDetails,
  onSearchInChat,
  onStartCall,
  onVerifySafetyNumber,
  onLeaveGroup,
  onMarkUnread,
  onPinChat,
  onArchive,
  onDelete,
  onBlock,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isGroup = conversation.type === "group";
  const otherMember = conversation.members.find((m) => m.user_id !== currentUser.id);
  const isOnline = !isGroup && otherMember?.user.is_online;

  const showPlaceholderToast = (featureName: string) => {
    setToastMessage(`${featureName} is coming soon`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <header className="h-[50px] px-3.5 bg-[#1a1a1a] border-b border-[#262626]/80 flex items-center justify-between select-none relative z-10 flex-shrink-0">
      {/* Toast notification for placeholders */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-[#282828] text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg pointer-events-none transition-all z-50 border border-[#333333]">
          {toastMessage}
        </div>
      )}

      {/* Left section: Back button + Avatar + Details */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-1 -ml-1 text-zinc-400 hover:text-white hover:bg-[#252525] rounded-md transition-colors"
          title="Back to conversations"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.75]" />
        </button>

        {/* Clicking avatar/name opens Group Details View in main canvas */}
        <button
          onClick={onOpenDetails}
          className="flex items-center gap-2.5 text-left min-w-0 group focus:outline-none"
        >
          <Avatar
            name={conversation.name || "Chat"}
            src={conversation.avatar_url}
            size="sm"
            isGroup={isGroup}
            isOnline={isOnline}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-tight">
              <h2 className="font-medium text-xs text-zinc-100 truncate group-hover:text-[#2C6BED] transition-colors">
                {conversation.name || "Conversation"}
              </h2>
              {!isGroup && onVerifySafetyNumber && (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerifySafetyNumber();
                  }}
                  className="text-[9px] text-zinc-400 hover:text-white bg-[#242424] px-1 py-0.2 rounded flex items-center gap-0.5"
                  title="Verify Safety Number"
                >
                  🔒
                </span>
              )}
            </div>
            {(!isGroup && (isOnline || otherMember?.user.last_seen)) && (
              <p
                className={`text-[10px] truncate leading-tight ${
                  isOnline
                    ? "text-emerald-400 font-medium"
                    : "text-zinc-500"
                }`}
              >
                {isOnline
                  ? "Online"
                  : otherMember?.user.last_seen
                  ? "Offline"
                  : ""}
              </p>
            )}
          </div>
        </button>
      </div>

      {/* Right section: Video call, Search in chat, More options (three-dot) */}
      <div className="flex items-center gap-0.5 text-zinc-400">
        <button
          onClick={() => {
            if (onStartCall) onStartCall(true);
            else showPlaceholderToast("Video calling");
          }}
          className="p-1.5 rounded-md hover:bg-[#252525] hover:text-zinc-100 transition-colors"
          title="Video Call"
          aria-label="Video Call"
        >
          <Video className="w-4 h-4 stroke-[1.75]" />
        </button>

        <button
          onClick={() => {
            if (onSearchInChat) onSearchInChat();
            else showPlaceholderToast("Search in chat");
          }}
          className="p-1.5 rounded-md hover:bg-[#252525] hover:text-zinc-100 transition-colors"
          title="Search in conversation"
          aria-label="Search in conversation"
        >
          <Search className="w-4 h-4 stroke-[1.75]" />
        </button>

        {/* Three-dot menu — opens contextual dropdown, NOT group details */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-1.5 rounded-md hover:bg-[#252525] hover:text-zinc-100 transition-colors ${
            isMenuOpen ? "bg-[#252525] text-zinc-100" : ""
          }`}
          title="More options"
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4 stroke-[1.75]" />
        </button>

        {/* Contextual chat menu */}
        <ChatContextMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          isGroup={isGroup}
          onConversationDetails={onOpenDetails}
          onLeaveGroup={onLeaveGroup}
          onMarkUnread={onMarkUnread}
          onPinChat={onPinChat}
          onArchive={onArchive}
          onDelete={onDelete}
          onBlock={onBlock}
        />
      </div>
    </header>
  );
};
