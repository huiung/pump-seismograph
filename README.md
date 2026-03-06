# Pump Seismograph

**Read the memecoin market like a seismograph. When foreshocks hit, the mainshock follows.**

A real-time dashboard that visualizes new Pump.fun token launches as seismic activity. Tokens are classified into themes (AI, Dog, Cat, Political, etc.), and each theme gets its own seismograph channel. When a theme shows a sudden burst of copycat launches — a "foreshock" pattern — the system triggers an earthquake warning, signaling a potential breakout.

> Before every major memecoin, there's a swarm of copycats. This tool detects the swarm.

## How It Works

1. **Stream** — Connects to Pump.fun trades via Bitquery WebSocket (or runs in demo mode)
2. **Classify** — Each new token is categorized by theme using keyword matching
3. **Visualize** — Theme activity renders as parallel seismograph lines with D3.js
4. **Alert** — When a theme's launch frequency exceeds the rolling average, an earthquake warning triggers

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

No API keys needed — the app launches in **demo mode** with simulated token events.

### Live Data (Optional)

```bash
cp .env.example .env.local
```

Add your keys to `.env.local`:

| Variable | Source | Required |
|----------|--------|----------|
| `NEXT_PUBLIC_BITQUERY_API_KEY` | [bitquery.io](https://bitquery.io) (free tier: 10K points/mo) | For live data |
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) | For history |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [supabase.com](https://supabase.com) | For history |

## Features

- **9 Theme Channels** — AI, Dog, Cat, Political, Pepe, Celebrity, Food, Space, Gaming
- **Real-time Seismograph** — D3.js multi-channel visualization with CRT scanline effect
- **Richter Scale Sidebar** — Live ranking of theme activity (1.0 - 10.0)
- **Earthquake Warnings** — Auto-triggered alerts when theme activity spikes
- **Token Details** — Click any spike to see token info with DexScreener/Birdeye links
- **Demo Mode** — Works without any API keys or configuration
- **Mobile Responsive** — Collapsible sidebar for smaller screens

## Theme Categories

| Theme | Color | Keywords |
|-------|-------|----------|
| AI | Cyan | ai, gpt, neural, llm, bot, agent... |
| Dog | Orange | doge, shiba, inu, bonk, puppy... |
| Cat | Pink | cat, kitty, meow, nyan, purr... |
| Political | Red | trump, maga, elon, biden, vote... |
| Pepe | Green | pepe, frog, kek, wojak, based... |
| Celebrity | Yellow | drake, kanye, swift, kardashian... |
| Food | Orange-Red | pizza, burger, sushi, taco, coffee... |
| Space | Purple | moon, mars, rocket, galaxy, alien... |
| Gaming | Sky Blue | game, esport, steam, rpg, pvp... |

## Roadmap

- [x] Real-time seismograph visualization
- [x] Theme classification engine
- [x] Richter scale alert system
- [x] Demo mode
- [ ] Historical overlay (past mainshock patterns)
- [ ] Sound effects for earthquake warnings
- [ ] Custom theme creation
- [ ] Telegram/Discord alert bot
- [ ] Multi-language support

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
    classifier.ts         # Theme classifier
    supabase.ts           # DB client
    thresholds.ts         # Alert logic
  data/
    keywords.ts           # Theme keywords + colors
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs welcome!

## License

[MIT](./LICENSE)
