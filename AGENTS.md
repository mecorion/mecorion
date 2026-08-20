# AGENTS.md

Рабочий контекст для Codex/агентов и разработчиков Mecorion. Держи этот файл
коротким, практичным и актуальным: сюда записывается то, что нужно помнить
между сессиями, чтобы не начинать анализ проекта с нуля.

## Проект

Mecorion — монорепозиторий экосистемы сервисов: Web, единый API, будущий
media-worker и общие packages. Цель продукта — единый аккаунт и разные
пользовательские сервисы: Music, Video, Book, Course, Cloud, Mail, VPN,
Spaces, админ-панель и другие модули.

Текущая архитектурная договорённость:

- одна база данных PostgreSQL с именем `mecorion`;
- одна backend-точка `apps/api`, внутри которой разные доменные модули;
- frontend всей платформы лежит в `apps/web`;
- локальное файловое хранилище эмулируется через `data`;
- будущая обработка медиафайлов лежит в `apps/media-worker`;
- общие библиотеки лежат в `packages`, но выносить туда код нужно только при
  реальном повторном использовании несколькими приложениями.

## Команды

Установка зависимостей:

```bash
npm install
```

Frontend:

```bash
npm run dev
npm run build
```

API:

```bash
npm run api:dev
npm run api:build
npm run api:typecheck
```

PostgreSQL через Docker:

```bash
npm run db:up
npm run db:down
npm run db:migrate
npm run db:seed
```

Media worker:

```bash
npm run worker:dev
npm run worker:build
```

## База данных

Используется PostgreSQL 18 из `infrastructure/docker-compose.yml`.

Локальные параметры:

```text
host: 127.0.0.1
port: 5432
database: mecorion
user: mecorion
password: mecorion
```

Connection string:

```env
DATABASE_URL=postgres://mecorion:mecorion@127.0.0.1:5432/mecorion
```

Правила проектирования БД, которые уже согласованы с пользователем:

- база всегда одна: `mecorion`;
- схемы разделяют домены: `identity`, `music`, `video`, `book` и будущие;
- `identity` общая для всей платформы и отвечает за регистрацию,
  авторизацию, пользователей и сессии;
- таблицы называются с префиксом `t` и сущностью в единственном числе с
  большой буквы, например `tUser`, `tPerson`;
- не создавать отдельные базы вроде `mecorion_music`.

Текущие миграции:

- `apps/api/database/migrations/001_initial_music_schema.sql`;
- `apps/api/database/migrations/002_identity_auth_schema.sql`.

## Frontend

Основное приложение: `apps/web`.

Ключевые страницы:

- `/` — landing;
- `/sign-in` — авторизация;
- `/sign-up` — регистрация;
- `/dashboard` — общий dashboard экосистемы;
- `/profile` — профиль пользователя с mock API ролей;
- `/spaces` — корневое пространство/каталог контента;
- `/music` — Mecorion Music MVP;
- `/ui-kit` — страница UI kit.

Общий layout для dashboard/profile/spaces:

```text
apps/web/src/components/workspace/WorkspaceLayout.vue
```

Он содержит общий header и sidebar. Активный пункт sidebar определяется через
`vue-router` по текущему `route.path`.

Route guard в `apps/web/src/router/index.js` сейчас закомментирован. Не
включать его обратно без отдельной задачи, потому что пользователь ранее
отключал проверку авторизации для удобной разработки.

## Стили Mecorion

Стили собраны в `apps/web/src/styles`.

Главный вход:

```text
apps/web/src/styles/main.scss
```

Важные файлы:

- `var.scss` — CSS-переменные, темы, токены Mecorion и Element Plus;
- `mecorion-foundation.scss` — базовый слой: типографика, focus states,
  scrollbar, utility-классы;
- `mecorion-ui.scss` — UI kit: кнопки, карточки, поля, типографика;
- `mecorion-workspaces.scss` — dashboard/workspace layout;
- `mecorion-auth.scss` — landing/sign-in/sign-up;
- `mecorion-profile.scss` — профиль;
- `mecorion-spaces.scss` — корневое пространство;
- `mecorion-music.scss` — Mecorion Music.

Правила стиля:

