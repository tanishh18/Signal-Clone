"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Conversation, Message, User } from "@/types";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { MessageComposer } from "./MessageComposer";
import { InChatSearchBar } from "./InChatSearchBar";
import { CallModal } from "./CallModal";
import { SafetyNumberModal } from "./SafetyNumberModal";
import { Avatar } from "@/components/ui/Avatar";
import { MessageSquare, Users, Pin } from "lucide-react";

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
  onReact?: (messageId: number, emoji: string) => void;
  onTogglePin?: (messageId: number) => void;
  onCopy?: (text: string) => void;
  draftText?: string;
  onDraftChange?: (text: string) => void;
  onLeaveGroup?: (conversationId: number) => void;
  onMarkUnread?: (conversationId: number) => void;
  onPinChat?: (conversationId: number) => void;
  onArchive?: (conversationId: number) => void;
  onDeleteChat?: (conversationId: number) => void;
  onBlock?: (conversationId: number) => void;
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
  onReact,
  onTogglePin,
  onCopy,
  draftText = "",
  onDraftChange,
  onLeaveGroup,
  onMarkUnread,
  onPinChat,
  onArchive,
  onDeleteChat,
  onBlock,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // In-chat search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  // Call simulation state
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isSafetyNumberOpen, setIsSafetyNumberOpen] = useState(false);

  // Matching messages for in-chat search
  const matchedMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q)).map((m) => m.id);
  }, [messages, searchQuery]);

  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.is_pinned);
  }, [messages]);

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
        onSearchInChat={() => setIsSearchOpen(true)}
        onStartCall={(video) => {
          setIsVideoCall(video);
          setIsCallOpen(true);
        }}
        onVerifySafetyNumber={() => setIsSafetyNumberOpen(true)}
        onLeaveGroup={
          conversation.type === "group" && onLeaveGroup
            ? () => onLeaveGroup(conversation.id)
            : undefined
        }
        onMarkUnread={onMarkUnread ? () => onMarkUnread(conversation.id) : undefined}
        onPinChat={onPinChat ? () => onPinChat(conversation.id) : undefined}
        onArchive={onArchive ? () => onArchive(conversation.id) : undefined}
        onDelete={onDeleteChat ? () => onDeleteChat(conversation.id) : undefined}
        onBlock={onBlock ? () => onBlock(conversation.id) : undefined}
      />

      {/* Safety Number Verification Modal */}
      <SafetyNumberModal
        isOpen={isSafetyNumberOpen}
        onClose={() => setIsSafetyNumberOpen(false)}
        contactName={conversation.name || "Contact"}
        avatarUrl={conversation.avatar_url}
      />

      {/* In-Chat Search Bar */}
      <InChatSearchBar
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery("");
        }}
        query={searchQuery}
        onQueryChange={(q) => {
          setSearchQuery(q);
          setActiveMatchIndex(0);
        }}
        matchCount={matchedMessageIds.length}
        activeMatchIndex={activeMatchIndex}
        onNextMatch={() => {
          if (matchedMessageIds.length > 0) {
            setActiveMatchIndex((i) => (i + 1) % matchedMessageIds.length);
          }
        }}
        onPrevMatch={() => {
          if (matchedMessageIds.length > 0) {
            setActiveMatchIndex((i) => (i - 1 + matchedMessageIds.length) % matchedMessageIds.length);
          }
        }}
      />

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-[#1a1a1a] border-b border-[#252525] flex items-center justify-between text-xs text-zinc-300 z-10 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45 flex-shrink-0" />
            <span className="font-semibold text-white">Pinned message:</span>
            <span className="truncate text-zinc-300">
              {pinnedMessages[pinnedMessages.length - 1].content}
            </span>
          </div>
          <button
            onClick={() => onTogglePin?.(pinnedMessages[pinnedMessages.length - 1].id)}
            className="text-[11px] text-[#2C6BED] hover:underline flex-shrink-0 font-medium ml-2"
          >
            Unpin
          </button>
        </div>
      )}

      {/* Simulated Call Modal */}
      <CallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        contactName={conversation.name || "Signal Contact"}
        avatarUrl={conversation.avatar_url}
        isVideo={isVideoCall}
      />

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
        {/* GROUP WELCOME / IDENTITY CARD matching Signal Desktop */}
        {isGroup && (
          <div className="flex flex-col items-center my-6 select-none">
            <div className="w-full max-w-sm bg-[#1e1e1e] border border-[#2b2b2b]/60 rounded-3xl p-5 flex flex-col items-center text-center shadow-xs">
              <div className="mb-2.5">
                <Avatar
                  name={conversation.name || "Group"}
                  src={conversation.avatar_url}
                  size="xl"
                  isGroup={true}
                />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
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
            <p className="text-[10px] text-zinc-500 mt-3 flex items-center gap-1">
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
                    <div className="flex justify-center my-2 select-none">
                      <span className="text-[10px] font-normal text-zinc-500">
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
                    currentUserId={currentUser.id}
                    searchHighlight={searchQuery}
                    onDelete={onDeleteMessage}
                    onCopy={onCopy}
                    onTogglePin={onTogglePin}
                    onReact={onReact}
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
        draftText={draftText}
        onDraftChange={onDraftChange}
      />
    </section>
  );
};
