"use client";

import React, { useState, useEffect } from "react";
import { User, Conversation } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { createGroup, searchUsers, getContacts } from "@/lib/api";
import { Users, X, Check, Search, Loader2 } from "lucide-react";

interface NewGroupModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onGroupCreated: (conversation: Conversation) => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onGroupCreated,
}) => {
  const [name, setName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load contacts when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    getContacts()
      .then((contacts) => {
        if (active) {
          const users = contacts
            .map((c) => c.contact_user)
            .filter((u) => u.id !== currentUser.id);
          setAvailableUsers(users);
        }
      })
      .catch(() => {
        if (active) setAvailableUsers([]);
      });

    return () => {
      active = false;
    };
  }, [isOpen, currentUser.id]);

  // Debounced search for all users
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsers(trimmed);
        setSearchResults(users.filter((u) => u.id !== currentUser.id));
      } catch {
        // Fall back to empty search results
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser.id]);

  const handleClose = () => {
    setName("");
    setSelectedUserIds([]);
    setSearchQuery("");
    setSearchResults([]);
    setError(null);
    onClose();
  };

  const toggleSelectUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a group name.");
      return;
    }

    if (selectedUserIds.length === 0) {
      setError("Please select at least one member.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newConv = await createGroup(trimmedName, selectedUserIds);
      onGroupCreated(newConv);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create group.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Merge available contacts and search results without duplicates
  const candidateUsers = searchQuery.trim()
    ? searchResults
    : availableUsers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#1c1c1c] rounded-3xl w-full max-w-md shadow-2xl border border-[#2a2a2a] overflow-hidden flex flex-col max-h-[85vh] text-zinc-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2C6BED]" />
            <h2 className="font-bold text-base text-white">
              New Group
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-zinc-400 hover:text-white rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col min-h-0">
          {/* Group Name Input */}
          <div className="p-4 border-b border-zinc-100 dark:border-[#242424] space-y-3">
            <div>
              <label
                htmlFor="group-name"
                className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1"
              >
                GROUP NAME
              </label>
              <input
                id="group-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Project Team, Family, Book Club"
                maxLength={100}
                className="w-full bg-zinc-100 dark:bg-[#222222] text-sm text-zinc-900 dark:text-zinc-100 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#2C6BED] placeholder-zinc-400"
                autoFocus
              />
            </div>

            {/* Member search */}
            <div className="relative flex items-center bg-zinc-100 dark:bg-[#222222] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[#2C6BED]">
              <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts to add..."
                className="bg-transparent text-sm w-full outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-zinc-400 animate-spin flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 mx-4 my-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Member Selection List */}
          <div className="flex-1 overflow-y-auto p-3 min-h-[180px]">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                {searchQuery.trim() ? "Search Results" : "Add Members"}
              </span>
              <span className="text-[11px] font-medium text-[#2C6BED]">
                {selectedUserIds.length} selected
              </span>
            </div>

            {candidateUsers.length > 0 ? (
              candidateUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleSelectUser(user.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left mb-1 ${
                      isSelected
                        ? "bg-[#2C6BED]/10 dark:bg-[#2C6BED]/20"
                        : "hover:bg-zinc-100 dark:hover:bg-[#242424]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={user.display_name}
                        src={user.avatar_url}
                        size="md"
                        isOnline={user.is_online}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {user.display_name}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? "bg-[#2C6BED] border-[#2C6BED] text-white"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-12 text-center text-zinc-400 text-xs">
                {isSearching
                  ? "Searching..."
                  : searchQuery.trim()
                  ? "No contacts found matching search"
                  : "No contacts available to add"}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-zinc-200 dark:border-[#282828] flex items-center justify-end gap-2 bg-zinc-50 dark:bg-[#181818]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || selectedUserIds.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2C6BED] hover:bg-[#2458C7] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              )}
              <span>Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
