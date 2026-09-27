# Mecorion Admin

Отдельное Nuxt 4 приложение для управления платформой Mecorion. В production
оно публикуется под `/admin/`, но использует тот же API из `apps/api`.

## Текущий этап

Реализованы этапы 1–3:

- отдельный workspace `@mecorion/admin`;
- вход зарегистрированного пользователя по email-коду;
- обязательная роль `ADMIN`;
- обязательное разрешение `platform.admin`;
- повторная серверная проверка каждого `/api/v1/admin/*` запроса;
- общий адаптивный layout, мобильное меню и две темы;
- подключение только необходимых слоёв Mecorion V2;
- стартовая страница с картой следующих модулей.
- список пользователей с поиском, фильтрами и серверной пагинацией;
- создание аккаунтов администратором;
- редактирование профиля и статуса аккаунта;
- назначение и отзыв ролей;
- просмотр и принудительное завершение сессий;
- каталог ролей и разрешений;
- создание пользовательских ролей с набором permissions;
- аудит административных изменений профиля, статуса, ролей и сессий.
- каталог канонического контента и участников;
- создание и редактирование контента и contributors;
- привязка участника к контенту с доменной ролью;
- создание публикаций, выбор состава и управление статусом публикации.

Обычная регистрация не выдаёт административный доступ. Роль и permission
назначаются через bootstrap/admin API и хранятся в схемах `access` и `account`.
Форма использует sign-in-only endpoint `/api/v1/auth/email/sign-in/start`:
неизвестный email не создаёт новый аккаунт.

## Локальный запуск

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run api:dev
npm run admin:dev
```

Адреса:

- Admin: `http://127.0.0.1:5174/admin/`
- API: `http://127.0.0.1:4000`

В `.env` API должны быть разрешены оба frontend origin:

```env
CORS_ORIGIN=http://127.0.0.1:5173,http://127.0.0.1:5174
```

При `MAIL_DEV_MODE=true` API возвращает тестовый код подтверждения. Admin
показывает его только в локальной форме входа. В production `MAIL_DEV_MODE`
должен быть `false`.

## Контроль доступа

Frontend middleware проверяет `GET /api/v1/admin/access`. Это удобная проверка
для навигации, но не граница безопасности. Настоящая граница находится в
`apps/api/src/core/http/app.ts`: все пути `/api/v1/admin/*` проходят через
`requireAdminPanelAccess` и требуют одновременно:

```text
roles содержит ADMIN
permissions содержит platform.admin
```

Исключение — `POST /api/v1/admin/accounts` с корректным серверным заголовком
`x-mecorion-bootstrap-token`. Он нужен только для создания первого
администратора и не используется web-admin. Без bootstrap-секрета endpoint
проходит обычную проверку ADMIN.

Ответы:

- `401` — нет токена, сессия отозвана или аккаунт заблокирован;
- `403` — пользователь зарегистрирован, но не имеет полного admin-доступа;
- `200` — административная сессия разрешена.

## Производительность

Admin не импортирует общий `apps/web/src/styles/main.scss`. Вместо него
подключаются только root/theme/foundation и используемые компоненты V2. Nuxt
разделяет страницы на route chunks, CSS также собирается раздельно. В shell нет
растровых изображений и внешних шрифтов. Списки следующих этапов будут получать
данные только через серверную пагинацию.

## API этапа 2

Все запросы, кроме bootstrap-сценария, требуют заголовок:

