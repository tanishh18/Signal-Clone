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
  ArrowLeft,
  Video,
  BellOff,
  Search,
  UserPlus,
  Shield,
  UserMinus,
  Loader2,
  Check,
  LogOut,
  ChevronRight,
  Timer,
  Palette,
  Bell,
  Link2,
  Tag,
  Users,
  Lock,
  AlertTriangle,
  Ban,
} from "lucide-react";

interface GroupDetailsViewProps {
  conversation: Conversation;
  currentUser: User;
  onBack: () => void;
  onMembersUpdated?: (updatedMembers: ConversationMember[]) => void;
  onLeaveGroup?: (conversationId: number) => void;
}

export const GroupDetailsView: React.FC<GroupDetailsViewProps> = ({
  conversation,
  currentUser,
  onBack,
  onMembersUpdated,
  onLeaveGroup,
}) => {
  const members = useMemo(
    () => conversation.members || [],
    [conversation.members]
  );
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [addCandidates, setAddCandidates] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Disappearing messages local state
  const [disappearingTimer, setDisappearingTimer] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(
        `signal_disappearing_${conversation.id}`
      );
      return saved || "Off";
    }
    return "Off";
  });

  // Mute local state
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem(`signal_muted_${conversation.id}`) === "true"
      );
    }
    return false;
  });

  const isGroup = conversation.type === "group";
  const myMembership = members.find((m) => m.user_id === currentUser.id);
  const isAdmin = myMembership?.role === "admin";

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      const msg =
        err instanceof Error ? err.message : "Failed to add member";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (
    targetUserId: number,
    targetName: string
  ) => {
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
        onBack();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to remove member";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisappearingChange = (value: string) => {
    setDisappearingTimer(value);
    try {
      localStorage.setItem(`signal_disappearing_${conversation.id}`, value);
    } catch {}
    showToast(`Disappearing messages: ${value}`);
  };

  const handleToggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    try {
      localStorage.setItem(
        `signal_muted_${conversation.id}`,
        String(newVal)
      );
    } catch {}
    showToast(newVal ? "Notifications muted" : "Notifications unmuted");
  };

  const disappearingOptions = [
    "Off",
    "30 seconds",
    "5 minutes",
    "1 hour",
    "8 hours",
    "1 day",
    "1 week",
    "4 weeks",
  ];

  // Get the other user for 1:1 conversations
  const otherMember = !isGroup
    ? members.find((m) => m.user_id !== currentUser.id)
    : null;

  return (
    <section className="flex-1 h-full flex flex-col bg-[#121212] overflow-hidden relative">
      {/* Toast */}
      {toast && (
        <div
          className={`absolute top-14 left-1/2 -translate-x-1/2 text-xs px-3.5 py-1.5 rounded-full shadow-lg z-30 transition-all ${
            toast.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-[#282828] text-white border border-[#333333]"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header with back button */}
      <header className="h-[50px] px-3.5 bg-[#1a1a1a] border-b border-[#262626]/80 flex items-center gap-3 select-none flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1 text-zinc-400 hover:text-white hover:bg-[#252525] rounded-md transition-colors"
          title="Back to conversation"
          aria-label="Back to conversation"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.75]" />
        </button>
        <h2 className="text-sm font-medium text-zinc-100">
          {isGroup ? "Group details" : "Conversation details"}
        </h2>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile / Identity Card */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
          <Avatar
            name={
              isGroup
                ? conversation.name || "Group"
                : otherMember?.user.display_name || conversation.name || "Chat"
            }
            src={conversation.avatar_url}
            size="xl"
            isGroup={isGroup}
            className="mb-3"
          />
          <h3 className="font-semibold text-lg text-white">
            {conversation.name ||
              otherMember?.user.display_name ||
              "Conversation"}
          </h3>
          {isGroup ? (
            <p className="text-xs text-zinc-400 mt-0.5">
              {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          ) : (
            <p className="text-xs text-zinc-400 mt-0.5">
              @{otherMember?.user.username || "user"}
            </p>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center justify-center gap-6 pb-5">
          <button
            onClick={() => showToast("Video calling coming soon")}
            className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center">
              <Video className="w-4 h-4 stroke-[1.75]" />
            </div>
            <span className="text-[10px]">Video</span>
          </button>
          <button
            onClick={handleToggleMute}
            className={`flex flex-col items-center gap-1.5 transition-colors ${
              isMuted
                ? "text-[#2C6BED]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full border flex items-center justify-center ${
                isMuted
                  ? "bg-[#2C6BED]/10 border-[#2C6BED]/30"
                  : "bg-[#1e1e1e] border-[#2a2a2a]"
              }`}
            >
              <BellOff className="w-4 h-4 stroke-[1.75]" />
            </div>
            <span className="text-[10px]">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>
          <button
            onClick={() => showToast("Search coming soon")}
            className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center">
              <Search className="w-4 h-4 stroke-[1.75]" />
            </div>
            <span className="text-[10px]">Search</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#222222] mx-4" />

        {/* Settings Sections */}
        <div className="px-4 py-3 space-y-0.5">
          {/* Disappearing messages */}
          <div className="group">
            <button
              className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left"
              onClick={() => {
                // Cycle through options
                const currentIdx = disappearingOptions.indexOf(disappearingTimer);
                const nextIdx = (currentIdx + 1) % disappearingOptions.length;
                handleDisappearingChange(disappearingOptions[nextIdx]);
              }}
            >
              <div className="flex items-center gap-3">
                <Timer className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                <div>
                  <p className="text-[13px] text-zinc-200">
                    Disappearing messages
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {disappearingTimer}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </button>
          </div>

          {/* Chat color */}
          <button
            className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left"
            onClick={() => showToast("Chat color customization coming soon")}
          >
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
              <div>
                <p className="text-[13px] text-zinc-200">Chat color</p>
                <p className="text-[11px] text-zinc-500">Default</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#2C6BED]" />
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </div>
          </button>

          {/* Notifications */}
          <button
            className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left"
            onClick={handleToggleMute}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
              <div>
                <p className="text-[13px] text-zinc-200">Notifications</p>
                <p className="text-[11px] text-zinc-500">
                  {isMuted ? "Muted" : "Default"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          </button>
        </div>

        {/* Members Section (Groups only) */}
        {isGroup && (
          <>
            <div className="border-t border-[#222222] mx-4" />

            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-medium text-zinc-400">
                  Members ({members.length})
                </span>
              </div>

              {/* Add members button */}
              {isAdmin && !isAddingMode && (
                <button
                  onClick={() => setIsAddingMode(true)}
                  className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2C6BED]/15 flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5 text-[#2C6BED]" />
                  </div>
                  <span className="text-[13px] text-[#2C6BED] font-medium">
                    Add members
                  </span>
                </button>
              )}

              {/* Inline Add Member Picker */}
              {isAddingMode && (
                <div className="mb-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-300">
                      Add member
                    </span>
                    <button
                      onClick={() => {
                        setIsAddingMode(false);
                        setAddSearchQuery("");
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-300 font-medium"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="relative flex items-center bg-[#161616] rounded-lg px-2.5 py-1.5 mb-2 border border-[#2a2a2a]">
                    <Search className="w-3.5 h-3.5 text-zinc-500 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      value={addSearchQuery}
                      onChange={(e) => setAddSearchQuery(e.target.value)}
                      placeholder="Search people to add..."
                      className="bg-transparent text-xs w-full outline-none text-zinc-100 placeholder-zinc-500"
                      autoFocus
                    />
                    {isSearching && (
                      <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin flex-shrink-0" />
                    )}
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-0.5">
                    {addCandidates.length > 0 ? (
                      addCandidates.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleAddMember(user)}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#222222] text-left transition-colors disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              name={user.display_name}
                              src={user.avatar_url}
                              size="sm"
                              isOnline={user.is_online}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-zinc-200 truncate">
                                {user.display_name}
                              </p>
                              <p className="text-[10px] text-zinc-500 truncate">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-medium text-[#2C6BED] bg-[#2C6BED]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Add
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="py-4 text-center text-[11px] text-zinc-500">
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

              {/* Members list */}
              <div className="space-y-0.5">
                {members.map((member) => {
                  const isMemberAdmin = member.role === "admin";
                  const isMe = member.user_id === currentUser.id;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={member.user.display_name}
                          src={member.user.avatar_url}
                          size="sm"
                          isOnline={member.user.is_online}
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-zinc-200 truncate">
                            {isMe ? "You" : member.user.display_name}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            @{member.user.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isMemberAdmin && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#2C6BED] bg-[#2C6BED]/10 px-2 py-0.5 rounded-full">
                            <Shield className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        )}

                        {/* Admin can remove other members */}
                        {isAdmin && !isMe && (
                          <button
                            onClick={() =>
                              handleRemoveMember(
                                member.user_id,
                                member.user.display_name
                              )
                            }
                            disabled={actionLoading}
                            className="p-1 text-zinc-500 hover:text-rose-400 rounded-full transition-colors disabled:opacity-50"
                            title="Remove from group"
                            aria-label={`Remove ${member.user.display_name}`}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Group Management Section (groups only) */}
        {isGroup && (
          <>
            <div className="border-t border-[#222222] mx-4" />

            <div className="px-4 py-3 space-y-0.5">
              <button
                className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left"
                onClick={() => showToast("Group link not available yet")}
              >
                <div className="flex items-center gap-3">
                  <Link2 className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                  <p className="text-[13px] text-zinc-200">Group link</p>
                </div>
                <span className="text-[11px] text-zinc-500">Off</span>
              </button>

              <button
                className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left"
                onClick={() => showToast("Member labels coming soon")}
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                  <p className="text-[13px] text-zinc-200">Member label</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              </button>

              <button
                className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left"
                onClick={() =>
                  showToast("Requests & invites not available yet")
                }
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                  <p className="text-[13px] text-zinc-200">
                    Requests & invites
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              </button>

              <button
                className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left"
                onClick={() => showToast("Permissions settings coming soon")}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                  <p className="text-[13px] text-zinc-200">Permissions</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              </button>
            </div>
          </>
        )}

        {/* Danger Section */}
        <div className="border-t border-[#222222] mx-4" />

        <div className="px-4 py-3 space-y-0.5 pb-8">
          {isGroup && (
            <button
              onClick={() =>
                handleRemoveMember(currentUser.id, currentUser.display_name)
              }
              disabled={actionLoading}
              className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-rose-500/5 transition-colors text-left disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 text-rose-400 stroke-[1.75]" />
              <span className="text-[13px] text-rose-400">Leave group</span>
            </button>
          )}

          <button
            className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-rose-500/5 transition-colors text-left"
            onClick={() =>
              showToast(
                isGroup
                  ? "Block group is not available yet"
                  : "Block user is not available yet"
              )
            }
          >
            <Ban className="w-4 h-4 text-rose-400 stroke-[1.75]" />
            <span className="text-[13px] text-rose-400">
              {isGroup ? "Block group" : "Block"}
            </span>
          </button>

          <button
            className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-rose-500/5 transition-colors text-left"
            onClick={() => showToast("Report submitted (placeholder)")}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 stroke-[1.75]" />
            <span className="text-[13px] text-rose-400">Report spam</span>
          </button>
        </div>
      </div>
    </section>
  );
};
