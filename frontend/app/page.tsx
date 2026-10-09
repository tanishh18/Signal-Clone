"use client";

import React, { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoginView } from "@/components/auth/LoginView";
import { ConversationSidebar } from "@/components/sidebar/ConversationSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { NavigationRail, NavSection } from "@/components/layout/NavigationRail";
import { SettingsView } from "@/components/settings/SettingsView";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { GroupDetailsView } from "@/components/chat/GroupDetailsView";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { NewGroupModal } from "@/components/groups/NewGroupModal";
import {
  getConversations,
  getConversationDetails,
  getConversationMessages,
  sendRestMessage,
  markConversationAsRead,
} from "@/lib/api";
import { signalWs } from "@/lib/websocket";
import { Conversation, Message } from "@/types";
import { CallsView } from "@/components/layout/CallsView";
import { StoriesView } from "@/components/layout/StoriesView";
import { ShieldCheck, Loader2 } from "lucide-react";

function MessengerApp() {
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<NavSection>("chats");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | undefined>(undefined);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("signal_dark_mode");
      if (saved !== null) return saved === "true";
    }
    return true;
  });
  const [drafts, setDrafts] = useState<Record<number, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("signal_drafts");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState<"contacts" | "search">("contacts");
  const [newChatInitialQuery, setNewChatInitialQuery] = useState("");
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedIdRef = useRef<number | null>(selectedId);
  const conversationsRef = useRef<Conversation[]>(conversations);
  const typingReceiverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Synchronize dark theme class with html element and persist
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("signal_dark_mode", String(isDarkMode));
    } catch {}
  }, [isDarkMode]);

  // Persist drafts
  const handleDraftChange = (convId: number, text: string) => {
    setDrafts((prev) => {
      const next = { ...prev, [convId]: text };
      try {
        localStorage.setItem("signal_drafts", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Toggle reaction on a message
  const handleReactToMessage = (messageId: number, emoji: string) => {
    if (!currentUser) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || [];
        const existingIdx = currentReactions.findIndex((r) => r.emoji === emoji);

        if (existingIdx >= 0) {
          const target = currentReactions[existingIdx];
          const hasMine = target.user_id === currentUser.id || target.users?.includes(currentUser.id);

          if (hasMine) {
            // Remove my reaction
            const newCount = (target.count || 1) - 1;
            if (newCount <= 0) {
              return {
                ...m,
                reactions: currentReactions.filter((_, idx) => idx !== existingIdx),
              };
            } else {
              return {
                ...m,
                reactions: currentReactions.map((r, idx) =>
                  idx === existingIdx
                    ? {
                        ...r,
                        count: newCount,
                        users: r.users?.filter((u) => u !== currentUser.id) || [],
                      }
                    : r
                ),
              };
            }
          } else {
            // Add my reaction to existing emoji
            return {
              ...m,
              reactions: currentReactions.map((r, idx) =>
                idx === existingIdx
                  ? {
                      ...r,
                      count: (r.count || 1) + 1,
                      users: [...(r.users || [r.user_id]), currentUser.id],
                    }
                  : r
              ),
            };
          }
        } else {
          // Add brand new reaction
          return {
            ...m,
            reactions: [
              ...currentReactions,
              {
                emoji,
                user_id: currentUser.id,
                count: 1,
                users: [currentUser.id],
              },
            ],
          };
        }
      })
    );
  };

  // Toggle pin on a message
  const handleTogglePinMessage = (messageId: number) => {
    setMessages((prev) => {
      const target = prev.find((m) => m.id === messageId);
      const isNowPinned = !target?.is_pinned;
      showNotice(isNowPinned ? "Message pinned" : "Message unpinned");
      return prev.map((m) =>
        m.id === messageId ? { ...m, is_pinned: isNowPinned } : m
      );
    });
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  // Keyboard Shortcuts (Cmd/Ctrl+K, Cmd/Ctrl+N, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setNewChatTab("search");
        setNewChatInitialQuery("");
        setIsNewChatOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const searchInput = document.querySelector('input[aria-label="Search"]') as HTMLInputElement;
        searchInput?.focus();
      } else if (e.key === "Escape") {
        if (isDetailsOpen) setIsDetailsOpen(false);
        if (isNewChatOpen) setIsNewChatOpen(false);
        if (isNewGroupOpen) setIsNewGroupOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailsOpen, isNewChatOpen, isNewGroupOpen]);

  // Load conversations when user is authenticated
  useEffect(() => {
    if (!currentUser) return;
    let isCancelled = false;

    const fetchConvs = async () => {
      setIsLoadingConversations(true);
      try {
        const data = await getConversations();
        if (!isCancelled) {
          setConversations(data);
          if (data.length > 0 && selectedIdRef.current === null && window.innerWidth >= 768) {
            setSelectedId(data[0].id);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load conversations";
          showNotice(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingConversations(false);
        }
      }
    };

    fetchConvs();
    return () => {
      isCancelled = true;
    };
  }, [currentUser]);

  // Load message history when selected conversation changes
  useEffect(() => {
    if (!selectedId || !currentUser) {
      return;
    }

    let isMounted = true;
    const fetchMsgs = async () => {
      setIsLoadingMessages(true);
      try {
        const history = await getConversationMessages(selectedId);
        if (!isMounted) return;
        setMessages((current) => {
          // Deduplicate and merge: preserve any new real-time messages that arrived while fetching history
          const historyMap = new Map<number, Message>();
          history.forEach((m) => historyMap.set(m.id, m));

          current.forEach((m) => {
            if (!historyMap.has(m.id)) {
              historyMap.set(m.id, m);
            }
          });

          return Array.from(historyMap.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load messages";
          showNotice(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchMsgs();
    return () => {
      isMounted = false;
    };
  }, [selectedId, currentUser]);

  // Handle switching / selecting conversations
  const handleSelectConversation = (id: number) => {
    // Clear typing state from previous conversation immediately
    setIsTyping(false);
    setTypingUser(undefined);
    if (typingReceiverTimerRef.current) {
      clearTimeout(typingReceiverTimerRef.current);
      typingReceiverTimerRef.current = null;
    }

    setSelectedId(id);
    setActiveSection("chats");
    setIsDetailsOpen(false);

    // Clear local unread count
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
    );

    // Emit read receipt via WebSocket and REST API
    signalWs.send("message.read", { conversation_id: id });
    markConversationAsRead(id).catch(() => {});
  };

  // Reconnection and real-time state recovery
  useEffect(() => {
    if (!currentUser) return;

    const unsubStatus = signalWs.onStatusChange((status) => {
      if (status === "connected") {
        // Reset receiver typing state on reconnect
        setIsTyping(false);
        setTypingUser(undefined);

        // Catch up on conversations list
        getConversations().then((data) => setConversations(data)).catch(() => {});

        // If in active conversation, refresh message history to recover any missed events
        const currentActiveId = selectedIdRef.current;
        if (currentActiveId) {
          getConversationMessages(currentActiveId)
            .then((history) => {
              setMessages((current) => {
                const map = new Map<number, Message>();
                history.forEach((m) => map.set(m.id, m));
                current.forEach((m) => {
                  if (!map.has(m.id)) map.set(m.id, m);
                });
                return Array.from(map.values()).sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            })
            .catch(() => {});
        }
      } else if (status === "disconnected" || status === "error") {
        // Clear typing indicator on disconnect
        setIsTyping(false);
        setTypingUser(undefined);
      }
    });

    return () => {
      unsubStatus();
    };
  }, [currentUser]);

  // Listen to WebSocket events (message.created, message.delivered, message.read, typing, presence)
  useEffect(() => {
    if (!currentUser) return;

    // 1. New message created
    const unsubMsgCreated = signalWs.on("message.created", (newMsg: Message) => {
      const activeId = selectedIdRef.current;
      const isFromOther = newMsg.sender_id !== currentUser.id;

      // If received from another user, send delivery receipt
      if (isFromOther) {
        signalWs.send("message.delivered", {
          conversation_id: newMsg.conversation_id,
          message_id: newMsg.id,
        });
      }

      // Update message thread if it belongs to currently active conversation
      if (activeId === newMsg.conversation_id) {
        setMessages((prev) => {
          // Check if message with identical server ID already exists
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          // Reconcile optimistic message by temp_id if present
          if (newMsg.temp_id && prev.some((m) => m.temp_id === newMsg.temp_id)) {
            return prev.map((m) => (m.temp_id === newMsg.temp_id ? newMsg : m));
          }
          // Append new incoming message
          return [...prev, newMsg];
        });

        // If conversation is open and message is from another party, mark as read immediately
        if (isFromOther) {
          signalWs.send("message.read", {
            conversation_id: newMsg.conversation_id,
          });
          markConversationAsRead(newMsg.conversation_id).catch(() => {});
        }
      }

      // Update conversation preview and ordering in sidebar
      setConversations((prev) => {
        const existingConv = prev.find((c) => c.id === newMsg.conversation_id);
        if (!existingConv) {
          // If conversation isn't in sidebar yet, reload conversation list from API
          getConversations().then((data) => setConversations(data));
          return prev;
        }

        const isCurrentActive = activeId === newMsg.conversation_id;
        const isFromSelf = newMsg.sender_id === currentUser.id;

        const exists = prev.some((c) => c.id === newMsg.conversation_id);
        if (!exists) {
          getConversationDetails(newMsg.conversation_id)
            .then((newConv) => {
              setConversations((curr) => {
                if (curr.some((c) => c.id === newConv.id)) return curr;
                const newEntry: Conversation = {
                  ...newConv,
                  latest_message: newMsg,
                  unread_count: isCurrentActive || isFromSelf ? 0 : 1,
                  updated_at: newMsg.created_at,
                };
                return [newEntry, ...curr];
              });
            })
            .catch(() => {});
        }

        const updated = prev.map((c) => {
          if (c.id === newMsg.conversation_id) {
            return {
              ...c,
              latest_message: newMsg,
              updated_at: newMsg.created_at,
              unread_count: isCurrentActive || isFromSelf ? 0 : c.unread_count + 1,
            };
          }
          return c;
        });

        // Reorder so most recently active conversation is at the top
        return updated.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
    });

    // 2. Message delivered confirmation
    const unsubDelivered = signalWs.on(
      "message.delivered",
      (data: { conversation_id: number; message_id: number; user_id: number }) => {
        const { conversation_id, message_id } = data;
        const activeId = selectedIdRef.current;

        // If active conversation, update message status to delivered
        if (conversation_id === activeId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === message_id && (m.status === "sent" || m.status === "sending")
                ? { ...m, status: "delivered" }
                : m
            )
          );
        }

        // Update latest message in sidebar if matching
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversation_id &&
            c.latest_message?.id === message_id &&
            (c.latest_message.status === "sent" || c.latest_message.status === "sending")
              ? {
                  ...c,
                  latest_message: { ...c.latest_message, status: "delivered" },
                }
              : c
          )
        );
      }
    );

    // 3. Message read confirmation
    const unsubRead = signalWs.on(
      "message.read",
      (data: {
        conversation_id: number;
        reader_id: number;
        read_at: string;
        marked_count: number;
      }) => {
        const { conversation_id, reader_id, read_at } = data;
        const activeId = selectedIdRef.current;

        // Update active messages sent by current user to 'read' (for direct conversations)
        // or record the per-user read receipt (for group conversations)
        if (conversation_id === activeId) {
          setMessages((prev) => {
            const isGroupConv = conversationsRef.current.find((c) => c.id === conversation_id)?.type === "group";
            return prev.map((m) => {
              if (m.sender_id === currentUser.id) {
                const alreadyRead = m.reads?.some((r) => r.user_id === reader_id);
                const updatedReads = alreadyRead
                  ? m.reads
                  : [...(m.reads || []), { user_id: reader_id, read_at }];
                return {
                  ...m,
                  status: isGroupConv ? m.status : "read",
                  reads: updatedReads,
                };
              }
              return m;
            });
          });
        }

        // Update conversation sidebar preview and reset reader unread count
        setConversations((prev) => {
          const isGroupConv = prev.find((c) => c.id === conversation_id)?.type === "group";
          return prev.map((c) => {
            if (c.id === conversation_id) {
              const isReaderSelf = reader_id === currentUser.id;
              let updatedLatest = c.latest_message;
              if (updatedLatest && updatedLatest.sender_id === currentUser.id && !isGroupConv) {
                updatedLatest = { ...updatedLatest, status: "read" };
              }
              return {
                ...c,
                unread_count: isReaderSelf ? 0 : c.unread_count,
                latest_message: updatedLatest,
              };
            }
            return c;
          });
        });
      }
    );

    // 4. Real-time typing indicators: typing.start
    const unsubTypingStart = signalWs.on(
      "typing.start",
      (data: {
        conversation_id: number;
        user_id: number;
        username: string;
        display_name: string;
      }) => {
        const activeId = selectedIdRef.current;
        if (data.conversation_id === activeId && data.user_id !== currentUser.id) {
          setIsTyping(true);
          setTypingUser(data.display_name || data.username || "Someone");

          // Reset defensive receiver timeout (3.5s) to auto-clear typing if stop event dropped
          if (typingReceiverTimerRef.current) {
            clearTimeout(typingReceiverTimerRef.current);
          }
          typingReceiverTimerRef.current = setTimeout(() => {
            setIsTyping(false);
            setTypingUser(undefined);
            typingReceiverTimerRef.current = null;
          }, 3500);
        }
      }
    );

    // 5. Real-time typing indicators: typing.stop
    const unsubTypingStop = signalWs.on(
      "typing.stop",
      (data: {
        conversation_id: number;
        user_id: number;
        username: string;
        display_name: string;
      }) => {
        const activeId = selectedIdRef.current;
        if (data.conversation_id === activeId && data.user_id !== currentUser.id) {
          setIsTyping(false);
          setTypingUser(undefined);
          if (typingReceiverTimerRef.current) {
            clearTimeout(typingReceiverTimerRef.current);
            typingReceiverTimerRef.current = null;
          }
        }
      }
    );

    // 6. Real-time presence updates: user.online
    const unsubUserOnline = signalWs.on("user.online", (data: { user_id: number }) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          members: c.members.map((m) =>
            m.user_id === data.user_id
              ? { ...m, user: { ...m.user, is_online: true } }
              : m
          ),
        }))
      );
    });

    // 7. Real-time presence updates: user.offline
    const unsubUserOffline = signalWs.on(
      "user.offline",
      (data: { user_id: number; last_seen?: string }) => {
        setConversations((prev) =>
          prev.map((c) => ({
            ...c,
            members: c.members.map((m) =>
              m.user_id === data.user_id
                ? {
                    ...m,
                    user: {
                      ...m.user,
                      is_online: false,
                      last_seen: data.last_seen || new Date().toISOString(),
                    },
                  }
                : m
            ),
          }))
        );
      }
    );

    return () => {
      unsubMsgCreated();
      unsubDelivered();
      unsubRead();
      unsubTypingStart();
      unsubTypingStop();
      unsubUserOnline();
      unsubUserOffline();
    };
  }, [currentUser]);

  // Typing event triggers for MessageComposer
  const handleTypingStart = () => {
    if (!selectedIdRef.current) return;
    signalWs.send("typing.start", { conversation_id: selectedIdRef.current });
  };

  const handleTypingStop = () => {
    if (!selectedIdRef.current) return;
    signalWs.send("typing.stop", { conversation_id: selectedIdRef.current });
  };

  // Sending a message
  const handleSendMessage = async (content: string) => {
    if (!selectedId || !currentUser || !content.trim()) return;

    const tempId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const optimisticMsg: Message = {
      id: Date.now(), // Temporary local ID
      conversation_id: selectedId,
      sender_id: currentUser.id,
      content: content.trim(),
      message_type: "text",
      status: "sending",
      created_at: nowIso,
      updated_at: nowIso,
      sender: currentUser,
      temp_id: tempId,
    };

    // 1. Optimistic UI update: append immediately
    setMessages((prev) => [...prev, optimisticMsg]);

    // 2. Update conversation list preview optimistically
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === selectedId
          ? { ...c, latest_message: optimisticMsg, updated_at: nowIso }
          : c
      );
      return updated.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    // 3. Dispatch via WebSocket
    const sentViaWs = signalWs.send("message.send", {
      conversation_id: selectedId,
      content: content.trim(),
      reply_to_id: null,
      temp_id: tempId,
    });

    // If WebSocket is not currently connected, fall back to REST API
    if (!sentViaWs) {
      try {
        const persisted = await sendRestMessage(selectedId, content.trim());
        setMessages((prev) =>
          prev.map((m) => (m.temp_id === tempId ? persisted : m))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to send message";
        showNotice(msg);
        // Mark message as sent in UI
        setMessages((prev) =>
          prev.map((m) =>
            m.temp_id === tempId ? { ...m, status: "sent" } : m
          )
        );
      }
    }
  };

  const handleConversationCreated = (conv: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id);
      if (exists) {
        return prev;
      }
      return [conv, ...prev];
    });
    handleSelectConversation(conv.id);
  };

  const handleOpenContacts = () => {
    setNewChatTab("contacts");
    setNewChatInitialQuery("");
    setIsNewChatOpen(true);
  };

  const handleOpenNewChat = () => {
    setNewChatTab("search");
    setNewChatInitialQuery("");
    setIsNewChatOpen(true);
  };

  const handleGlobalSearch = (q: string) => {
    setNewChatTab("search");
    setNewChatInitialQuery(q);
    setIsNewChatOpen(true);
  };

  // Loading screen during initial authentication check
  if (authLoading) {
    return (
      <main className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-[#121212] select-none text-zinc-900 dark:text-zinc-100">
        <div className="w-14 h-14 rounded-2xl bg-[#2C6BED] text-white flex items-center justify-center shadow-lg shadow-[#2C6BED]/20 mb-4 animate-pulse">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#2C6BED]" />
          <span>Starting Signal...</span>
        </p>
      </main>
    );
  }

  // If user is not authenticated, render LoginView
  if (!currentUser) {
    return <LoginView />;
  }

  const activeConversation = conversations.find((c) => c.id === selectedId);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <main className="h-screen w-screen overflow-hidden flex bg-[#121212] text-zinc-100 font-sans select-none relative">
      {/* Top subtle sync indicator */}
      {(isLoadingConversations || isLoadingMessages) && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#2C6BED] animate-pulse z-50 pointer-events-none" />
      )}

      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#282828] text-white text-xs px-4 py-2 rounded-full shadow-xl z-50 border border-[#333333] animate-fade-in pointer-events-none">
          {notice}
        </div>
      )}

      {/* TIER 1: Far-Left Desktop Navigation Rail (Hidden on mobile) */}
      <div className="hidden md:flex h-full">
        <NavigationRail
          activeSection={activeSection}
          onSelectSection={(sec) => {
            setActiveSection(sec);
          }}
          unreadCount={totalUnread}
        />
      </div>

      {/* MAIN BODY: Depends on activeSection */}
      {activeSection === "settings" ? (
        /* Full-screen dedicated Settings View */
        <div className="flex-1 h-full flex overflow-hidden">
          <SettingsView
            currentUser={currentUser}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onLogout={logout}
            onClose={() => setActiveSection("chats")}
          />
        </div>
      ) : activeSection === "calls" ? (
        /* Real Calls View */
        <div className="flex-1 h-full flex overflow-hidden">
          <CallsView />
        </div>
      ) : activeSection === "stories" ? (
        /* Real Stories View */
        <div className="flex-1 h-full flex overflow-hidden">
          <StoriesView currentUser={currentUser} />
        </div>
      ) : (
        /* Active Chats: 2-Pane Split (Sidebar + Canvas) */
        <div className="flex-1 flex overflow-hidden w-full h-full">
          {/* Tier 2: Chats Sidebar (Visible on desktop, or mobile when no conversation selected) */}
          <div
            className={`h-full ${
              selectedId !== null ? "hidden md:flex" : "flex w-full md:w-auto"
            }`}
          >
            <ConversationSidebar
              currentUser={currentUser}
              conversations={conversations}
              selectedId={selectedId}
              onSelectConversation={handleSelectConversation}
              onOpenSettings={() => setActiveSection("settings")}
              onNewChat={handleOpenNewChat}
              onNewGroup={() => setIsNewGroupOpen(true)}
              onOpenContacts={handleOpenContacts}
              onGlobalSearch={handleGlobalSearch}
            />
          </div>

          {/* Tier 3: Main Chat Canvas (Visible on desktop, or mobile when chat selected) */}
          <div
            className={`flex-1 h-full ${
              selectedId === null ? "hidden md:flex" : "flex w-full"
            }`}
          >
            {isDetailsOpen && activeConversation ? (
              <GroupDetailsView
                conversation={activeConversation}
                currentUser={currentUser}
                onBack={() => setIsDetailsOpen(false)}
                onMembersUpdated={(updatedMembers) => {
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === activeConversation.id
                        ? { ...c, members: updatedMembers }
                        : c
                    )
                  );
                }}
                onLeaveGroup={(convId) => {
                  setConversations((prev) =>
                    prev.filter((c) => c.id !== convId)
                  );
                  if (selectedId === convId) {
                    setSelectedId(null);
                  }
                  setIsDetailsOpen(false);
                  showNotice("You left the group");
                }}
              />
            ) : (
              <ChatWindow
                conversation={activeConversation}
                messages={messages}
                currentUser={currentUser}
                isTyping={isTyping}
                typingUser={typingUser}
                onSendMessage={handleSendMessage}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                onBack={() => setSelectedId(null)}
                onOpenDetails={() => setIsDetailsOpen(true)}
                onReact={handleReactToMessage}
                onTogglePin={handleTogglePinMessage}
                onCopy={() => showNotice("Copied to clipboard")}
                draftText={selectedId ? drafts[selectedId] || "" : ""}
                onDraftChange={(text) => {
                  if (selectedId) handleDraftChange(selectedId, text);
                }}
                onLeaveGroup={(convId) => {
                  setConversations((prev) =>
                    prev.filter((c) => c.id !== convId)
                  );
                  if (selectedId === convId) {
                    setSelectedId(null);
                  }
                  showNotice("You left the group");
                }}
                onMarkUnread={(convId) => {
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === convId ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c
                    )
                  );
                  showNotice("Marked as unread");
                }}
                onPinChat={() => {
                  showNotice("Chat pinned to top");
                }}
                onArchive={(convId) => {
                  setConversations((prev) => prev.filter((c) => c.id !== convId));
                  if (selectedId === convId) setSelectedId(null);
                  showNotice("Chat moved to archive");
                }}
                onDeleteChat={(convId) => {
                  setConversations((prev) => prev.filter((c) => c.id !== convId));
                  if (selectedId === convId) setSelectedId(null);
                  showNotice("Chat deleted");
                }}
                onBlock={() => {
                  showNotice("User/Group blocked");
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* New Direct Chat / Contacts Modal */}
      <NewChatModal
        key={`${newChatTab}-${newChatInitialQuery}-${isNewChatOpen}`}
        isOpen={isNewChatOpen}
        currentUser={currentUser}
        initialTab={newChatTab}
        initialSearchQuery={newChatInitialQuery}
        onClose={() => setIsNewChatOpen(false)}
        onConversationCreated={handleConversationCreated}
      />

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={isNewGroupOpen}
        currentUser={currentUser}
        onClose={() => setIsNewGroupOpen(false)}
        onGroupCreated={handleConversationCreated}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        currentUser={currentUser}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onLogout={logout}
      />
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MessengerApp />
    </AuthProvider>
  );
}
