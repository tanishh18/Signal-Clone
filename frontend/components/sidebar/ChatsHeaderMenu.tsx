"use client";

import React, { useEffect, useRef } from "react";
import { Archive, FolderPlus, Moon, ChevronRight } from "lucide-react";

interface ChatsHeaderMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onViewArchive?: () => void;
  onAddFolder?: () => void;
  onNotificationProfile?: () => void;
}

export const ChatsHeaderMenu: React.FC<ChatsHeaderMenuProps> = ({
  isOpen,
  onClose,
  onViewArchive,
  onAddFolder,
  onNotificationProfile,
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
      className="absolute top-12 right-2 w-56 bg-[#202020] text-zinc-100 rounded-xl shadow-2xl border border-[#2d2d2d] py-1.5 z-50 animate-fade-in select-none"
    >
      <button
        onClick={() => {
          onClose();
          onViewArchive?.();
        }}
        className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <Archive className="w-4 h-4 text-zinc-400" />
        <span>View Archive</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onAddFolder?.();
        }}
        className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <FolderPlus className="w-4 h-4 text-zinc-400" />
        <span>Add chat folder</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onNotificationProfile?.();
        }}
        className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center justify-between hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Moon className="w-4 h-4 text-zinc-400" />
          <span>Notification profile</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
      </button>
    </div>
  );
};
