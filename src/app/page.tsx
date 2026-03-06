"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Seismograph, {
  SeismographDataPoint,
} from "@/components/Seismograph";
import RichterSidebar, { ThemeEntry } from "@/components/RichterSidebar";
import TokenDetail, { TokenInfo } from "@/components/TokenDetail";
import EarthquakeAlert, { AlertItem } from "@/components/EarthquakeAlert";
import { TokenEvent, DynamicClassifier } from "@/lib/classifier";
import { THEME_COLORS, THEME_KEYWORDS } from "@/data/keywords";
import {
  ThemeActivity,
  calculateRichterLevel,
  getAlertLevel,
} from "@/lib/thresholds";
import { createPumpFunSubscription } from "@/lib/bitquery";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProcessedToken extends TokenEvent {
  category: string;
}

// ── Mock data generator (demo mode) ──────────────────────────────────────────

const MOCK_NAMES: Record<string, string[]> = {
  AI: ["NeuralDoge", "GPTMoon", "AIBot", "LLMCoin", "AgentX"],
  Dog: ["ShibaRocket", "DogeKing", "PuppyCoin", "WoofToken", "BonkJr"],
  Cat: ["KittyMoon", "MeowCoin", "NyanToken", "PurrFi", "CatGold"],
  Political: ["TrumpRocket", "MAGACoin", "ElonMoon", "BidenCoin", "VoteToken"],
  Pepe: ["PepeGold", "FrogKing", "KekCoin", "BasedPepe", "RareWojak"],
  Celebrity: ["DrakeToken", "SwiftCoin", "KanyeMoon", "StarToken", "FameCoin"],
  Food: ["PizzaCoin", "BurgerDAO", "SushiSwap2", "TacoMoon", "CoffeeToken"],
  Space: ["MoonShot", "MarsDAO", "RocketCoin", "GalaxyToken", "AlienMoon"],
  Gaming: ["GameFi2", "PlayCoin", "SteamToken", "RPGMoon", "PvPCoin"],
};

