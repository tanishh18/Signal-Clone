"use client";

import React, { useEffect, useRef } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";

interface InChatSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  matchCount: number;
}

export const InChatSearchBar: React.FC<InChatSearchBarProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  matchCount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="h-11 px-4 bg-[#1e1e1e] border-b border-[#2a2a2a] flex items-center justify-between gap-3 text-xs z-20 animate-fade-in select-none">
      <div className="flex items-center gap-2 flex-1 max-w-md bg-[#282828] rounded-lg px-2.5 py-1 text-zinc-100">
        <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search in conversation"
          className="bg-transparent w-full outline-none text-xs text-white placeholder-zinc-500"
        />
        {query && (
          <span className="text-[10px] text-zinc-400 whitespace-nowrap">
            {matchCount} {matchCount === 1 ? "match" : "matches"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 text-zinc-400">
        <button
          onClick={onClose}
          className="p-1 hover:text-white hover:bg-[#282828] rounded-md transition-colors"
          title="Close search"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
