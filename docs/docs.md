# Mecorion: справочник по проекту

Этот документ нужен для быстрого входа в проект. Он объясняет, что лежит в
каждой папке, какие части проекта уже есть, как они связаны между собой и как
правильно добавлять новые сервисы Mecorion.

## 1. Что такое Mecorion

Mecorion — это единая экосистема пользовательских сервисов. В одном продукте
должны сосуществовать Music, Video, Book, Course, Cloud, Mail, VPN,
админ панель и другие будущие сервисы.

Текущий репозиторий устроен как монорепозиторий:

- frontend лежит в `apps/web`;
- единый backend API лежит в `apps/api`;
- будущая обработка медиафайлов лежит в `apps/media-worker`;
- общие внутренние библиотеки лежат в `packages`;
- локальное файловое хранилище эмулируется через `data`;
- окружение разработки описывается в `infrastructure`;
- проектная документация лежит в `docs`.

Главная архитектурная идея: проект не дробится на множество отдельных
репозиториев и API. Вместо этого используется один Mecorion API с внутренними
модулями: `music`, `video`, `books`, `course`, `cloud` и так далее.

## 2. Главная структура

```text
mecorion/
├── apps/
│   ├── web/
│   ├── api/
│   └── media-worker/
│
├── packages/
│   ├── contracts/
│   ├── storage/
│   ├── ui/
│   └── config/
│
├── data/
│   ├── music/
│   ├── video/
│   ├── books/
│   ├── cloud/
│   └── temp/
│
├── infrastructure/
│   └── docker-compose.yml
│
├── docs/
│   ├── docs.md
│   ├── architecture/
│   ├── diagrams/
│   └── manual/
│
├── mecorion.md
├── mecorion-music-plan.md
├── mecorion-music-backend-plan.md
├── package.json
└── package-lock.json
```

## 3. Быстрый запуск

Установка зависимостей:

```bash
npm install
```

Запуск frontend:

```bash
npm run dev
```

Сборка frontend:

```bash
npm run build
```

Запуск PostgreSQL через Docker Compose:

```bash
npm run db:up
```

По умолчанию проект поднимает PostgreSQL 18 в Docker-контейнере:

```text
database: mecorion
user: mecorion
password: mecorion
host: 127.0.0.1
port: 5432
```

Перед запуском API создай локальный env-файл:

```bash
cp apps/api/.env.example apps/api/.env
```

`DATABASE_URL` должен совпадать с настройками Docker Compose:

```env
DATABASE_URL=postgres://mecorion:mecorion@127.0.0.1:5432/mecorion
```

Применение миграций:

```bash
npm run db:migrate
```

Заполнение тестовыми данными:

```bash
npm run db:seed
```

Запуск API:

```bash
npm run api:dev
```

Проверка API:

```bash
npm run api:typecheck
npm run api:build
```

Проверка Media Worker:

```bash
npm run worker:build
```

## 4. Авторизация и роли

Авторизация уже вынесена из frontend-заглушки в Mecorion API.

Backend-часть:

- миграция схемы лежит в `apps/api/database/migrations/002_identity_auth_schema.sql`;
- auth-модуль лежит в `apps/api/src/modules/auth`;
- пользователи хранятся в `identity.users`;
- серверные сессии хранятся в `identity.sessions`;
- пароли хранятся как `scrypt`-хеш + соль;
- frontend хранит только случайный session token, а не пароль и не user role как
  источник истины.

Основные API routes:

- `POST /api/v1/auth/sign-up` — регистрация пользователя;
- `POST /api/v1/auth/sign-in` — вход пользователя;
- `GET /api/v1/auth/me` — проверка текущей сессии;
- `POST /api/v1/auth/logout` — отзыв текущей сессии.

Текущие роли:

- `user` — обычный пользователь;
- `admin` — администратор платформы;
- `super_admin` — будущий полный администратор экосистемы.

Frontend-часть:

- auth-клиент лежит в `apps/web/src/auth/session.js`;
- `/sign-in` и `/sign-up` вызывают Mecorion API;
- route guard в `apps/web/src/router/index.js` подтверждает локальный токен
  через `GET /api/v1/auth/me` перед входом в защищённые разделы.

Для локальной разработки frontend ожидает API по адресу
`http://127.0.0.1:4000`. Его можно переопределить переменной:

