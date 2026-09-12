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

Стили разделены на две самостоятельные библиотеки:

- `apps/web/src/styles-v1` — основной строгий интерфейс для запуска;
- `apps/web/src/styles-v2` — мягкий интерфейс со скруглениями и тенями.

Главный вход для совместимости:

```text
apps/web/src/styles/main.scss
```

Версия выбирается на странице `/settings`, применяется без перезапуска и
сохраняется в `localStorage`; по умолчанию используется `v1`.
Полная архитектура, правила расширения и команды проверки описаны в
`docs/ui-libraries.md`.

В каждой версии обязательны:

- `mcrn-root.scss` — размеры, токены и публичные переменные;
- `mcrn-light-theme.scss`, `mcrn-dark-theme.scss` — полные палитры;
- `mcrn-media.scss` — весь адаптив;
- `components/*` — переиспользуемые UI-компоненты;
- `style/{music,video,book,course}/mcrn-init.scss` — сервисные стили.

Правила стиля:

- держать визуальный стиль тёмным, мягким, с акцентом `--mc-accent`;
- новые размеры, радиусы, отступы брать из `--mc-*` токенов;
- не возвращать глобальный `line-height: 1 !important`;
- проверять диапазон ширин от 180px до wide screen;
- сохранять одинаковые селекторы и публичные переменные в v1 и v2;
- не импортировать одну UI-библиотеку из другой;
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

## Текущий статус проекта

Актуальный срез состояния:

### Готово / близко к MVP

- Монорепозиторий уже собран через npm workspaces.
- `apps/web` запускается и собирается через Vite.
- Есть базовая визуальная система Mecorion: токены, foundation, UI kit,
  workspace layout, auth, dashboard, profile, spaces, music.
- Есть landing, sign-in, sign-up, dashboard, profile, spaces, music, ui-kit.
- Dashboard переведён на общий `WorkspaceLayout`.
- Profile переведён на общий `WorkspaceLayout`, имеет mock API для ролей:
  `user`, `agent`, `moderator`.
- Spaces добавлен как корневой каталог контентных пространств. Сейчас это
  frontend-прототип с mock-данными.
- Mecorion Music имеет хороший frontend MVP:
  - онлайн-каталог из локального `catalog.js`;
  - поиск;
  - фильтры;
  - избранное;
  - плейлисты;
  - очередь;
  - player bar;
  - player mode;
  - локальная музыка через выбор папки;
  - playlist/finder режимы просмотра локальных файлов.
- API имеет Fastify-каркас, health route, auth module и базовые music routes.
- PostgreSQL 18 описан в Docker Compose.
- Есть миграции `identity` и `music`.
- Есть seed с dev-admin и несколькими тестовыми артистами/альбомами/треками.
- `packages/storage` уже содержит интерфейс `StorageDriver`.

### Частично сделано

- Авторизация:
  - backend auth routes реализованы;
  - frontend sign-in/sign-up умеют обращаться к API;
  - frontend session хранится в `localStorage`;
  - route guard в `router/index.js` сейчас закомментирован для удобной
    разработки. Это осознанное состояние, не включать без отдельной задачи.
- Music backend:
  - есть таблицы artists/albums/tracks/genres/playlists/likes/history/lyrics;
  - есть `GET /api/v1/artists`, `GET /api/v1/albums`;
  - есть `GET /api/v1/tracks`, `GET /api/v1/tracks/:id`, `POST /api/v1/tracks`;
  - frontend Music пока не подключён к этим endpoints и продолжает жить на
    локальном `apps/web/src/music/catalog.js`.
- UI library:
  - базовые стили есть;
  - `UiKitView` есть;
  - компоненты ещё не выделены в полноценный reusable component layer;
  - `packages/ui` пока пустой/резервный.
- Spaces:
  - страница и визуальная модель есть;
  - данные вынесены в `apps/web/src/spaces/spaces.mock.js`;
  - нет API, таблиц и routes конкретных пространств.
