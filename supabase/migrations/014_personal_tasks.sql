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

-- Explicit grants so the anon key used by API routes can access this table
GRANT ALL ON TABLE personal_tasks TO anon;
GRANT ALL ON TABLE personal_tasks TO authenticated;

-- Disable RLS to match the pattern of all other tables in this project
-- (auth is enforced server-side by Clerk, not by Supabase RLS)
ALTER TABLE personal_tasks DISABLE ROW LEVEL SECURITY;
