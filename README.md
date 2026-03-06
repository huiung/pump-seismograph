# Pump Seismograph

**Read the memecoin market like a seismograph. When foreshocks hit, the mainshock follows.**

A real-time dashboard that visualizes Pump.fun token activity as seismic waves. Tokens are classified into themes (AI, Dog, Cat, Political, etc.), and each theme gets its own seismograph channel. When a theme shows a sudden burst of copycat launches — a "foreshock" pattern — the system triggers an earthquake warning, signaling a potential breakout.

> Before every major memecoin, there's a swarm of copycats. This tool detects the swarm.

## How It Works

1. **Stream** — Connects to Pump.fun trades in real-time via Bitquery WebSocket
2. **Classify** — Each token is categorized by theme using fuzzy keyword matching (typo-tolerant)
3. **Detect** — Emerging themes auto-generate new categories when unknown tokens cluster
4. **Visualize** — Theme activity renders as parallel seismograph lines with D3.js (log-scale amplitude)
5. **Alert** — When a theme's activity exceeds the rolling average, an earthquake warning triggers

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=flat-square&logo=d3.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)

## Quick Start

```bash
git clone https://github.com/huiung/pump-seismograph.git
cd pump-seismograph
npm install
npm run dev
```

The app runs in **demo mode** without API keys. For live Pump.fun data:

```bash
cp .env.example .env.local
```

| Variable | Source | Required |
|----------|--------|----------|
| `NEXT_PUBLIC_BITQUERY_API_KEY` | [bitquery.io](https://bitquery.io) (free tier: 10K points/mo) | For live data |
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) | For history |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [supabase.com](https://supabase.com) | For history |

## Features

- **Real-time Seismograph** — D3.js multi-channel visualization with CRT scanline effect and log-scale amplitude
- **7 Built-in Themes** — AI, Dog, Cat, Political, Pepe, Influencer, Gaming
- **Dynamic Theme Detection** — Unknown tokens that cluster around a word auto-generate new categories
- **Fuzzy Classification** — Levenshtein distance matching catches typos and variations
- **Richter Scale Sidebar** — Live ranking of theme activity (1.0 - 10.0)
- **Earthquake Warnings** — Auto-triggered alerts with pulse/shake animation when theme activity spikes
- **Notable Tremors** — Only tokens with meaningful volume ($10+) shown in the feed, reducing rug noise
- **Token Details** — Click to see token info with Pump.fun and DexScreener links
- **Mobile Responsive** — Adaptive labels, collapsible sidebar, full-width panels on small screens

## Theme Categories

| Theme | Color | Example Keywords |
|-------|-------|------------------|
| AI | Cyan | ai, gpt, neural, llm, bot, agent... |
| Dog | Orange | doge, shiba, inu, bonk, puppy... |
| Cat | Pink | cat, kitty, meow, nyan, purr... |
| Political | Red | trump, maga, biden, vote... |
| Pepe | Green | pepe, frog, kek, wojak, based... |
| Influencer | Yellow | elon, musk, drake, swift, streamer... |
| Gaming | Sky Blue | gaming, esport, fortnite, minecraft... |
| *Dynamic* | *Auto-assigned* | *Auto-detected from trending unknown tokens* |

## Roadmap

- [x] Real-time seismograph visualization
- [x] Fuzzy theme classification engine
- [x] Dynamic emerging theme detection
- [x] Richter scale alert system
- [x] Volume-based noise filtering
- [x] Mobile responsive design
- [ ] Historical overlay (past mainshock patterns)
- [ ] Sound effects for earthquake warnings
- [ ] Telegram/Discord alert bot
- [ ] Token price tracking via DexScreener API
- [ ] Multi-chain support (Base, ETH)

## Project Structure

```
src/
  app/
    page.tsx              # Main dashboard
    layout.tsx            # Layout + metadata
    api/tokens/route.ts   # Token history API
  components/
    Seismograph.tsx       # D3.js seismograph
    RichterSidebar.tsx    # Theme ranking
    TokenDetail.tsx       # Token info panel
    EarthquakeAlert.tsx   # Warning banner
  lib/
    bitquery.ts           # WebSocket client
    classifier.ts         # Fuzzy classifier + dynamic themes
    supabase.ts           # DB client
    thresholds.ts         # Alert logic
  data/
    keywords.ts           # Theme keywords + colors
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs welcome!

## License

[MIT](./LICENSE)
