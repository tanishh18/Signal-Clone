"use client";

import React from "react";

interface TypingIndicatorProps {
  displayName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  displayName = "Someone",
}) => {
  return (
    <div className="flex items-center gap-2 mb-2 select-none animate-fade-in">
      <div className="bg-[#f1f3f5] dark:bg-[#282828] text-zinc-600 dark:text-zinc-300 px-3.5 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 mr-1">
          {displayName} is typing
        </span>
        <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
};
