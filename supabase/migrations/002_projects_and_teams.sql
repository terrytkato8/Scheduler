-- Migration 002: multi-team profiles + projects/tasks/sprints/milestones

-- 1. Add teams array to profiles (keep single `team` for backwards compat)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS teams text[] DEFAULT '{}';

-- 2. Projects table
CREATE TABLE IF NOT EXISTS projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  team        text,
  type        text NOT NULL DEFAULT 'standard',  -- 'kanban' | 'art_pipeline' | 'standard'
  color       text NOT NULL DEFAULT '#e85d7b',
  owner_id    text NOT NULL,
  member_ids  text[] DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        text NOT NULL,
  goal        text,
  start_date  date,
  end_date    date,
  status      text NOT NULL DEFAULT 'planned',  -- 'planned' | 'active' | 'completed'
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  due_date    date,
  status      text NOT NULL DEFAULT 'open',  -- 'open' | 'closed'
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 5. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id     uuid REFERENCES sprints(id) ON DELETE SET NULL,
  milestone_id  uuid REFERENCES milestones(id) ON DELETE SET NULL,
  title         text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'backlog',  -- 'backlog'|'todo'|'in_progress'|'in_review'|'done'
  priority      text NOT NULL DEFAULT 'medium',   -- 'low'|'medium'|'high'|'critical'
  stage         text,                             -- art pipeline: 'concept'|'rough_draft'|'wip'|'review'|'final'
  assignee_id   text,
  creator_id    text NOT NULL,
  due_date      date,
  external_url  text,
  embed_url     text,
  position      integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS tasks_project_id_idx   ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_id_idx  ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx     ON tasks(due_date);
CREATE INDEX IF NOT EXISTS sprints_project_id_idx ON sprints(project_id);
