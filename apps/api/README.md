# Mecorion API

Единый TypeScript API экосистемы Mecorion. Это один Fastify-процесс и одна
PostgreSQL-база `mecorion`; домены разделены схемами и модулями, а не отдельными
базами или независимыми API.

## Локальный запуск

```bash
cp apps/api/.env.example apps/api/.env
npm run auth:keys
npm run db:up
npm run db:migrate
npm run db:seed
npm run api:dev
```

Адрес API: `http://127.0.0.1:4000`. Проверка базы и процесса:

```http
GET http://127.0.0.1:4000/health
```

PostgreSQL запускается из `infrastructure/docker-compose.yml`:

```text
image: postgres:18
host: 127.0.0.1
port: 5432
database: mecorion
user: mecorion
password: mecorion
```

```env
DATABASE_URL=postgres://mecorion:mecorion@127.0.0.1:5432/mecorion
CORS_ORIGIN=http://127.0.0.1:5173,http://127.0.0.1:5174
JWT_MODE=keypair
JWT_PRIVATE_KEY_PATH=../../infrastructure/keys/jwt-private.pem
JWT_PUBLIC_KEY_PATH=../../infrastructure/keys/jwt-public.pem
```

`auth:keys` создаёт локальную пару RSA-3072. Приватный PEM имеет права `0600`,
а вся директория `infrastructure/keys/*.pem` исключена из Git. В production
ключи должны поступать из secret manager или защищённого volume, а не из
репозитория.

RS256 использует приватный ключ для подписи access JWT и публичный ключ для
проверки. `JWT_SECRET` относится только к тестовому режиму HS256 и запрещён в
production. Refresh token не является JWT: это случайный одноразовый секрет,
его digest хранится в `auth.tRefreshToken`, а при обновлении он ротируется.

## Устройство API

```text
src/
├── core/
│   ├── config.ts          env и обязательные ограничения production
│   ├── database.ts        единый pg Pool и transaction helper
│   ├── db-helpers.ts      resource, audit и outbox helpers
│   └── http/              Fastify app, auth context, errors и health
└── modules/
    ├── admin/             аккаунты, роли, permissions и сессии
    ├── auth/              email-code auth, JWT и refresh sessions
    ├── content/           canonical content, contributors, publications
    ├── media/             uploads, storage metadata, assets, transcode jobs
    ├── workflow/          requests, revisions и reviews
    ├── moderation/        reports, restrictions и appeals
    ├── legal/             statuses, licenses, takedown и policies
    ├── library/           collections, favorites, progress, offline grants
    ├── audit/             immutable audit и transactional outbox
    ├── music/
    └── video/
```

`createApp()` регистрирует общие hooks и все модули. Модули не создают
собственные подключения к БД. Транзакционные сценарии используют
`withTransaction`, а универсальные сущности связываются через
`core.tResource`.

## Доступ

Браузерные приложения используют общую cookie-сессию:

- `mecorion_access` и `mecorion_refresh` имеют `HttpOnly`, `SameSite=Lax` и
  общий `Path=/`; в production также устанавливается `Secure`;
- Web и Admin отправляют cookies через `credentials: include`;
- вход в одном приложении автоматически действует в остальных сервисах на
  том же домене; Admin дополнительно проверяет роль `ADMIN` и permission
  `platform.admin`;
- refresh token не попадает в JavaScript или `localStorage`; короткоживущий
  access token может возвращаться в body для CLI/Postman и хранится Web только
  в памяти вкладки;
- текущая реализация поддерживает один активный аккаунт в браузере. Новый вход
  заменяет текущую cookie-сессию, списка аккаунтов в клиенте нет.

Web и Admin не должны обращаться из браузера напрямую к другому hostname API.
Оба frontend используют относительный `/api`: локально Nuxt проксирует его на
`127.0.0.1:4000`, а в production это делает reverse proxy. Так cookie остаётся
first-party и доступна обоим приложениям независимо от порта. Не смешивайте
`localhost` и `127.0.0.1` при ручной проверке: это разные cookie-хосты.

Внешние клиенты и Postman также могут использовать:

```http
Authorization: Bearer <accessToken>
```

Все маршруты `/api/v1/admin/*` сначала проходят общий gate в
`core/http/app.ts`. Для доступа одновременно необходимы:

```text
роль ADMIN
permission platform.admin
активный аккаунт и активная сессия
отсутствие эффективного moderation restriction
```

