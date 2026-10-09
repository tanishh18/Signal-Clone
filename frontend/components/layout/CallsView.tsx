"use client";

import React, { useState } from "react";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video, Search, Plus, PhoneCall } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

interface CallRecord {
  id: number;
  name: string;
  type: "incoming" | "outgoing" | "missed" | "video";
  time: string;
  duration?: string;
  missed?: boolean;
}

const DEMO_CALLS: CallRecord[] = [
  { id: 1, name: "Tt Mam New Tiet", type: "incoming", time: "7:01 am", duration: "0:00", missed: false },
  { id: 2, name: "Test Group", type: "missed", time: "Yesterday", missed: true },
  { id: 3, name: "Signal Team", type: "outgoing", time: "Mon", duration: "2:34" },
  { id: 4, name: "Tt Mam New Tiet", type: "video", time: "Sun", duration: "5:12" },
];

function CallIcon({ type, missed }: { type: CallRecord["type"]; missed?: boolean }) {
  const iconClass = missed ? "text-rose-400" : type === "outgoing" ? "text-[#2C6BED]" : "text-emerald-400";
  if (type === "incoming") return <PhoneIncoming className={`w-3.5 h-3.5 ${iconClass}`} />;
  if (type === "outgoing") return <PhoneOutgoing className={`w-3.5 h-3.5 ${iconClass}`} />;
  if (type === "missed") return <PhoneMissed className={`w-3.5 h-3.5 ${iconClass}`} />;
  if (type === "video") return <Video className={`w-3.5 h-3.5 ${iconClass}`} />;
  return null;
}

export const CallsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filtered = DEMO_CALLS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-[#121212]">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#282828] text-white text-xs px-4 py-2 rounded-full shadow-xl z-50 border border-[#333333] pointer-events-none">
          {toast}
        </div>
      )}

      {/* Calls Sidebar */}
      <aside className="w-[280px] lg:w-[300px] h-full flex flex-col bg-[#1a1a1a] border-r border-[#262626]/80 flex-shrink-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-base font-semibold text-white">Calls</h1>
          <button
            onClick={() => showToast("New call coming soon")}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
            title="Start a new call"
          >
            <Plus className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="flex items-center bg-[#242424] rounded-full px-3 py-1.5 gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Call List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((call) => (
              <div
                key={call.id}
                className="px-2 py-0.5"
              >
                <button
                  className="w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-3 hover:bg-[#202020] transition-colors"
                  onClick={() => showToast("Calling coming soon")}
                >
                  <Avatar name={call.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${call.missed ? "text-rose-400" : "text-zinc-200"}`}>
                      {call.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CallIcon type={call.type} missed={call.missed} />
                      <span className="text-[10px] text-zinc-500">
                        {call.type === "video" ? "Video" : "Audio"} call
                        {call.duration ? ` · ${call.duration}` : " · Missed"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-zinc-500">{call.time}</span>
                    <button
                      className="p-1 text-zinc-400 hover:text-white hover:bg-[#252525] rounded-md transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast("Calling coming soon");
                      }}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 px-6 text-center text-zinc-500">
              <p className="text-sm font-medium text-zinc-400">No calls found</p>
              <p className="text-xs mt-1">Recent calls will appear here.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Canvas — Empty State */}
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#121212] text-center p-8">
        <div className="w-20 h-20 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mb-5 text-[#2C6BED]">
          <Phone className="w-9 h-9 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Signal Calls</h2>
        <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-6">
          Signal calls are end-to-end encrypted and never stored by Signal.
          Protect your calls from eavesdropping with the world&apos;s most private messaging app.
        </p>
        <button
          onClick={() => showToast("Calling coming soon")}
          className="px-5 py-2.5 bg-[#2C6BED] hover:bg-[#2055c4] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Start a call
        </button>
      </div>
    </div>
  );
};
