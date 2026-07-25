/**
 * Next.js instrumentation hook — runs once when the server process boots.
 *
 * On the Node runtime it starts a 60s scheduler that fires due appointment web
 * pushes. Because it lives in the dev/prod server process (not the browser), it
 * keeps working even when every CRM tab is closed — which is the whole point of
 * push. Guarded by ENABLE_PUSH_SCHEDULER so it can be turned off (e.g. once a
 * real Supabase cron drives /api/push/run instead).
 *
 * In production on serverless hosts this hook may not stay alive between
 * requests; there, drive /api/push/run from Supabase cron instead.
 */

const SCHEDULER_INTERVAL_MS = 60 * 1000;

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.ENABLE_PUSH_SCHEDULER !== 'true') return;

  // Guard against double-registration on dev hot reloads.
  const g = globalThis as typeof globalThis & { __pushSchedulerStarted?: boolean };
  if (g.__pushSchedulerStarted) return;
  g.__pushSchedulerStarted = true;

  const { sendDueAppointmentPushes } = await import('@/lib/services/push.service');

  // Prevents overlapping runs: a slow tick must finish before the next starts,
  // otherwise two runs could read the same pending rows and double-send.
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await sendDueAppointmentPushes();
      if (result.due > 0) {
        console.log(
          `[push-scheduler] due=${result.due} pushed=${result.pushed} delivered=${result.delivered}`
        );
      }
    } catch (err) {
      console.error('[push-scheduler] error:', err);
    } finally {
      running = false;
    }
  };

  setInterval(tick, SCHEDULER_INTERVAL_MS);
  console.log('[push-scheduler] đã bật, quét mỗi 60s');
}
