-- Web Push subscriptions + a dedicated push timestamp on appointments.
--
-- Each row is one browser/device that a user allowed notifications on. A user
-- may have several (desktop Chrome, phone, ...), so the unique key is the push
-- endpoint, not the user.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL,
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions (user_id);

-- Separate from `reminder_sent_at` (which the in-app bell uses) so the web-push
-- channel and the browser popup channel do not cancel each other out.
ALTER TABLE lead_appointments
  ADD COLUMN IF NOT EXISTS pushed_at timestamptz;

-- Supports the push poller: appointments whose push has not fired yet.
CREATE INDEX IF NOT EXISTS idx_lead_appointments_pending_push
  ON lead_appointments (appointment_date)
  WHERE pushed_at IS NULL;

-- Anti-spam backfill: mark every appointment whose reminder moment has ALREADY
-- passed as pushed, so enabling web push does not fire a burst of notifications
-- for historical/overdue appointments. Upcoming appointments stay NULL and push
-- normally when their time arrives.
UPDATE lead_appointments
SET pushed_at = now()
WHERE pushed_at IS NULL
  AND appointment_date - (remind_before_min || ' minutes')::interval <= now();
