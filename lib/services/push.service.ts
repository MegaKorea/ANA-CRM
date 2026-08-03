import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleServiceError, handleSupabaseError } from '@/lib/utils/error-handler';
import { PushErrorCode } from '@/constants/enums';
import { EnvKey, getOptionalEnv } from '@/config/env.config';
import type { PushSubscriptionsTable } from '@/lib/supabase/types/tables/push_subscriptions';
import type { LeadAppointmentsTable } from '@/lib/supabase/types/tables/lead_appointments';
import type { InsertTables } from '@/types/supabase';

export type PushSubscriptionRow = PushSubscriptionsTable['Row'];

/** Payload delivered to the service worker. Kept small and JSON-serialisable. */
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  /**
   * Show the OS notification even when a CRM tab is focused. The worker
   * normally suppresses those to avoid double-notifying alongside the in-app
   * bell, which would make a "send test" from an open tab look like it failed.
   */
  force?: boolean;
}

/** Shape the browser produces from PushManager.subscribe(). */
export interface BrowserSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

let vapidConfigured = false;

/** Lazily wires VAPID keys into web-push; returns false when keys are missing. */
function ensureVapid(): boolean {
  if (vapidConfigured) return true;

  const publicKey = getOptionalEnv(EnvKey.VAPID_PUBLIC_KEY);
  const privateKey = getOptionalEnv(EnvKey.VAPID_PRIVATE_KEY);
  const subject = getOptionalEnv(EnvKey.VAPID_SUBJECT) ?? 'mailto:admin@example.com';

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/** Upserts a browser subscription for a user (idempotent on endpoint). */
export async function saveSubscription(
  userId: string,
  sub: BrowserSubscription,
  userAgent?: string
): Promise<void> {
  try {
    const supabase = createAdminClient();

    const row: InsertTables<'push_subscriptions'> = {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent ?? null,
    };

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(row as never, { onConflict: 'endpoint' });

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: PushErrorCode.SAVE_FAILED });
    }
  } catch (error) {
    handleServiceError(error, PushErrorCode.SAVE_FAILED);
  }
}

/** Removes a subscription by its endpoint (called on unsubscribe / 410 Gone). */
export async function deleteSubscription(endpoint: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    if (error) {
      handleSupabaseError(error, { defaultErrorCode: PushErrorCode.DELETE_FAILED });
    }
  } catch (error) {
    handleServiceError(error, PushErrorCode.DELETE_FAILED);
  }
}

async function fetchSubscriptionsForUsers(userIds: string[]): Promise<PushSubscriptionRow[]> {
  if (userIds.length === 0) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds);

  if (error) {
    handleSupabaseError(error, { defaultErrorCode: PushErrorCode.FETCH_FAILED });
  }
  return (data as unknown as PushSubscriptionRow[]) || [];
}

/**
 * Sends one payload to every subscription in the list. Subscriptions the push
 * service reports as gone (404/410) are pruned so the table stays clean.
 * Returns the number of notifications actually delivered.
 */
async function sendToSubscriptions(
  subs: PushSubscriptionRow[],
  payload: PushPayload
): Promise<number> {
  if (!ensureVapid() || subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  let delivered = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
        delivered += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        const body = String((err as { body?: unknown }).body ?? '');

        // 404/410: subscription expired or was unsubscribed.
        // 400 VapidPkHashMismatch: created under a rotated VAPID key, so it can
        // never be delivered to again — prune it too, otherwise these rows fail
        // silently on every run forever.
        if (statusCode === 404 || statusCode === 410 || body.includes('VapidPkHashMismatch')) {
          await deleteSubscription(sub.endpoint).catch(() => undefined);
        }
      }
    })
  );

  return delivered;
}

/** Sends a payload to all of a single user's devices. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  try {
    const subs = await fetchSubscriptionsForUsers([userId]);
    return await sendToSubscriptions(subs, payload);
  } catch (error) {
    handleServiceError(error, PushErrorCode.SEND_FAILED);
  }
}

/** Returns the ids of all users whose role is ADMIN (managers see everything). */
async function fetchAdminUserIds(): Promise<string[]> {
  const supabase = createAdminClient();
  // `roles!inner` filters the top-level users rows by the embedded role code —
  // a plain `.eq('roles.code', ...)` only constrains the embed, not the rows.
  const { data, error } = await supabase
    .from('users')
    .select('id, roles!inner(code)')
    .eq('roles.code', 'ADMIN');

  if (error) {
    // Non-fatal: fall back to no admins rather than blocking telesales pushes.
    return [];
  }

  return ((data as unknown as { id: string }[]) || []).map((u) => u.id);
}

