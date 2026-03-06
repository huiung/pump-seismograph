# Contributing to Pump Seismograph

Thanks for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/pump-seismograph.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`
5. Start dev server: `npm run dev`

## Development

- The app runs in **demo mode** without API keys — no setup needed for UI work.
- For live data, copy `.env.example` to `.env.local` and add your Bitquery API key.

## What to Contribute

- **New theme categories** — Add keywords to `src/data/keywords.ts`
- **Visualization improvements** — Enhance the D3.js seismograph in `src/components/Seismograph.tsx`
- **Alert logic** — Improve foreshock detection in `src/lib/thresholds.ts`
- **Bug fixes** — Always welcome
- **Mobile UX** — Responsive improvements

## Pull Request Process

1. Ensure your code passes `npm run build` with no errors
2. Keep PRs focused — one feature or fix per PR
3. Describe what changed and why

## Code Style

- TypeScript throughout
- Tailwind CSS for styling
- `"use client"` directive for interactive components
- Keep it simple — no over-engineering

## Issues

Feel free to open issues for bugs, feature requests, or questions.