Domain permission проверяется повторно внутри обработчика. `platform.admin`
и `platform.owner` являются разрешённым override, но не отменяют активное
ограничение модерации.

## База данных

Версионируемые файлы находятся в корневом `database`:

- `database/migrations` — структура схем, таблиц, индексов и триггеров;
- `database/seeds` — обязательные справочники и development data;
- `database/service` — SQL-эталоны пользовательских сценариев;
- `database/tests` — транзакционные smoke-тесты инвариантов.

Основные схемы:

| Схема | Ответственность |
| --- | --- |
| `core` | сервисы, resource registry, языки, территории, outbox |
| `account` | аккаунт, профиль и governance identity |
| `auth` | identities, устройства, сессии и refresh tokens |
| `access` | роли, permissions, scopes и assignments |
| `content` | канонический контент, contributors и публикации |
| `media` | storage metadata, assets, variants и worker jobs |
| `workflow` | заявки, revisions и reviews |
| `moderation` | жалобы, ограничения и апелляции |
| `legal` | правовой статус, лицензии, takedown и политики |
| `library` | коллекции, избранное, прогресс и offline grants |
| `audit` | неизменяемый журнал операций |
| `music`, `video` | сервисные расширения canonical content |

Миграции применяются один раз и записываются в
`public.mecorion_api_migrations`. Если таблица уже существует, но связанная с
ней миграция отсутствует в журнале, runner останавливается до выполнения SQL.
Это защищает импортированную или созданную вручную базу от повторного создания
объектов. Такую рассинхронизацию нужно сверять и исправлять вручную, а не
помечать все миграции применёнными без проверки. Seeds спроектированы как
повторяемые там, где это требуется для справочников.

## Проверки

Быстрые проверки без PostgreSQL:

```bash
npm run api:typecheck
npm run api:test
npm run api:build
```

`api:test` использует Fastify `inject`: проверяет регистрацию ключевых routes,
единый `401` admin-gate и CORS для поддерживаемых методов.

Проверка реальной базы после `db:migrate` и `db:seed` либо после проверенного
восстановления схемы из дампа:

```bash
npm run db:test
```

Runner выполняет все `database/tests/NNN_*.sql` через `pg`. Каждый SQL-тест
работает внутри транзакции и завершает её `ROLLBACK`, поэтому тестовые аккаунты,
контент и события не остаются в базе.

Полная проверка API и production-сборки Admin:

```bash
npm run admin:check
```

## Документация и Postman

Полная карта административных endpoints, используемых таблиц, переходов
состояний и примеров тел находится в
[`apps/admin/README.md`](../admin/README.md).

Готовая коллекция:

```text
apps/admin/postman/Mecorion-Admin.postman_collection.json
```

После импорта заполнить `accessToken` и идентификаторы в Variables. Запросы
сгруппированы по этапам: auth/access, content, media, workflow, moderation,
legal, library, audit и outbox.

Admin авторизуется через двухшаговый seed challenge:

- `POST /api/v1/auth/seed/challenge/start` принимает email или username и
  возвращает четыре случайные позиции;
- `POST /api/v1/auth/seed/challenge/confirm` принимает слова с этих позиций,
  создаёт серверную сессию и устанавливает cookie;
- отдельные слова представлены в credential metadata только HMAC-проверками с
  серверным `AUTH_SEED_PEPPER`;
- полный seed endpoint сохранён как recovery-механизм и не используется
  формой Admin.

Регистрация Web использует отдельный подтверждаемый сценарий:

- `POST /api/v1/auth/seed/register` создаёт аккаунт в статусе `PENDING`,
  генерирует BIP39 seed phrase и возвращает её только в этом ответе;
- интерфейс показывает phrase один раз, не пишет её в storage и очищает из
  памяти до контрольной проверки;
- `POST /api/v1/auth/seed/register/confirm` просит четыре случайные позиции;
  только успешная проверка переводит аккаунт в `ACTIVE` и создаёт сессию;
- обычный sign-in endpoint не принимает registration challenge для
  `PENDING`-аккаунта;
- auth-ответы имеют `Cache-Control: no-store`. В production обязателен HTTPS.

## Известные ограничения

- `apps/media-worker` пока не выполняет реальные FFmpeg-задачи.
- API регистрирует storage metadata, но физический local/S3 adapter не готов.
- Outbox dispatcher/broker не реализован; Admin предоставляет диагностику и
  ручные recovery-действия.
- Полный end-to-end тест требует запущенный PostgreSQL 18 и применённые seed.
