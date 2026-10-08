"use client";

import React, { useState, useEffect } from "react";
import { User, Conversation } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { searchUsers, createOrGetDirectConversation, getContacts } from "@/lib/api";
import { Search, X, MessageSquarePlus, Loader2 } from "lucide-react";

interface NewChatModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onConversationCreated,
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial contacts / suggestions when opened
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    getContacts()
      .then((contacts) => {
        if (active) {
          setSuggestedUsers(contacts.map((c) => c.contact_user));
        }
      })
      .catch(() => {
        if (active) {
          setSuggestedUsers([]);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    setQuery("");
    setSearchResults([]);
    setError(null);
    onClose();
  };

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const users = await searchUsers(trimmed);
        // Exclude self
        setSearchResults(users.filter((u) => u.id !== currentUser.id));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to search users";
        setError(msg);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, currentUser.id]);

  const handleStartChat = async (targetUser: User) => {
    setIsCreating(true);
    setError(null);
    try {
      const conv = await createOrGetDirectConversation(targetUser.id);
      onConversationCreated(conv);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start conversation";
      setError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  const displayList = query.trim() ? searchResults : suggestedUsers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-[#282828] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-[#2C6BED]" />
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              New Direct Conversation
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-3.5 border-b border-zinc-100 dark:border-[#242424]">
          <div className="relative flex items-center bg-zinc-100 dark:bg-[#222222] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[#2C6BED]">
            <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username..."
              className="bg-transparent text-sm w-full outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3 m-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[220px]">
          <p className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {query.trim() ? "Search Results" : "Suggested Contacts"}
          </p>

          {displayList.length > 0 ? (
            displayList.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStartChat(user)}
                disabled={isCreating}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-[#242424] transition-colors text-left disabled:opacity-50"
              >
                <Avatar
                  name={user.display_name}
                  src={user.avatar_url}
                  size="md"
                  isOnline={user.is_online}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {user.display_name}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                    @{user.username} {user.phone && `• ${user.phone}`}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-zinc-400 text-xs">
              {isSearching ? (
                "Searching..."
              ) : query.trim() ? (
                "No users found matching your search"
              ) : (
                "Search by username to find people on Signal"
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
