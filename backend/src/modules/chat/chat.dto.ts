
export interface ChatResult {
  answer: string;
  source: 'llm' | 'cache' | 'fallback';
  estimatedInputTokens?: number;
  remainingCalls: number;
}