function generateMockToken(): ProcessedToken {
  const themes = Object.keys(MOCK_NAMES);
  // Weighted random — some themes burst more
  const weights = themes.map(() => Math.random());
  // Occasionally create a burst for a random theme
  const burstIdx = Math.floor(Math.random() * themes.length);
  weights[burstIdx] *= 3;
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let theme = themes[0];
  for (let i = 0; i < themes.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      theme = themes[i];
      break;
    }
  }
  const names = MOCK_NAMES[theme];
  const name = names[Math.floor(Math.random() * names.length)];
  const symbol = name.slice(0, 4).toUpperCase();
  const mintAddress = Array.from({ length: 44 }, () =>
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"[
      Math.floor(Math.random() * 58)
    ]
  ).join("");

  return {
    name,
    symbol,
    mintAddress,
    timestamp: Date.now(),
    initialBuyVolume: Math.random() * 50 + 0.5,
    tradeAmount: Math.random() * 100 + 1,
    category: theme,
  };
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function Home() {
  const [seismographData, setSeismographData] = useState<
    Record<string, SeismographDataPoint[]>
  >({});
  const [themeActivities, setThemeActivities] = useState<
    Record<string, ThemeActivity>
  >({});
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [tokenLog, setTokenLog] = useState<ProcessedToken[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dismissedRef = useRef<Set<string>>(new Set());
  const seenTokensRef = useRef<Set<string>>(new Set());
  const classifierRef = useRef(new DynamicClassifier());

  // Process a new token event
  const processToken = useCallback((token: ProcessedToken) => {
    const { category, timestamp, initialBuyVolume } = token;
    const amplitude = Math.min(initialBuyVolume / 20, 1); // normalize 0-1

    // Update seismograph data
    setSeismographData((prev) => {
      const themePoints = prev[category] || [];
      const cutoff = Date.now() - 120_000; // keep 2 min of data
      const filtered = themePoints.filter((p) => p.timestamp > cutoff);
      return {
        ...prev,
        [category]: [
          ...filtered,
          {
            timestamp,
            amplitude,
            token: token.mintAddress,
          },
        ],
      };
    });

    // Update theme activities
    setThemeActivities((prev) => {
      const existing = prev[category] || {
        theme: category,
        count: 0,
        volume: 0,
        timestamps: [],
      };
      const cutoff = Date.now() - 30 * 60 * 1000;
      return {
        ...prev,
        [category]: {
          theme: category,
          count: existing.count + 1,
          volume: existing.volume + initialBuyVolume,
          timestamps: [...existing.timestamps.filter((t) => t > cutoff), timestamp],
        },
      };
    });

    // Update token log (keep last 200)
    setTokenLog((prev) => [token, ...prev].slice(0, 200));
  }, []);

  // Check alerts after activities update
  useEffect(() => {
    const newAlerts: AlertItem[] = [];
    for (const activity of Object.values(themeActivities)) {
      const level = calculateRichterLevel(activity);
      const alertLevel = getAlertLevel(level);
      if (
        alertLevel === "earthquake" &&
        !dismissedRef.current.has(activity.theme)
      ) {
        newAlerts.push({ theme: activity.theme, richterLevel: level });
      }
    }
    setAlerts(newAlerts);
  }, [themeActivities]);

  // Start demo mode fallback
  const startDemo = useCallback(() => {
    const allThemes = Object.keys(THEME_KEYWORDS);
    for (const theme of allThemes) {
      setSeismographData((prev) => ({ ...prev, [theme]: [] }));
    }
    const interval = setInterval(() => {
      const token = generateMockToken();
      processToken(token);
    }, 800 + Math.random() * 1500);
    return interval;
  }, [processToken]);

  // Connect to data source
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_BITQUERY_API_KEY;
    let demoInterval: ReturnType<typeof setInterval> | null = null;

    if (apiKey) {
      // Live mode — with fallback to demo on connection failure
      const sub = createPumpFunSubscription(
        apiKey,
        (event) => {
          // Skip tokens we've already seen
          if (seenTokensRef.current.has(event.mintAddress)) return;
          seenTokensRef.current.add(event.mintAddress);

          const category = classifierRef.current.classifyToken(
            event.name,
            event.symbol,
            event.description
          );
          processToken({ ...event, category });
        },
        (err) => console.error("Bitquery error:", err),
        () => {
          // Connection failed — fall back to demo
          console.warn("Falling back to demo mode");
          if (!demoInterval) {
            demoInterval = startDemo();
          }
        }
      );
      return () => {
        sub.close();
        if (demoInterval) clearInterval(demoInterval);
      };
    } else {
      // No API key — demo mode
      demoInterval = startDemo();
      return () => {
        if (demoInterval) clearInterval(demoInterval);
      };
    }
  }, [processToken, startDemo]);

  // Merge static + dynamic colors
  const allColors = { ...classifierRef.current.getColors(), ...THEME_COLORS };

  // Build sidebar data
  const themeEntries: ThemeEntry[] = Object.keys({
    ...allColors,
    ...themeActivities,
  })
    .filter((name) => name !== "Unknown" || themeActivities[name])
    .map((name) => {
      const activity = themeActivities[name] || {
        theme: name,
        count: 0,
        volume: 0,
        timestamps: [],
      };
      const richterLevel = calculateRichterLevel(activity);
      return {
        name,
        richterLevel,
        alertLevel: getAlertLevel(richterLevel),
        tokenCount: activity.count,
        color: allColors[name] || "#666666",
      };
    });

  const handleTokenClick = useCallback(
    (mintAddress: string, theme: string) => {
      void theme;
      const token = tokenLog.find((t) => t.mintAddress === mintAddress);
      if (token) {
        setSelectedToken({
          name: token.name,
          symbol: token.symbol,
          mintAddress: token.mintAddress,
          category: token.category,
          timestamp: token.timestamp,
          initialBuyVolume: token.initialBuyVolume,
          tradeAmount: token.tradeAmount,
          description: token.description,
        });
      }
    },
    [tokenLog]
  );

  const handleDismissAlert = useCallback((theme: string) => {
    dismissedRef.current.add(theme);
    setAlerts((prev) => prev.filter((a) => a.theme !== theme));
    // Reset after 5 minutes
    setTimeout(() => dismissedRef.current.delete(theme), 5 * 60 * 1000);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Earthquake Alert Banner */}
      <EarthquakeAlert alerts={alerts} onDismiss={handleDismissAlert} />

      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="animate-flicker glow-green font-mono text-sm sm:text-lg font-bold tracking-wider text-[#00ff41]">
            <span className="hidden sm:inline">PUMP SEISMOGRAPH</span>
            <span className="sm:hidden">SEISMOGRAPH</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full bg-green-500 animate-status-pulse"
            />
            <span className="font-mono text-[10px] text-gray-500">
              LIVE
            </span>
          </div>
          <a
            href="https://github.com/huiung/pump-seismograph"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 transition-colors hover:text-gray-300"
            aria-label="GitHub Repository"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded border border-[#222] px-2 py-1 font-mono text-[10px] text-gray-500 transition-colors hover:text-gray-300 md:hidden"
          >
            {sidebarOpen ? "HIDE" : "RICHTER"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Seismograph area */}
        <main className="relative flex-1 overflow-auto bg-[#0a0a0a] p-4 scanlines">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] text-gray-600">
              REAL-TIME SEISMIC ACTIVITY — {Object.keys(seismographData).length}{" "}
              CHANNELS
            </span>
            <span className="font-mono text-[10px] text-gray-600">
              {tokenLog.length} EVENTS RECORDED
            </span>
          </div>
          <Seismograph
            data={seismographData}
            onTokenClick={handleTokenClick}
            themeColors={allColors}
          />

          {/* Recent tokens feed */}
          <div className="mt-4 border-t border-[#1a1a1a] pt-3">
            <h3 className="mb-2 font-mono text-[10px] tracking-wider text-gray-600">
              RECENT LAUNCHES
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tokenLog.slice(0, 20).map((t, i) => (
                <button
                  key={`${t.mintAddress}-${i}`}
                  onClick={() =>
                    setSelectedToken({
                      name: t.name,
                      symbol: t.symbol,
                      mintAddress: t.mintAddress,
                      category: t.category,
                      timestamp: t.timestamp,
                      initialBuyVolume: t.initialBuyVolume,
                      tradeAmount: t.tradeAmount,
                      description: t.description,
                    })
                  }
                  className="rounded border border-[#222] bg-[#111] px-2 py-1 font-mono text-[10px] transition-colors hover:border-[#444]"
                  style={{ color: allColors[t.category] || "#666" }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Richter Sidebar */}
        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? "w-72" : "w-0 overflow-hidden"
          } hidden md:block`}
        >
          <RichterSidebar themes={themeEntries} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full">
              <RichterSidebar themes={themeEntries} />
            </div>
          </div>
        )}
      </div>

      {/* Token Detail Panel */}
      <TokenDetail
        token={selectedToken}
        onClose={() => setSelectedToken(null)}
      />

      {/* Footer */}
      <footer className="shrink-0 border-t border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2 text-center">
        <span className="font-mono text-[10px] text-gray-600">
          PUMP SEISMOGRAPH v0.1.0 — Powered by{" "}
          <a
            href="https://bitquery.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 underline-offset-2 hover:underline"
          >
            Bitquery
          </a>{" "}
          &{" "}
          <a
            href="https://dexscreener.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 underline-offset-2 hover:underline"
          >
            DexScreener
          </a>
        </span>
      </footer>
    </div>
  );
}