- держать визуальный стиль тёмным, мягким, с акцентом `--mc-accent`;
- новые размеры, радиусы, отступы брать из `--mc-*` токенов;
- не возвращать глобальный `line-height: 1 !important`;
- на мобильных проверять ширины вплоть до 320px;
- избегать переполнений через `min-width: 0` внутри grid/flex;
- cards radius держать умеренным: обычно `var(--mc-radius-md)`;
- новые страницы лучше подключать отдельным `mecorion-*.scss` через
  `main.scss`.

## Spaces

Корневое пространство платформы находится на `/spaces`.

Текущая реализация:

- view: `apps/web/src/pages/SpacesView.vue`;
- mock-данные: `apps/web/src/spaces/spaces.mock.js`;
- стили: `apps/web/src/styles/mecorion-spaces.scss`;
- пункт sidebar добавлен в `WorkspaceLayout.vue`.

Назначение страницы: стартовый каталог контентных пространств платформы.
Сейчас это frontend-прототип с фильтрами, сортировкой, горизонтальной
скролл-витриной и карточками для перехода в будущие пространства.

Следующий логичный шаг: заменить mock-данные на API, добавить реальные routes
конкретных пространств и состояния фильтров.

## Mecorion Music

Music сейчас считается достаточным MVP для дальнейшего движения по платформе.
Уже есть:

- online music prototype;
- local music import flow;
- playlist/finder views for local files;
- player bar;
- player mode;
- filters by section.

Важные файлы:

- `apps/web/src/pages/MusicView.vue`;
- `apps/web/src/components/music/*`;
- `apps/web/src/stores/musicPlayer.js`;
- `apps/web/src/music/catalog.js`;
- `apps/web/src/music/localLibrary.js`;
- `apps/web/src/music/trackFilters.js`;
- `apps/web/src/styles/mecorion-music.scss`.

Планы развития лежат в:

- `mecorion-music-plan.md`;
- `mecorion-music-backend-plan.md`.

## API

API находится в `apps/api`.

Текущая структура:

```text
apps/api/src/
├── core/
│   ├── config.ts
│   ├── database.ts
│   └── http/
├── modules/
│   ├── auth/
│   └── music/
└── main.ts
```

Технологии:

- Fastify;
- PostgreSQL через `pg`;
- Zod для env/config и валидации;
- dotenv.

Auth routes:

- `POST /api/v1/auth/sign-up`;
- `POST /api/v1/auth/sign-in`;
- `GET /api/v1/auth/me`;
- `POST /api/v1/auth/logout`.

Health route:

- `GET /health`.

## Media Worker

`apps/media-worker` — будущий процесс фоновой обработки медиафайлов:

- ffmpeg/transcoding;
- анализ метаданных;
- генерация превью/обложек;
- перенос оригиналов и обработанных файлов в storage.

Сейчас это каркас. Не превращать worker в HTTP API без отдельного решения.

## Packages

Назначение:

- `packages/contracts` — общие API-контракты и типы;
- `packages/storage` — будущий единый интерфейс локального диска/S3;
- `packages/ui` — общий UI только если появится несколько frontend-приложений;
- `packages/config` — общие настройки инструментов.

Правило: packages не должны импортировать код из `apps`.

## Git и рабочее дерево

В проекте могут быть пользовательские незакоммиченные изменения. Не откатывать
их без явной просьбы.

Служебные файлы `.DS_Store` и backup-файлы draw.io могут появляться в статусе.
Если задача не про чистку репозитория, не трогать их.

`memory.md` и `MEMORY.md` игнорируются Git и не должны попадать в коммиты.

`data/**` игнорируется Git, кроме README и `.gitkeep`. Не коммитить реальные
медиафайлы из `data`.

## Как работать дальше

Перед изменениями:

1. Проверить `git status --short`.
2. Прочитать ближайшие файлы, не делать предположений по памяти.
3. Для поиска использовать `rg` / `find`.
4. Сохранять стиль Mecorion и существующие паттерны.

После изменений:

1. Запустить минимум `npm run build`, если трогался frontend.
2. Запустить `npm run api:typecheck` или `npm run api:build`, если трогался API.
3. Запустить `git diff --check`.
4. В ответе кратко описать, что сделано, что проверено и как назвать коммит.

Текущий рекомендуемый стиль названий коммитов:

```text
Web. Добавлена страница корневых пространств
Web. Исправлен мобильный адаптив dashboard и профиля
API. Добавлена схема авторизации
DOCS. Описана архитектура проекта
```
