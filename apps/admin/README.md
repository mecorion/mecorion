# Mecorion Admin

Отдельное Nuxt 4 приложение для управления платформой Mecorion. В production
оно публикуется под `/admin/`, но использует тот же API из `apps/api`.

## Текущий этап

Реализованы этапы 1–7:

- отдельный workspace `@mecorion/admin`;
- вход зарегистрированного пользователя по логину и четырём случайно
  выбранным словам seed phrase;
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
- управление upload-сессиями и регистрацией объектов в storage;
- создание исходных media assets и вариантов;
- привязка assets к каноническому контенту;
- постановка задач транскодирования, смена рабочего статуса и атомарная
  регистрация результата обработки.
- очередь редакционных заявок с фильтрами и детальной карточкой;
- revisions, связанные ресурсы, reviews и история смены статусов;
- контролируемые переходы состояний и применение решения review.
- очередь жалоб с отображением отправителя и целевого ресурса;
- создание и управление ограничениями аккаунтов;
- рассмотрение апелляций с атомарным отзывом отменённой санкции.
- управление правовыми статусами, лицензиями, takedown и версиями политик;
- операционный обзор пользовательских коллекций, offline grants и прогресса;
- фильтруемый неизменяемый журнал аудита;
- диагностика transactional outbox, ручная фиксация доставки и повтор события.

Обычная регистрация не выдаёт административный доступ. Роль и permission
назначаются через bootstrap/admin API и хранятся в схемах `access` и `account`.
Форма использует sign-in-only endpoints `/api/v1/auth/seed/challenge/start` и
`/api/v1/auth/seed/challenge/confirm`: неизвестный логин не создаёт аккаунт.
API возвращает только номера четырёх позиций, а не правильные слова. Challenge
одноразовый, живёт 10 минут и блокируется после пяти неверных попыток.

## Локальный запуск

```bash
npm install
npm run auth:keys
npm run db:up
npm run db:migrate
npm run db:seed
npm run api:dev
npm run admin:dev
```

Адреса:

- Admin: `http://127.0.0.1:5174/admin/`
- API: `http://127.0.0.1:4000`

Frontend обращается к относительному `/api`. В development Nuxt проксирует
этот путь в Fastify; прямой cross-origin URL здесь использовать нельзя, иначе
`SameSite` cookie не будет общей с Web. В `.env` API origins остаются нужны для
прямых инструментальных запросов и возможной отдельной deployment-схемы:

```env
CORS_ORIGIN=http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173,http://localhost:5174
```

Для dev-admin используется seed phrase из `database/seeds/DEV_USERS.md`.
После изменения seed-логики или первой настройки локальной базы повторно
выполните `npm run db:seed`, чтобы создать позиционные HMAC-проверки. В БД не
хранятся открытые слова. Production должен задавать отдельный секрет
`AUTH_SEED_PEPPER` длиной не менее 16 символов.

Отдельно входить в Admin не требуется, если пользователь уже вошёл в основной
Web на том же домене: оба приложения используют HttpOnly cookie Mecorion API.
`GET /api/v1/admin/access` всё равно проверяет роль и permission на сервере.
Если аккаунт обычный, общая авторизация сохранится, но Admin вернёт `403`.
Для локальной разработки открывайте оба приложения через один hostname:
например, только `localhost`, а не смесь `localhost` и `127.0.0.1`, потому что
для браузера это разные cookie-домены. Порты могут отличаться: cookie к порту
не привязана.

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

## Автоматические проверки

```bash
npm run api:typecheck
npm run api:test
npm run db:test
npm run admin:build
```

Или одной командой для быстрых проверок без PostgreSQL:

```bash
npm run admin:check
```

`db:test` требует запущенный PostgreSQL с полной схемой и справочниками. Обычно
они создаются через `db:migrate` и `db:seed`; проверенная база из дампа также
поддерживается. Тестовые SQL-сценарии выполняются в транзакциях с `ROLLBACK` и
не оставляют фикстуры. Postman-коллекция находится в
`apps/admin/postman/Mecorion-Admin.postman_collection.json`.

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

1. Выполнить `POST /api/v1/auth/seed/challenge/start` с email или username
   администратора.
2. По массиву `positions` найти четыре слова в seed phrase и передать их в том
   же порядке в `POST /api/v1/auth/seed/challenge/confirm`.
