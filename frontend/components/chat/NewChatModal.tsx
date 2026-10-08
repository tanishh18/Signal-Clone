"use client";

import React, { useState, useEffect } from "react";
import { User, Conversation, Contact } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import {
  searchUsers,
  createOrGetDirectConversation,
  getContacts,
  addContact,
  deleteContact,
} from "@/lib/api";
import {
  Search,
  X,
  MessageSquare,
  Loader2,
  UserPlus,
  UserMinus,
  Check,
  BookUser,
  Users,
} from "lucide-react";

interface NewChatModalProps {
  isOpen: boolean;
  currentUser: User;
  initialTab?: "contacts" | "search";
  initialSearchQuery?: string;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  currentUser,
  initialTab = "contacts",
  initialSearchQuery = "",
  onClose,
  onConversationCreated,
}) => {
  const [activeTab, setActiveTab] = useState<"contacts" | "search">(initialTab);
  const [query, setQuery] = useState(initialSearchQuery);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactFilter, setContactFilter] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Load contacts list asynchronously when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    getContacts()
      .then((data) => {
        if (isMounted) {
          setContacts(data);
          setIsLoadingContacts(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setContacts([]);
          setIsLoadingContacts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    setQuery("");
    setContactFilter("");
    setSearchResults([]);
    setError(null);
    onClose();
  };

  // Debounced search for all users
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || activeTab !== "search") {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const users = await searchUsers(trimmed);
        setSearchResults(users.filter((u) => u.id !== currentUser.id));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to search users";
        setError(msg);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab, currentUser.id]);

  // Start direct chat
  const handleStartChat = async (targetUser: User) => {
    setIsCreatingChat(true);
    setError(null);
    try {
      const conv = await createOrGetDirectConversation(targetUser.id);
      onConversationCreated(conv);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start conversation";
      setError(msg);
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Add user to contacts
  const handleAddContact = async (targetUser: User) => {
    setActionLoadingId(targetUser.id);
    try {
      const newContact = await addContact(targetUser.id);
      setContacts((prev) => [...prev, newContact]);
      showToast(`Added ${targetUser.display_name} to contacts`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add contact";
      showToast(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove user from contacts
  const handleRemoveContact = async (contactId: number, displayName: string) => {
    setActionLoadingId(contactId);
    try {
      await deleteContact(contactId);
      setContacts((prev) => prev.filter((c) => c.contact_id !== contactId));
      showToast(`Removed ${displayName} from contacts`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove contact";
      showToast(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  const contactUserIds = new Set(contacts.map((c) => c.contact_id));

  // Filtered contacts list
  const filteredContacts = contacts.filter((c) => {
    if (!contactFilter.trim()) return true;
    const q = contactFilter.toLowerCase();
    const u = c.contact_user;
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col max-h-[85vh] relative">
        {/* Toast alert */}
        {toast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs px-3.5 py-1.5 rounded-full shadow-lg z-30 pointer-events-none transition-all">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-[#282828] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookUser className="w-5 h-5 text-[#2C6BED]" />
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Contacts &amp; People
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200 dark:border-[#282828] bg-zinc-50 dark:bg-[#181818] px-3 pt-2 gap-2">
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === "contacts"
                ? "border-[#2C6BED] text-[#2C6BED] bg-white dark:bg-[#1a1a1a]"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts ({contacts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === "search"
                ? "border-[#2C6BED] text-[#2C6BED] bg-white dark:bg-[#1a1a1a]"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find People</span>
          </button>
        </div>

        {/* TAB 1: CONTACTS */}
        {activeTab === "contacts" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter Input */}
            <div className="p-3 border-b border-zinc-100 dark:border-[#242424]">
              <div className="relative flex items-center bg-zinc-100 dark:bg-[#222222] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[#2C6BED]">
                <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={contactFilter}
                  onChange={(e) => setContactFilter(e.target.value)}
                  placeholder="Filter your contacts..."
                  className="bg-transparent text-xs w-full outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-2 min-h-[220px]">
              {isLoadingContacts ? (
                <div className="py-12 flex justify-center text-zinc-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => {
                  const user = contact.contact_user;
                  const isBusy = actionLoadingId === contact.contact_id || isCreatingChat;

                  return (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-[#242424] transition-colors mb-1"
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
                            @{user.username} {user.phone && `• ${user.phone}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleStartChat(user)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2C6BED] hover:bg-[#2458C7] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          title="Send Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Message</span>
                        </button>
                        <button
                          onClick={() => handleRemoveContact(contact.contact_id, user.display_name)}
                          disabled={isBusy}
                          className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                          title="Remove from contacts"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  {contactFilter.trim() ? (
                    `No contacts matching "${contactFilter}"`
                  ) : (
                    <div>
                      <p className="font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                        No contacts saved yet
                      </p>
                      <p className="text-zinc-400 mb-3">
                        Switch to &quot;Find People&quot; to search and add contacts.
                      </p>
                      <button
                        onClick={() => setActiveTab("search")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2C6BED]/10 text-[#2C6BED] font-semibold rounded-lg hover:bg-[#2C6BED]/20 transition-colors text-xs"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Find People</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FIND PEOPLE */}
        {activeTab === "search" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input */}
            <div className="p-3 border-b border-zinc-100 dark:border-[#242424]">
              <div className="relative flex items-center bg-zinc-100 dark:bg-[#222222] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[#2C6BED]">
                <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by username, display name, or phone..."
                  className="bg-transparent text-xs w-full outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-zinc-400 animate-spin flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 m-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-2 min-h-[220px]">
              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mb-2 text-[#2C6BED]" />
                  <span>Searching for people on Signal...</span>
                </div>
              ) : query.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((user) => {
                    const isContact = contactUserIds.has(user.id);
                    const isBusy = actionLoadingId === user.id || isCreatingChat;

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-[#242424] transition-colors mb-1"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            name={user.display_name}
                            src={user.avatar_url}
                            size="md"
                            isOnline={user.is_online}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {user.display_name}
                              </p>
                              {isContact && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                                  <Check className="w-2.5 h-2.5" />
                                  Contact
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                              @{user.username} {user.phone && `• ${user.phone}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isContact ? (
                            <button
                              onClick={() => handleRemoveContact(user.id, user.display_name)}
                              disabled={isBusy}
                              className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                              title="Remove contact"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddContact(user)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-[#282828] hover:bg-zinc-200 dark:hover:bg-[#323232] text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                              title="Add to contacts"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleStartChat(user)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2C6BED] hover:bg-[#2458C7] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    No users found matching &quot;{query.trim()}&quot;
                  </div>
                )
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  <Search className="w-6 h-6 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                  <p className="font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    Search for people
                  </p>
                  <p className="text-zinc-400 max-w-xs mx-auto">
                    Type a username, display name, or phone number to find people on Signal.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
