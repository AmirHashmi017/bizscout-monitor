import axios, { AxiosError } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { eventBus } from '../../utils/event-bus';
import { ResponseModel, ResponseDocument } from '../responses/response.model';
import { createIncident } from '../incidents/incident.service';
import { generatePayload } from './payload.util';
import { getRollingStats, isAnomalous } from './stats.service';

// Trim stored response bodies to keep documents small.
const MAX_BODY_BYTES = 8_000;

function byteLength(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value ?? ''), 'utf8');
  } catch {
    return 0;
  }
}

// Run one monitoring cycle:
//   1. Send a random payload to the target and time the round trip.
//   2. Compare the time against rolling stats to flag anomalies.
//   3. Save the sample.
//   4. Broadcast the sample to clients.
//   5. Open an incident when the sample looks abnormal.
// Always resolves, so a single failed request never stops the scheduler.
export async function runMonitoringCycle(): Promise<ResponseDocument | null> {
  const url = env.monitor.targetUrl;
  const payload = generatePayload();
  const startedAt = Date.now();

  let statusCode = 0;
  let success = false;
  let responseBody: unknown = null;
  let errorMessage: string | undefined;

  try {
    const res = await axios.post(url, payload, {
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
      // Treat any HTTP status as a completed request.
      validateStatus: () => true,
    });
    statusCode = res.status;
    success = res.status >= 200 && res.status < 400;
    responseBody = res.data;
  } catch (err) {
    const axiosErr = err as AxiosError;
    errorMessage = axiosErr.message;
    statusCode = axiosErr.response?.status ?? 0;
    success = false;
    logger.error({ err: axiosErr.message, url }, 'Monitoring request failed');
  }

  const responseTimeMs = Date.now() - startedAt;

  // Replace oversized bodies with a small marker before saving.
  let storedBody = responseBody;
  if (byteLength(responseBody) > MAX_BODY_BYTES) {
    storedBody = { _truncated: true, note: 'Response body exceeded storage limit' };
  }

  // Check the anomaly rules against the rolling window. Only successful pings qualify.
  const stats = await getRollingStats();
  const anomaly = success && isAnomalous(responseTimeMs, stats, env.anomalyFactor);

  const doc = await ResponseModel.create({
    timestamp: new Date(startedAt),
    url,
    method: 'POST',
    requestPayload: payload,
    statusCode,
    success,
    responseTimeMs,
    responseSizeBytes: byteLength(responseBody),
    responseBody: storedBody,
    isAnomaly: anomaly,
    error: errorMessage,
  });

  logger.info({ statusCode, responseTimeMs, isAnomaly: anomaly }, 'Monitoring cycle complete');

  eventBus.emit('response:new', doc);

  if (anomaly) {
    // Fire and forget. Incident creation never blocks or breaks the cycle.
    createIncident(doc, stats).catch((err) =>
      logger.error({ err }, 'Failed to create incident'),
    );
  }

  return doc;
}
