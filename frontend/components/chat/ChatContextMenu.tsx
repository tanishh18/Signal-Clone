"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Timer,
  BellOff,
  Settings,
  ImageIcon,
  CheckSquare,
  BookmarkMinus,
  Pin,
  Archive,
  Trash2,
  LogOut,
  Ban,
  ChevronRight,
  Check,
} from "lucide-react";

interface ChatContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isGroup: boolean;
  onConversationDetails?: () => void;
  onMarkUnread?: () => void;
  onPinChat?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onLeaveGroup?: () => void;
  onBlock?: () => void;
}

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
  isOpen,
  onClose,
  isGroup,
  onConversationDetails,
  onMarkUnread,
  onPinChat,
  onArchive,
  onDelete,
  onLeaveGroup,
  onBlock,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<"disappearing" | "mute" | null>(null);
  const [selectedTimer, setSelectedTimer] = useState<string>("Off");

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveSubmenu(null);
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveSubmenu(null);
        onClose();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showPlaceholder = (label: string) => {
    setToast(`${label} coming soon`);
    setTimeout(() => setToast(null), 2500);
    onClose();
  };

  const handleAction = (
    callback: (() => void) | undefined,
    fallbackLabel: string
  ) => {
    onClose();
    if (callback) {
      callback();
    } else {
      showPlaceholder(fallbackLabel);
    }
  };

  const timerOptions = [
    "Off",
    "4 weeks",
    "1 week",
    "1 day",
    "8 hours",
    "1 hour",
    "5 minutes",
    "30 seconds",
    "Custom time...",
  ];

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#282828] text-white text-xs px-4 py-2 rounded-full shadow-xl z-[100] border border-[#333333] pointer-events-none">
          {toast}
        </div>
      )}

      <div
        ref={menuRef}
        className="absolute top-[42px] right-2 flex items-start gap-1 z-50 select-none"
        style={{ animation: "fadeIn 0.12s ease-out" }}
      >
        {/* Submenu for Disappearing Messages (shown to the left matching Signal screenshot) */}
        {activeSubmenu === "disappearing" && (
          <div className="w-40 bg-[#202020] text-zinc-100 rounded-xl shadow-2xl border border-[#2d2d2d] py-1.5 z-50">
            {timerOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setSelectedTimer(opt);
                  setToast(`Disappearing messages set to ${opt}`);
                  setTimeout(() => setToast(null), 2000);
                  onClose();
                }}
                className="w-full px-3 py-1.5 text-xs font-normal flex items-center justify-between text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
              >
                <span>{opt}</span>
                {selectedTimer === opt && (
                  <Check className="w-3.5 h-3.5 text-zinc-300" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Submenu for Mute Notifications */}
        {activeSubmenu === "mute" && (
          <div className="w-40 bg-[#202020] text-zinc-100 rounded-xl shadow-2xl border border-[#2d2d2d] py-1.5 z-50">
            {["1 hour", "8 hours", "1 day", "7 days", "Always"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setToast(`Notifications muted for ${opt}`);
                  setTimeout(() => setToast(null), 2000);
                  onClose();
                }}
                className="w-full px-3 py-1.5 text-xs font-normal text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Main Context Menu */}
        <div className="w-56 bg-[#202020] text-zinc-100 rounded-xl shadow-2xl border border-[#2d2d2d] py-1.5">
          {/* Disappearing messages with flyout */}
          <button
            onMouseEnter={() => setActiveSubmenu("disappearing")}
            onClick={() => setActiveSubmenu(activeSubmenu === "disappearing" ? null : "disappearing")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center justify-between text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Timer className="w-4 h-4 text-zinc-400" />
              <span>Disappearing messages</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {/* Mute notifications with flyout */}
          <button
            onMouseEnter={() => setActiveSubmenu("mute")}
            onClick={() => setActiveSubmenu(activeSubmenu === "mute" ? null : "mute")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center justify-between text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <BellOff className="w-4 h-4 text-zinc-400" />
              <span>Mute notifications</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {/* Group settings / Conversation details */}
          <button
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={() => handleAction(onConversationDetails, "Settings")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>{isGroup ? "Group settings" : "Conversation details"}</span>
          </button>

          {/* All media */}
          <button
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={() => showPlaceholder("All media")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <ImageIcon className="w-4 h-4 text-zinc-400" />
            <span>All media</span>
          </button>

          <div className="my-1 border-t border-[#2a2a2a]" />

          {/* Select messages */}
          <button
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={() => showPlaceholder("Select messages")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <CheckSquare className="w-4 h-4 text-zinc-400" />
            <span>Select messages</span>
          </button>

          {/* Mark as unread */}
          <button
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={() => handleAction(onMarkUnread, "Mark as unread")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <BookmarkMinus className="w-4 h-4 text-zinc-400" />
            <span>Mark as unread</span>
          </button>

          {/* Pin chat */}
          <button
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={() => handleAction(onPinChat, "Pin chat")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <Pin className="w-4 h-4 text-zinc-400" />
            <span>Pin chat</span>
          </button>

          {/* Archive */}
          <button
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={() => handleAction(onArchive, "Archive")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <Archive className="w-4 h-4 text-zinc-400" />
            <span>Archive</span>
          </button>

          <div className="my-1 border-t border-[#2a2a2a]" />

          {/* Block */}
          <button
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={() => handleAction(onBlock, "Block")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 text-zinc-200 hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <Ban className="w-4 h-4 text-zinc-400" />
            <span>Block</span>
          </button>

          {/* Delete */}
          <button
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={() => handleAction(onDelete, "Delete")}
            className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Delete</span>
          </button>

          {/* Leave group for groups */}
          {isGroup && (
            <button
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => handleAction(onLeaveGroup, "Leave group")}
              className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Leave group</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
