"use client";

import React from "react";
import { MessageSquare, Phone, Radio, Settings, Menu } from "lucide-react";

export type NavSection = "chats" | "calls" | "stories" | "settings";

interface NavigationRailProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  unreadCount?: number;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeSection,
  onSelectSection,
  unreadCount = 0,
}) => {
  const tabs: {
    key: NavSection;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { key: "chats", icon: <MessageSquare className="w-[18px] h-[18px] stroke-[1.5]" />, label: "Chats" },
    { key: "calls", icon: <Phone className="w-[18px] h-[18px] stroke-[1.5]" />, label: "Calls" },
    { key: "stories", icon: <Radio className="w-[18px] h-[18px] stroke-[1.5]" />, label: "Stories" },
  ];

  return (
    <aside className="w-[54px] h-full flex flex-col items-center justify-between py-3 bg-[#1a1a1a] border-r border-[#262626]/80 select-none flex-shrink-0 z-30">
      {/* Top Section */}
      <div className="flex flex-col items-center gap-1 w-full">
        {/* Hamburger/Menu Button */}
        <button
          className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-[#252525] transition-colors mb-1"
          title="Menu"
          aria-label="Menu"
        >
          <Menu className="w-[18px] h-[18px] stroke-[1.5]" />
        </button>

        {tabs.map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => onSelectSection(key)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl relative transition-all ${
              activeSection === key
                ? "bg-[#282828] text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-[#252525]"
            }`}
            title={label}
            aria-label={label}
          >
            {icon}
            {key === "chats" && unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2C6BED] rounded-full ring-2 ring-[#1a1a1a]" />
            )}
          </button>
        ))}
      </div>

      {/* Bottom Section - Settings */}
      <div className="flex flex-col items-center w-full">
        <button
          onClick={() => onSelectSection("settings")}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            activeSection === "settings"
              ? "bg-[#282828] text-white"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-[#252525]"
          }`}
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-[18px] h-[18px] stroke-[1.5]" />
        </button>
      </div>
    </aside>
  );
};
