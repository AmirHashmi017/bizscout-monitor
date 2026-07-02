import { logger } from '../../utils/logger';
import { checkAvailability, complete } from '../llm/llm.client';

export interface IncidentInput {
  endpoint: string;
  responseTimeMs: number;
  avgResponseTimeMs: number;
  statusCode: number;
  ratio: number;
}

export interface IncidentAnalysis {
  title: string;
  rootCause: string;
  recommendations: string[];
  generatedBy: string; // "llm" or "rule-based"
}

const SYSTEM_PROMPT = `You are an SRE assistant analyzing HTTP monitoring anomalies.
Given a slow-response incident, produce a concise incident report.
Respond ONLY with minified JSON of shape:
{"title": string, "rootCause": string, "recommendations": string[]}
Keep rootCause under 60 words. Give 2-3 short, actionable recommendations.
Do not wrap the JSON in markdown fences.`;

// Deterministic fallback used when the LLM is off or rate limited.
// Guarantees an incident always has a usable description.
function ruleBasedAnalysis(input: IncidentInput): IncidentAnalysis {
  return {
    title: `Elevated response time on ${input.endpoint}`,
    rootCause:
      `Response time (${input.responseTimeMs}ms) exceeded ${input.ratio.toFixed(1)}x the ` +
      `rolling average (${Math.round(input.avgResponseTimeMs)}ms). Likely causes: upstream ` +
      `latency, network congestion, or a transient load spike.`,
    recommendations: [
      'Check upstream/service health and recent deploys around this timestamp.',
      'Review network metrics and retry the request to confirm persistence.',
      'If recurring, consider adding caching or scaling the affected component.',
    ],
    generatedBy: 'rule-based',
  };
}

// Remove markdown code fences the model sometimes adds around JSON.
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// Build the incident analysis. Prefer Gemini.
// Fall back to the rule based version on any failure, so incident creation never breaks.
export async function generateIncidentAnalysis(
  input: IncidentInput,
): Promise<IncidentAnalysis> {
  if (checkAvailability() !== null) {
    return ruleBasedAnalysis(input);
  }

  try {
    const { text } = await complete(SYSTEM_PROMPT, JSON.stringify(input), 512);
    const parsed = JSON.parse(stripFences(text)) as Omit<IncidentAnalysis, 'generatedBy'>;
    return {
      title: parsed.title,
      rootCause: parsed.rootCause,
      recommendations: parsed.recommendations ?? [],
      generatedBy: 'llm',
    };
  } catch (err) {
    logger.warn({ err }, 'LLM incident analysis failed; using rule-based fallback');
    return ruleBasedAnalysis(input);
  }
}
