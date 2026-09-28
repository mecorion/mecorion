# Mecorion

Mecorion — монорепозиторий экосистемы сервисов. В нём находятся основной Web,
Admin, единый Fastify API, PostgreSQL-схема, будущий media worker и общие
packages.

Старый вариант документации сохранён в [README-old.md](README-old.md).

## Состав проекта

```text
apps/web           Nuxt 4: основной сайт и пользовательские сервисы
apps/admin         Nuxt 4: панель администратора под /admin/
apps/api           Fastify: единый API всех доменов
apps/media-worker  каркас фоновой обработки медиа
database           миграции, seed и SQL-тесты PostgreSQL
infrastructure     Docker Compose и локальная инфраструктура
packages           общие контракты, storage, config и будущий UI
data               локальная эмуляция объектного хранилища
```

Подробная карта проекта находится в [docs/docs.md](docs/docs.md), правила UI —
в [docs/ui-libraries.md](docs/ui-libraries.md), рабочий контекст — в
[AGENTS.md](AGENTS.md).

## Требования

- Node.js 22.19+ или 24.11+;
- npm;
- PostgreSQL 18: рекомендуется Docker Desktop, но локальный PostgreSQL также
  поддерживается;
- Git.

Установка зависимостей:

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## PostgreSQL: Docker или локальная установка

Для команды рекомендуется **Docker**. Он фиксирует PostgreSQL 18, одинаковые
пользователя, пароль и порт на всех компьютерах и не загрязняет системную
установку PostgreSQL.

```bash
npm run db:up
npm run db:migrate
npm run db:seed
```

Подключение API и SQL-клиента:

```env
DATABASE_URL=postgres://mecorion:mecorion@127.0.0.1:5432/mecorion
```

Параметры подключения в DBeaver/TablePlus:

```text
Host: 127.0.0.1
Port: 5432
Database: mecorion
User: mecorion
Password: mecorion
```

Локальный PostgreSQL тоже подходит. Создайте одну базу `mecorion`, укажите
собственные логин и пароль в `DATABASE_URL`, затем выполните миграции и seed.
Если локальный PostgreSQL уже занимает порт `5432`, Docker-контейнер на этом
порту одновременно не запустится: выберите только один вариант или измените
проброс порта и `DATABASE_URL`.

Когда API запускается на компьютере, а PostgreSQL — в Docker, hostname остаётся
`127.0.0.1`. Имя `postgres` используется только если сам API позднее будет
запускаться внутри той же Docker Compose network.

## Два DEV-сегмента

Web и Admin всегда вызывают одинаковые API endpoints. Режим авторизации
выбирается только на стороне API, поэтому frontend-код не приходится
комментировать или переписывать.

### DEV без обязательной авторизации

Используйте этот режим для интерфейсов, верстки и обычной разработки API.
JWT и cookie не требуются, но API загружает настоящий seeded-аккаунт из БД,
поэтому роли и permissions продолжают работать.

Терминал 1:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
npm run api:dev:no-auth
```

Терминал 2:

```bash
npm run dev
```

Терминал 3, если нужна Admin:

```bash
npm run admin:dev
```

Адреса:

- Web: `http://localhost:5173`;
- Admin: `http://localhost:5174/admin/`;
- API: `http://127.0.0.1:4000`;
- Health check: `http://127.0.0.1:4000/health`.

`api:dev:no-auth` использует `dev-admin`, поэтому открывает Web и Admin. Для
проверки интерфейса базового пользователя запустите:

```bash
npm run api:dev:no-auth:base
```

Этот профиль использует `dev-base`: Web работает без входа, а Admin корректно
возвращает `403`. Аккаунты создаются командой `npm run db:seed`.

### DEV с настоящей авторизацией

Этот режим обязателен при разработке login/registration, JWT, refresh-cookie,
сессий и перед merge изменений в auth-модуль.

Один раз создайте локальную пару RS256-ключей:

```bash
npm run auth:keys
```

Затем запустите:

```bash
npm run api:dev:auth
npm run dev
npm run admin:dev
```