```bash
VITE_MECORION_API_URL=http://127.0.0.1:4000
```

Dev-seed создаёт администратора:

```text
email: admin@mecorion.local
password: mecorion-admin
```

## 5. Корневые файлы

### `package.json`

Корневой `package.json` управляет npm workspaces и общими командами.

В проекте подключены workspaces:

```json
[
  "apps/*",
  "packages/*"
]
```

Это значит, что `apps/web`, `apps/api`, `apps/media-worker` и все пакеты из
`packages` являются частями одного npm-проекта.

Корневые команды специально оставлены короткими:

- `npm run dev` запускает frontend;
- `npm run api:dev` запускает API;
- `npm run worker:dev` запускает worker;
- `npm run db:up` поднимает PostgreSQL;
- `npm run db:migrate` применяет миграции;
- `npm run db:seed` добавляет тестовые данные.

### `package-lock.json`

Единый lock-файл для всего монорепозитория. Отдельные lock-файлы внутри
`apps/*` и `packages/*` создавать не нужно.

### `.gitignore`

Исключает:

- `node_modules`;
- build-артефакты;
- `.env`;
- системные файлы;
- локальные медиафайлы;
- содержимое `data`.

В `data` можно коммитить только служебные файлы вроде `README.md` и `.gitkeep`,
но не реальные аудио, видео, книги и пользовательские файлы.

### `mecorion.md`

Архитектурное описание проекта. Там зафиксирована общая концепция:
монорепозиторий, единый API, модули, `data`, `packages`, worker и
infrastructure.

### `mecorion-music-plan.md`

Roadmap по развитию Mecorion Music.

### `mecorion-music-backend-plan.md`

План backend-развития музыкального модуля.

### `MEMORY.md`

Локальный дневник Codex с текущим контекстом и планами работы. Файл
игнорируется Git и не должен попадать в коммиты.

## 6. `apps`

`apps` содержит запускаемые приложения. Главное правило:

```text
apps = процессы, которые можно запустить
```

Если часть проекта открывает порт, имеет entrypoint или работает как отдельный
процесс, она должна жить в `apps`.

## 7. `apps/web`

`apps/web` — frontend всей экосистемы Mecorion.

Технологии:

- Vue 3;
- Vue Router;
- Pinia;
- Vite;
- SCSS;
- Element Plus;
- Tailwind-зависимости пока присутствуют в проекте.

Структура:

```text
apps/web/
├── index.html
├── package.json
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js
├── public/
└── src/
```

### `apps/web/src/main.js`

Точка входа frontend-приложения. Здесь создаётся Vue-приложение, подключаются
router, Pinia и глобальные стили.

### `apps/web/src/App.vue`

Корневой Vue-компонент.

### `apps/web/src/router`

Маршрутизация frontend. Здесь описываются URL-адреса страниц:

- dashboard;
- Music;
- Video;
- UiKit;
- старые страницы просмотра видео.

При добавлении нового сервиса, например Course, frontend-маршруты нужно
добавлять сюда или в будущую модульную роутинг-структуру.

### `apps/web/src/pages`

Страницы верхнего уровня.

Примеры:

- `DashboardView.vue` — главный dashboard экосистемы;
- `MusicView.vue` — музыкальное приложение;
- `VideoPage.vue` — текущая video-страница;
- `UiKitView.vue` — страница UI kit;
- `HomePage.vue`, `PlayerPage.vue` — старые/переходные страницы видеосервиса.

Страница должна описывать экран или крупный сценарий, а не маленькую кнопку или
строку списка.

### `apps/web/src/components`

Переиспользуемые Vue-компоненты.

Текущие группы:

- `components/layout` — layout-компоненты общего интерфейса;
- `components/music` — компоненты Mecorion Music;
- остальные компоненты — текущие общие или video-компоненты.

Правило: компоненты конкретного сервиса должны лежать в своей подпапке. Для
нового Course лучше создать:

```text
apps/web/src/components/course/
```

### `apps/web/src/layouts`

Крупные layout-обёртки. Например, общий layout с сайдбаром и шапкой.

### `apps/web/src/stores`

Pinia stores.

Сейчас есть:

- `app.js` — состояние приложения;
- `musicPlayer.js` — состояние музыкального плеера;
- `requests.js` — состояние/логика запросов.

Для новых сервисов следует создавать отдельные stores:

