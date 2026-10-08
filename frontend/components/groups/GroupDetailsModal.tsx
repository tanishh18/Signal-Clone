"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Conversation, ConversationMember, User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import {
  addGroupMember,
  removeGroupMember,
  getContacts,
  searchUsers,
} from "@/lib/api";
import {
  X,
  UserPlus,
  Shield,
  UserMinus,
  Search,
  Loader2,
  Check,
  LogOut,
} from "lucide-react";

interface GroupDetailsModalProps {
  isOpen: boolean;
  conversation?: Conversation | null;
  currentUser: User;
  onClose: () => void;
  onMembersUpdated?: (updatedMembers: ConversationMember[]) => void;
  onLeaveGroup?: (conversationId: number) => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  conversation,
  currentUser,
  onClose,
  onMembersUpdated,
  onLeaveGroup,
}) => {
  const members = useMemo(
    () => conversation?.members || [],
    [conversation?.members]
  );
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [addCandidates, setAddCandidates] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Load contacts to pick from when entering add mode
  useEffect(() => {
    if (!isAddingMode || !conversation) return;
    let active = true;

    const existingIds = new Set(members.map((m) => m.user_id));

    getContacts()
      .then((contacts) => {
        if (active) {
          const eligible = contacts
            .map((c) => c.contact_user)
            .filter((u) => !existingIds.has(u.id));
          setAddCandidates(eligible);
        }
      })
      .catch(() => {
        if (active) setAddCandidates([]);
      });

    return () => {
      active = false;
    };
  }, [isAddingMode, conversation, members]);

  // Search users for addition
  useEffect(() => {
    const trimmed = addSearchQuery.trim();
    if (!isAddingMode || !trimmed) {
      return;
    }

    const existingIds = new Set(members.map((m) => m.user_id));
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsers(trimmed);
        setAddCandidates(users.filter((u) => !existingIds.has(u.id)));
      } catch {
        setAddCandidates([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [addSearchQuery, isAddingMode, members]);

  if (!isOpen || !conversation) return null;

  const isGroup = conversation.type === "group";
  const myMembership = members.find((m) => m.user_id === currentUser.id);
  const isAdmin = myMembership?.role === "admin";

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddMember = async (user: User) => {
    if (!conversation) return;
    setActionLoading(true);
    try {
      const newMember = await addGroupMember(conversation.id, user.id);
      const updated = [...members, newMember];
      onMembersUpdated?.(updated);
      showToast(`${user.display_name} added to group`);
      setIsAddingMode(false);
      setAddSearchQuery("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add member";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId: number, targetName: string) => {
    if (!conversation) return;
    setActionLoading(true);
    try {
      await removeGroupMember(conversation.id, targetUserId);
      const updated = members.filter((m) => m.user_id !== targetUserId);
      onMembersUpdated?.(updated);
      showToast(`${targetName} removed from group`);

      // If user removed themselves (left the group)
      if (targetUserId === currentUser.id) {
        onLeaveGroup?.(conversation.id);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove member";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col max-h-[85vh] relative">
        {/* Toast alert */}
        {toast && (
          <div
            className={`absolute top-14 left-1/2 -translate-x-1/2 text-xs px-3.5 py-1.5 rounded-full shadow-lg z-30 transition-all ${
              toast.type === "error"
                ? "bg-rose-600 text-white"
                : "bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900"
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-[#282828] flex items-center justify-between">
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            {isGroup ? "Group Details" : "Contact Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-5 flex flex-col items-center text-center border-b border-zinc-100 dark:border-[#242424]">
          <Avatar
            name={conversation.name || "Chat"}
            src={conversation.avatar_url}
            size="xl"
            isGroup={isGroup}
            className="mb-3"
          />
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            {conversation.name}
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            {isGroup ? `${members.length} members` : "Encrypted direct chat"}
          </p>
        </div>

        {/* Members section for groups */}
        {isGroup && (
          <div className="flex-1 p-5 overflow-y-auto">
            {/* Header / Add Member Bar */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Members ({members.length})
              </span>
              {isAdmin && !isAddingMode && (
                <button
                  onClick={() => setIsAddingMode(true)}
                  className="inline-flex items-center gap-1 text-xs text-[#2C6BED] font-semibold hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              )}
              {isAddingMode && (
                <button
                  onClick={() => {
                    setIsAddingMode(false);
                    setAddSearchQuery("");
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Inline Add Member Picker */}
            {isAddingMode && (
              <div className="mb-4 p-3 bg-zinc-50 dark:bg-[#202020] rounded-xl border border-zinc-200 dark:border-[#2e2e2e]">
                <div className="relative flex items-center bg-white dark:bg-[#181818] rounded-lg px-2.5 py-1.5 mb-2 border border-zinc-200 dark:border-zinc-700">
                  <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    placeholder="Search people to add..."
                    className="bg-transparent text-xs w-full outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin flex-shrink-0" />
                  )}
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1">
                  {addCandidates.length > 0 ? (
                    addCandidates.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleAddMember(user)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#282828] text-left transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            name={user.display_name}
                            src={user.avatar_url}
                            size="sm"
                            isOnline={user.is_online}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                              {user.display_name}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-[#2C6BED] bg-[#2C6BED]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Add
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="py-4 text-center text-[11px] text-zinc-400">
                      {isSearching
                        ? "Searching..."
                        : addSearchQuery.trim()
                        ? "No users found"
                        : "No eligible contacts to add"}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Existing Members List */}
            <div className="space-y-1.5">
              {members.map((member) => {
                const isMemberAdmin = member.role === "admin";
                const isMe = member.user_id === currentUser.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={member.user.display_name}
                        src={member.user.avatar_url}
                        size="md"
                        isOnline={member.user.is_online}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {member.user.display_name} {isMe && "(You)"}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          @{member.user.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isMemberAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2C6BED] bg-[#2C6BED]/10 px-2 py-0.5 rounded-full">
                          <Shield className="w-2.5 h-2.5" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Member</span>
                      )}

                      {/* Admin can remove other members */}
                      {isAdmin && !isMe && (
                        <button
                          onClick={() =>
                            handleRemoveMember(member.user_id, member.user.display_name)
                          }
                          disabled={actionLoading}
                          className="p-1 text-zinc-400 hover:text-rose-500 rounded-full transition-colors disabled:opacity-50"
                          title="Remove from group"
                          aria-label={`Remove ${member.user.display_name}`}
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leave Group Action (for any member) */}
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-[#242424]">
              <button
                onClick={() =>
                  handleRemoveMember(currentUser.id, currentUser.display_name)
                }
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Group</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
