-- Migration 008: Document repository (Confluence-like wiki)
CREATE TABLE IF NOT EXISTS documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  content             text NOT NULL DEFAULT '',
  game                text,
  parent_id           uuid REFERENCES documents(id) ON DELETE SET NULL,
  author_id           text NOT NULL,
  author_name         text,
  last_editor_id      text,
  last_editor_name    text,
  linked_project_ids  uuid[] DEFAULT '{}',
  linked_ticket_ids   uuid[] DEFAULT '{}',
  tags                text[] DEFAULT '{}',
  is_published        boolean DEFAULT true,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_game_idx      ON documents(game);
CREATE INDEX IF NOT EXISTS documents_parent_idx    ON documents(parent_id);
CREATE INDEX IF NOT EXISTS documents_author_idx    ON documents(author_id);
CREATE INDEX IF NOT EXISTS documents_published_idx ON documents(is_published);
