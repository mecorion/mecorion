# Mecorion API

Единый TypeScript API экосистемы Mecorion. Сейчас внутри реализован модуль
Music, позже рядом появятся Book, Course, Video и другие модули.

## Запуск

```bash
cp apps/api/.env.example apps/api/.env
npm run db:up
npm run db:migrate
npm run db:seed
npm run api:dev
```

API будет доступно по адресу `http://127.0.0.1:4000`.

## Маршруты

- `GET /health` — состояние API и PostgreSQL;
- `GET /api/v1/tracks` — треки с фильтрами и пагинацией;
- `GET /api/v1/tracks/:id` — один трек;
- `POST /api/v1/tracks` — создание тестового трека;
- `GET /api/v1/artists` — исполнители;
- `GET /api/v1/albums` — альбомы.

`POST /api/v1/tracks` пока предназначен только для разработки. Перед
публикацией API этот маршрут необходимо защитить авторизацией Mecorion и
проверкой административной роли.

Пример фильтрации:

```text
GET /api/v1/tracks?artistId=<uuid>&year=2000&available=true&limit=20&offset=0
```

## Структура

- `src/config.ts` — проверка переменных окружения;
- `src/core` — общая конфигурация, HTTP-сборка и база;
- `src/modules/music` — маршруты и логика Music;
- `database/migrations` — версионируемая структура базы;
- `database/seeds` — тестовые данные;
- `scripts` — команды миграции и заполнения базы.
