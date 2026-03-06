"use client";

import React, { useEffect, useRef, useState } from "react";

export interface AlertItem {
  theme: string;
  richterLevel: number;
}

export interface EarthquakeAlertProps {
  alerts: AlertItem[];
  onDismiss: (theme: string) => void;
}

export default function EarthquakeAlert({
  alerts,
  onDismiss,
}: EarthquakeAlertProps) {
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (alerts.length > prevCountRef.current && !muted) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio("/alert.mp3");
          audioRef.current.volume = 0.5;
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Audio play failed (no file or autoplay blocked)
        });
      } catch {
        // Audio API unavailable
      }
    }
    prevCountRef.current = alerts.length;
  }, [alerts.length, muted]);

  if (alerts.length === 0) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 animate-pulse border-b border-red-900 bg-red-950/90 px-4 py-3 backdrop-blur-sm"
      style={{
        animation: "earthquake-pulse 1s ease-in-out infinite, earthquake-shake 0.3s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes earthquake-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 0, 0, 0.6); }
        }
        @keyframes earthquake-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }
      `}</style>

      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <span className="shrink-0 font-mono text-sm font-bold tracking-wider text-red-400">
            {"\u26A0"} EARTHQUAKE WARNING
          </span>
          <div className="flex flex-wrap gap-2">
            {alerts.map((alert) => (
              <span
                key={alert.theme}
                className="inline-flex items-center gap-1.5 rounded bg-red-900/50 px-2 py-0.5 font-mono text-xs text-red-300"
              >
                {alert.theme}: {alert.richterLevel.toFixed(1)}
                <button
                  onClick={() => onDismiss(alert.theme)}
                  className="ml-1 text-red-500 transition-colors hover:text-red-200"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setMuted((m) => !m)}
          className="ml-3 shrink-0 rounded bg-red-900/50 px-2 py-1 font-mono text-[10px] text-red-400 transition-colors hover:text-red-200"
        >
          {muted ? "UNMUTE" : "MUTE"}
        </button>
      </div>
    </div>
  );
}
