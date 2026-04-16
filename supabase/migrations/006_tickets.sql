-- Migration 006: Ticket system (bug + feature tickets)
CREATE TABLE IF NOT EXISTS tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number   serial,
  project_id      uuid REFERENCES projects(id) ON DELETE SET NULL,
  game            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'task')),
  status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','in_review','resolved','closed','wont_fix')),
  priority        text NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('critical','high','medium','low')),
  title           text NOT NULL,
  description     text,
  -- Bug-specific
  steps_to_reproduce  text,
  expected_behavior   text,
  actual_behavior     text,
  environment         text,
  build_version       text,
  -- Feature-specific
  user_story          text,
  acceptance_criteria text,
  -- People
  reporter_id     text NOT NULL,
  reporter_name   text,
  assignee_id     text,
  assignee_name   text,
  -- Meta
  labels          text[] DEFAULT '{}',
  linked_doc_ids  uuid[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_game_idx       ON tickets(game);
CREATE INDEX IF NOT EXISTS tickets_project_id_idx ON tickets(project_id);
CREATE INDEX IF NOT EXISTS tickets_reporter_idx   ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx     ON tickets(status);
