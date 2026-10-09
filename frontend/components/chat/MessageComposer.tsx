"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Smile, Mic, Plus, Send } from "lucide-react";
import { AttachmentMenu } from "./AttachmentMenu";
import { EmojiPicker } from "./EmojiPicker";

interface MessageComposerProps {
  onSendMessage: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
  draftText?: string;
  onDraftChange?: (text: string) => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  draftText = "",
  onDraftChange,
}) => {
  const [content, setContent] = useState(draftText);
  const prevDraftRef = useRef(draftText);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize when conversation draft switches
  useEffect(() => {
    if (prevDraftRef.current !== draftText) {
      prevDraftRef.current = draftText;
      setContent(draftText);
    }
  }, [draftText]);

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

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    onDraftChange?.(val);

    if (val.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart?.();
      }

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        stopTyping();
      }, 2500);
    } else {
      stopTyping();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    stopTyping();

    onSendMessage(trimmed);
    setContent("");
    onDraftChange?.("");
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

  const handleInsertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const next = content + emoji;
      setContent(next);
      onDraftChange?.(next);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    onDraftChange?.(next);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 10);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const hasContent = content.trim().length > 0;

  return (
    <footer className="px-4 py-3 bg-[#1a1a1a] border-t border-[#262626]/80 relative flex-shrink-0">
      {/* Toast */}
      {toast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#282828] text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-[#333333] pointer-events-none z-30">
          {toast}
        </div>
      )}

      {/* Emoji Picker Popover */}
      <EmojiPicker
        isOpen={isEmojiOpen}
        onClose={() => setIsEmojiOpen(false)}
        onSelectEmoji={handleInsertEmoji}
      />

      {/* Attachment Menu Popup */}
      <AttachmentMenu
        isOpen={isAttachmentOpen}
        onClose={() => setIsAttachmentOpen(false)}
        onSelectOption={(type) => {
          if (type === "photos") showNotice("Photo attachments coming soon");
          else if (type === "file") showNotice("File attachments coming soon");
          else if (type === "poll") showNotice("Poll creation coming soon");
        }}
      />

      {/* Composer Row — matching Signal: [Emoji] [Input pill] [Mic/Send] [Attach+] */}
      <div className="flex items-end gap-2">
        {/* Left: Emoji Smiley */}
        <button
          type="button"
          onClick={() => setIsEmojiOpen(!isEmojiOpen)}
          className={`p-2 rounded-full transition-colors flex-shrink-0 mb-0.5 ${
            isEmojiOpen ? "text-white bg-[#282828]" : "text-zinc-400 hover:text-zinc-200 hover:bg-[#252525]"
          }`}
          title="Insert Emoji"
          aria-label="Insert Emoji"
        >
          <Smile className="w-5 h-5 stroke-[1.5]" />
        </button>

        {/* Center: Rounded Pill Message Input */}
        <div className="flex-1 flex items-end bg-[#2a2a2a] rounded-2xl px-4 py-2 focus-within:ring-1 focus-within:ring-[#2C6BED]/50 transition-shadow">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            rows={1}
            disabled={disabled}
            className="w-full bg-transparent text-[13px] text-zinc-100 placeholder-zinc-500 resize-none max-h-[100px] py-0 focus:outline-none leading-[1.4] align-bottom"
            aria-label="Message text"
          />
        </div>

        {/* Right: Voice note or Send */}
        {hasContent ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled}
            className="p-2 bg-[#2C6BED] text-white rounded-full hover:bg-[#2055c4] transition-colors flex-shrink-0 mb-0.5 shadow-sm"
            title="Send message"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => showNotice("Voice messages coming soon")}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#252525] rounded-full transition-colors flex-shrink-0 mb-0.5"
            title="Record voice message"
            aria-label="Record voice message"
          >
            <Mic className="w-5 h-5 stroke-[1.5]" />
          </button>
        )}

        {/* Attach + */}
        <button
          type="button"
          onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
          className={`p-2 rounded-full transition-colors flex-shrink-0 mb-0.5 ${
            isAttachmentOpen
              ? "text-white bg-[#282828]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#252525]"
          }`}
          title="Add attachment"
          aria-label="Add attachment"
        >
          <Plus className="w-5 h-5 stroke-[1.5]" />
        </button>
      </div>
    </footer>
  );
};
