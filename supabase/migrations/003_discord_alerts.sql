-- Migration 003: Discord alert support

-- Add Discord username/ID to profiles so alerts can @mention people
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_username text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_user_id  text;  -- needed for @mentions (<@USER_ID>)

-- Track which alerts have already been sent to avoid duplicates
-- alert_type: '30min' | '10min'
CREATE TABLE IF NOT EXISTS meeting_alert_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid NOT NULL,
  alert_type  text NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, alert_type)
);

CREATE INDEX IF NOT EXISTS meeting_alert_logs_meeting_id_idx ON meeting_alert_logs(meeting_id);
