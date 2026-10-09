"use client";

import React from "react";
import { Copy, CornerUpLeft, MoreHorizontal, Smile } from "lucide-react";

interface MessageHoverActionsProps {
  onCopy?: () => void;
  onReply?: () => void;
  onReact?: () => void;
  onMore?: () => void;
  isOutgoing: boolean;
}

export const MessageHoverActions: React.FC<MessageHoverActionsProps> = ({
  onCopy,
  onReply,
  onReact,
  onMore,
}) => {
  return (
    <div className="absolute -top-7 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#242424] text-zinc-300 rounded-full shadow-lg border border-[#333333] px-1 py-0.5 flex items-center gap-0.5 z-20 select-none">
      <button
        onClick={onReact}
        className="p-1 hover:text-white hover:bg-[#303030] rounded-full transition-colors"
        title="React"
      >
        <Smile className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onReply}
        className="p-1 hover:text-white hover:bg-[#303030] rounded-full transition-colors"
        title="Reply"
      >
        <CornerUpLeft className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onCopy}
        className="p-1 hover:text-white hover:bg-[#303030] rounded-full transition-colors"
        title="Copy text"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onMore}
        className="p-1 hover:text-white hover:bg-[#303030] rounded-full transition-colors"
        title="More"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
