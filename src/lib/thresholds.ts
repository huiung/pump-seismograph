export interface ThemeActivity {
  theme: string;
  count: number;
  volume: number;
  timestamps: number[];
}

const WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const BASE_FREQUENCY = 100; // baseline: ~100 tokens per 30 min on Helius
const BASE_VOLUME = 500; // baseline USD volume

export function calculateRichterLevel(activity: ThemeActivity): number {
  const now = Date.now();
  const recentTimestamps = activity.timestamps.filter(t => now - t < WINDOW_MS);
  const frequency = recentTimestamps.length;
  const freqRatio = Math.max(frequency / BASE_FREQUENCY, 1);
  const volRatio = Math.max(activity.volume / BASE_VOLUME, 1);
  const raw = Math.log10(freqRatio * volRatio) * 2.5 + 1;
  return Math.min(Math.max(Math.round(raw * 10) / 10, 1), 10);
}

export function getAlertLevel(richter: number): 'calm' | 'warning' | 'earthquake' {
  if (richter >= 7) return 'earthquake';
  if (richter >= 4) return 'warning';
  return 'calm';
}
