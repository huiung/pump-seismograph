import { THEME_KEYWORDS, THEME_COLORS } from '@/data/keywords';

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

// Stop words to ignore when detecting emerging themes
const STOP_WORDS = new Set([
  'the', 'of', 'to', 'and', 'a', 'in', 'is', 'it', 'for', 'on',
  'with', 'this', 'that', 'token', 'coin', 'sol', 'solana', 'pump',
  'fun', 'new', 'buy', 'sell', 'hold', 'go', 'get', 'my', 'your',
  'we', 'are', 'was', 'be', 'has', 'have', 'will', 'can', 'do',
  'not', 'but', 'or', 'so', 'if', 'no', 'yes', 'up', 'all', 'just',
  'one', 'its', 'im', 'gonna', 'big', 'mega', 'super', 'mini',
  'pro', 'max', 'official', 'real', 'true', 'dao', 'fi', 'wen',
]);

const MIN_WORD_LENGTH = 3;
const EMERGE_THRESHOLD = 5; // min occurrences to create a new category

// Dynamic color palette for emerging themes
const DYNAMIC_COLORS = [
  '#e879f9', '#34d399', '#fb923c', '#38bdf8', '#f87171',
  '#a78bfa', '#fbbf24', '#2dd4bf', '#f472b6', '#818cf8',
];

export class DynamicClassifier {
  private dynamicKeywords: Record<string, string[]> = {};
  private dynamicColors: Record<string, string> = {};
  private wordCounts: Map<string, number> = new Map();
  private colorIndex = 0;

  classifyToken(name: string, symbol: string, description?: string): string {
    const text = `${name} ${symbol} ${description || ''}`.toLowerCase();

    // Check static categories first
    for (const [category, keywords] of Object.entries(THEME_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return category;
        }
      }
    }

    // Check dynamic categories
    for (const [category, keywords] of Object.entries(this.dynamicKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return category;
        }
      }
    }

    // Track words from unknown tokens for emerging theme detection
    this.trackWords(name);

    return 'Unknown';
  }

  private trackWords(name: string) {
    const words = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    for (const word of words) {
      if (word.length < MIN_WORD_LENGTH || STOP_WORDS.has(word)) continue;

      const count = (this.wordCounts.get(word) || 0) + 1;
      this.wordCounts.set(word, count);

      // Word hit threshold — create new category
      if (count === EMERGE_THRESHOLD && !this.dynamicKeywords[word]) {
        const categoryName = word.charAt(0).toUpperCase() + word.slice(1);
        this.dynamicKeywords[categoryName] = [word];
        this.dynamicColors[categoryName] =
          DYNAMIC_COLORS[this.colorIndex % DYNAMIC_COLORS.length];
        this.colorIndex++;
        console.log(`[Classifier] New theme emerged: "${categoryName}" (${count} occurrences)`);
      }
    }
  }

  getColors(): Record<string, string> {
    return { ...THEME_COLORS, ...this.dynamicColors };
  }

  getDynamicThemes(): string[] {
    return Object.keys(this.dynamicKeywords);
  }
}

// Simple function for backward compatibility
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
