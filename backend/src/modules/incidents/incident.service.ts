import { IncidentModel, IncidentSeverity } from './incident.model';
import { generateIncidentAnalysis } from './incident.analyzer';
import type { ResponseDocument } from '../responses/response.model';
import type { RollingStats } from '../monitoring/stats.service';
import { eventBus } from '../../utils/event-bus';
import { logger } from '../../utils/logger';
import { buildPagination } from '../../utils/pagination';

// Map the overshoot ratio to a severity level.
export function classifySeverity(ratio: number): IncidentSeverity {
  if (ratio >= 4) return 'high';
  if (ratio >= 3) return 'medium';
  return 'low';
}

// Create an incident for an abnormal response (Option B requirement 2).
// The analyzer returns a rule based fallback on failure, so an incident always lands.
export async function createIncident(
  response: ResponseDocument,
  stats: RollingStats,
): Promise<void> {
  const ratio = stats.mean > 0 ? response.responseTimeMs / stats.mean : 1;
  const severity = classifySeverity(ratio);

  const analysis = await generateIncidentAnalysis({
    endpoint: response.url,
    responseTimeMs: response.responseTimeMs,
    avgResponseTimeMs: stats.mean,
    statusCode: response.statusCode,
    ratio,
  });

  const incident = await IncidentModel.create({
    responseId: response._id,
    timestamp: response.timestamp,
    severity,
    endpoint: response.url,
    responseTimeMs: response.responseTimeMs,
    avgResponseTimeMs: stats.mean,
    title: analysis.title,
    rootCause: analysis.rootCause,
    recommendations: analysis.recommendations,
    generatedBy: analysis.generatedBy,
  });

  logger.warn(
    { incidentId: incident.id, severity, ratio: Number(ratio.toFixed(2)) },
    'Incident created',
  );

  eventBus.emit('incident:new', incident);
}

// Paginated incident history for the Incidents tab.
export async function listIncidents(page: number, limit: number) {
  const [items, total] = await Promise.all([
    IncidentModel.find()
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    IncidentModel.countDocuments(),
  ]);
  return { items, pagination: buildPagination(page, limit, total) };
}
