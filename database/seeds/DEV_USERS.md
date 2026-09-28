# Mecorion dev users

Эти пользователи создаются сидом `020_dev_demo.sql` только для локального и dev-тестирования.
Все аккаунты активны, email уже подтвержден, вход в Admin доступен по логину и
четырём случайно выбранным словам seed phrase.

В БД хранится SHA-256 hash полной seed phrase и HMAC-проверки отдельных слов;
сами фразы нужны только для ручного dev-тестирования.
Не использовать эти фразы в production.

| Роль | Email | Username | Seed-фраза | Для чего использовать |
| --- | --- | --- | --- | --- |
| BASE | `base@mecorion.local` | `dev-base` | `option raccoon focus modify shine letter sweet wall tag job twin input` | Обычный пользователь: регистрация, вход, просмотр опубликованной музыки и видео, избранное, плейлист. |
| AGENT | `agent@mecorion.local` | `dev-agent` | `scale stadium chicken flush rate between rely make invest install mistake river` | Агент: загрузка/предложение контента, декларация прав, создание жалобы. |
| MODERATOR | `moderator@mecorion.local` | `dev-moderator` | `evolve copper answer online donate swing dragon memory measure whale stone expire` | Модератор: просмотр и разбор очереди жалоб. |
| ADMIN | `admin@mecorion.local` | `dev-admin` | `hole behind arrange attitude person group merit swim custom announce loop mammal` | Админ: админ-панель, роли, пользователи, системные операции. |
| OWNER | `owner@mecorion.local` | `dev-owner` | `evoke copy fury offer plate scorpion lottery outside grunt index claw olive` | Владелец: полный доступ ко всем permissions. |
| FOUNDER | `founder@mecorion.local` | `dev-founder` | `cruel shiver vacuum wheat timber sword wisdom soon play purchase east jealous` | Основатель: полный доступ ко всем permissions. |

Дополнительные данные, которые добавляет dev seed:

- music content: `Midnight Signal`, album `Synthetic Dawn`;
- video content: `Aurora Station`;
- published slugs: `demo-midnight-signal`, `demo-aurora-station`;
- base user playlist: `Dev Base Favorites`;
- base user favorite: track `Midnight Signal`;
- open moderation report from `dev-agent` on `Aurora Station`;
- demo media objects for source audio and video in bucket `mecorion-dev`.
