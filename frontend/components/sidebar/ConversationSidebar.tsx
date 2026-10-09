"use client";

import React, { useState } from "react";
import { Conversation, User } from "@/types";
import { ConversationItem } from "./ConversationItem";
import { ChatsHeaderMenu } from "./ChatsHeaderMenu";
import { Search, X, Edit3, MoreHorizontal, SlidersHorizontal } from "lucide-react";

interface ConversationSidebarProps {
  currentUser: User;
  conversations: Conversation[];
  selectedId?: number | null;
  onSelectConversation: (id: number) => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onOpenContacts?: () => void;
  onGlobalSearch?: (query: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  currentUser,
  conversations,
  selectedId,
  onSelectConversation,
  onNewChat,
  onNewGroup,
  onOpenContacts,
  onGlobalSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "groups">("all");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 2500);
  };

  const filteredConversations = conversations.filter((c) => {
    // Filter by tab
    if (activeFilter === "unread" && (c.unread_count || 0) === 0) {
      return false;
    }
    if (activeFilter === "groups" && c.type !== "group") {
      return false;
    }

    // Filter by search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const msgMatch = c.latest_message?.content.toLowerCase().includes(q);
    return nameMatch || msgMatch;
  });

  return (
    <aside className="w-full md:w-[280px] lg:w-[300px] h-full flex flex-col bg-[#1a1a1a] border-r border-[#262626]/80 select-none flex-shrink-0 relative">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-3 py-1 rounded-full shadow-lg z-50 pointer-events-none">
          {toastNotice}
        </div>
      )}

      {/* Top Header matching Signal Desktop: Chats [Compose] [...] */}
      <div className="px-3.5 py-3 flex items-center justify-between relative">
        <h1 className="text-base font-semibold tracking-tight text-white">Chats</h1>

        <div className="flex items-center gap-0.5 text-zinc-400">
          {/* Compose / New Chat button */}
          <button
            onClick={onNewChat}
            className="p-1 rounded-md hover:bg-[#252525] hover:text-white transition-colors"
            title="Compose new message"
            aria-label="Compose new message"
          >
            <Edit3 className="w-4 h-4 stroke-[1.75]" />
          </button>

          {/* More options button (...) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 rounded-md hover:bg-[#252525] hover:text-white transition-colors"
            title="More options"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* 3-Dot Dropdown Menu (includes New Group & Contacts access) */}
        <ChatsHeaderMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onNewGroup={onNewGroup}
          onOpenContacts={onOpenContacts}
          onViewArchive={() => showToast("Archive is empty")}
          onAddFolder={() => showToast("Chat folders coming soon")}
          onNotificationProfile={() => showToast("Notification profiles coming soon")}
        />
      </div>

      {/* Search Bar matching Signal Desktop */}
      <div className="px-3 pb-2 flex items-center gap-1.5">
        <div className="flex-1 relative flex items-center bg-[#242424] rounded-full px-3 py-1 focus-within:ring-1 focus-within:ring-[#2C6BED]">
          <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 flex-shrink-0 stroke-[1.75]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat"
            className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            aria-label="Search chat"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-zinc-400 hover:text-zinc-200"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Toggle Icon Button */}
        <button
          onClick={() => {
            if (activeFilter === "all") setActiveFilter("unread");
            else if (activeFilter === "unread") setActiveFilter("groups");
            else setActiveFilter("all");
          }}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            activeFilter !== "all"
              ? "bg-[#282828] text-[#2C6BED]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#252525]"
          }`}
          title={`Filter: ${activeFilter}`}
          aria-label="Filter chats"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 stroke-[1.75]" />
        </button>
      </div>

      {searchQuery.trim() && onGlobalSearch && (
        <div className="px-3 pb-2">
          <button
            onClick={() => onGlobalSearch(searchQuery.trim())}
            className="w-full text-left text-[11px] text-[#2C6BED] hover:underline flex items-center gap-1.5 px-1 py-0.5 font-medium transition-colors"
          >
            <Search className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Search Signal users for &quot;{searchQuery.trim()}&quot;</span>
          </button>
        </div>
      )}

      {/* Filter indicator if active */}
      {activeFilter !== "all" && (
        <div className="px-3 pb-1.5 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Filtering by: <strong className="text-zinc-200 capitalize">{activeFilter}</strong></span>
          <button
            onClick={() => setActiveFilter("all")}
            className="text-[#2C6BED] hover:underline text-[10px]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
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
          <div className="py-20 px-6 text-center text-zinc-500">
            <p className="text-sm font-medium text-zinc-400">
              {searchQuery ? "No chats found" : "No chats"}
            </p>
            <p className="text-xs mt-1 text-zinc-500">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Recent chats will appear here."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