- Документация:
  - есть `docs/docs.md`, `mecorion.md`, планы Music, draw.io диаграммы;
  - часть документов может отставать от текущего кода, поэтому перед важными
    решениями сверять с исходниками.

### Каркас / не реализовано

- `apps/media-worker` пока только выводит сообщение в консоль. Нет очередей,
  ffmpeg, обработки метаданных, генерации preview и связи со storage.
- `packages/contracts` содержит только версию, реальных контрактов API пока нет.
- `packages/config` и `packages/ui` пока не несут прикладной нагрузки.
- Нет полноценной админ-панели для управления артистами, треками, плейлистами,
  пространствами и пользователями.
- Нет backend-модулей для Video, Book, Course, Cloud, Mail, VPN, Spaces.
- Нет настоящего S3/local-storage abstraction implementation, есть только
  интерфейс.
- Нет e2e/visual тестов адаптива. Проверки пока в основном через build.
- Нет Playwright в зависимостях проекта.

## Что следует реализовать дальше

Рекомендуемый порядок работ:

1. Стабилизировать основу frontend:
   - довести адаптив dashboard/profile/spaces/music до 320px;
   - убрать старые/лишние legacy-компоненты, если они больше не используются;
   - привести все новые страницы к `WorkspaceLayout` или осознанно выделить
     отдельный layout для сервисов.

2. Вернуть контролируемую авторизацию:
   - включить route guard только после проверки sign-in/sign-up с API;
   - добавить понятные состояния ошибок API на формах;
   - добавить logout в общий layout;
   - решить, где хранить user-role и как обновлять профиль после `/auth/me`.

3. Подключить Music frontend к API:
   - заменить часть `catalog.js` на загрузку `/api/v1/tracks`;
   - добавить loading/error states;
   - сохранить локальную музыку отдельно от серверной;
   - постепенно перенести liked tracks, history, playlists в backend.

4. Сделать backend для админки Music:
   - CRUD artists;
   - CRUD albums;
   - CRUD tracks;
   - CRUD playlists;
   - загрузка/привязка cover/audio source;
   - управление lyrics.

5. Спроектировать и реализовать Spaces backend:
   - схема `spaces` или доменная схема по согласованному названию;
   - таблицы пространств, категорий, подписок, публикаций;
   - API для каталога `/spaces`;
   - фильтры и сортировка;
   - права доступа и роли внутри пространства.

6. Реализовать media-worker:
   - выбрать очередь задач;
   - подключить ffmpeg;
   - реализовать обработку audio/video;
   - связать worker с `packages/storage`;
   - хранить в БД не абсолютные пути, а storage keys.

7. Развить packages:
   - `contracts`: Zod-схемы и типы ответов API;
   - `storage`: LocalStorageDriver для `data`;
   - `ui`: выносить только реально переиспользуемые компоненты;
   - `config`: общий TS/ESLint config, когда появится повторение.

8. Добавить тестирование:
   - unit/typecheck для API;
   - frontend smoke build;
   - позже Playwright для критичных экранов и адаптива.

## Риски и технический долг

- В репозитории есть следы старого frontend layout (`components/layout`,
  `MainLayout`, старые video pages). Перед удалением проверить routes и imports.
- В `apps/web/src/router/index.js` импортируются `fetchCurrentUser` и
  `isAuthenticated`, но guard закомментирован. Это нормально сейчас, но
  линтер позже может считать это неиспользуемым кодом.
- Music frontend и Music API пока живут параллельно и не интегрированы.
- Схемы миграций сейчас используют имена `music.artists`, `identity.users`,
  а пользователь отдельно проговаривал правило будущего именования таблиц
  `tUser`, `tPerson`. Перед новыми миграциями нужно решить, мигрируем ли старые
  таблицы под этот стандарт или пока сохраняем текущую схему.
- `.DS_Store` и backup-файлы draw.io могут появляться в `git status`; не
  удалять и не откатывать без явной просьбы.
- `data/**` намеренно игнорируется, реальные медиафайлы не коммитить.

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
