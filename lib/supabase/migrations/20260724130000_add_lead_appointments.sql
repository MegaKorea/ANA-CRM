CREATE TABLE IF NOT EXISTS lead_appointments (
  id                bigserial PRIMARY KEY,
  lead_id           bigint NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  appointment_date  timestamptz NOT NULL,
  attendance_status text NOT NULL DEFAULT 'not_arrived',
  note              text,
  remind_before_min integer NOT NULL DEFAULT 30,
  reminder_sent_at  timestamptz,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_appointments_lead
  ON lead_appointments (lead_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_lead_appointments_pending_reminder
  ON lead_appointments (appointment_date)
  WHERE reminder_sent_at IS NULL;

INSERT INTO lead_appointments (lead_id, appointment_date, attendance_status, reminder_sent_at, created_at)
SELECT
  l.id,
  l.appointment_date,
  COALESCE(l.attendance_status, 'not_arrived'),
  CASE WHEN l.appointment_date <= now() THEN now() ELSE NULL END,
  COALESCE(l.created_at, now())
FROM leads l
WHERE l.appointment_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lead_appointments a
    WHERE a.lead_id = l.id AND a.appointment_date = l.appointment_date
  );
