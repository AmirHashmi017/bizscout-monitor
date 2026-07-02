import { ResponseModel } from '../responses/response.model';
import { IncidentModel } from '../incidents/incident.model';
import { computeStats } from '../monitoring/stats.service';

// Build a compact factual snapshot of recent data for the LLM to reason over.
// Design choice: pre aggregate the data the model needs instead of letting the
// model write raw MongoDB queries. Safer and lower cost.
export async function buildQueryContext(windowMs = 24 * 60 * 60 * 1000): Promise<string> {
  const since = new Date(Date.now() - windowMs);

  const [recent, slowest, incidents] = await Promise.all([
    ResponseModel.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(200)
      .lean(),
    ResponseModel.find({ timestamp: { $gte: since }, success: true })
      .sort({ responseTimeMs: -1 })
      .limit(5)
      .lean(),
    IncidentModel.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean(),
  ]);

  const times = recent.filter((r) => r.success).map((r) => r.responseTimeMs);
  const stats = computeStats(times);
  const failures = recent.filter((r) => !r.success).length;

  const lines: string[] = [
    `Window: last ${Math.round(windowMs / 3_600_000)}h`,
    `Total samples: ${recent.length} (failures: ${failures})`,
    `Response time ms | mean: ${stats.mean}, stdDev: ${stats.stdDev}, min: ${stats.min}, max: ${stats.max}, p95: ${stats.p95}`,
    '',
    'Slowest successful responses:',
    ...slowest.map(
      (r) => `- ${new Date(r.timestamp).toISOString()} | ${r.responseTimeMs}ms | HTTP ${r.statusCode}`,
    ),
    '',
    `Incidents (${incidents.length}):`,
    ...incidents.map(
      (i) =>
        `- ${new Date(i.timestamp).toISOString()} | ${i.severity} | ${i.responseTimeMs}ms vs avg ${Math.round(i.avgResponseTimeMs)}ms | ${i.title}`,
    ),
  ];

  return lines.join('\n');
}
