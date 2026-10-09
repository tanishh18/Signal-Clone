"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import {
  User as UserIcon,
  Heart,
  Settings as SettingsIcon,
  Sun,
  Moon,
  MessageSquare,
  Phone,
  Bell,
  Lock,
  Database,
  Archive,
  ChevronRight,
  LogOut,
  Camera,
  MoreHorizontal,
  Check,
} from "lucide-react";

export type SettingsCategory =
  | "profile"
  | "account"
  | "donate"
  | "general"
  | "appearance"
  | "chats"
  | "calls"
  | "notifications"
  | "privacy"
  | "data_usage"
  | "backups";

interface SettingsViewProps {
  currentUser: User;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout?: () => void;
  onClose?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("profile");

  // Privacy toggles state
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [disappearingTimer, setDisappearingTimer] = useState("Off");
  const [storiesEnabled, setStoriesEnabled] = useState(false);
  const [sealedSenderIcon, setSealedSenderIcon] = useState(false);
  const [autoKeyVerification, setAutoKeyVerification] = useState(true);

  // Notifications toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-[#121212] select-none text-zinc-100">
      {/* Tier 2: Settings Sidebar */}
      <aside className="w-[300px] h-full flex flex-col bg-[#181818] border-r border-[#242424] flex-shrink-0">
        {/* Settings Title Header */}
        <div className="px-5 py-4 border-b border-[#242424]">
          <h1 className="text-xl font-bold tracking-tight text-white">Settings</h1>
        </div>