```http
Authorization: Bearer <accessToken>
```

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/api/v1/admin/access` | Проверить роль `ADMIN` и permission `platform.admin` |
| `GET` | `/api/v1/admin/accounts` | Список аккаунтов; `page`, `pageSize`, `search`, `status`, `role` |
| `POST` | `/api/v1/admin/accounts` | Создать аккаунт |
| `GET` | `/api/v1/admin/accounts/:id` | Профиль, роли, история статусов и сессии |
| `PATCH` | `/api/v1/admin/accounts/:id/profile` | Изменить публичный профиль |
| `PATCH` | `/api/v1/admin/accounts/:id/status` | Изменить статус аккаунта |
| `POST` | `/api/v1/admin/accounts/:id/roles` | Назначить одну или несколько ролей |
| `DELETE` | `/api/v1/admin/accounts/:id/roles/:roleCode` | Отозвать роль |
| `DELETE` | `/api/v1/admin/accounts/:id/sessions/:sessionId` | Завершить сессию и отозвать её refresh-токены |
| `GET` | `/api/v1/admin/account-statuses` | Справочник статусов аккаунта |
| `GET` | `/api/v1/admin/roles` | Роли, permissions, типы и число назначений |
| `GET` | `/api/v1/admin/permissions` | Разрешения, сгруппированные по сервисам |
| `POST` | `/api/v1/admin/roles` | Создать пользовательскую роль |
| `PATCH` | `/api/v1/admin/roles/:id` | Изменить пользовательскую роль и её permissions |

### Объекты базы данных

- `account.tAccount`, `account.tProfile` — аккаунт и публичный профиль;
- `account.tAccountStatus`, `account.tAccountStatusHistory` — текущий статус и история;
- `auth.tIdentity` — основной email;
- `auth.tDevice`, `auth.tSession`, `auth.tRefreshToken` — устройства и сессии;
- `access.tRole`, `access.tPermission`, `access.tRolePermission` — модель доступа;
- `access.tRoleAssignment`, `access.tScope` — назначение роли в scope;
- `audit.tAuditEvent` — неизменяемая запись административных мутаций.

Блокирующие статусы (`FROZEN`, `BANNED`, `DELETION_PENDING`, `ANONYMIZED`,
`CLOSED`) отзывают все активные сессии и refresh-токены аккаунта. API запрещает
администратору снять роль `ADMIN` с собственной текущей учётной записи и
завершить текущую сессию через карточку пользователя.

### Проверка через Postman

1. Выполнить `POST /api/v1/auth/email/sign-in/start` с email администратора.
2. Выполнить `POST /api/v1/auth/email/confirm` и сохранить `tokens.accessToken`.
3. Создать переменные окружения `api = http://127.0.0.1:4000` и
   `token = <accessToken>`.
4. Добавить к административным запросам `Authorization: Bearer {{token}}`.
5. Проверить список: `GET {{api}}/api/v1/admin/accounts?page=1&pageSize=20`.
6. Взять `items[0].id` и вызвать `GET {{api}}/api/v1/admin/accounts/:id`.

Пример изменения статуса:

```json
{
  "status": "FROZEN",
  "reasonCode": "SECURITY_REVIEW"
}
```

Пример создания роли:

```json
{
  "roleTypeCode": "SYSTEM",
  "code": "CONTENT_EDITOR",
  "name": "Редактор контента",
  "description": "Работа с каталогом и публикациями",
  "requiresGovernanceIdentity": false,
  "permissionCodes": ["content.read", "content.submit"]
}
```

## API этапа 3

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/api/v1/admin/content/references` | Типы и статусы контента, роли участников, языки |
| `GET` | `/api/v1/content` | Поиск по каноническому каталогу |
| `POST` | `/api/v1/admin/content` | Создать объект контента |
| `PATCH` | `/api/v1/admin/content/:id` | Изменить метаданные и статус контента |
| `GET` | `/api/v1/contributors` | Поиск участников контента |
| `POST` | `/api/v1/admin/contributors` | Создать участника |
| `PATCH` | `/api/v1/admin/contributors/:id` | Изменить участника |
| `POST` | `/api/v1/admin/content/:id/contributors` | Привязать участника с ролью |
| `GET` | `/api/v1/publications` | Поиск публикаций |
| `POST` | `/api/v1/admin/publications` | Создать публикацию и её состав |
| `PATCH` | `/api/v1/admin/publications/:id` | Изменить текст и статус публикации |

Основные таблицы: `content.tContent`, `content.tContributor`,
`content.tContentContributor`, `content.tPublication` и
`content.tPublicationContent`. Переход публикации в публичный статус выставляет
`publishDtm`; это обязательное условие триггера `trgPublicationValidateState`.

## Дорожная карта

1. Основа Admin и защита доступа — выполнено.
2. Пользователи, роли, permissions и сессии — выполнено.
3. Контент, contributors и публикации — выполнено на уровне базового CRUD.
4. Upload, storage objects, assets и transcode jobs.
5. Workflow и редакционный процесс.
6. Жалобы, ограничения и апелляции.
7. Legal, Library, Audit и Outbox.
8. Стабилизация, тесты и полная Postman-документация.
9. Разделение результата на логические коммиты и несколько PR при необходимости.

README расширяется после каждого этапа. Финальная версия будет содержать карту
SQL-сценариев, таблиц, endpoints, тел запросов, ответов и проверки через Postman.
