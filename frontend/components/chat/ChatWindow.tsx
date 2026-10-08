"use client";

import React, { useEffect, useRef } from "react";
import { Conversation, Message, User } from "@/types";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { MessageComposer } from "./MessageComposer";
import { ShieldCheck, Lock } from "lucide-react";

interface ChatWindowProps {
  conversation?: Conversation | null;
  messages: Message[];
  currentUser: User;
  isTyping?: boolean;
  typingUser?: string;
  onSendMessage: (content: string) => void;
  onBack: () => void;
  onOpenDetails: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  isTyping = false,
  typingUser,
  onSendMessage,
  onBack,
  onOpenDetails,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or typing state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Calm Empty State when no conversation is selected
  if (!conversation) {
    return (
      <div className="flex-1 h-full hidden md:flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-[#121212] select-none text-center">
        <div className="w-16 h-16 rounded-3xl bg-zinc-200/70 dark:bg-zinc-800 flex items-center justify-center mb-4 text-[#2C6BED]">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">
          Signal Web
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
          Send and receive messages with privacy by design. Select a conversation from the sidebar to start messaging.
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium bg-zinc-200/50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-full">
          <Lock className="w-3 h-3 text-[#2C6BED]" />
          <span>Simulated End-to-End Encryption</span>
        </div>
      </div>
    );
  }

  const isGroup = conversation.type === "group";

  return (
    <section className="flex-1 h-full flex flex-col bg-white dark:bg-[#121212] relative overflow-hidden">
      {/* Pinned Chat Header */}
      <ChatHeader
        conversation={conversation}
        currentUser={currentUser}
        onBack={onBack}
        onOpenDetails={onOpenDetails}
      />

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
        {/* Security / Encryption Badge at top of conversation */}
        <div className="flex justify-center my-3 select-none">
          <div className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-[#202020] text-zinc-500 dark:text-zinc-400 text-[11px] px-3 py-1 rounded-full border border-zinc-200/60 dark:border-zinc-800">
            <Lock className="w-3 h-3 text-[#2C6BED]" />
            <span>Messages in this conversation are private and encrypted</span>
          </div>
        </div>

        {/* Date separator */}
        <div className="flex justify-center my-2 select-none">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-[#1c1c1c] px-2.5 py-0.5 rounded-full">
            Today
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col justify-end">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOutgoing={msg.sender_id === currentUser.id}
                isGroup={isGroup}
              />
            ))
          ) : (
            <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 select-none">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send a message below to start chatting.</p>
            </div>
          )}

          {/* Active Typing Indicator */}
          {isTyping && <TypingIndicator displayName={typingUser} />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Pinned Message Composer */}
      <MessageComposer onSendMessage={onSendMessage} />
    </section>
  );
};
