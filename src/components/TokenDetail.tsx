"use client";

import React, { useState } from "react";

export interface TokenInfo {
  name: string;
  symbol: string;
  mintAddress: string;
  category: string;
  timestamp: number;
  initialBuyVolume: number;
  tradeAmount: number;
  description?: string;
}

export interface TokenDetailProps {
  token: TokenInfo | null;
  onClose: () => void;
}

const categoryColors: Record<string, string> = {
  meme: "#ff6b6b",
  defi: "#4ecdc4",
  ai: "#a78bfa",
  gaming: "#fbbf24",
  social: "#60a5fa",
  nft: "#f472b6",
};

export default function TokenDetail({ token, onClose }: TokenDetailProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token.mintAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable
    }
  };

  const truncatedAddress = token
    ? `${token.mintAddress.slice(0, 6)}...${token.mintAddress.slice(-4)}`
    : "";

  return (
    <>
      {/* Backdrop */}
      {token && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-80 transform border-l border-[#222222] bg-[#111111] p-4 sm:p-6 transition-transform duration-300 ease-in-out ${
          token ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {token && (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{token.name}</h2>
                <span className="font-mono text-sm text-gray-400">
                  ${token.symbol}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 transition-colors hover:text-white"
              >
                <svg
                  className="h-5 w-5"
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
            </div>

            {/* Category badge */}
            <span
              className="mb-4 inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor:
                  (categoryColors[token.category.toLowerCase()] || "#6b7280") +
                  "22",
                color:
                  categoryColors[token.category.toLowerCase()] || "#6b7280",
              }}
            >
              {token.category}
            </span>

            {/* Contract address */}
            <div className="mb-4">
              <p className="mb-1 text-xs text-gray-500">Contract Address</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs text-gray-300">
                  {truncatedAddress}
                </code>
                <button
                  onClick={copyAddress}
                  className="rounded bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-gray-400 transition-colors hover:text-white"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Initial Buy Volume</p>
                <p className="font-mono text-sm text-white">
                  {token.initialBuyVolume.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Trade Amount</p>
                <p className="font-mono text-sm text-white">
                  {token.tradeAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Launch time */}
            <div className="mb-4">
              <p className="text-xs text-gray-500">Launch Time</p>
              <p className="font-mono text-sm text-white">
                {new Date(token.timestamp).toLocaleString()}
              </p>
            </div>

            {/* Description */}
            {token.description && (
              <div className="mb-4">
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm text-gray-300">{token.description}</p>
              </div>
            )}

            {/* Links */}
            <div className="mt-auto flex flex-col gap-2">
              <a
                href={`https://pump.fun/coin/${token.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-center font-mono text-xs text-[#f59e0b] transition-colors hover:border-[#f59e0b]"
              >
                View on Pump.fun
              </a>
              <a
                href={`https://dexscreener.com/solana/${token.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-center font-mono text-xs text-[#00ff41] transition-colors hover:border-[#00ff41]"
              >
                View on DexScreener
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