3. Сохранить `tokens.accessToken`.
4. Создать переменные окружения `api = http://127.0.0.1:4000` и
   `token = <accessToken>`.
5. Добавить к административным запросам `Authorization: Bearer {{token}}`.
6. Проверить список: `GET {{api}}/api/v1/admin/accounts?page=1&pageSize=20`.
7. Взять `items[0].id` и вызвать `GET {{api}}/api/v1/admin/accounts/:id`.

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

## API этапа 4

Все операции ниже требуют административную сессию и permission
`content.upload`. API управляет метаданными и очередью. Передачу бинарного файла
в S3/local storage и работу FFmpeg должен выполнять storage adapter и
`apps/media-worker`; эти части пока не реализованы.

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/api/v1/admin/media/references` | Справочники media, storage, языков и территорий |
| `GET` | `/api/v1/admin/media/uploads` | Последние upload-сессии |
| `POST` | `/api/v1/admin/media/uploads` | Создать upload-сессию на два часа |
| `PATCH` | `/api/v1/admin/media/uploads/:id/complete` | Подтвердить файл и создать storage object |
| `GET` | `/api/v1/admin/media/storage-objects` | Зарегистрированные объекты хранилища |
| `GET` | `/api/v1/admin/media/assets` | Логические media assets |
| `POST` | `/api/v1/admin/media/source-assets` | Создать asset и SOURCE-вариант из storage object |
| `GET` | `/api/v1/admin/media/asset-variants` | Исходные и производные варианты assets |
| `POST` | `/api/v1/admin/media/content-assets` | Привязать asset к контенту с ролью |
| `GET` | `/api/v1/admin/media/transcode-jobs` | Очередь обработки |
| `POST` | `/api/v1/admin/media/transcode-jobs` | Поставить SOURCE-вариант в очередь |
| `PATCH` | `/api/v1/admin/media/transcode-jobs/:id` | Перевести задачу в `RUNNING`, `FAILED` или `CANCELLED` |
| `POST` | `/api/v1/admin/media/transcode-jobs/:id/complete` | Атомарно создать output object/variant и завершить задачу |

Основные таблицы: `media.tUpload`, `media.tStorageObject`, `media.tAsset`,
`media.tAssetVariant`, `media.tContentAsset` и `media.tTranscodeJob` вместе с
их справочниками статусов и ролей.

### Проверка media pipeline через Postman

1. Получить admin access token по инструкции этапа 2.
2. Создать сессию: `POST {{api}}/api/v1/admin/media/uploads`.
3. После условной загрузки файла вызвать
   `PATCH {{api}}/api/v1/admin/media/uploads/:id/complete`:

```json
{
  "providerCode": "primary-s3",
  "bucketName": "mecorion",
  "objectKey": "video/source/example.mp4",
  "sizeByte": 1048576,
  "contentType": "video/mp4",
  "sha256Hex": "0000000000000000000000000000000000000000000000000000000000000000"
}
```

4. Передать полученный `storageObjectId` в
   `POST {{api}}/api/v1/admin/media/source-assets`.
5. Взять `assetVariantId` и создать transcode job.
6. Перевести job в `RUNNING`, затем завершить через endpoint `/complete`,
   передав location, checksum и код выходного варианта.
7. Проверить, что job получил `SUCCEEDED`, asset — `READY`, а в списках
   storage objects и variants появились выходные записи.

## API этапа 5

Workflow отделяет пользовательское предложение от канонического контента.
Автор создаёт request и отправляет revision, после чего администратор или иной
проверяющий добавляет review. Решение review может атомарно изменить статус
заявки.

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/api/v1/workflow/requests` | Заявки текущего пользователя |
| `POST` | `/api/v1/workflow/requests` | Создать draft или сразу отправить заявку |
| `POST` | `/api/v1/workflow/requests/:id/submit` | Отправить draft/исправленную заявку и создать revision |
| `GET` | `/api/v1/admin/workflow/references` | Типы заявок, статусы и виды review |
| `GET` | `/api/v1/admin/workflow/requests` | Административная очередь с `q`, `status`, `type`, `limit`, `offset` |
| `GET` | `/api/v1/admin/workflow/requests/:id` | Request, revisions, targets, reviews и status history |
| `POST` | `/api/v1/admin/workflow/requests/:id/reviews` | Добавить review и опционально применить решение |
| `PATCH` | `/api/v1/admin/workflow/requests/:id/status` | Выполнить допустимый служебный переход |