```text
stores/course.js
stores/books.js
stores/video.js
```

Не стоит складывать состояние всех сервисов в один большой store.

### `apps/web/src/music`

Frontend-логика музыкального MVP:

- `catalog.js` — демонстрационный каталог;
- `localLibrary.js` — сканирование локальной папки с музыкой;
- `trackFilters.js` — фильтрация и сортировка треков.

Позже часть этой логики должна переехать на backend, когда frontend начнёт
получать каталог через API.

### `apps/web/src/styles`

Глобальные стили и стили Mecorion.

Основные файлы:

- `main.scss` — общий вход для стилей;
- `var.scss` — переменные;
- `mecorion-ui.scss` — базовый визуальный язык;
- `mecorion-workspaces.scss` — стили dashboard/workspace;
- `mecorion-music.scss` — стили Music;
- `el-components.scss` — переопределения Element Plus.

Для нового крупного сервиса можно добавить отдельный файл:

```text
apps/web/src/styles/mecorion-course.scss
```

Но общие цвета, типографика и базовые элементы лучше держать в UI-слое, чтобы
сервисы выглядели частью одной экосистемы.

### `apps/web/src/assets`

Статические frontend-ассеты:

- шрифты;
- иконки;
- иллюстрации;
- изображения;
- демонстрационные музыкальные файлы.

Важно: это не серверное хранилище пользовательских файлов. Пользовательские
аудио, видео, книги и cloud-файлы должны лежать в `data`, а не в
`apps/web/src/assets`.

### `apps/web/src/db`

Временные JSON-данные для frontend-прототипа. Например, `sidebar.json`.

Позже такие данные должны переехать в API или в конфигурационные endpoints.

### `apps/web/src/api`

Frontend-описание API endpoint'ов. В будущем сюда стоит добавить клиент для
единого Mecorion API.

### `apps/web/src/utils`

Утилиты frontend:

- работа с API;
- конвертация данных;
- helper-функции;
- музыкальные formatters;
- cookies.

Правило: если функция нужна только frontend, она может быть здесь. Если она
должна использоваться frontend и backend, её нужно переносить в `packages`.

## 7. `apps/api`

`apps/api` — единый backend API Mecorion.

Технологии:

- TypeScript;
- Fastify;
- PostgreSQL через `pg`;
- Zod;
- SQL-миграции;
- npm scripts для миграций и seed.

Структура:

