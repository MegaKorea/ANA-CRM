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

ALTER TABLE lead_appointments
  ADD COLUMN IF NOT EXISTS pushed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_lead_appointments_pending_push
  ON lead_appointments (appointment_date)
  WHERE pushed_at IS NULL;

UPDATE lead_appointments
SET pushed_at = now()
WHERE pushed_at IS NULL
  AND appointment_date - (remind_before_min || ' minutes')::interval <= now();