Основные таблицы: `workflow.tRequest`, `workflow.tRequestRevision`,
`workflow.tRequestTarget`, `workflow.tReview` и
`workflow.tRequestStatusHistory`. Справочники находятся в
`workflow.tRequestType`, `workflow.tRequestStatus` и `workflow.tReviewType`.

Поддерживаемые переходы:

```text
DRAFT -> SUBMITTED | CANCELLED
SUBMITTED -> AUTO_CHECK | COMMUNITY_REVIEW | NEEDS_CHANGES | APPROVED | REJECTED | CANCELLED
AUTO_CHECK -> COMMUNITY_REVIEW | NEEDS_CHANGES | APPROVED | REJECTED | CANCELLED
COMMUNITY_REVIEW -> NEEDS_CHANGES | APPROVED | REJECTED | CANCELLED
NEEDS_CHANGES -> SUBMITTED | CANCELLED
```

Финальные состояния `APPROVED`, `REJECTED`, `CANCELLED` повторно не
открываются. Решения `APPROVE`, `REJECT`, `NEEDS_CHANGES` могут автоматически
применить соответствующий статус. `ABSTAIN` и `POSSIBLE_DUPLICATE` сохраняют
review без автоматического перехода.

### Проверка workflow через Postman

1. С пользовательским token вызвать `POST /api/v1/workflow/requests`:

```json
{
  "typeCode": "CREATE_CONTENT",
  "title": "Тестовая заявка",
  "payload": {"originalTitle": "Пример"},
  "submit": false
}
```

2. Отправить полученный request через `POST /api/v1/workflow/requests/:id/submit`.
3. С admin token открыть `GET /api/v1/admin/workflow/requests/:id`.
4. Добавить review:

```json
{
  "reviewTypeCode": "MODERATOR",
  "reviewerRoleCode": "ADMIN",
  "decisionCode": "APPROVE",
  "score": 1,
  "comment": "Метаданные проверены",
  "evidence": {},
  "applyDecision": true
}
```

5. Повторно открыть detail и проверить `APPROVED`, новую review и запись в
   status history.

## API этапа 6

