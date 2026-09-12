BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS account;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS access;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS moderation;
CREATE SCHEMA IF NOT EXISTS legal;
CREATE SCHEMA IF NOT EXISTS library;
CREATE SCHEMA IF NOT EXISTS music;
CREATE SCHEMA IF NOT EXISTS video;
CREATE SCHEMA IF NOT EXISTS audit;

COMMENT ON SCHEMA core IS 'Общие технические примитивы и глобальные переиспользуемые ресурсы Mecorion.';
COMMENT ON SCHEMA account IS 'Аккаунты, публичные профили и подтверждение уникального человека.';
COMMENT ON SCHEMA auth IS 'Credentials, способы входа, устройства и пользовательские сессии.';
COMMENT ON SCHEMA access IS 'Permissions, роли, scopes и назначения ролей.';
COMMENT ON SCHEMA content IS 'Единый каталог контента, публикаций, контрибьюторов, внешних идентификаторов и дедупликации.';
COMMENT ON SCHEMA media IS 'Хранилище, assets, варианты файлов, загрузки и фоновые задачи обработки медиа.';
COMMENT ON SCHEMA workflow IS 'Заявки, проверки, ревизии и маршруты согласования.';
COMMENT ON SCHEMA moderation IS 'Жалобы, ограничения и апелляции.';
COMMENT ON SCHEMA legal IS 'Правовые статусы, политики, лицензии и takedown.';
COMMENT ON SCHEMA library IS 'Пользовательские коллекции, избранное, история, прогресс и offline grants.';
COMMENT ON SCHEMA music IS 'Музыкальные доменные расширения поверх общего каталога контента.';
COMMENT ON SCHEMA video IS 'Видео-доменные расширения поверх общего каталога контента.';
COMMENT ON SCHEMA audit IS 'Неизменяемый аудит действий и системных событий.';

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
