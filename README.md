# Mecorion

Монорепозиторий: Nuxt frontend в `apps/web`, Fastify API в `apps/api`,
media-worker и общие packages.

## Frontend

Нужен Node.js 22.19+ (22.x) или 24.11+ (24.x); проверено на Node 24.

```bash
npm install
cp apps/web/.env.example apps/web/.env
npm run dev
```

Приложение открывается на `http://localhost:5173`. Nuxt 4 работает в режиме
SPA (`ssr: false`), сохраняя браузерное состояние сессии, тем и медиаплеера.
SSR пока не включён. Авторизационная проверка маршрутов остаётся отключённой.

Все существующие страницы находятся в `apps/web/src/pages` и используют
файловые маршруты Nuxt. Общий интерфейс подключается через `layouts/default.vue`,
главная и авторизация — через `layouts/auth.vue`. Инициализация тем, SVG и Plyr находится
в `plugins/mecorion.client.js`; Pinia подключена модулем `@pinia/nuxt`.

Адрес отдельного Fastify API задаётся через `NUXT_PUBLIC_MECORION_API_URL`
(по умолчанию `http://127.0.0.1:4000`). Эта переменная заменяет
`VITE_MECORION_API_URL`; перенесите значение из старого `.env`.
Nuxt dev/preview читает `apps/web/.env`; production Node-сервер получает
переменную из окружения процесса. При статическом экспорте она задаётся до сборки.

```bash
npm run build       # production Node-сервер в apps/web/.output
npm run preview     # локальная проверка production-сборки
npm run generate    # статический экспорт в apps/web/.output/public
npm run ui:check    # проверка библиотеки стилей Mecorion UI
```

Production запуск:

```bash
NUXT_PUBLIC_MECORION_API_URL=http://127.0.0.1:4000 node apps/web/.output/server/index.mjs
```

Для статического хостинга нужен history fallback на `200.html`, чтобы прямые
переходы на `/music` или `/space/:id` работали. Fastify API разворачивается отдельно.
Каталоги `.nuxt` и `.output` генерируются автоматически и не коммитятся.

## Проверка frontend

```bash
npx playwright install chromium
npm run build
npm run web:test:smoke
```

Smoke-тесты запускают production-сборку на порту 4173 и проверяют все
14 маршрутов, layouts, клиентские переходы, темы, SVG и runtime API config.
Auth-запрос в тестах подменяется, запущенный Fastify не требуется.
Для проверки dev-сервера: `MECORION_TEST_DEV=1 npm run web:test:smoke`.

## Backend

```bash
npm run db:up
npm run db:migrate
npm run db:seed
npm run api:dev
```

Подробнее: [документация проекта](docs/docs.md),
[библиотеки интерфейса](docs/ui-libraries.md), [контекст разработки](AGENTS.md).
