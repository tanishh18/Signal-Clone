"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip } from "lucide-react";

interface MessageComposerProps {
  onSendMessage: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
}) => {
  const [content, setContent] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop?.();
    }
  }, [onTypingStop]);

  // Cleanup typing when unmounting or disabled
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    if (val.trim().length > 0) {
      // First character: trigger typing.start
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart?.();
      }

      // Reset debounce inactivity timer (2.5s)
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        stopTyping();
      }, 2500);
    } else {
      // Input cleared
      stopTyping();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    // Immediately stop typing indicator on send
    stopTyping();

    onSendMessage(trimmed);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea up to 120px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const showAttachmentNotice = () => {
    setToast("File attachments are coming soon");
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <footer className="p-3 bg-white dark:bg-[#181818] border-t border-zinc-200 dark:border-[#282828] relative flex-shrink-0">
      {toast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs px-3 py-1 rounded-full shadow pointer-events-none z-20">
          {toast}
        </div>
      )}

      <div className="flex items-end gap-2 bg-zinc-100 dark:bg-[#222222] rounded-2xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#2C6BED]">
        <button
          type="button"
          onClick={showAttachmentNotice}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full transition-colors mb-0.5"
          title="Add attachment"
          aria-label="Add attachment"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Signal message"
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 resize-none max-h-[120px] py-1.5 focus:outline-none"
          aria-label="Message text"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className={`p-2 rounded-full mb-0.5 transition-all ${
            content.trim() && !disabled
              ? "bg-[#2C6BED] text-white hover:bg-[#2259c7] shadow-sm cursor-pointer"
              : "text-zinc-300 dark:text-zinc-600 cursor-not-allowed opacity-50"
          }`}
          title="Send message (Enter)"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