        {/* Profile Header Card */}
        <div className="p-3">
          <button
            onClick={() => setActiveCategory("profile")}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left ${
              activeCategory === "profile"
                ? "bg-[#282828]"
                : "bg-[#202020] hover:bg-[#242424]"
            }`}
          >
            <Avatar
              name={currentUser.display_name}
              src={currentUser.avatar_url}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-white truncate">
                {currentUser.display_name}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {currentUser.phone || `@${currentUser.username}`}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          <button
            onClick={() => setActiveCategory("account")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "account"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            <UserIcon className="w-4 h-4 text-zinc-400" />
            <span>Account</span>
          </button>

          <button
            onClick={() => setActiveCategory("donate")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "donate"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            <Heart className="w-4 h-4 text-zinc-400" />
            <span>Donate to Signal</span>
          </button>

          <div className="my-2 border-t border-[#242424]" />

          <button
            onClick={() => setActiveCategory("general")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "general"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            <SettingsIcon className="w-4 h-4 text-zinc-400" />
            <span>General</span>
          </button>

          <button
            onClick={() => setActiveCategory("appearance")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "appearance"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            {isDarkMode ? (
              <Moon className="w-4 h-4 text-zinc-400" />
            ) : (
              <Sun className="w-4 h-4 text-zinc-400" />
            )}
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveCategory("chats")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "chats"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <span>Chats</span>
          </button>

          <button
            onClick={() => setActiveCategory("calls")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "calls"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            <Phone className="w-4 h-4 text-zinc-400" />
            <span>Calls</span>
          </button>

          <button
            onClick={() => setActiveCategory("notifications")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "notifications"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            <Bell className="w-4 h-4 text-zinc-400" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveCategory("privacy")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "privacy"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            <Lock className="w-4 h-4 text-zinc-400" />
            <span>Privacy</span>
          </button>

          <button
            onClick={() => setActiveCategory("data_usage")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "data_usage"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            <Database className="w-4 h-4 text-zinc-400" />
            <span>Data usage</span>
          </button>

          <button
            onClick={() => setActiveCategory("backups")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              activeCategory === "backups"
                ? "bg-[#282828] text-white font-medium"
                : "text-zinc-300 hover:bg-[#202020] hover:text-white"
            }`}
          >
            <Archive className="w-4 h-4 text-zinc-400" />
            <span>Backups</span>
          </button>
        </div>

        {/* Logout button at bottom of settings sidebar */}
        {onLogout && (
          <div className="p-3 border-t border-[#242424]">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Tier 3: Settings Main Content Canvas */}
      <main className="flex-1 h-full overflow-y-auto px-8 py-8 flex flex-col items-center">
        <div className="w-full max-w-xl space-y-6">
          {/* CATEGORY: PROFILE */}
          {activeCategory === "profile" && (
            <div className="space-y-6">
              <h2 className="text-center text-sm font-semibold text-zinc-300">Profile</h2>

              {/* Avatar Centerpiece */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-[#2C6BED] text-white text-3xl font-bold flex items-center justify-center overflow-hidden shadow-lg">
                    {currentUser.display_name.slice(0, 1).toUpperCase()}
                  </div>
                  <button
                    className="absolute bottom-0 right-0 p-2 bg-[#202020] hover:bg-[#282828] border border-[#2d2d2d] rounded-full text-zinc-300 shadow"
                    title="Change photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <button className="text-xs font-medium text-zinc-400 hover:text-white bg-[#202020] hover:bg-[#262626] px-3 py-1.5 rounded-full border border-[#2d2d2d] transition-colors">
                  Edit photo
                </button>
              </div>

              {/* Name & About Card */}
              <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium text-white">{currentUser.display_name}</span>
                </div>
                <div className="border-t border-[#2a2a2a]" />
                <div className="flex items-center gap-3 text-zinc-400">
                  <span className="text-sm">About</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 px-2 leading-relaxed">
                Your profile and changes to it will be visible to people you message, contacts and groups.
              </p>

              {/* Username Card */}
              <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">@</span>
                  <span className="text-sm text-white font-medium">{currentUser.username}</span>
                </div>
                <MoreHorizontal className="w-4 h-4 text-zinc-500 cursor-pointer" />
              </div>
              <p className="text-[11px] text-zinc-500 px-2 leading-relaxed">
                People can now message you using your optional username so you don&apos;t have to give out your phone number.
              </p>
            </div>
          )}

          {/* CATEGORY: PRIVACY */}
          {activeCategory === "privacy" && (
            <div className="space-y-6">
              <h2 className="text-center text-sm font-semibold text-zinc-300">Privacy</h2>

              {/* Phone Number Visibility */}
              <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 flex items-center justify-between hover:bg-[#232323] cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">Phone Number</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Choose who can see your phone number and who can contact you on Signal with it.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              </div>

              {/* Blocked */}
              <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 flex items-center justify-between hover:bg-[#232323] cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">Blocked</p>
                  <p className="text-xs text-zinc-500 mt-0.5">No users or groups</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              </div>

              {/* Messaging Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                  Messaging
                </h3>
                <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 space-y-4">
                  {/* Read Receipts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Read receipts</p>
                    </div>
                    <button
                      onClick={() => setReadReceipts(!readReceipts)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        readReceipts ? "bg-[#2C6BED]" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                          readReceipts ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="border-t border-[#2a2a2a]" />

                  {/* Typing Indicators */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Typing indicators</p>
                    </div>
                    <button
                      onClick={() => setTypingIndicators(!typingIndicators)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        typingIndicators ? "bg-[#2C6BED]" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                          typingIndicators ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 px-2 leading-relaxed">
                  See and share when messages are being read and typed. If disabled, you won&apos;t see read receipts or typing indicators from others.
                </p>
              </div>

              {/* Disappearing Messages */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                  Disappearing messages
                </h3>
                <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Default timer for new chats</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Set a default disappearing message timer for all new chats started by you.
                    </p>
                  </div>
                  <select
                    value={disappearingTimer}
                    onChange={(e) => setDisappearingTimer(e.target.value)}
                    className="bg-[#282828] text-xs text-zinc-200 border border-[#333333] rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="Off">Off</option>
                    <option value="30 seconds">30 seconds</option>
                    <option value="5 minutes">5 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="1 day">1 day</option>
                    <option value="1 week">1 week</option>
                  </select>
                </div>
              </div>

              {/* Stories */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                  Stories
                </h3>
                <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Share &amp; View Stories</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      If you opt out of stories you will no longer be able to share or view stories.
                    </p>
                  </div>
                  <button
                    onClick={() => setStoriesEnabled(!storiesEnabled)}
                    className="text-xs font-medium px-3 py-1.5 bg-[#2a1a1a] text-rose-400 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 transition-colors"
                  >
                    {storiesEnabled ? "Enable stories" : "Turn off stories"}
                  </button>
                </div>
              </div>

              {/* Advanced */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                  Advanced
                </h3>
                <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Show status icon 🔒</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Show an icon in message details when they were delivered using sealed sender.
                      </p>
                    </div>
                    <button
                      onClick={() => setSealedSenderIcon(!sealedSenderIcon)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        sealedSenderIcon ? "bg-[#2C6BED]" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                          sealedSenderIcon ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="border-t border-[#2a2a2a]" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Automatic key verification</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        When enabled, Signal will attempt to automatically verify the simulated encryption of 1:1 chats.
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoKeyVerification(!autoKeyVerification)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        autoKeyVerification ? "bg-[#2C6BED]" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                          autoKeyVerification ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: APPEARANCE */}
          {activeCategory === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-center text-sm font-semibold text-zinc-300">Appearance</h2>
              <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-white">Theme</p>
                  <p className="text-xs text-zinc-400 mt-0.5 mb-3">
                    Choose between light and dark themes.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={onToggleDarkMode}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        !isDarkMode
                          ? "border-[#2C6BED] bg-[#282828] text-white"
                          : "border-[#2e2e2e] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium">Light</span>
                      </div>
                      {!isDarkMode && <Check className="w-4 h-4 text-[#2C6BED]" />}
                    </button>

                    <button
                      onClick={onToggleDarkMode}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        isDarkMode
                          ? "border-[#2C6BED] bg-[#282828] text-white"
                          : "border-[#2e2e2e] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-[#2C6BED]" />
                        <span className="text-xs font-medium">Dark</span>
                      </div>
                      {isDarkMode && <Check className="w-4 h-4 text-[#2C6BED]" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: NOTIFICATIONS */}
          {activeCategory === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-center text-sm font-semibold text-zinc-300">Notifications</h2>
              <div className="bg-[#202020] rounded-2xl border border-[#282828] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Message sounds</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Play sound on incoming messages</p>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                      soundEnabled ? "bg-[#2C6BED]" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                        soundEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t border-[#2a2a2a]" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Message preview</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Show sender name and message in notifications</p>
                  </div>
                  <button
                    onClick={() => setPreviewEnabled(!previewEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                      previewEnabled ? "bg-[#2C6BED]" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                        previewEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OTHER PLACEHOLDERS */}
          {!["profile", "privacy", "appearance", "notifications"].includes(activeCategory) && (
            <div className="space-y-6">
              <h2 className="text-center text-sm font-semibold text-zinc-300 capitalize">
                {activeCategory.replace("_", " ")}
              </h2>
              <div className="bg-[#202020] rounded-2xl border border-[#282828] p-8 text-center space-y-2">
                <p className="text-sm font-medium text-white capitalize">
                  {activeCategory.replace("_", " ")} Preferences
                </p>
                <p className="text-xs text-zinc-400">
                  Settings in this section are managed automatically or available in the full release.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
