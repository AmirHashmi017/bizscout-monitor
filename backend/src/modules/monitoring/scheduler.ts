import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { runMonitoringCycle } from './monitoring.service';

let timer: NodeJS.Timeout | null = null;
let running = false;

// Guarded runner. Skips a tick when the previous cycle is still in flight.
async function tick(): Promise<void> {
  if (running) {
    logger.warn('Previous monitoring cycle still running; skipping this tick');
    return;
  }
  running = true;
  try {
    await runMonitoringCycle();
  } catch (err) {
    logger.error({ err }, 'Unhandled error in monitoring cycle');
  } finally {
    running = false;
  }
}

// Start the periodic monitor. Runs every MONITOR_INTERVAL_MS (default 5 minutes).
// An optional immediate run fills the dashboard without waiting a full interval.
export function startScheduler(): void {
  if (timer) return;

  logger.info(
    { intervalMs: env.monitor.intervalMs, target: env.monitor.targetUrl },
    'Starting monitoring scheduler',
  );

  if (env.monitor.runOnStart) {
    void tick();
  }

  timer = setInterval(() => void tick(), env.monitor.intervalMs);
}

export function stopScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('Monitoring scheduler stopped');
  }
}
