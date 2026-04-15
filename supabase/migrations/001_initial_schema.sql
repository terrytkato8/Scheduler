-- Migration 001: Initial schema
-- Run this first, then 002, then 003.

-- User availability (weekly slot grid)
CREATE TABLE IF NOT EXISTS availability (
  user_id        text PRIMARY KEY,
  display_name   text,
  available_slots text[] DEFAULT '{}',
  busy_slots      text[] DEFAULT '{}',
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id              text PRIMARY KEY,
  display_name         text,
  role                 text,
  team                 text,
  team_lead_requested  boolean NOT NULL DEFAULT false,
  team_lead_approved   boolean NOT NULL DEFAULT false,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Team lead upgrade requests
CREATE TABLE IF NOT EXISTS team_lead_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      text NOT NULL,
  display_name text,
  team         text,
  role         text,
  status       text NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS team_lead_requests_user_id_idx ON team_lead_requests(user_id);
CREATE INDEX IF NOT EXISTS team_lead_requests_status_idx  ON team_lead_requests(status);

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id text NOT NULL,
  title        text NOT NULL,
  description  text,
  date         date,
  start_hour   integer,
  start_minute integer NOT NULL DEFAULT 0,
  end_hour     integer,
  end_minute   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meetings_organizer_id_idx ON meetings(organizer_id);
CREATE INDEX IF NOT EXISTS meetings_date_idx         ON meetings(date);

-- Meeting invites
CREATE TABLE IF NOT EXISTS meeting_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id   uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id      text NOT NULL,
  display_name text,
  status       text NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'declined'
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS meeting_invites_meeting_id_idx ON meeting_invites(meeting_id);
CREATE INDEX IF NOT EXISTS meeting_invites_user_id_idx    ON meeting_invites(user_id);
