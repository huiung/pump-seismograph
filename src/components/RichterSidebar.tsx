"use client";

import React from "react";

export interface ThemeEntry {
  name: string;
  richterLevel: number;
  alertLevel: "calm" | "warning" | "earthquake";
  tokenCount: number;
  color: string;
}

export interface RichterSidebarProps {
  themes: ThemeEntry[];
}

const alertColors: Record<string, string> = {
  calm: "#00ff41",
  warning: "#ffff00",
  earthquake: "#ff0000",
};

export default function RichterSidebar({ themes }: RichterSidebarProps) {
  const sorted = [...themes].sort((a, b) => b.richterLevel - a.richterLevel);

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-[#222222] bg-[#111111] p-4">
      <h2 className="mb-4 font-mono text-sm font-bold tracking-widest text-[#00ff41]">
        RICHTER SCALE
      </h2>
      <div className="flex flex-col gap-2">
        {sorted.map((theme) => {
          const color = alertColors[theme.alertLevel] || "#00ff41";
          const isEarthquake = theme.alertLevel === "earthquake";

          return (
            <div
              key={theme.name}
              className="flex items-center gap-2 rounded border border-[#222222] bg-[#0a0a0a] px-3 py-2"
            >
              {/* Color dot */}
              <span
                className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${isEarthquake ? "animate-pulse" : ""}`}
                style={{
                  backgroundColor: theme.color,
                  boxShadow: isEarthquake
                    ? `0 0 8px ${color}, 0 0 16px ${color}`
                    : "none",
                }}
              />

              {/* Name */}
              <span
                className="min-w-0 flex-1 truncate font-mono text-xs"
                style={{ color }}
              >
                {theme.name}
              </span>

              {/* Richter number */}
              <span className="shrink-0 font-mono text-sm font-bold" style={{ color }}>
                {theme.richterLevel.toFixed(1)}
              </span>

              {/* Bar */}
              <div className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-[#222222]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isEarthquake ? "animate-pulse" : ""}`}
                  style={{
                    width: `${Math.min(100, (theme.richterLevel / 10) * 100)}%`,
                    backgroundColor: color,
                    boxShadow: isEarthquake ? `0 0 6px ${color}` : "none",
                  }}
                />
              </div>

              {/* Token count badge */}
              <span className="shrink-0 rounded bg-[#1a1a1a] px-1.5 py-0.5 font-mono text-[10px] text-gray-400">
                {theme.tokenCount}
              </span>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="font-mono text-xs text-gray-600">No themes detected</p>
        )}
      </div>
    </aside>
  );
}