type DueRow = Pick<
  LeadAppointmentsTable['Row'],
  'id' | 'lead_id' | 'appointment_date' | 'remind_before_min'
>;

/**
 * Finds appointments whose reminder moment has arrived and that have not been
 * web-pushed yet, delivers a notification to each owning telesales (plus all
 * admins), then stamps `pushed_at` so it never fires twice.
 *
 * This is the function a scheduler (dev instrumentation now, Supabase cron
 * later) calls on an interval. Returns a small summary for logging.
 */
export async function sendDueAppointmentPushes(): Promise<{
  due: number;
  pushed: number;
  delivered: number;
}> {
  try {
    if (!ensureVapid()) {
      return { due: 0, pushed: 0, delivered: 0 };
    }

    const supabase = createAdminClient();
    const now = Date.now();
    const horizonIso = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    const floorIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('lead_appointments')
      .select('id, lead_id, appointment_date, remind_before_min')
      .is('pushed_at', null)
      .gte('appointment_date', floorIso)
      .lte('appointment_date', horizonIso)
      .order('appointment_date', { ascending: true });

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: PushErrorCode.FETCH_FAILED });
    }

    const candidates = (data as unknown as DueRow[]) || [];
    const due = candidates.filter((a) => {
      const remindAt = new Date(a.appointment_date).getTime() - a.remind_before_min * 60 * 1000;
      return remindAt <= now;
    });

    if (due.length === 0) {
      return { due: 0, pushed: 0, delivered: 0 };
    }

    // Resolve lead → owner + display fields.
    const leadIds = [...new Set(due.map((a) => a.lead_id))];
    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, full_name, phone_number, telesales_id')
      .in('id', leadIds);

    const leadMap = new Map(
      ((leadsData as unknown as {
        id: number;
        full_name: string | null;
        phone_number: string | null;
        telesales_id: string | null;
      }[]) || []).map((l) => [l.id, l])
    );

    const adminIds = await fetchAdminUserIds();

    // Fetch every relevant subscription in ONE query (admins + all owners),
    // then index by user id — avoids an N+1 query per appointment.
    const allRecipientIds = new Set<string>(adminIds);
    for (const appt of due) {
      const telesalesId = leadMap.get(appt.lead_id)?.telesales_id;
      if (telesalesId) allRecipientIds.add(telesalesId);
    }
    const allSubs = await fetchSubscriptionsForUsers([...allRecipientIds]);
    const subsByUser = new Map<string, PushSubscriptionRow[]>();
    for (const sub of allSubs) {
      const list = subsByUser.get(sub.user_id) ?? [];
      list.push(sub);
      subsByUser.set(sub.user_id, list);
    }

    let delivered = 0;
    let pushed = 0;

    for (const appt of due) {
      const lead = leadMap.get(appt.lead_id);
      const recipientIds = new Set<string>(adminIds);
      if (lead?.telesales_id) recipientIds.add(lead.telesales_id);

      // Gather this appointment's recipients' subscriptions from the index.
      const subs = [...recipientIds].flatMap((uid) => subsByUser.get(uid) ?? []);
      const when = new Date(appt.appointment_date).toLocaleString('vi-VN');
      const name = lead?.full_name ?? 'Khách hàng';
      const phone = lead?.phone_number ? ` (${lead.phone_number})` : '';

      delivered += await sendToSubscriptions(subs, {
        title: 'Sắp tới lịch hẹn',
        body: `${name}${phone} — hẹn lúc ${when}`,
        url: `/lead?highlight=${appt.lead_id}`,
        tag: `appointment-${appt.id}`,
      });

      // Stamp pushed_at immediately after each send (not in a batch at the end),
      // so a crash mid-loop can duplicate at most this one appointment. Marked
      // regardless of delivery count so a user with no device does not keep the
      // row "due" forever.
      await supabase
        .from('lead_appointments')
        .update({ pushed_at: new Date().toISOString() } as never)
        .eq('id', appt.id);
      pushed += 1;
    }

    return { due: due.length, pushed, delivered };
  } catch (error) {
    handleServiceError(error, PushErrorCode.SEND_FAILED);
  }
}
