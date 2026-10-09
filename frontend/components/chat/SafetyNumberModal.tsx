"use client";

import React, { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ShieldCheck, QrCode, Check, Copy, X } from "lucide-react";

interface SafetyNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  avatarUrl?: string | null;
}

export const SafetyNumberModal: React.FC<SafetyNumberModalProps> = ({
  isOpen,
  onClose,
  contactName,
  avatarUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen) return null;

  // Signal 60-digit safety number representation grouped into 12 blocks of 5 digits
  const safetyNumberBlocks = [
    "38194", "50281", "94821", "04821",
    "49102", "85910", "48291", "59102",
    "94810", "48201", "39581", "02948"
  ];

  const fullNumber = safetyNumberBlocks.join(" ");

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none animate-fade-in">
      <div className="bg-[#1c1c1c] rounded-2xl w-full max-w-sm border border-[#2b2b2b] p-5 shadow-2xl relative text-zinc-100 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-zinc-400 hover:text-white rounded-md transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[1.75]" />
        </button>

        {/* Contact Info Header */}
        <div className="flex flex-col items-center mb-3">
          <Avatar name={contactName} src={avatarUrl} size="md" className="mb-2" />
          <h3 className="font-semibold text-sm text-white">{contactName}</h3>
          <p className="text-[11px] text-zinc-400 text-center mt-0.5 max-w-[260px] leading-snug">
            Verify safety number to confirm encryption security.
          </p>
        </div>

        {/* Signal-style QR Code Simulation Card */}
        <div className="p-3 bg-white rounded-xl mb-3 shadow-md flex items-center justify-center">
          <QrCode className="w-28 h-28 text-black stroke-[1.5]" />
        </div>

        {/* 60-Digit Fingerprint Blocks */}
        <div className="w-full bg-[#242424] rounded-xl p-3 border border-[#2c2c2c] mb-3">
          <div className="grid grid-cols-4 gap-x-2 gap-y-1 font-mono text-center text-xs tracking-wider text-zinc-200">
            {safetyNumberBlocks.map((chunk, idx) => (
              <span key={idx} className="tabular-nums font-medium">
                {chunk}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-1.5 px-3 rounded-lg bg-[#282828] hover:bg-[#303030] text-xs font-medium text-zinc-200 border border-[#333333] transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2C6BED]" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={() => setIsVerified(!isVerified)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              isVerified
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                : "bg-[#2C6BED] hover:bg-[#2055c4] text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isVerified ? "Verified" : "Mark verified"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
