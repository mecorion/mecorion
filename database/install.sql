\set ON_ERROR_STOP on

\ir migrations/000_bootstrap.sql
\ir migrations/010_core.sql
\ir migrations/020_account.sql
\ir migrations/030_auth.sql
\ir migrations/040_access.sql
\ir migrations/050_content.sql
\ir migrations/060_media.sql
\ir migrations/070_workflow.sql
\ir migrations/080_moderation.sql
\ir migrations/090_legal.sql
\ir migrations/100_library.sql
\ir migrations/110_music.sql
\ir migrations/120_video.sql
\ir migrations/130_audit.sql
\ir seeds/001_foundation.sql
\ir seeds/010_content_platform.sql