```text
apps/api/
├── src/
│   ├── core/
│   └── modules/
├── database/
│   ├── migrations/
│   └── seeds/
├── scripts/
├── .env.example
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

### `apps/api/src/main.ts`

Точка входа API. Запускает HTTP-сервер и корректно закрывает соединения при
остановке процесса.

### `apps/api/src/core`

Общее ядро API. Здесь лежит код, который нужен всем модулям.

Текущие подпапки:

```text
core/
├── config/
├── database/
└── http/
```

#### `core/config`

Читает и проверяет переменные окружения.

Главная идея: API не должен стартовать с неправильной конфигурацией. Если
отсутствует `DATABASE_URL` или некорректен порт, ошибка должна появиться при
старте.

#### `core/database`

Создаёт пул PostgreSQL-соединений и экспортирует общую функцию `query`.

В локальной разработке API подключается к PostgreSQL по `DATABASE_URL`.
Если используется контейнер из `infrastructure/docker-compose.yml`, то
подключение идёт к базе `mecorion` внутри контейнера через проброшенный порт
`127.0.0.1:5432`.

Все SQL-запросы должны быть параметризованными:

```ts
await query("SELECT * FROM music.tracks WHERE id = $1", [trackId]);
```

Не нужно собирать SQL из пользовательских строк напрямую.

#### `core/http`

Собирает Fastify-приложение:

- подключает CORS;
- регистрирует health-check;
- регистрирует доменные модули;
- настраивает единый обработчик ошибок.

### `apps/api/src/modules`

Доменные модули Mecorion API.

Сейчас есть:

```text
modules/music/
```

В будущем здесь появятся:

```text
modules/books/
modules/course/
modules/video/
modules/cloud/
modules/mail/
modules/vpn/
modules/admin/
modules/identity/
```

Каждый новый сервис должен добавляться как новый модуль внутри единого API, а
не как отдельный API-проект.

### `apps/api/src/modules/music`

Текущий backend-модуль Music.

Файлы:

- `music.module.ts` — регистрирует routes модуля;
- `music-tracks.routes.ts` — endpoints треков;
- `music-catalog.routes.ts` — endpoints исполнителей и альбомов.

Текущие маршруты:

```text
GET  /api/v1/tracks
GET  /api/v1/tracks/:id
POST /api/v1/tracks
GET  /api/v1/artists
GET  /api/v1/albums
```

Важно: `POST /api/v1/tracks` сейчас является тестовым маршрутом. Перед
production он должен получить авторизацию и проверку административной роли.

### Рекомендуемый шаблон будущего модуля

Например, для Mecorion Course:

```text
apps/api/src/modules/course/
├── course.module.ts
├── course.routes.ts
├── course.service.ts
├── course.repository.ts
├── course.schemas.ts
└── course.types.ts
```

Назначение:

- `routes` — HTTP-слой;
- `schemas` — Zod-валидация входных данных;
- `service` — бизнес-логика;
- `repository` — SQL-запросы;
- `types` — внутренние типы;
- `module` — подключение модуля к API.

Сейчас Music-модуль проще этого шаблона, потому что он MVP. При расширении его
тоже стоит разнести на `service` и `repository`.

### `apps/api/database/migrations`

SQL-миграции PostgreSQL.

Текущая миграция создаёт схему `music` и таблицы:

- `artists`;
- `albums`;
- `tracks`;
- `genres`;
- `track_genres`;
- `playlists`;
- `playlist_tracks`;
- `liked_tracks`;
- `playback_history`;
- `lyrics`.

Правило: изменение структуры БД делается только новой миграцией. Нельзя
редактировать уже применённую миграцию после того, как она попала к другим
разработчикам или на сервер.

### `apps/api/database/seeds`

Тестовые данные для разработки.

Сейчас seed добавляет демонстрационный музыкальный каталог.

### `apps/api/scripts`

Скрипты:

- `migrate.ts` — применяет SQL-миграции;
- `seed.ts` — применяет тестовые данные.

## 8. `apps/media-worker`

`apps/media-worker` — будущий отдельный процесс для фоновой обработки файлов.

Он нужен, потому что API не должен долго конвертировать файлы внутри HTTP-
запроса. API должен быстро принять файл или создать задачу, а worker уже после
этого выполнит тяжёлую работу.

Будущие задачи worker:

- брать задания из PostgreSQL или очереди;
- читать исходные файлы из `data/temp`;
- запускать FFmpeg;
- создавать обработанные версии аудио и видео;
- извлекать метаданные;
- генерировать preview/poster/cover;
- обновлять статусы в PostgreSQL.

Сейчас worker является каркасом и не выполняет FFmpeg-задачи.

## 9. `packages`

`packages` содержит внутренние библиотеки, которые могут использоваться
несколькими приложениями.

Главное правило:

```text
packages = код, который импортируют apps
```

Пакет не должен запускаться как сервер, открывать порт или владеть бизнес-
процессом. Если что-то является отдельным процессом, оно должно быть в `apps`.

## 10. `packages/contracts`

Будущие общие контракты API.

Здесь должны лежать:

- Zod-схемы запросов;
- Zod-схемы ответов;
- TypeScript-типы, полученные из схем;
- общие коды ошибок;
- публичные enum'ы API.

Кто будет использовать:

- `apps/api` — чтобы валидировать входящие/исходящие данные;
- `apps/web` — чтобы иметь те же типы, что и backend;
- будущие клиенты — desktop, mobile, admin.

Сюда нельзя помещать:

- SQL;
- доступ к PostgreSQL;
- бизнес-логику;
- секреты;
- внутренние модели, которые не должны уходить клиенту.

## 11. `packages/storage`

Общая библиотека доступа к файлам.

Сейчас проект использует локальную директорию `data`, но в будущем может
появиться S3 или S3-совместимое хранилище. Чтобы API и worker не зависели от
конкретного способа хранения, вводится общий интерфейс:

```ts
interface StorageDriver {
  put(key, data): Promise<void>;
  read(key): Promise<Readable>;
  delete(key): Promise<void>;
  exists(key): Promise<boolean>;
  getUrl(key): Promise<string>;
}
```

Кто будет использовать:

- `apps/api` — для загрузки оригиналов и выдачи ссылок;
- `apps/media-worker` — для чтения оригиналов и записи обработанных файлов.

Идея: сегодня реализация работает с `/data`, завтра с S3, но код Music, Video
и Books не переписывается.

## 12. `packages/ui`

Будущий общий UI kit Mecorion.

Сейчас frontend один, поэтому большинство компонентов остаётся в
`apps/web/src/components`.

Выносить в `packages/ui` стоит только то, что реально используется несколькими
frontend-приложениями:

- базовые кнопки;
- поля форм;
- модальные окна;
- таблицы;
- tokens;
- общая типографика;
- общие layout-примитивы.

Нельзя выносить в `packages/ui` страницы конкретных сервисов, например
`MusicView` или будущий `CourseDashboard`. Это продуктовые компоненты, а не
универсальный UI.

## 13. `packages/config`

Будущие общие конфигурации разработки:

- базовый `tsconfig`;
- ESLint;
- Prettier;
- Vitest/Jest-конфигурация;
- общие правила сборки.

Здесь не должны лежать `.env`, пароли, токены, адреса баз и runtime-настройки.

## 14. `data`

`data` эмулирует файловое хранилище сервера.

Структура:

```text
data/
├── music/
├── video/
├── books/
├── cloud/
└── temp/
```

Назначение:

- `music` — аудиофайлы, обложки, обработанные версии;
- `video` — видео, HLS/DASH-потоки, постеры;
- `books` — EPUB/PDF/обложки;
- `cloud` — пользовательские файлы будущего cloud-сервиса;
- `temp` — временные файлы загрузки и обработки.

Реальные файлы из `data` не коммитятся. В Git остаются только структура,
`README.md` и `.gitkeep`.

В базе нужно хранить относительный ключ:

```text
music/processed/{trackId}/audio-320.mp3
```

Не нужно хранить абсолютные пути вроде:

```text
/Users/name/project/mecorion/data/music/...
```

Такой путь сломается на другом компьютере или сервере.

## 15. `infrastructure`

`infrastructure` содержит настройки окружения, а не бизнес-логику.

Сейчас здесь есть:

- `docker-compose.yml` — запуск PostgreSQL;
- `README.md` — описание будущих инфраструктурных частей.

В будущем здесь могут появиться:

- `nginx` — единая точка входа для frontend, API и media;
- `postgres` — init-скрипты и настройки базы;
- `monitoring` — Prometheus, Grafana, логи;
- конфигурация backup.

Nginx в будущем может маршрутизировать:

```text
/              -> apps/web
/api/*         -> apps/api
/media/music/* -> data/music
/media/video/* -> data/video
```

## 16. `docs`

Документация проекта.

Текущие части:

- `docs/docs.md` — этот справочник по проекту;
- `docs/architecture` — архитектурные заметки;
- `docs/diagrams` — Draw.io диаграммы;
- `docs/manual` — пользовательская или проектная инструкция.

Документацию нужно обновлять при изменении архитектуры, команд запуска,
структуры папок или правил добавления новых сервисов.

## 17. `docs/diagrams`

Диаграммы проекта.

Сейчас есть:

- `Ecosystem/MEC-ECO-01.drawio` — схема экосистемы;
- `Sitemap/MEC-SMAP-01.drawio` — карта сайта.

Диаграммы стоит использовать для крупных решений: экосистема сервисов,
маршрутизация, upload pipeline, database boundaries, media processing.

## 18. `dist`

`dist` — результат сборки frontend. Это build-артефакт.

В нормальном режиме разработки его не нужно редактировать вручную. Если он
попадает в Git, нужно отдельно решить, действительно ли проект хочет хранить
собранный frontend в репозитории. Обычно build-артефакты не коммитят.

## 19. Как добавлять новый сервис

Пример: нужно добавить Mecorion Course.

### Backend

Создать модуль:

```text
apps/api/src/modules/course/
├── course.module.ts
├── course.routes.ts
├── course.service.ts
├── course.repository.ts
├── course.schemas.ts
└── course.types.ts
```

Зарегистрировать модуль в `apps/api/src/core/http/app.ts`.

Создать миграцию:

```text
apps/api/database/migrations/002_course_schema.sql
```

Пример будущих таблиц:

```text
course.courses
course.lessons
course.enrollments
course.progress
course.certificates
```

### Frontend

Создать страницы:

```text
apps/web/src/pages/CourseView.vue
```

Создать компоненты:

```text
apps/web/src/components/course/
```

Создать store, если нужен:

```text
apps/web/src/stores/course.js
```

Добавить маршруты в:

```text
apps/web/src/router/index.js
```

### Contracts

Если frontend и API начинают обмениваться typed-структурами, добавить схемы в:

```text
packages/contracts
```

### Storage

Если сервис работает с файлами, добавить раздел в `data`:

```text
data/course/
```

И использовать `packages/storage`, а не прямые абсолютные пути.

## 20. Как добавлять новые таблицы

1. Создать новый SQL-файл в `apps/api/database/migrations`.
2. Не редактировать старую применённую миграцию.
3. Использовать отдельную PostgreSQL-схему для домена:

```text
music.*
books.*
course.*
video.*
identity.*
admin.*
```

4. Добавить индексы под реальные запросы.
5. При необходимости добавить seed в `database/seeds`.
6. Проверить:

```bash
npm run db:migrate
npm run db:seed
npm run api:typecheck
```

## 21. Как работать с медиафайлами

API не должен отдавать большие аудио и видео напрямую через Node.js, если это
можно избежать.

Правильная схема:

```text
Frontend -> API -> проверка доступа -> URL файла -> Media server/Nginx -> data
```

Для обработки:

```text
API создаёт задачу -> Media Worker -> FFmpeg -> data/processed -> PostgreSQL
```

Это нужно, чтобы:

- API не блокировался тяжёлой обработкой;
- перемотка аудио и видео работала через Range-запросы;
- worker можно было масштабировать отдельно;
- позже локальный диск можно было заменить на S3.

## 22. Правила границ

### Frontend не должен

- напрямую читать PostgreSQL;
- напрямую читать серверную директорию `data`;
- знать абсолютные пути файлов на сервере;
- содержать бизнес-логику прав доступа.

### API не должен

- хранить большие файлы в PostgreSQL;
- выполнять долгую FFmpeg-обработку внутри HTTP-запроса;
- отдавать пользователю секретные пути и ключи;
- смешивать логику разных сервисов в одном файле.

### Media Worker не должен

- принимать HTTP-запросы от пользователя;
- решать права доступа;
- содержать frontend-логику;
- напрямую менять пользовательские настройки без задачи из API.

### Packages не должны

- импортировать код из `apps`;
- открывать серверные порты;
- владеть бизнес-сценарием;
- хранить `.env` или секреты.

## 23. Текущий статус сервисов

### Music

Music находится на уровне MVP:

- frontend-плеер;
- поиск;
- плейлисты;
- избранное;
- локальная музыка;
- player mode;
- фильтры;
- начальный backend-каталог;
- PostgreSQL-схема Music.

Дальше Music можно развивать, но сейчас он достаточен как первый сервис
экосистемы.

### Video

В проекте есть старые video-компоненты и страницы. Они пока не приведены к
новой модульной архитектуре.

### Book, Course, Cloud, Mail, VPN

Пока не реализованы. Их нужно добавлять по шаблону нового сервиса:

- backend module;
- database schema;
- frontend pages/components;
- contracts;
- storage-раздел, если нужны файлы;
- admin-сценарии.

## 24. Проверки перед завершением задачи

После изменения frontend:

```bash
npm run build
```

После изменения API:

```bash
npm run api:typecheck
npm run api:build
```

После изменения worker:

```bash
npm run worker:build
```

После изменения миграций:

```bash
npm run db:migrate
npm run db:seed
```

Перед коммитом полезно проверить:

```bash
git status --short
git diff --check
```

## 25. Куда смотреть новому разработчику

Если нужно понять общую архитектуру:

```text
mecorion.md
docs/docs.md
```

Если нужно работать с frontend:

```text
apps/web/src/router
apps/web/src/pages
apps/web/src/components
apps/web/src/stores
apps/web/src/styles
```

Если нужно работать с API:

```text
apps/api/src/core
apps/api/src/modules
apps/api/database/migrations
```

Если нужно работать с Music:

```text
apps/web/src/pages/MusicView.vue
apps/web/src/components/music
apps/web/src/stores/musicPlayer.js
apps/api/src/modules/music
```

Если нужно работать с файлами:

```text
data
packages/storage
apps/media-worker
```

Если нужно понять будущую архитектуру сервисов:

```text
docs/diagrams
mecorion.md
```
