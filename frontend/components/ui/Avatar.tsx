"use client";

import React, { useState } from "react";
import { Users } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  isGroup?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const onlineIndicatorSizes = {
  sm: "w-2.5 h-2.5 ring-1",
  md: "w-3 h-3 ring-2",
  lg: "w-3.5 h-3.5 ring-2",
  xl: "w-4 h-4 ring-2",
};

// Deterministic pastel palette for initials matching Signal's calm color system
const colors = [
  "bg-blue-600 text-white",
  "bg-emerald-600 text-white",
  "bg-purple-600 text-white",
  "bg-amber-600 text-white",
  "bg-rose-600 text-white",
  "bg-indigo-600 text-white",
  "bg-teal-600 text-white",
];

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorIndex(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = "md",
  isOnline = false,
  isGroup = false,
  className = "",
}) => {
  const [hasError, setHasError] = useState(false);
  const colorClass = getColorIndex(name);
  const initials = getInitials(name);

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium overflow-hidden select-none ${
          !src || hasError ? colorClass : "bg-zinc-200 dark:bg-zinc-800"
        }`}
      >
        {isGroup && (!src || hasError) ? (
          <Users className="w-1/2 h-1/2 opacity-90" />
        ) : src && !hasError ? (
          // Standard img with reliable fallback
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${onlineIndicatorSizes[size]} bg-emerald-500 rounded-full ring-white dark:ring-[#181818]`}
          title="Online"
          aria-label="Online"
        />
      )}
    </div>
  );
};
