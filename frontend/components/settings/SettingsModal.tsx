"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { X, Moon, Sun, Shield, Bell, Laptop, Info, LogOut } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "privacy" | "appearance" | "notifications" | "about">("profile");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-[#282828] flex items-center justify-between">
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content: Navigation tabs + Details */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs Sidebar */}
          <nav className="w-40 border-r border-zinc-100 dark:border-[#242424] p-2 space-y-1 bg-zinc-50 dark:bg-[#161616]">
            {[
              { id: "profile", label: "Profile", icon: Shield },
              { id: "appearance", label: "Appearance", icon: isDarkMode ? Moon : Sun },
              { id: "privacy", label: "Privacy", icon: Shield },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "about", label: "About", icon: Info },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#2C6BED] text-white"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Tab Panels */}
          <div className="flex-1 p-5 overflow-y-auto">
            {activeTab === "profile" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={currentUser.display_name}
                    src={currentUser.avatar_url}
                    size="xl"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {currentUser.display_name}
                    </h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      @{currentUser.username}
                    </p>
                    {currentUser.phone && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {currentUser.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-[#262626] space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                      Display Name
                    </label>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {currentUser.display_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                      Username Handle
                    </label>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                      @{currentUser.username}
                    </p>
                  </div>
                </div>

                {onLogout && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-[#262626]">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    Theme
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                    Choose between light and dark Signal themes.
                  </p>
                  <button
                    onClick={onToggleDarkMode}
                    className="flex items-center justify-between w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {isDarkMode ? "Dark Theme Active" : "Light Theme Active"}
                    </span>
                    {isDarkMode ? (
                      <Moon className="w-4 h-4 text-[#2C6BED]" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Read Receipts
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      See when others have read your messages.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-[#2C6BED] w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400">
                  <div className="flex items-center gap-2 mb-1">
                    <Laptop className="w-4 h-4" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      Linked Devices
                    </span>
                  </div>
                  <p className="text-[11px]">Coming soon in a future release.</p>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Message Notifications
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Play sound on incoming real-time messages.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-[#2C6BED] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-3 text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-[#2C6BED]/10 text-[#2C6BED] flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Signal Web Platform
                </h3>
                <p className="text-xs text-zinc-400">Version 1.0.0 (Evaluation Build)</p>
                <div className="bg-zinc-100 dark:bg-zinc-800/60 p-3 rounded-xl text-left text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-200">
                    Assignment Disclosure:
                  </p>
                  <p>
                    Built with Next.js, FastAPI, SQLite, and WebSockets. Authentication and cryptographic key exchange are simulated per the assignment guidelines.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