Moderation связывает пользовательскую жалобу с универсальным
`core.tResource`. Целевым ресурсом может быть профиль, контент, contributor или
публикация. Ограничение применяется к аккаунту целиком, к scope либо к
конкретному permission внутри scope.

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/api/v1/moderation/report-reasons` | Доступные причины жалоб |
| `POST` | `/api/v1/moderation/reports` | Отправить жалобу на resource |
| `POST` | `/api/v1/moderation/restrictions/:id/appeals` | Обжаловать собственное активное ограничение |
| `GET` | `/api/v1/admin/moderation/references` | Справочники статусов, scopes и permissions |
| `GET` | `/api/v1/admin/moderation/reports` | Очередь жалоб с фильтрами `q`, `status`, `reason` |
| `PATCH` | `/api/v1/admin/moderation/reports/:id/status` | Triage, расследование или финальное решение |
| `GET` | `/api/v1/admin/moderation/restrictions` | Ограничения пользователей |
| `POST` | `/api/v1/admin/moderation/restrictions` | Создать ограничение, включая связь с report |
| `PATCH` | `/api/v1/admin/moderation/restrictions/:id/status` | Активировать, приостановить, завершить или отозвать |
| `GET` | `/api/v1/admin/moderation/appeals` | Очередь апелляций |
| `PATCH` | `/api/v1/admin/moderation/appeals/:id/status` | Принять в работу или вынести решение |

Основные таблицы: `moderation.tReport`, `moderation.tRestriction` и
`moderation.tAppeal`. Справочники находятся в `tReportReason`,
`tReportStatus`, `tRestrictionStatus` и `tAppealStatus`.

Разрешённые переходы:

```text
Report: OPEN -> TRIAGE -> INVESTIGATING -> RESOLVED | REJECTED | DUPLICATE
Restriction: PENDING -> ACTIVE; ACTIVE <-> SUSPENDED; затем EXPIRED | REVOKED
Appeal: SUBMITTED -> REVIEWING -> UPHELD | OVERTURNED | CANCELLED
```

Для `sourceType = COMPLAINT` API требует `sourceReportId`, как требует
ограничение целостности БД. Решение апелляции `OVERTURNED` в одной транзакции
переводит appeal в финальное состояние и restriction в `REVOKED`.

`requirePermission` проверяет эффективные ограничения централизованно. Global
scope может заблокировать все или конкретное permission; service scope — все
или конкретное permission соответствующего сервиса. Resource-scoped проверка
потребует отдельного resource context и остаётся следующим расширением модели.

### Проверка модерации через Postman

1. Получить public ID ресурса и с пользовательским token создать жалобу:

```json
{
  "resourceId": "<resource-uuid>",
  "reasonCode": "ABUSE",
  "description": "Описание нарушения",
  "evidence": {"source": "manual-test"}
}
```

2. С admin token перевести report в `TRIAGE`, затем `INVESTIGATING`.
3. Создать restriction с `sourceType: "COMPLAINT"` и public ID жалобы.
4. С token ограниченного пользователя вызвать endpoint создания appeal.
5. С admin token перевести appeal в `REVIEWING`, затем в `OVERTURNED`.
6. Проверить через список restrictions, что статус стал `REVOKED`, а
   `revokeDtm` заполнен.

## API этапа 7

Этап объединяет четыре операционных контура. Legal определяет возможность
публикации ресурса, Library хранит пользовательское состояние, Audit является
append-only журналом, а Outbox хранит события для доставки между доменами.

### Legal

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/api/v1/legal/policies` | Действующие публичные политики |
| `POST` | `/api/v1/legal/policies/:versionId/accept` | Принять версию политики |
| `GET` | `/api/v1/admin/legal/references` | Ресурсы и правовые справочники для форм |
| `GET` | `/api/v1/admin/legal/resource-statuses` | История статусов; фильтры `q`, `active` |
| `POST` | `/api/v1/admin/legal/resource-statuses` | Атомарно заменить активный статус территории |
| `GET` | `/api/v1/admin/legal/licenses` | Лицензии и их территории |
| `POST` | `/api/v1/admin/legal/licenses` | Зарегистрировать лицензию |
| `PATCH` | `/api/v1/admin/legal/licenses/:id/revoke` | Отозвать лицензию |
| `GET` | `/api/v1/admin/legal/takedowns` | Требования об ограничении ресурса |
| `POST` | `/api/v1/admin/legal/takedowns` | Создать takedown |
| `PATCH` | `/api/v1/admin/legal/takedowns/:id/revoke` | Отозвать takedown |
| `GET` | `/api/v1/admin/legal/policy-versions` | Версии документов и число принятий |
| `POST` | `/api/v1/admin/legal/policy-versions` | Создать версию документа |

Основные таблицы: `legal.tResourceLegalStatus`, `legal.tLegalStatus`,
`legal.tLicense`, `legal.tLicenseTerritory`, `legal.tTakedown`,
`legal.tPolicyDocument`, `legal.tPolicyVersion` и
`legal.tAccountPolicyAcceptance`. Статус уникален для пары
`resource + territory`, пока не заполнен `revokeDtm`. История не удаляется.

Пример назначения статуса:

```json
{
  "resourceId": "<resource-uuid>",
  "legalStatusCode": "LICENSED",
  "territoryCode": "WORLD",
  "sourceType": "LEGAL_REVIEW",
  "evidence": {"case": "manual-check"}
}
```

Пример лицензии:

```json
{
  "resourceId": "<resource-uuid>",
  "licenseTypeCode": "DIRECT",
  "evidenceStorageObjectId": "<storage-object-uuid>",
  "licenseReference": "CONTRACT-2026-001",
  "territoryCodes": ["WORLD"],
  "validFromDt": "2026-01-01"
}
```

Пример takedown:

```json
{
  "resourceId": "<resource-uuid>",
  "territoryCode": "WORLD",
  "reasonCode": "COPYRIGHT_CLAIM"
}
```

### Library

