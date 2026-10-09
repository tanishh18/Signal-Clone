"use client";

import React, { useState } from "react";
import { User } from "@/types";
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
  Shield,
  Keyboard,
  Monitor,
  HardDrive,
  RefreshCw,
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

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 flex-shrink-0 ${
        checked ? "bg-[#2C6BED]" : "bg-zinc-700"
      }`}
    >
      <span
        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingsRow({
  label,
  description,
  rightElement,
  onClick,
  danger = false,
}: {
  label: string;
  description?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between py-3 px-0 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="min-w-0 flex-1 mr-4">
        <p className={`text-sm font-medium ${danger ? "text-rose-400" : "text-white"}`}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {rightElement}
    </div>
  );
}

function SettingsSection({
  title,
  children,
  footer,
}: {
  title?: string;
  children: React.ReactNode;
  footer?: string;
}) {
  return (
    <div className="space-y-1">
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-4 mb-2">
          {title}
        </h3>
      )}
      <div className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] px-4 divide-y divide-[#2a2a2a]">
        {children}
      </div>
      {footer && (
        <p className="text-[11px] text-zinc-500 px-4 leading-relaxed pt-1">{footer}</p>
      )}
    </div>
  );
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("profile");

  // Persist prefs
  const getPref = (key: string, def: string) => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(key);
      if (v !== null) return v;
    }
    return def;
  };
  const getBoolPref = (key: string, def: boolean) => getPref(key, String(def)) === "true";
  const setPref = (key: string, val: string) => {
    try { localStorage.setItem(key, val); } catch {}
  };

  // Privacy
  const [readReceipts, setReadReceipts] = useState(() => getBoolPref("signal_pref_read_receipts", true));
  const [typingIndicators, setTypingIndicators] = useState(() => getBoolPref("signal_pref_typing_indicators", true));
  const [disappearingTimer, setDisappearingTimer] = useState(() => getPref("signal_pref_disappearing_timer", "Off"));
  const [storiesEnabled, setStoriesEnabled] = useState(() => getBoolPref("signal_pref_stories", false));
  const [sealedSenderIcon, setSealedSenderIcon] = useState(() => getBoolPref("signal_pref_sealed_sender", false));
  const [autoKeyVerification, setAutoKeyVerification] = useState(() => getBoolPref("signal_pref_auto_key", true));
  // Notifications
  const [soundEnabled, setSoundEnabled] = useState(() => getBoolPref("signal_pref_sound", true));
  const [previewEnabled, setPreviewEnabled] = useState(() => getBoolPref("signal_pref_preview", true));
  const [callsEnabled, setCallsEnabled] = useState(() => getBoolPref("signal_pref_calls_notif", true));
  // General
  const [systemTheme, setSystemTheme] = useState(() => getBoolPref("signal_pref_system_theme", false));
  const [hardwareAccel, setHardwareAccel] = useState(() => getBoolPref("signal_pref_hw_accel", true));
  const [minimizeToTray, setMinimizeToTray] = useState(() => getBoolPref("signal_pref_tray", true));
  const [launchAtStartup, setLaunchAtStartup] = useState(() => getBoolPref("signal_pref_startup", false));
  // Chats
  const [enterSends, setEnterSends] = useState(() => getBoolPref("signal_pref_enter_sends", true));
  const [spellCheck, setSpellCheck] = useState(() => getBoolPref("signal_pref_spell_check", true));
  const [linkPreviews, setLinkPreviews] = useState(() => getBoolPref("signal_pref_link_previews", true));
  const [autoPlayGifs, setAutoPlayGifs] = useState(() => getBoolPref("signal_pref_auto_gif", true));
  // Calls
  const [incomingCallRing, setIncomingCallRing] = useState(() => getBoolPref("signal_pref_call_ring", true));
  const [noiseSuppression, setNoiseSuppression] = useState(() => getBoolPref("signal_pref_noise_suppress", true));
  const [echoCancellation, setEchoCancellation] = useState(() => getBoolPref("signal_pref_echo_cancel", true));
  const [relayCalls, setRelayCalls] = useState(() => getBoolPref("signal_pref_relay_calls", false));
  // Data usage
  const [autoDownloadPhotos, setAutoDownloadPhotos] = useState(() => getBoolPref("signal_pref_dl_photos", true));
  const [autoDownloadFiles, setAutoDownloadFiles] = useState(() => getBoolPref("signal_pref_dl_files", false));
  const [autoDownloadAudio, setAutoDownloadAudio] = useState(() => getBoolPref("signal_pref_dl_audio", true));
  const [autoDownloadDocuments, setAutoDownloadDocuments] = useState(() => getBoolPref("signal_pref_dl_docs", false));

  const toggle = (state: boolean, setter: (v: boolean) => void, key: string) => {
    const next = !state;
    setter(next);
    setPref(key, String(next));
  };

  const navItems: { key: SettingsCategory; label: string; icon: React.ReactNode }[] = [
    { key: "account", label: "Account", icon: <UserIcon className="w-4 h-4" /> },
    { key: "donate", label: "Donate to Signal", icon: <Heart className="w-4 h-4" /> },
    { key: "general", label: "General", icon: <SettingsIcon className="w-4 h-4" /> },
    { key: "appearance", label: "Appearance", icon: isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" /> },
    { key: "chats", label: "Chats", icon: <MessageSquare className="w-4 h-4" /> },
    { key: "calls", label: "Calls", icon: <Phone className="w-4 h-4" /> },
    { key: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { key: "privacy", label: "Privacy", icon: <Lock className="w-4 h-4" /> },
    { key: "data_usage", label: "Data usage", icon: <Database className="w-4 h-4" /> },
    { key: "backups", label: "Backups", icon: <Archive className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-[#121212] select-none text-zinc-100">
      {/* Settings Sidebar */}
      <aside className="w-[260px] h-full flex flex-col bg-[#121212] border-r border-[#242424] flex-shrink-0">
        {/* Settings Title Header */}
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-xl font-bold tracking-tight text-white">Settings</h1>
        </div>

        {/* Profile Header Card */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setActiveCategory("profile")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
              activeCategory === "profile"
                ? "bg-[#2a2a2a]"
                : "hover:bg-[#1e1e1e]"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#2C6BED] text-white font-bold text-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                currentUser.display_name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-white truncate">
                {currentUser.display_name}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {currentUser.phone || `+1 (555) 000-0000`}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {navItems.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                activeCategory === key
                  ? "bg-[#2a2a2a] text-white font-medium"
                  : "text-zinc-300 hover:bg-[#1e1e1e] hover:text-white"
              }`}
            >
              <span className="text-zinc-400">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Settings gear icon at bottom left */}
        <div className="p-3 border-t border-[#242424]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">Signal 7.43.0</span>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8 space-y-6">

          {/* ═══════════ PROFILE ═══════════ */}
          {activeCategory === "profile" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full bg-[#2C6BED] text-white text-4xl font-bold flex items-center justify-center overflow-hidden shadow-lg">
                    {currentUser.avatar_url ? (
                      <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.display_name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-[#2a2a2a] hover:bg-[#333333] border border-[#3a3a3a] rounded-full text-zinc-300 shadow transition-colors" title="Change photo">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <SettingsSection footer="Your profile is end-to-end encrypted. Only people you message can see your name and photo.">
                <SettingsRow
                  label={currentUser.display_name}
                  description="Name"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="About"
                  description="Hey there! I am using Signal."
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>

              <SettingsSection footer="People can message you using your username so you don't have to give out your phone number.">
                <SettingsRow
                  label={`@${currentUser.username}`}
                  description="Username"
                  rightElement={<MoreHorizontal className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ ACCOUNT ═══════════ */}
          {activeCategory === "account" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Account</h2>
              <SettingsSection>
                <SettingsRow
                  label="Phone number"
                  description={currentUser.phone || "+1 (555) 000-0000"}
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="Signal PIN"
                  description="Keep your Signal information safe if you lose your phone or switch phones."
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="Registration Lock"
                  description="Require your Signal PIN to register your phone number with Signal again."
                  rightElement={<ToggleSwitch checked={true} onChange={() => {}} />}
                />
              </SettingsSection>

              <SettingsSection title="Linked Devices">
                <SettingsRow
                  label="Linked devices"
                  description="Use Signal on multiple devices"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>

              <SettingsSection>
                <SettingsRow
                  label="Delete account"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                  danger
                />
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ DONATE ═══════════ */}
          {activeCategory === "donate" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Donate to Signal</h2>
              <div className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-2">Support Signal</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Signal is a 501(c)(3) nonprofit. We&apos;re powered by your donations, not by ads or investors. Help us build a private future.
                  </p>
                </div>
                <button className="w-full py-3 bg-[#2C6BED] hover:bg-[#2055c4] text-white font-semibold rounded-xl transition-colors">
                  Make a one-time donation
                </button>
                <button className="w-full py-3 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] text-zinc-200 font-semibold rounded-xl transition-colors">
                  Become a monthly donor
                </button>
              </div>
              <SettingsSection>
                <SettingsRow
                  label="Manage donations"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ GENERAL ═══════════ */}
          {activeCategory === "general" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">General</h2>

              <SettingsSection title="System">
                <SettingsRow
                  label="Launch at startup"
                  description="Automatically launch Signal when you log in"
                  rightElement={
                    <ToggleSwitch
                      checked={launchAtStartup}
                      onChange={() => toggle(launchAtStartup, setLaunchAtStartup, "signal_pref_startup")}
                    />
                  }
                />
                <SettingsRow
                  label="Minimize to tray"
                  description="Close Signal to the system tray"
                  rightElement={
                    <ToggleSwitch
                      checked={minimizeToTray}
                      onChange={() => toggle(minimizeToTray, setMinimizeToTray, "signal_pref_tray")}
                    />
                  }
                />
                <SettingsRow
                  label="Hardware acceleration"
                  description="Use GPU for rendering"
                  rightElement={
                    <ToggleSwitch
                      checked={hardwareAccel}
                      onChange={() => toggle(hardwareAccel, setHardwareAccel, "signal_pref_hw_accel")}
                    />
                  }
                />
              </SettingsSection>

              <SettingsSection title="Updates">
                <SettingsRow
                  label="Check for updates"
                  rightElement={<RefreshCw className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="Signal version"
                  rightElement={<span className="text-xs text-zinc-500">7.43.0</span>}
                />
              </SettingsSection>

              <SettingsSection title="Keyboard">
                <SettingsRow
                  label="Keyboard shortcuts"
                  rightElement={<Keyboard className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>

              <SettingsSection>
                <SettingsRow
                  label="Clear data"
                  description="Clear locally cached data"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                  danger
                />
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ APPEARANCE ═══════════ */}
          {activeCategory === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Appearance</h2>

              <SettingsSection title="Theme">
                <div className="py-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Light", value: false, icon: <Sun className="w-5 h-5 text-amber-400" /> },
                      { label: "Dark", value: true, icon: <Moon className="w-5 h-5 text-[#2C6BED]" /> },
                      { label: "System", value: null, icon: <Monitor className="w-5 h-5 text-zinc-400" /> },
                    ].map(({ label, value, icon }) => {
                      const isActive = value === null ? systemTheme : isDarkMode === value && !systemTheme;
                      return (
                        <button
                          key={label}
                          onClick={() => {
                            if (value === null) {
                              setSystemTheme(true);
                              setPref("signal_pref_system_theme", "true");
                            } else {
                              setSystemTheme(false);
                              setPref("signal_pref_system_theme", "false");
                              if (isDarkMode !== value) onToggleDarkMode();
                            }
                          }}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                            isActive
                              ? "border-[#2C6BED] bg-[#2C6BED]/10"
                              : "border-[#333333] hover:border-[#444444]"
                          }`}
                        >
                          {icon}
                          <span className={`text-xs font-medium ${isActive ? "text-[#2C6BED]" : "text-zinc-400"}`}>
                            {label}
                          </span>
                          {isActive && <Check className="w-3 h-3 text-[#2C6BED]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection title="Font Size">
                <div className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">A</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      defaultValue="3"
                      className="flex-1 accent-[#2C6BED]"
                    />
                    <span className="text-base text-zinc-300 font-semibold">A</span>
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection title="Zoom Level">
                <div className="py-3">
                  <div className="flex items-center gap-2">
                    {[75, 100, 125, 150].map((zoom) => (
                      <button
                        key={zoom}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${
                          zoom === 100
                            ? "border-[#2C6BED] bg-[#2C6BED]/10 text-[#2C6BED]"
                            : "border-[#333333] text-zinc-400 hover:border-[#444444]"
                        }`}
                      >
                        {zoom}%
                      </button>
                    ))}
                  </div>
                </div>
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ CHATS ═══════════ */}
          {activeCategory === "chats" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Chats</h2>

              <SettingsSection title="Messaging">
                <SettingsRow
                  label="Enter key sends"
                  description="Pressing Enter will send a message; use Shift+Enter for a new line"
                  rightElement={
                    <ToggleSwitch
                      checked={enterSends}
                      onChange={() => toggle(enterSends, setEnterSends, "signal_pref_enter_sends")}
                    />
                  }
                />
                <SettingsRow
                  label="Spell check"
                  description="Check spelling as you type"
                  rightElement={
                    <ToggleSwitch
                      checked={spellCheck}
                      onChange={() => toggle(spellCheck, setSpellCheck, "signal_pref_spell_check")}
                    />
                  }
                />
                <SettingsRow
                  label="Link previews"
                  description="Show preview cards for links shared in chats"
                  rightElement={
                    <ToggleSwitch
                      checked={linkPreviews}
                      onChange={() => toggle(linkPreviews, setLinkPreviews, "signal_pref_link_previews")}
                    />
                  }
                />
                <SettingsRow
                  label="Auto-play GIFs"
                  description="Automatically play animated GIF images"
                  rightElement={
                    <ToggleSwitch
                      checked={autoPlayGifs}
                      onChange={() => toggle(autoPlayGifs, setAutoPlayGifs, "signal_pref_auto_gif")}
                    />
                  }
                />
              </SettingsSection>

              <SettingsSection title="Chat history">
                <SettingsRow
                  label="Archive all chats"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="Clear all chat history"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                  danger
                />
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ CALLS ═══════════ */}
          {activeCategory === "calls" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Calls</h2>

              <SettingsSection title="Incoming calls">
                <SettingsRow
                  label="Ring for incoming calls"
                  description="Play a ringtone for incoming Signal calls"
                  rightElement={
                    <ToggleSwitch
                      checked={incomingCallRing}
                      onChange={() => toggle(incomingCallRing, setIncomingCallRing, "signal_pref_call_ring")}
                    />
                  }
                />
              </SettingsSection>

              <SettingsSection title="Audio processing">
                <SettingsRow
                  label="Noise suppression"
                  description="Reduce background noise during calls"
                  rightElement={
                    <ToggleSwitch
                      checked={noiseSuppression}
                      onChange={() => toggle(noiseSuppression, setNoiseSuppression, "signal_pref_noise_suppress")}
                    />
                  }
                />
                <SettingsRow
                  label="Echo cancellation"
                  description="Prevent audio echo during calls"
                  rightElement={
                    <ToggleSwitch
                      checked={echoCancellation}
                      onChange={() => toggle(echoCancellation, setEchoCancellation, "signal_pref_echo_cancel")}
                    />
                  }
                />
              </SettingsSection>

              <SettingsSection
                title="Advanced"
                footer="When enabled, Signal will relay all calls through Signal servers so that your IP address is never exposed to the other party."
              >
                <SettingsRow
                  label="Always relay calls"
                  description="Relay calls through Signal servers to protect your IP"
                  rightElement={
                    <ToggleSwitch
                      checked={relayCalls}
                      onChange={() => toggle(relayCalls, setRelayCalls, "signal_pref_relay_calls")}
                    />
                  }
                />
              </SettingsSection>

              <SettingsSection title="Devices">
                <SettingsRow
                  label="Microphone"
                  description="Default"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="Speaker"
                  description="Default"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="Camera"
                  description="Default"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ NOTIFICATIONS ═══════════ */}
          {activeCategory === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Notifications</h2>

              <SettingsSection title="Messages">
                <SettingsRow
                  label="Notifications"
                  rightElement={
                    <ToggleSwitch
                      checked={soundEnabled}
                      onChange={() => toggle(soundEnabled, setSoundEnabled, "signal_pref_sound")}
                    />
                  }
                />
                <SettingsRow
                  label="Show notification content"
                  description="Display sender name and message preview in notifications"
                  rightElement={
                    <ToggleSwitch
                      checked={previewEnabled}
                      onChange={() => toggle(previewEnabled, setPreviewEnabled, "signal_pref_preview")}
                    />
                  }
                />
              </SettingsSection>

              <SettingsSection title="Calls">
                <SettingsRow
                  label="Call notifications"
                  description="Notify for missed calls"
                  rightElement={
                    <ToggleSwitch
                      checked={callsEnabled}
                      onChange={() => toggle(callsEnabled, setCallsEnabled, "signal_pref_calls_notif")}
                    />
                  }
                />
              </SettingsSection>

              <SettingsSection title="Sounds">
                <SettingsRow
                  label="Incoming message sound"
                  description="Default"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="Outgoing message sound"
                  description="Default"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="Call ringtone"
                  description="Default"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>

              <SettingsSection title="Notification Profiles">
                <SettingsRow
                  label="Manage profiles"
                  description="Create custom notification profiles for different situations"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ PRIVACY ═══════════ */}
          {activeCategory === "privacy" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Privacy</h2>

              <SettingsSection>
                <SettingsRow
                  label="Phone Number"
                  description="Choose who can see your phone number and who can contact you on Signal with it."
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
                <SettingsRow
                  label="Blocked"
                  description="No users or groups"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>

              <SettingsSection
                title="Messaging"
                footer="See and share when messages are being read and typed. If disabled, you won't see read receipts or typing indicators from others."
              >
                <SettingsRow
                  label="Read receipts"
                  rightElement={
                    <ToggleSwitch
                      checked={readReceipts}
                      onChange={() => toggle(readReceipts, setReadReceipts, "signal_pref_read_receipts")}
                    />
                  }
                />
                <SettingsRow
                  label="Typing indicators"
                  rightElement={
                    <ToggleSwitch
                      checked={typingIndicators}
                      onChange={() => toggle(typingIndicators, setTypingIndicators, "signal_pref_typing_indicators")}
                    />
                  }
                />
              </SettingsSection>

              <SettingsSection
                title="Disappearing messages"
                footer="Set a default disappearing message timer for all new chats started by you."
              >
                <SettingsRow
                  label="Default timer for new chats"
                  description={disappearingTimer}
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {
                    const opts = ["Off", "30 seconds", "5 minutes", "1 hour", "8 hours", "1 day", "1 week", "4 weeks"];
                    const idx = opts.indexOf(disappearingTimer);
                    const next = opts[(idx + 1) % opts.length];
                    setDisappearingTimer(next);
                    setPref("signal_pref_disappearing_timer", next);
                  }}
                />
              </SettingsSection>

              <SettingsSection title="Stories">
                <SettingsRow
                  label="Share & View Stories"
                  description="If you opt out of stories you will no longer be able to share or view stories."
                  rightElement={
                    <button
                      onClick={() => setStoriesEnabled(!storiesEnabled)}
                      className="text-xs font-medium px-3 py-1.5 bg-[#2a1a1a] text-rose-400 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 transition-colors"
                    >
                      {storiesEnabled ? "Turn off stories" : "Enable stories"}
                    </button>
                  }
                />
              </SettingsSection>

              <SettingsSection title="Advanced">
                <SettingsRow
                  label="Show status icon 🔒"
                  description="Show an icon when messages were delivered using sealed sender."
                  rightElement={
                    <ToggleSwitch
                      checked={sealedSenderIcon}
                      onChange={() => toggle(sealedSenderIcon, setSealedSenderIcon, "signal_pref_sealed_sender")}
                    />
                  }
                />
                <SettingsRow
                  label="Automatic key verification"
                  description="Automatically verify the encryption of 1:1 chats."
                  rightElement={
                    <ToggleSwitch
                      checked={autoKeyVerification}
                      onChange={() => toggle(autoKeyVerification, setAutoKeyVerification, "signal_pref_auto_key")}
                    />
                  }
                />
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ DATA USAGE ═══════════ */}
          {activeCategory === "data_usage" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Data usage</h2>

              <SettingsSection
                title="Auto-download"
                footer="Choose which media types to automatically download when on Wi-Fi."
              >
                <SettingsRow
                  label="Photos"
                  rightElement={
                    <ToggleSwitch
                      checked={autoDownloadPhotos}
                      onChange={() => toggle(autoDownloadPhotos, setAutoDownloadPhotos, "signal_pref_dl_photos")}
                    />
                  }
                />
                <SettingsRow
                  label="Audio"
                  rightElement={
                    <ToggleSwitch
                      checked={autoDownloadAudio}
                      onChange={() => toggle(autoDownloadAudio, setAutoDownloadAudio, "signal_pref_dl_audio")}
                    />
                  }
                />
                <SettingsRow
                  label="Files"
                  rightElement={
                    <ToggleSwitch
                      checked={autoDownloadFiles}
                      onChange={() => toggle(autoDownloadFiles, setAutoDownloadFiles, "signal_pref_dl_files")}
                    />
                  }
                />
                <SettingsRow
                  label="Documents"
                  rightElement={
                    <ToggleSwitch
                      checked={autoDownloadDocuments}
                      onChange={() => toggle(autoDownloadDocuments, setAutoDownloadDocuments, "signal_pref_dl_docs")}
                    />
                  }
                />
              </SettingsSection>

              <SettingsSection title="Calls">
                <SettingsRow
                  label="Use less data for calls"
                  description="Reduce bandwidth usage for voice and video calls"
                  rightElement={<ToggleSwitch checked={false} onChange={() => {}} />}
                />
              </SettingsSection>

              <SettingsSection title="Storage">
                <SettingsRow
                  label="Manage storage"
                  description="Review and clear media files"
                  rightElement={<ChevronRight className="w-4 h-4 text-zinc-500" />}
                  onClick={() => {}}
                />
              </SettingsSection>
            </div>
          )}

          {/* ═══════════ BACKUPS ═══════════ */}
          {activeCategory === "backups" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Backups</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Back up your message history so you never lose data when you get a new phone or reinstall Signal.
              </p>

              <SettingsSection>
                <div className="py-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#2C6BED]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-5 h-5 text-[#2C6BED]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-1">Signal Secure Backups</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Automatic backups with Signal&apos;s secure, end-to-end encrypted storage service. Get started on your phone.{" "}
                      <span className="text-[#2C6BED] cursor-pointer hover:underline">Learn more.</span>
                    </p>
                  </div>
                </div>
              </SettingsSection>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                  Other ways to back up
                </h3>
                <div className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-[#282828] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HardDrive className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-0.5">Desktop backups</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Create an end-to-end encrypted backup that you can restore on your phone.
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333333] text-zinc-200 text-xs font-semibold rounded-xl border border-[#3a3a3a] transition-colors flex-shrink-0">
                    Set up
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
