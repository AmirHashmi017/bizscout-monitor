

// Shared types mirroring the backend API responses.
export interface MonitorResponse {
  _id: string;
  timestamp: string;
  url: string;
  method: string;
  statusCode: number;
  success: boolean;
  responseTimeMs: number;
  responseSizeBytes: number;
  isAnomaly: boolean;
  error?: string;
  requestPayload?: unknown;
  responseBody?: unknown;
}

export interface Incident {
  _id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  endpoint: string;
  responseTimeMs: number;
  avgResponseTimeMs: number;
  title: string;
  rootCause: string;
  recommendations: string[];
  generatedBy: string;
}

export interface RollingStats {
  count: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  p95: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface ChatResult {
  answer: string;
  source: 'llm' | 'cache' | 'fallback';
  estimatedInputTokens?: number;
  remainingCalls: number;
}

export interface CostSnapshot {
  enabled: boolean;
  provider?: string;
  model: string;
  maxCallsPerHour: number;
  remainingCalls: number;
  totalCalls: number;
  cachedHits: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
}