Пользовательские endpoints требуют обычную активную сессию. Административные
списки и операции требуют роль `ADMIN` вместе с `platform.admin`.

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/api/v1/library/devices` | Активные устройства для выдачи offline grant |
| `GET/POST` | `/api/v1/library/collections` | Список и создание своих коллекций |
| `GET` | `/api/v1/library/collections/:collectionId` | Коллекция вместе с активными элементами |
| `POST` | `/api/v1/library/collections/:collectionId/items` | Добавить resource в коллекцию |
| `DELETE` | `/api/v1/library/collections/:collectionId/items/:resourceId` | Мягко удалить элемент |
| `GET` | `/api/v1/library/favorites` | Избранные ресурсы пользователя |
| `PUT/DELETE` | `/api/v1/library/favorites/:resourceId` | Добавить или удалить избранное |
| `POST` | `/api/v1/library/playback-events` | Записать событие и обновить прогресс |
| `GET` | `/api/v1/library/playback-progress` | Последний прогресс пользователя |
| `GET/POST` | `/api/v1/library/offline-grants` | Список и создание offline grants |
| `DELETE` | `/api/v1/library/offline-grants/:id` | Отозвать свой grant |
| `GET` | `/api/v1/admin/library/collections` | Все активные коллекции |
| `DELETE` | `/api/v1/admin/library/collections/:id` | Мягко удалить коллекцию |
| `GET` | `/api/v1/admin/library/offline-grants` | Все offline grants |
| `PATCH` | `/api/v1/admin/library/offline-grants/:id/revoke` | Отозвать grant администратором |
| `GET` | `/api/v1/admin/library/playback-progress` | Диагностика последнего прогресса |

Основные таблицы: `library.tCollection`, `library.tCollectionItem`,
`library.tFavorite`, `library.tPlaybackProgress`, `library.tPlaybackEvent`,
`library.tOfflineGrant` и `library.tOfflineGrantAsset`. Удаление коллекций и
их элементов мягкое. Playback events не заменяют progress: первые нужны для
аналитики, второй — для быстрого продолжения просмотра или чтения.

Пример события воспроизведения:

```json
{
  "contentId": "<content-uuid>",
  "eventType": "PROGRESS",
  "positionMs": 180000,
  "durationMs": 3600000
}
```

Для offline grant передаётся public ID активного устройства текущего аккаунта:

```json
{
  "deviceId": "<device-uuid>",
  "contentId": "<content-uuid>",
  "ttlHours": 72
}
```

К grant автоматически привязываются только варианты media asset с
`isOfflineAllowed = true`, уже связанные с выбранным content.

### Audit и Outbox

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/api/v1/admin/audit/references` | Категории, сервисы и исходы |
| `GET` | `/api/v1/admin/audit/events` | Аудит; `q`, `category`, `service`, `outcome`, `limit` |
| `GET` | `/api/v1/admin/outbox/events` | События; `q`, `service`, `state` |
| `POST` | `/api/v1/admin/outbox/events` | Вручную поставить событие в outbox |
| `PATCH` | `/api/v1/admin/outbox/events/:id/publish` | Зафиксировать успешную доставку |
| `PATCH` | `/api/v1/admin/outbox/events/:id/fail` | Записать неудачную попытку |
| `PATCH` | `/api/v1/admin/outbox/events/:id/retry` | Очистить ошибку и вернуть в ожидание |

`audit.tAuditEvent` запрещено редактировать и удалять: это обеспечивается
триггером базы данных. `core.tOutboxEvent` является transactional outbox, но
реальный dispatcher/broker пока не реализован. Кнопки Admin изменяют состояние
для диагностики и аварийного восстановления, а не заменяют будущий worker.

Пример ручного события:

```json
{
  "ownerServiceCode": "content",
  "eventType": "content.publication.changed",
  "aggregatePublicId": "<publication-uuid>",
  "payload": {"source": "postman"}
}
```

Проверка этапа через Postman:

1. Получить admin token по сценарию этапа 2 и запросить legal references.
2. Взять `resources[0].id`, назначить ему статус и создать лицензию.
3. Создать takedown, проверить список, затем отозвать его.
4. С пользовательским token создать коллекцию, добавить resource и удалить его.
5. Записать playback event и проверить playback progress.
6. Создать outbox event, записать ошибку, выполнить retry и отметить доставку.
7. Открыть audit events и убедиться, что административные операции записаны.

## Дорожная карта

1. Основа Admin и защита доступа — выполнено.
2. Пользователи, роли, permissions и сессии — выполнено.
3. Контент, contributors и публикации — выполнено на уровне базового CRUD.
4. Upload, storage objects, assets и transcode jobs — выполнено на уровне API
   метаданных и Admin; физическая загрузка и worker остаются отдельной задачей.
