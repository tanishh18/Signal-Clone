"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  "👍", "❤️", "😂", "😮", "😢", "🙏", "🎉", "🔥",
  "😊", "😍", "👏", "✨", "💯", "🚀", "🤔", "🥺",
  "😭", "😎", "🥳", "🙌", "👀", "🤝", "💪", "💡",
  "⭐", "👋", "🥰", "😴", "🤫", "🤐", "🤷", "🤦"
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [search, setSearch] = useState("");
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
      className="absolute bottom-14 left-2 w-72 bg-[#202020] text-zinc-100 rounded-2xl shadow-2xl border border-[#2d2d2d] p-3 z-50 animate-fade-in select-none"
    >
      {/* Search Header */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#282828] rounded-xl mb-3 text-xs">
        <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji"
          className="bg-transparent w-full text-zinc-200 placeholder-zinc-500 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Emoji Grid */}
      <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto p-1">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-[#2c2c2c] rounded-lg transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
