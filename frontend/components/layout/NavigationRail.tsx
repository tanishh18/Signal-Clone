"use client";

import React from "react";
import { MessageSquare, Phone, Smartphone, Settings, Menu } from "lucide-react";

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
  return (
    <aside className="w-[60px] h-full flex flex-col items-center justify-between py-3.5 bg-[#181818] border-r border-[#242424] select-none flex-shrink-0 z-30">
      {/* Top Section */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Hamburger/Menu Button */}
        <button
          className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-[#242424] transition-colors"
          title="Menu"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Chats Tab */}
        <button
          onClick={() => onSelectSection("chats")}
          className={`w-10 h-10 flex items-center justify-center rounded-xl relative transition-all ${
            activeSection === "chats"
              ? "bg-[#282828] text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#242424]"
          }`}
          title="Chats"
          aria-label="Chats"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#2C6BED] rounded-full ring-2 ring-[#181818]" />
          )}
        </button>

        {/* Calls Tab */}
        <button
          onClick={() => onSelectSection("calls")}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            activeSection === "calls"
              ? "bg-[#282828] text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#242424]"
          }`}
          title="Calls"
          aria-label="Calls"
        >
          <Phone className="w-5 h-5" />
        </button>

        {/* Stories / Linked Devices Tab */}
        <button
          onClick={() => onSelectSection("stories")}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            activeSection === "stories"
              ? "bg-[#282828] text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#242424]"
          }`}
          title="Stories & Devices"
          aria-label="Stories & Devices"
        >
          <Smartphone className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Section - Settings */}
      <div className="flex flex-col items-center w-full">
        <button
          onClick={() => onSelectSection("settings")}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            activeSection === "settings"
              ? "bg-[#282828] text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#242424]"
          }`}
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