5. Workflow и редакционный процесс — выполнено на уровне очереди, revisions,
   reviews и контролируемых переходов.
6. Жалобы, ограничения и апелляции — выполнено на уровне очередей, решений и
   контролируемых переходов.
7. Legal, Library, Audit и Outbox — выполнено на уровне API и Admin.
8. Стабилизация, тестовый runner и Postman-документация — выполнено; SQL
   integration test запускается при доступном Docker/PostgreSQL.
9. UI Registry — выполнен первый модуль управления Mecorion: группы Sidebar,
   пункты, названия, иконки, порядок, видимость и доступ к страницам по ролям.
10. Разделение результата на логические коммиты и несколько PR при необходимости.

README расширяется после каждого этапа. Финальная версия будет содержать карту
SQL-сценариев, таблиц, endpoints, тел запросов, ответов и проверки через Postman.

## Управление Mecorion

Раздел `/admin/platform` управляет глобальным Sidebar основного Web-приложения.
Конфигурация хранится в `core.tUiNavigationGroup`,
`core.tUiNavigationItem` и `core.tUiNavigationItemRole`.

- `VISIBILITY` определяет, какие роли видят ссылку в Sidebar;
- `ROUTE` определяет, какие роли могут открыть страницу напрямую;
- пустой список ролей означает доступ для всех авторизованных пользователей;
- отключённая группа или пункт скрываются и запрещают переход для всех ролей;
- изменение сохраняется через API и записывается в аудит.

Стартовая конфигурация оставляет `BASE`, `SPONSOR` и другим несистемным ролям
только `Главная`, `Профиль` и `Настройки`. Полная навигация доступна ролям
`ADMIN`, `OWNER`, `FOUNDER` и `DEVELOPER`.

API:

```text
GET   /api/v1/admin/platform/navigation
PATCH /api/v1/admin/platform/navigation/items/:itemPublicId
PATCH /api/v1/admin/platform/navigation/groups/:groupPublicId
```

`componentKey` выбирается из серверного allowlist зарегистрированных страниц.
Администратор не может передать путь к произвольному `.vue`-файлу: загрузка
исполняемого кода из БД была бы критической уязвимостью. На текущем этапе ключ
является безопасным идентификатором страницы; подключение динамического
рендерера компонентов будет отдельным этапом UI Registry.

## Управление Mecorion Music

Раздел `/admin/music` объединяет общие схемы `content`, `media` и доменную
схему `music`. Здесь можно создавать и редактировать исполнителей, альбомы и
треки, управлять составом релиза, модерационными статусами и текстами песен,
а также загружать исходное аудио и обложки.

Основной сценарий: «Загрузить музыку» → выбрать MP3 → при необходимости
указать название, исполнителя и альбом → отправить. Название подставляется из
имени файла. Трек сразу публикуется в `/music`; технические метаданные для
загрузки не требуются. Исполнителя и альбом можно создать по названию отдельно.

Файлы принимаются потоково и сохраняются в `data/music`. API вычисляет
SHA-256 во время записи и одной транзакцией создаёт `tStorageObject`, `tAsset`,
`tAssetVariant` и `tContentAsset`. Путь строится из UUID, поэтому имя файла
пользователя не может изменить директорию хранения.

```text
GET/POST       /api/v1/admin/music/artists
PATCH/DELETE   /api/v1/admin/music/artists/:id
GET/POST       /api/v1/admin/music/albums
PATCH/DELETE   /api/v1/admin/music/albums/:id
PUT            /api/v1/admin/music/albums/:id/tracks
POST           /api/v1/admin/music/albums/:id/cover
GET/POST       /api/v1/admin/music/tracks
POST           /api/v1/admin/music/tracks/upload
PATCH/DELETE   /api/v1/admin/music/tracks/:id
GET/PUT        /api/v1/admin/music/tracks/:id/lyrics
POST           /api/v1/admin/music/tracks/:id/audio
```

Перед ручной проверкой применить миграции и seed. Seed создаёт локальный
provider `local-data`; миграция `150_music_admin.sql` создаёт `music.tArtist`
и переносит в него уже связанных музыкальных contributors.
