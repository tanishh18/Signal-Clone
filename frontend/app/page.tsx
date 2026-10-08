"use client";

import React, { useState, useEffect } from "react";
import { ConversationSidebar } from "@/components/sidebar/ConversationSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { GroupDetailsModal } from "@/components/groups/GroupDetailsModal";
import {
  mockCurrentUser,
  mockConversations,
  mockMessagesByConvId,
} from "@/services/mockData";
import { Message } from "@/types";

export default function Home() {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedId, setSelectedId] = useState<number | null>(1); // Default to first conversation
  const [messagesByConv, setMessagesByConv] = useState<Record<number, Message[]>>(mockMessagesByConvId);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Synchronize dark theme class with html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const activeConversation = conversations.find((c) => c.id === selectedId);
  const activeMessages = selectedId ? messagesByConv[selectedId] || [] : [];

  const handleSendMessage = (content: string) => {
    if (!selectedId) return;

    const newMsg: Message = {
      id: Date.now(),
      conversation_id: selectedId,
      sender_id: mockCurrentUser.id,
      content,
      message_type: "text",
      status: "sent",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Append to active message history
    setMessagesByConv((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg],
    }));

    // Update conversation's latest message preview
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, latest_message: newMsg, updated_at: newMsg.created_at }
          : c
      )
    );
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-white dark:bg-[#121212] text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs px-4 py-2 rounded-full shadow-xl z-50 animate-fade-in pointer-events-none">
          {notice}
        </div>
      )}

      {/* Main 2-Pane Messenger Shell */}
      <div className="flex-1 flex overflow-hidden w-full h-full">
        {/* Sidebar: Visible on desktop, or on mobile when no conversation is selected */}
        <div
          className={`h-full ${
            selectedId !== null ? "hidden md:flex" : "flex w-full"
          }`}
        >
          <ConversationSidebar
            currentUser={mockCurrentUser}
            conversations={conversations}
            selectedId={selectedId}
            onSelectConversation={(id) => setSelectedId(id)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNewChat={() => showNotice("Contact search modal available in Phase 11")}
            onNewGroup={() => showNotice("Group creation modal available in Phase 10")}
          />
        </div>

        {/* Chat Area: Visible on desktop, or on mobile when a conversation is selected */}
        <div
          className={`flex-1 h-full ${
            selectedId === null ? "hidden md:flex" : "flex w-full"
          }`}
        >
          <ChatWindow
            conversation={activeConversation}
            messages={activeMessages}
            currentUser={mockCurrentUser}
            onSendMessage={handleSendMessage}
            onBack={() => setSelectedId(null)}
            onOpenDetails={() => setIsDetailsOpen(true)}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        currentUser={mockCurrentUser}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Group / Contact Details Modal */}
      <GroupDetailsModal
        isOpen={isDetailsOpen}
        conversation={activeConversation}
        currentUser={mockCurrentUser}
        onClose={() => setIsDetailsOpen(false)}
      />
    </main>
  );
}
