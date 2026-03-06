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

// Levenshtein distance for fuzzy matching
function editDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

// Check if text matches a keyword (exact substring or fuzzy)
function matchesKeyword(textWords: string[], text: string, keyword: string): boolean {
  // Exact substring match (handles "dogecoin" matching "doge")
  if (text.includes(keyword)) return true;

  // Fuzzy match: check each word against keyword
  // Only for keywords with 4+ chars to avoid false positives
  if (keyword.length >= 4) {
    for (const word of textWords) {
      if (word.length < 3) continue;
      const maxDist = keyword.length >= 6 ? 2 : 1;
      if (editDistance(word, keyword) <= maxDist) return true;
    }
  }

  return false;
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
const EMERGE_THRESHOLD = 5;

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
    const words = text.replace(/[^a-z0-9\s]/g, '').split(/\s+/);

    // Check static categories first
    for (const [category, keywords] of Object.entries(THEME_KEYWORDS)) {
      for (const keyword of keywords) {
        if (matchesKeyword(words, text, keyword)) {
          return category;
        }
      }
    }

    // Check dynamic categories
    for (const [category, keywords] of Object.entries(this.dynamicKeywords)) {
      for (const keyword of keywords) {
        if (matchesKeyword(words, text, keyword)) {
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

export function classifyToken(name: string, symbol: string, description?: string): string {
  const text = `${name} ${symbol} ${description || ''}`.toLowerCase();
  const words = text.replace(/[^a-z0-9\s]/g, '').split(/\s+/);

  for (const [category, keywords] of Object.entries(THEME_KEYWORDS)) {
    for (const keyword of keywords) {
      if (matchesKeyword(words, text, keyword)) {
        return category;
      }
    }
  }

  return 'Unknown';
}
