"use client";

import React, { useEffect, useRef } from "react";
import { Image as ImageIcon, FileText, BarChart2 } from "lucide-react";

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (type: "photos" | "file" | "poll") => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  isOpen,
  onClose,
  onSelectOption,
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
      className="absolute bottom-14 right-2 w-48 bg-[#202020] text-zinc-100 rounded-xl shadow-2xl border border-[#2d2d2d] py-1.5 z-50 animate-fade-in select-none"
    >
      <button
        onClick={() => {
          onClose();
          onSelectOption("photos");
        }}
        className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <ImageIcon className="w-4 h-4 text-zinc-400" />
        <span>Photos &amp; videos</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onSelectOption("file");
        }}
        className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <FileText className="w-4 h-4 text-zinc-400" />
        <span>File</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onSelectOption("poll");
        }}
        className="w-full px-3.5 py-2 text-[13px] font-normal flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors text-left"
      >
        <BarChart2 className="w-4 h-4 text-zinc-400" />
        <span>Poll</span>
      </button>
    </div>
  );
};
