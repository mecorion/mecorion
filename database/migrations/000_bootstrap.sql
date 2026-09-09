BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS account;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS access;

COMMENT ON SCHEMA core IS 'Общие технические примитивы и глобальные переиспользуемые ресурсы Mecorion.';
COMMENT ON SCHEMA account IS 'Аккаунты, публичные профили и подтверждение уникального человека.';
COMMENT ON SCHEMA auth IS 'Credentials, способы входа, устройства и пользовательские сессии.';
COMMENT ON SCHEMA access IS 'Permissions, роли, scopes и назначения ролей.';

CREATE OR REPLACE FUNCTION core."fncSetUpdateDtm"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW."updateDtm" := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMIT;
