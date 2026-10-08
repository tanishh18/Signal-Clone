"use client";

import React, { useState } from "react";
import { Conversation, User } from "@/types";
import { ConversationItem } from "./ConversationItem";
import { Avatar } from "@/components/ui/Avatar";
import { Search, X, Settings, Plus, ShieldCheck, Users } from "lucide-react";

interface ConversationSidebarProps {
  currentUser: User;
  conversations: Conversation[];
  selectedId?: number | null;
  onSelectConversation: (id: number) => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  onNewGroup: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  currentUser,
  conversations,
  selectedId,
  onSelectConversation,
  onOpenSettings,
  onNewChat,
  onNewGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const msgMatch = c.latest_message?.content.toLowerCase().includes(q);
    return nameMatch || msgMatch;
  });

  return (
    <aside className="w-full md:w-[340px] lg:w-[380px] h-full flex flex-col bg-white dark:bg-[#181818] border-r border-zinc-200 dark:border-[#282828] select-none flex-shrink-0">
      {/* Top Header */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-zinc-100 dark:border-[#242424]">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="rounded-full ring-2 ring-transparent hover:ring-[#2C6BED]/40 transition-all focus:outline-none"
            title="Profile & Settings"
            aria-label="Profile and Settings"
          >
            <Avatar
              name={currentUser.display_name}
              src={currentUser.avatar_url}
              size="md"
              isOnline={currentUser.is_online}
            />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                Signal
              </span>
              <ShieldCheck className="w-4 h-4 text-[#2C6BED]" />
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              {currentUser.display_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
          <button
            onClick={onNewGroup}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
            title="New Group"
            aria-label="Create new group"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={onNewChat}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
            title="New Message"
            aria-label="Start new conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
            title="Settings"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3.5 py-2.5">
        <div className="relative flex items-center bg-zinc-100 dark:bg-[#222222] rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#2C6BED]">
          <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            aria-label="Search conversations"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-transparent">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              currentUserId={currentUser.id}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))
        ) : (
          <div className="py-12 px-6 text-center text-zinc-400 dark:text-zinc-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {searchQuery ? "No conversations found" : "No chats yet"}
            </p>
            <p className="text-xs mt-1">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Tap the + button above to start your first encrypted conversation."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
