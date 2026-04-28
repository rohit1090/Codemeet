-- ============================================================
-- CodeMeet database schema
-- Run once: psql $DATABASE_URL -f db/schema.sql
-- (docker-compose mounts this as an init script automatically)
-- ============================================================

-- problems ---------------------------------------------------
CREATE TABLE IF NOT EXISTS problems (
  id           SERIAL       PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  difficulty   VARCHAR(10)  NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  description  TEXT         NOT NULL,

  -- [{ input, output, explanation? }]
  examples     JSONB        NOT NULL DEFAULT '[]',

  -- ["constraint string", ...]
  constraints  JSONB        NOT NULL DEFAULT '[]',

  -- [{ input (stdin), output (expected stdout) }]
  test_cases   JSONB        NOT NULL DEFAULT '[]',

  -- { python, javascript, java, cpp }  — stdin-aware templates
  starter_code JSONB        NOT NULL DEFAULT '{}',

  created_at   TIMESTAMP    DEFAULT NOW()
);

-- users (optional — for future auth) ------------------------
CREATE TABLE IF NOT EXISTS users (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username   VARCHAR(100) UNIQUE,
  created_at TIMESTAMP    DEFAULT NOW()
);
