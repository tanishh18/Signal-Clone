"use client";

import React, { useEffect, useRef } from "react";
import { Conversation, Message, User } from "@/types";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { MessageComposer } from "./MessageComposer";
import { Avatar } from "@/components/ui/Avatar";
import { MessageSquare, Users } from "lucide-react";

interface ChatWindowProps {
  conversation?: Conversation | null;
  messages: Message[];
  currentUser: User;
  isTyping?: boolean;
  typingUser?: string;
  onSendMessage: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onBack: () => void;
  onOpenDetails: () => void;
  onDeleteMessage?: (id: number) => void;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  isTyping = false,
  typingUser,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onBack,
  onOpenDetails,
  onDeleteMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // SIGNAL WELCOME / EMPTY CANVAS matching Screenshots 3 & 4
  if (!conversation) {
    return (
      <div className="flex-1 h-full hidden md:flex flex-col items-center justify-between p-12 bg-[#121212] select-none text-center">
        <div /> {/* Spacer */}

        {/* Centerpiece: Dotted Signal Speech Bubble Visual */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-400/80 flex items-center justify-center mb-6 text-zinc-100">
            <MessageSquare className="w-12 h-12 stroke-[1.5]" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
            Welcome to Signal
          </h2>

          <p className="text-xs text-zinc-400">
            See{" "}
            <span className="text-[#2C6BED] hover:underline cursor-pointer">
              what&apos;s new
            </span>{" "}
            in this update
          </p>
        </div>

        {/* Nonprofit Subtext Footer */}
        <footer className="text-[11px] text-zinc-500">
          Signal is a 501c3 nonprofit
        </footer>
      </div>
    );
  }

  const isGroup = conversation.type === "group";

  return (
    <section className="flex-1 h-full flex flex-col bg-[#121212] relative overflow-hidden">
      {/* Pinned Chat Header */}
      <ChatHeader
        conversation={conversation}
        currentUser={currentUser}
        onBack={onBack}
        onOpenDetails={onOpenDetails}
      />

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
        {/* GROUP WELCOME / IDENTITY CARD matching Screenshots 4 & 5 */}
        {isGroup && (
          <div className="flex flex-col items-center my-6 select-none">
            <div className="w-full max-w-sm bg-[#1c1c1c] border border-[#2a2a2a] rounded-3xl p-6 flex flex-col items-center text-center shadow-md">
              <div className="mb-3">
                <Avatar
                  name={conversation.name || "Group"}
                  src={conversation.avatar_url}
                  size="xl"
                  isGroup={true}
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {conversation.name}
              </h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  {conversation.members.length > 1
                    ? `${conversation.members.length} members`
                    : "No other group members yet"}
                </span>
              </p>
            </div>

            {/* System creation notice */}
            <p className="text-[11px] text-zinc-500 mt-4 flex items-center gap-1.5">
              <span>👥 You created the group.</span>
            </p>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 flex flex-col justify-end">
          {messages.length > 0 ? (
            messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

              const msgDate = msg.created_at || new Date().toISOString();
              const prevDate = prevMsg ? (prevMsg.created_at || new Date().toISOString()) : null;
              const nextDate = nextMsg ? (nextMsg.created_at || new Date().toISOString()) : null;

              const isDifferentDay = !prevMsg || (prevDate ? new Date(msgDate).toDateString() !== new Date(prevDate).toDateString() : true);
              const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id || isDifferentDay;
              const isNextDifferentDay = Boolean(nextMsg && nextDate && new Date(msgDate).toDateString() !== new Date(nextDate).toDateString());
              const isLastInGroup = Boolean(!nextMsg || nextMsg.sender_id !== msg.sender_id || isNextDifferentDay);

              return (
                <React.Fragment key={msg.temp_id || msg.id}>
                  {isDifferentDay && (
                    <div className="flex justify-center my-3 select-none">
                      <span className="text-[11px] font-medium text-zinc-400">
                        {formatDateSeparator(msgDate)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOutgoing={msg.sender_id === currentUser.id}
                    isGroup={isGroup}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    onDelete={onDeleteMessage}
                  />
                </React.Fragment>
              );
            })
          ) : (
            <div className="py-16 text-center text-zinc-500 select-none">
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
      <MessageComposer
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </section>
  );
};