`AUTH_MODE=required` требует настоящую seed-сессию. Тестовые пользователи и
их локальные seed phrase описаны в `database/seeds/DEV_USERS.md` и не должны
использоваться в production.

### Настройка bypass

Эквивалентная конфигурация API:

```env
NODE_ENV=development
AUTH_MODE=dev-bypass
DEV_AUTH_ACCOUNT=dev-admin
```

Bypass не запускается при `NODE_ENV=test|production`, внешнем `HOST` или
нелокальном hostname PostgreSQL. Клиент не может передать роль через header:
API всегда загружает роли выбранного аккаунта из БД.

## Переменные API

Основные параметры находятся в `apps/api/.env`:

```env
HOST=127.0.0.1
PORT=4000
DATABASE_URL=postgres://mecorion:mecorion@127.0.0.1:5432/mecorion
AUTH_MODE=required
DEV_AUTH_ACCOUNT=dev-admin
JWT_MODE=keypair
JWT_PRIVATE_KEY_PATH=../../infrastructure/keys/jwt-private.pem
JWT_PUBLIC_KEY_PATH=../../infrastructure/keys/jwt-public.pem
AUTH_SEED_PEPPER=replace-with-local-secret
```

Команды `api:dev:no-auth*` временно переопределяют `AUTH_MODE` и `JWT_MODE`,
не изменяя `.env`. Production всегда должен использовать `AUTH_MODE=required`,
RS256, HTTPS и внешний secret manager.

## Все команды корневого package.json

### Web

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Запустить основной Nuxt Web на порту 5173 |
| `npm run build` | Собрать Web для production |
| `npm run preview` | Запустить preview production-сборки Web |
| `npm run generate` | Создать статический экспорт Web |
| `npm run ui:check` | Проверить структуру Mecorion UI library |
| `npm run web:test:smoke` | Запустить Playwright smoke-тесты Web |

### Admin

| Команда | Назначение |
| --- | --- |
| `npm run admin:dev` | Запустить Admin на порту 5174 под `/admin/` |
| `npm run admin:build` | Собрать Admin для production |
| `npm run admin:preview` | Запустить preview Admin на порту 5174 |
| `npm run admin:check` | Typecheck и тесты API плюс production build Admin |

### API и авторизация

| Команда | Назначение |
| --- | --- |
| `npm run api:dev` | Запустить API с режимом из `apps/api/.env` |
| `npm run api:dev:auth` | Запустить API с обязательной авторизацией |
| `npm run api:dev:no-auth` | Запустить bypass API от имени `dev-admin` |
| `npm run api:dev:no-auth:base` | Запустить bypass API от имени `dev-base` |
| `npm run api:build` | Собрать TypeScript API в `apps/api/dist` |
| `npm run api:typecheck` | Проверить типы API без генерации файлов |
| `npm run api:test` | Запустить тесты API |
| `npm run auth:keys` | Создать локальную пару RS256-ключей |

### PostgreSQL

| Команда | Назначение |
| --- | --- |
| `npm run db:up` | Запустить PostgreSQL 18 через Docker Compose |
| `npm run db:down` | Остановить Docker Compose |
| `npm run db:migrate` | Последовательно применить SQL-миграции |
| `npm run db:seed` | Создать справочники и dev-данные |
| `npm run db:test` | Запустить транзакционные SQL smoke-тесты |

### Media worker и общие проверки

| Команда | Назначение |
| --- | --- |
| `npm run worker:dev` | Запустить media worker в watch-режиме |
| `npm run worker:build` | Собрать media worker |
| `npm run typecheck` | Проверить типы API и media worker |

## Рекомендуемый рабочий цикл

Для frontend-разработки:

```bash
npm run db:up
npm run api:dev:no-auth
npm run dev
```

Перед отправкой изменений:

```bash
npm run api:typecheck
npm run api:test
npm run build
npm run admin:build
git diff --check
```

Не коммитьте `.env`, приватные PEM-ключи, содержимое `data` и реальные
пользовательские медиафайлы.
