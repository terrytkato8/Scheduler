-- Personal tasks: user-owned to-do items not tied to any project
CREATE TABLE IF NOT EXISTS personal_tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  title       text NOT NULL,
  completed   boolean NOT NULL DEFAULT false,
  priority    text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date    date,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personal_tasks_user_id_idx ON personal_tasks (user_id);
