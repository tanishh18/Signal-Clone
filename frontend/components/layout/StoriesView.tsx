"use client";

import React, { useState } from "react";
import { Radio, Plus, Eye, Lock, StickyNote, Pen } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { User } from "@/types";

interface StoriesViewProps {
  currentUser: User;
}

interface StoryRecord {
  id: number;
  name: string;
  time: string;
  viewed: boolean;
  isOwn?: boolean;
}

const DEMO_STORIES: StoryRecord[] = [];

export const StoriesView: React.FC<StoriesViewProps> = ({ currentUser }) => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-[#121212]">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#282828] text-white text-xs px-4 py-2 rounded-full shadow-xl z-50 border border-[#333333] pointer-events-none">
          {toast}
        </div>
      )}

      {/* Stories Sidebar */}
      <aside className="w-[280px] lg:w-[300px] h-full flex flex-col bg-[#1a1a1a] border-r border-[#262626]/80 flex-shrink-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-base font-semibold text-white">Stories</h1>
          <button
            onClick={() => showToast("Story sharing coming soon")}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
            title="Share a story"
          >
            <Plus className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Notes to Self / My Story */}
        <div className="px-2 pb-2">
          <button
            onClick={() => showToast("Notes to self coming soon")}
            className="w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-3 hover:bg-[#202020] transition-colors"
          >
            <div className="relative flex-shrink-0">
              <Avatar name={currentUser.display_name} src={currentUser.avatar_url} size="md" />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#2C6BED] rounded-full flex items-center justify-center border-2 border-[#1a1a1a]">
                <Pen className="w-2 h-2 text-white" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">My Story</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Share with your connections</p>
            </div>
          </button>
        </div>

        <div className="border-t border-[#242424] mx-3 mb-2" />

        {/* Stories List */}
        <div className="flex-1 overflow-y-auto">
          {/* Notes to Self */}
          <div className="px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Notes to Self</p>
            <button
              onClick={() => showToast("Notes to self coming soon")}
              className="w-full text-left px-2 py-2 rounded-lg flex items-center gap-3 hover:bg-[#202020] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#2C6BED]/15 border border-[#2C6BED]/30 flex items-center justify-center">
                <StickyNote className="w-4 h-4 text-[#2C6BED]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">Notes to Self</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Send yourself reminders</p>
              </div>
            </button>
          </div>

          {DEMO_STORIES.length > 0 ? (
            <div className="px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Recent Stories</p>
              {DEMO_STORIES.map((story) => (
                <button
                  key={story.id}
                  className="w-full text-left px-2 py-2 rounded-lg flex items-center gap-3 hover:bg-[#202020] transition-colors"
                  onClick={() => showToast("Story viewing coming soon")}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar name={story.name} size="md" />
                    {!story.viewed && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#2C6BED] rounded-full border-2 border-[#1a1a1a]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{story.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{story.time}</p>
                  </div>
                  {story.viewed && <Eye className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 px-6 text-center text-zinc-500">
              <Radio className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-400 mb-1">No stories yet</p>
              <p className="text-xs text-zinc-500">Stories from your contacts will appear here.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Canvas */}
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#121212] text-center p-8">
        <div className="w-20 h-20 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mb-5">
          <Radio className="w-9 h-9 text-[#2C6BED] stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Signal Stories</h2>
        <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-6">
          Stories are end-to-end encrypted and automatically disappear after 24 hours.
          Share moments with the people you choose.
        </p>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full text-xs text-zinc-400">
            <Lock className="w-3 h-3" />
            <span>End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full text-xs text-zinc-400">
            <Eye className="w-3 h-3" />
            <span>Disappears in 24h</span>
          </div>
        </div>

        <button
          onClick={() => showToast("Story sharing coming soon")}
          className="px-5 py-2.5 bg-[#2C6BED] hover:bg-[#2055c4] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Share your first story
        </button>
      </div>
    </div>
  );
};
