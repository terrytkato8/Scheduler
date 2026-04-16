-- Migration 007: Dev log (per-game/project changelog)
CREATE TABLE IF NOT EXISTS dev_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES projects(id) ON DELETE SET NULL,
  game         text NOT NULL,
  title        text NOT NULL,
  content      text NOT NULL DEFAULT '',
  version      text,
  log_type     text NOT NULL DEFAULT 'update'
                 CHECK (log_type IN ('feature','fix','update','release','breaking','hotfix')),
  author_id    text NOT NULL,
  author_name  text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dev_logs_game_idx    ON dev_logs(game);
CREATE INDEX IF NOT EXISTS dev_logs_project_idx ON dev_logs(project_id);
