"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";

export interface SeismographDataPoint {
  timestamp: number;
  amplitude: number;
  token?: string;
}

export interface SeismographProps {
  data: Record<string, SeismographDataPoint[]>;
  onTokenClick?: (token: string, theme: string) => void;
  themeColors: Record<string, string>;
}

const TIME_WINDOW = 60_000; // 60 seconds
const LINE_HEIGHT = 50;
const LABEL_WIDTH_DESKTOP = 120;
const LABEL_WIDTH_MOBILE = 60;
const RIGHT_PAD = 10;

export default function Seismograph({
  data,
  onTokenClick,
  themeColors,
}: SeismographProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const draw = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Lazy-load d3 in the browser
    import("d3").then((d3) => {
      const themes = Object.keys(data);
      const totalHeight = themes.length * LINE_HEIGHT;
      const labelWidth = width < 500 ? LABEL_WIDTH_MOBILE : LABEL_WIDTH_DESKTOP;
      const chartWidth = width - labelWidth - RIGHT_PAD;
      const now = Date.now();
      const tMin = now - TIME_WINDOW;

      const sel = d3.select(svg);
      sel.attr("width", width).attr("height", totalHeight);
      sel.selectAll("*").remove();

      // Background
      sel
        .append("rect")
        .attr("width", width)
        .attr("height", totalHeight)
        .attr("fill", "#0a0a0a");

      // Grid lines (vertical time markers)
      const gridGroup = sel.append("g");
      for (let t = 0; t <= 60; t += 5) {
        const x = labelWidth + (t / 60) * chartWidth;
        gridGroup
          .append("line")
          .attr("x1", x)
          .attr("y1", 0)
          .attr("x2", x)
          .attr("y2", totalHeight)
          .attr("stroke", "#1a1a1a")
          .attr("stroke-width", 1);
      }

      // Horizontal grid lines
      for (let i = 0; i <= themes.length; i++) {
        gridGroup
          .append("line")
          .attr("x1", labelWidth)
          .attr("y1", i * LINE_HEIGHT)
          .attr("x2", width - RIGHT_PAD)
          .attr("y2", i * LINE_HEIGHT)
          .attr("stroke", "#1a1a1a")
          .attr("stroke-width", 1);
      }

      const xScale = d3
        .scaleLinear()
        .domain([tMin, now])
        .range([labelWidth, labelWidth + chartWidth]);

      themes.forEach((theme, i) => {
        const color = themeColors[theme] || "#00ff41";
        const centerY = i * LINE_HEIGHT + LINE_HEIGHT / 2;
        const amplitudeScale = LINE_HEIGHT / 2 - 4;

        // Label
        sel
          .append("text")
          .attr("x", 8)
          .attr("y", centerY + 4)
          .attr("fill", color)
          .attr("font-size", width < 500 ? "9px" : "11px")
          .attr("font-family", "monospace")
          .text(width < 500
            ? (theme.length > 6 ? theme.slice(0, 5) + "\u2026" : theme)
            : (theme.length > 14 ? theme.slice(0, 13) + "\u2026" : theme));

        // Build line data: filter to time window, add baseline noise between points
        const points = (data[theme] || [])
          .filter((d) => d.timestamp >= tMin && d.timestamp <= now)
          .sort((a, b) => a.timestamp - b.timestamp);

        // Generate continuous line with baseline noise
        const linePoints: { x: number; y: number; token?: string }[] = [];
        const step = TIME_WINDOW / 300; // ~300 points across the window

        for (let t = tMin; t <= now; t += step) {
          const x = xScale(t);
          // Find if there's a data spike near this time
          let amp = 0;
          let closestToken: string | undefined;
          for (const p of points) {
            const dist = Math.abs(p.timestamp - t);
            if (dist < step * 2) {
              const falloff = 1 - dist / (step * 2);
              if (p.amplitude * falloff > amp) {
                amp = p.amplitude * falloff;
                closestToken = p.token;
              }
            }
          }
          // Baseline noise
          const noise = (Math.random() - 0.5) * 0.03;
          const y = centerY - (amp + noise) * amplitudeScale;
          linePoints.push({ x, y, token: closestToken });
        }

        // Draw the line
        const lineGen = d3
          .line<{ x: number; y: number }>()
          .x((d) => d.x)
          .y((d) => d.y)
          .curve(d3.curveMonotoneX);

        sel
          .append("path")
          .datum(linePoints)
          .attr("d", lineGen)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.9);

        // Clickable spike zones
        if (onTokenClick) {
          points.forEach((p) => {
            if (!p.token) return;
            const cx = xScale(p.timestamp);
            sel
              .append("circle")
              .attr("cx", cx)
              .attr("cy", centerY - p.amplitude * amplitudeScale)
              .attr("r", 6)
              .attr("fill", "transparent")
              .attr("cursor", "pointer")
              .on("click", () => {
                if (p.token) onTokenClick(p.token, theme);
              });
          });
        }
      });
    });
  }, [data, themeColors, width, onTokenClick]);

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      draw();
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <svg ref={svgRef} className="block" />
      {/* CRT scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
          zIndex: 10,
        }}
      />
    </div>
  );
}
