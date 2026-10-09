"use client";

import React, { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { PhoneOff, Mic, MicOff, Video, VideoOff, ShieldCheck } from "lucide-react";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  avatarUrl?: string | null;
  isVideo?: boolean;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  contactName,
  avatarUrl,
  isVideo = false,
}) => {
  const [callState, setCallState] = useState<"calling" | "connected">("calling");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate answer after 2.5 seconds
    const timer = setTimeout(() => {
      setCallState("connected");
    }, 2500);

    return () => {
      clearTimeout(timer);
      setCallState("calling");
      setDuration(0);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || callState !== "connected") return;
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, callState]);

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-fade-in">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-[#2d2d2d] rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Signal End-to-End Encryption Notice Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-[#252525] border border-[#303030] px-3 py-1 rounded-full mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2C6BED]" />
          <span>Signal End-to-End Encrypted</span>
        </div>

        {/* Center Avatar with pulse animation if calling */}
        <div className="relative mb-4">
          <div
            className={`rounded-full transition-all ${
              callState === "calling" ? "animate-pulse ring-4 ring-[#2C6BED]/30" : ""
            }`}
          >
            <Avatar name={contactName} src={avatarUrl} size="xl" />
          </div>
        </div>

        {/* Contact Name & Call Status */}
        <h3 className="text-xl font-bold text-white mb-1">{contactName}</h3>
        <p className="text-xs text-zinc-400 mb-8 font-medium">
          {callState === "calling"
            ? "Calling Signal contact..."
            : `Connected · ${formatDuration(duration)}`}
        </p>

        {/* Call Controls Toolbar */}
        <div className="flex items-center gap-4">
          {/* Mute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full transition-colors ${
              isMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-[#282828] text-zinc-200 hover:bg-[#323232] border border-[#353535]"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className={`p-3.5 rounded-full transition-colors ${
              !isVideoEnabled
                ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                : "bg-[#282828] text-zinc-200 hover:bg-[#323232] border border-[#353535]"
            }`}
            title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* End Call (Red Pill) */}
          <button
            onClick={onClose}
            className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors shadow-lg shadow-rose-600/30"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
