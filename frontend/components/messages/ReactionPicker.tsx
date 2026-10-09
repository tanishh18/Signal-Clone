"use client";

import React, { useEffect, useRef } from "react";

interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
  isOutgoing: boolean;
}

const QUICK_REACTIONS = ["❤️", "👍", "👎", "😂", "😮", "😢", "🙏", "🔥"];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isOpen,
  onClose,
  onSelectReaction,
  isOutgoing,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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
      ref={popoverRef}
      className={`absolute -top-12 ${
        isOutgoing ? "right-0" : "left-0"
      } bg-[#202020] border border-[#2d2d2d] rounded-full px-2 py-1 shadow-2xl flex items-center gap-1 z-30 animate-fade-in select-none`}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            onSelectReaction(emoji);
            onClose();
          }}
          className="text-base w-7 h-7 flex items-center justify-center hover:scale-125 hover:bg-[#2c2c2c] rounded-full transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
