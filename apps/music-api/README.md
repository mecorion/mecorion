# Mecorion Music API

Минимальный TypeScript API музыкального сервиса.

## Запуск

```bash
cp apps/music-api/.env.example apps/music-api/.env
docker-compose up -d postgres
npm --prefix apps/music-api run db:migrate
npm --prefix apps/music-api run db:seed
npm --prefix apps/music-api run dev
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
- `src/database.ts` — пул соединений PostgreSQL;
- `src/routes` — HTTP-маршруты;
- `database/migrations` — версионируемая структура базы;
- `database/seeds` — тестовые данные;
- `scripts` — команды миграции и заполнения базы.
