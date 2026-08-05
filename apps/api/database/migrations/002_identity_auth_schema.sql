CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE identity.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(254) NOT NULL,
  display_name varchar(120) NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  role varchar(24) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'super_admin')),
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Email сравнивается в нижнем регистре, чтобы username@... и Username@...
-- не стали двумя разными аккаунтами.
CREATE UNIQUE INDEX users_email_lower_unique_idx ON identity.users (lower(email));
CREATE INDEX users_role_idx ON identity.users (role);

CREATE TABLE identity.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_id_idx ON identity.sessions (user_id);
CREATE INDEX sessions_active_idx ON identity.sessions (expires_at)
  WHERE revoked_at IS NULL;
