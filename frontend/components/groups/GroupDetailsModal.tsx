"use client";

import React, { useState } from "react";
import { Conversation, User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { X, UserPlus, Shield, UserMinus } from "lucide-react";

interface GroupDetailsModalProps {
  isOpen: boolean;
  conversation?: Conversation | null;
  currentUser: User;
  onClose: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  conversation,
  currentUser,
  onClose,
}) => {
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen || !conversation) return null;

  const isGroup = conversation.type === "group";
  const myMembership = conversation.members.find((m) => m.user_id === currentUser.id);
  const isAdmin = myMembership?.role === "admin";

  const showActionToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col max-h-[85vh] relative">
        {toast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs px-3 py-1 rounded-full shadow z-30">
            {toast}
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
            {isGroup ? `${conversation.members.length} members` : "Encrypted direct chat"}
          </p>
        </div>

        {/* Members section for groups */}
        {isGroup && (
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Members ({conversation.members.length})
              </span>
              {isAdmin && (
                <button
                  onClick={() => showActionToast("Add member action available in Phase 10")}
                  className="inline-flex items-center gap-1 text-xs text-[#2C6BED] font-medium hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {conversation.members.map((member) => {
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

                    <div className="flex items-center gap-2">
                      {isMemberAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2C6BED] bg-[#2C6BED]/10 px-2 py-0.5 rounded-full">
                          <Shield className="w-2.5 h-2.5" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Member</span>
                      )}

                      {isAdmin && !isMe && (
                        <button
                          onClick={() => showActionToast(`Remove member available in Phase 10`)}
                          className="p-1 text-zinc-400 hover:text-rose-500 rounded-full transition-colors"
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
        )}
      </div>
    </div>
  );
};
