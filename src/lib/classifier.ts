import { THEME_KEYWORDS } from '@/data/keywords';

export interface TokenEvent {
  name: string;
  symbol: string;
  description?: string;
  mintAddress: string;
  timestamp: number;
  initialBuyVolume: number;
  tradeAmount: number;
  category?: string;
}

export function classifyToken(name: string, symbol: string, description?: string): string {
  const text = `${name} ${symbol} ${description || ''}`.toLowerCase();

  for (const [category, keywords] of Object.entries(THEME_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Unknown';
}
