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

Локальные SVG-иконки собираются в спрайт через `vite-plugin-svg-icons` из
`apps/web/src/assets/icons`. Для вывода использовать `components/SvgIcon.vue`
и имя символа в формате `<dir>-<name>`, например `mc-vpn-outline-shield`.

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
- `/ui-kit` — каталог компонентов Mecorion UI Kit;

Единый layout всех страниц, кроме главной `/` и sign-in/sign-up:

```text
apps/web/src/components/workspace/WorkspaceLayout.vue
```

Он подключается один раз в Nuxt layout `src/layouts/default.vue` и содержит общий header и sidebar.
Страницы не должны оборачивать себя в `WorkspaceLayout`. Активный пункт sidebar
определяется через Nuxt `useRoute()` по текущему `route.path`.

На страницах Music, Video, Books и Course содержимое общего sidebar заменяется
контекстным меню сервиса через `src/navigation/contextNavigation.js`. Не
добавлять внутрь сервисных страниц второй sidebar или отдельный верхний header.
Контекст сервиса также передаёт его `accent`, `accentStrong` и при необходимости
`accentContrast`, чтобы общий layout сохранял фирменный primary-цвет сервиса.

Проверка авторизации при навигации отключена для удобной разработки.
Метаданные `requiresAuth` / `guestOnly` сохранены в `definePageMeta`, но
middleware их не применяет. Не включать проверку без отдельной задачи.

### Обязательное правило для нового интерфейса

- Любые новые страницы, блоки, формы и интерактивные элементы по умолчанию
  собирать из компонентов Mecorion UI Kit из `apps/web/src/components/ui`.
- Перед созданием локального или захардкоженного элемента проверять, есть ли
  подходящий компонент в UI Kit. Если его возможностей не хватает — сначала
  универсально расширить UI-компонент и задокументировать новое состояние в
  `/ui-kit`, а затем использовать его в продуктовой странице.
- Не создавать нативные `button`, `input`, `select`, `textarea`, карточки,
  модальные окна и другие контролы прямо в продуктовых страницах, если для них
  существует компонент UI Kit. Исключение — скрытые технические элементы,
  необходимые браузерному API.
- Все новые интерфейсы делать полностью адаптивными во всём диапазоне от
  `180px` до wide screen. Обязательно проверять ширины `180px`, обычный
  мобильный экран, планшет, desktop и wide screen. Даже на ширине `180px`
  интерфейс должен помещаться без горизонтального скролла, сохранять читаемую
  иерархию, доступ ко всем действиям и корректный UI/UX. Допускается осознанно
  перестраивать сетку, переносить или компактно компоновать контент, но нельзя
  просто обрезать или скрывать обязательные функции. Внутри `grid` и `flex`
  учитывать `min-width: 0`, безопасные переносы, длинный контент и доступные
  touch-targets.
- Визуальное качество является частью готовности задачи: соблюдать понятную
  иерархию, читаемую типографику, единый ритм отступов, согласованные размеры
  компонентов, состояния hover/focus/active/disabled/loading и поддержку
  светлой и тёмной тем. Ориентироваться на практики зрелых дизайн-систем, но
  сохранять фирменный стиль и токены Mecorion.
- Иконки брать из локального SVG-спрайта `apps/web/src/assets/icons` через
  `SvgIcon.vue`. Не использовать Unicode-символы, emoji или сторонние наборы
  вместо проектных иконок. Если нужной иконки нет, сначала добавить SVG из
  утверждённой библиотеки Figma.
- Задача по интерфейсу не считается законченной, пока основной сценарий и
  адаптивные состояния не приведены к визуально аккуратному и удобному виду.

## Стили Mecorion

Основная библиотека стилей находится в `apps/web/src/styles/v2`.

Главный вход для совместимости:

```text
apps/web/src/styles/main.scss
```

Полная архитектура, правила расширения и команды проверки описаны в
`docs/ui-libraries.md`.

В библиотеке обязательны:

- `mcrn-root.scss` — размеры, токены и публичные переменные;
- `mcrn-light-theme.scss`, `mcrn-dark-theme.scss` — полные палитры;
- `mcrn-media.scss` — весь адаптив;
- `components/*` — переиспользуемые UI-компоненты без внешней UI-библиотеки;
- `style/{music,video,book,course}/mcrn-init.scss` — сервисные стили.

Правила стиля:

- держать визуальный стиль тёмным, мягким, с акцентом `--mc-accent`;
- новые размеры, радиусы, отступы брать из `--mc-*` токенов;
- не возвращать глобальный `line-height: 1 !important`;
- проверять диапазон ширин от 180px до wide screen;
- избегать переполнений через `min-width: 0` внутри grid/flex;
- cards radius держать умеренным: обычно `var(--mc-radius-md)`;
- новые страницы лучше подключать отдельным `mecorion-*.scss` через
  `main.scss`.

## Spaces

Корневое пространство платформы находится на `/spaces`.

Текущая реализация:

- view: `apps/web/src/pages/spaces.vue`;
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

- `apps/web/src/pages/music.vue`;
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
- `apps/web` запускается и собирается через Nuxt 4 (SPA, `ssr: false`).
- Файловые маршруты: `src/pages`, layouts: `src/layouts`, вход: `src/app.vue`.
- `src/plugins/mecorion.client.js` подключает Plyr, SVG, темы и API config.
- API URL: `NUXT_PUBLIC_MECORION_API_URL`; dev-порт остаётся 5173.
- Сборка: `apps/web/.output`, статический экспорт: `npm run generate`.
- Есть базовая визуальная система Mecorion: токены, foundation, UI kit,
  workspace layout, auth, dashboard, profile, spaces, music.
- Есть landing, sign-in, sign-up, dashboard, profile, spaces, music и UI-каталог.
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
  - auth middleware отключено для удобной разработки. Это осознанное
    состояние, не включать без отдельной задачи.
- Music backend:
  - есть таблицы artists/albums/tracks/genres/playlists/likes/history/lyrics;
  - есть `GET /api/v1/artists`, `GET /api/v1/albums`;
  - есть `GET /api/v1/tracks`, `GET /api/v1/tracks/:id`, `POST /api/v1/tracks`;
  - frontend Music пока не подключён к этим endpoints и продолжает жить на
    локальном `apps/web/src/music/catalog.js`.
- UI library:
  - базовые стили есть;
  - `UiKitView` доступен на `/ui-kit`;
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
- Есть Playwright smoke-тесты миграции Nuxt: `npm run web:test:smoke` после
  `npm run build`. Полноценные visual-тесты адаптива ещё не добавлены.

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

- Nuxt работает в SPA-режиме. Перед включением SSR адаптировать браузерное
  состояние (темы, сессия, локальная музыка и плеер).
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

Коммиты оформляются в формате `<type>: <краткое описание>`. Использовать
следующие типы:

```text
feat: новая функциональность
fix: исправление бага
refactor: изменение кода без новой функциональности или исправления бага
perf: улучшение производительности
style: форматирование или CSS без изменения логики
test: добавление или изменение тестов
docs: документация
build: сборка, зависимости и инструменты сборки
ci: CI/CD
chore: техническая рутина, которая не подходит под остальные типы
revert: откат предыдущего коммита
```

Описание после двоеточия должно быть коротким. После каждой завершённой задачи
указывать в финальном ответе готовую строку коммита, которую пользователь может
скопировать. Автоматически не выполнять `git add` и `git commit`.
