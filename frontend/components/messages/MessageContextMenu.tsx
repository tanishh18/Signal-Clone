"use client";

import React, { useEffect, useRef } from "react";
import {
  CornerUpRight,
  Edit2,
  CheckSquare,
  Copy,
  Pin,
  Info,
  Trash2,
} from "lucide-react";

interface MessageContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
  onDelete?: () => void;
  onForward?: () => void;
  onInfo?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  isOutgoing: boolean;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  isOpen,
  onClose,
  onCopy,
  onDelete,
  onForward,
  onInfo,
  onPin,
  isPinned = false,
  isOutgoing,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-1 w-44 bg-[#202020] text-zinc-100 rounded-xl shadow-2xl border border-[#2d2d2d] py-1.5 z-50 animate-fade-in select-none text-[13px]"
    >
      <button
        onClick={() => {
          onClose();
          onForward?.();
        }}
        className="w-full px-3.5 py-1.5 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <CornerUpRight className="w-4 h-4 text-zinc-400" />
        <span>Forward</span>
      </button>

      {isOutgoing && (
        <button
          onClick={onClose}
          className="w-full px-3.5 py-1.5 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
        >
          <Edit2 className="w-4 h-4 text-zinc-400" />
          <span>Edit</span>
        </button>
      )}

      <button
        onClick={onClose}
        className="w-full px-3.5 py-1.5 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <CheckSquare className="w-4 h-4 text-zinc-400" />
        <span>Select</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onCopy();
        }}
        className="w-full px-3.5 py-1.5 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <Copy className="w-4 h-4 text-zinc-400" />
        <span>Copy text</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onPin?.();
        }}
        className="w-full px-3.5 py-1.5 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <Pin className="w-4 h-4 text-zinc-400" />
        <span>{isPinned ? "Unpin message" : "Pin message"}</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onInfo?.();
        }}
        className="w-full px-3.5 py-1.5 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <Info className="w-4 h-4 text-zinc-400" />
        <span>Info</span>
      </button>

      <div className="my-1 border-t border-[#2a2a2a]" />

      <button
        onClick={() => {
          onClose();
          onDelete?.();
        }}
        className="w-full px-3.5 py-1.5 flex items-center gap-3 hover:bg-rose-500/10 text-rose-400 transition-colors text-left"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete</span>
      </button>
    </div>
  );
};
