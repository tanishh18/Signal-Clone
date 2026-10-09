"use client";

import React, { useState } from "react";
import { Conversation, User } from "@/types";
import { ConversationItem } from "./ConversationItem";
import { ChatsHeaderMenu } from "./ChatsHeaderMenu";
import { Search, X, Edit3, MoreHorizontal, Users, BookUser } from "lucide-react";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 2500);
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const msgMatch = c.latest_message?.content.toLowerCase().includes(q);
    return nameMatch || msgMatch;
  });

  return (
    <aside className="w-full md:w-[320px] lg:w-[360px] h-full flex flex-col bg-[#181818] border-r border-[#242424] select-none flex-shrink-0 relative">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-50 pointer-events-none">
          {toastNotice}
        </div>
      )}

      {/* Top Header matching Screenshot 3: Chats [Compose] [...] */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-[#242424] relative">
        <h1 className="text-xl font-bold tracking-tight text-white">Chats</h1>

        <div className="flex items-center gap-1 text-zinc-300">
          {/* Contacts access */}
          {onOpenContacts && (
            <button
              onClick={onOpenContacts}
              className="p-1.5 rounded-lg hover:bg-[#282828] transition-colors text-zinc-400 hover:text-white"
              title="Contacts & People"
              aria-label="View Contacts"
            >
              <BookUser className="w-[18px] h-[18px]" />
            </button>
          )}

          {/* New Group button */}
          <button
            onClick={onNewGroup}
            className="p-1.5 rounded-lg hover:bg-[#282828] transition-colors text-zinc-400 hover:text-white"
            title="New Group"
            aria-label="Create group"
          >
            <Users className="w-[18px] h-[18px]" />
          </button>

          {/* Compose / New Chat button (Pencil icon from Screenshot 3) */}
          <button
            onClick={onNewChat}
            className="p-1.5 rounded-lg hover:bg-[#282828] transition-colors text-zinc-400 hover:text-white"
            title="Compose new message"
            aria-label="Compose new message"
          >
            <Edit3 className="w-[18px] h-[18px]" />
          </button>

          {/* More options button (...) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-lg hover:bg-[#282828] transition-colors text-zinc-400 hover:text-white"
            title="More options"
            aria-label="More options"
          >
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* 3-Dot Dropdown Menu */}
        <ChatsHeaderMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onViewArchive={() => showToast("Archive is empty")}
          onAddFolder={() => showToast("Chat folders coming soon")}
          onNotificationProfile={() => showToast("Notification profiles coming soon")}
        />
      </div>

      {/* Search Bar matching Screenshot 3 */}
      <div className="px-3.5 py-2.5">
        <div className="relative flex items-center bg-[#242424] rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#2C6BED]">
          <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            aria-label="Search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-zinc-400 hover:text-zinc-200"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {searchQuery.trim() && onGlobalSearch && (
          <button
            onClick={() => onGlobalSearch(searchQuery.trim())}
            className="w-full mt-1.5 text-left text-xs text-[#2C6BED] hover:underline flex items-center gap-1.5 px-1 py-0.5 font-medium transition-colors"
          >
            <Search className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Search Signal users for &quot;{searchQuery.trim()}&quot;</span>
          </button>
        )}
      </div>

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
