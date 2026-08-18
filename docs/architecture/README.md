# Mecorion Architecture Draft

Этот файл — рабочее место для проектирования Mecorion. Пока не пишем код
дальше, сначала фиксируем понятную архитектуру и правила.

## 1. Базовые договоренности

### 1.1. База данных

В проекте есть ровно одна основная PostgreSQL-база:

```text
mecorion
```

Других баз для Music, Video, Book или Auth не создаем. Все сервисы живут в
одной базе `mecorion`, но разделяются через PostgreSQL schemas.

### 1.2. Схемы PostgreSQL

Схема PostgreSQL — это логическая область внутри одной базы. В Mecorion схема
соответствует домену или сервису.

```text
mecorion
├── identity
├── music
├── video
└── book
```

Назначение схем:

- `identity` — общие аккаунты, регистрация, авторизация, роли, сессии;
- `music` — музыкальный каталог, треки, артисты, альбомы, плейлисты;
- `video` — видео, фильмы, сериалы, коллекции, история просмотра;
- `book` — книги, авторы, коллекции, прогресс чтения.

`identity` является общей для всех сервисов. Пользователь регистрируется один
раз и получает один аккаунт Mecorion, который используется в Music, Video,
Book и будущих сервисах.

### 1.3. Регламент именования таблиц

Таблицы называем так:

```text
t + EntityName
```

Правила:

- префикс `t` обязателен;
- имя сущности в единственном числе;
- имя сущности начинается с большой буквы;
- таблица лежит в своей схеме.

Примеры:

```text
identity.tUser
identity.tSession
identity.tRole
music.tTrack
music.tArtist
video.tMovie
book.tBook
```

Пока отдельно не фиксируем стиль колонок. Предлагаемый вариант: `snake_case`,
потому что он привычен для PostgreSQL:

```text
created_at
updated_at
password_hash
display_name
```

Если позже решим использовать другой стиль колонок, зафиксируем это здесь до
написания новых миграций.

## 2. Сервис авторизации Identity

### 2.1. Назначение сервиса

Identity отвечает за:

- регистрацию пользователя;
- вход пользователя;
- выход пользователя;
- проверку текущей сессии;
- хранение общего аккаунта Mecorion;
- роли пользователя;
- блокировку аккаунта;
- будущие восстановления пароля, подтверждения email и OAuth-входы.

Identity не должен хранить музыкальные, видео или книжные данные. Он отвечает
только на вопрос:

```text
Кто этот пользователь и что ему разрешено?
```

## 3. Что значит User в Mecorion

`User` — это аккаунт для входа в систему.

Важно не путать:

- `User` — учетная запись, логин, пароль, роль, статус;
- `Person` — персональные данные или профиль человека.

На первом этапе можно обойтись только `tUser`. Таблица `tPerson` понадобится,
если мы захотим отделить аккаунт от расширенного профиля:

- имя;
- фамилия;
- дата рождения;
- аватар;
- публичный профиль;
- приватные персональные данные.

Пока для MVP авторизации достаточно `identity.tUser`, но нужно понимать, что в
будущем `tPerson` может появиться как отдельная сущность.

## 4. Таблицы Identity

### 4.1. Минимальный MVP

Для первой рабочей версии авторизации нужны минимум три таблицы:

```text
identity.tUser
identity.tCredential
identity.tSession
```

Почему не только `tUser`: если положить пароль прямо в `tUser`, таблица быстро
начнет смешивать аккаунт, способы входа, OAuth, email-подтверждения и сессии.
Лучше сразу разделить ответственность.

### 4.2. `identity.tUser`

Главная таблица аккаунтов Mecorion.

Отвечает за:

- идентификатор пользователя;
- email как основной логин;
- отображаемое имя;
- системную роль;
- статус аккаунта;
- даты создания и обновления.

Предлагаемые поля:

```text
id uuid primary key
email varchar(254) unique not null
display_name varchar(120) not null
role varchar(32) not null
status varchar(32) not null
created_at timestamptz not null
updated_at timestamptz not null
disabled_at timestamptz null
```

Предлагаемые значения `role`:

```text
user
admin
super_admin
```

Предлагаемые значения `status`:

```text
active
pending_email
disabled
deleted
```

Пояснение:

- `role` отвечает за права;
- `status` отвечает за состояние аккаунта;
- `disabled_at` нужен для блокировки без удаления истории пользователя.

### 4.3. `identity.tCredential`

Таблица способов входа пользователя.

Отвечает за:

- парольный вход;
- будущий OAuth-вход через Google/Yandex/GitHub;
- хранение хеша пароля;
- отделение учетной записи от конкретного способа авторизации.

Предлагаемые поля:

```text
id uuid primary key
user_id uuid not null references identity.tUser(id)
type varchar(32) not null
provider varchar(64) not null
provider_user_id varchar(255) null
password_hash text null
password_salt text null
created_at timestamptz not null
updated_at timestamptz not null
last_used_at timestamptz null
```

Примеры:

```text
type = password, provider = local
type = oauth, provider = google
type = oauth, provider = yandex
```

Для обычной регистрации через email/password:

```text
tUser хранит email и имя
tCredential хранит password_hash и password_salt
```

Так позже можно добавить Google/Yandex login, не ломая `tUser`.

### 4.4. `identity.tSession`

Таблица активных сессий пользователя.

Отвечает за:

- вход пользователя на конкретном устройстве;
- хранение серверной сессии;
- logout;
- истечение сессии;
- будущую страницу "активные устройства".

Предлагаемые поля:

```text
id uuid primary key
user_id uuid not null references identity.tUser(id)
token_hash text unique not null
user_agent text null
ip_address inet null
created_at timestamptz not null
last_seen_at timestamptz not null
expires_at timestamptz not null
revoked_at timestamptz null
```

Почему храним `token_hash`, а не сам token:

```text
frontend получает случайный token
API хранит только hash(token)
если база утечет, готовые session tokens не будут лежать открытым текстом
```

### 4.5. `identity.tEmailVerification`

Не обязательно для самого первого MVP, но почти точно понадобится.

Отвечает за:

- подтверждение email;
- повторную отправку кода;
- срок жизни verification token.

Предлагаемые поля:

```text
id uuid primary key
user_id uuid not null references identity.tUser(id)
email varchar(254) not null
token_hash text unique not null
expires_at timestamptz not null
used_at timestamptz null
created_at timestamptz not null
```

### 4.6. `identity.tPasswordReset`

Не обязательно для первого MVP, но нужно для нормального продукта.

Отвечает за:

- запрос восстановления пароля;
- одноразовый reset token;
- срок жизни reset token.

Предлагаемые поля:

```text
id uuid primary key
user_id uuid not null references identity.tUser(id)
token_hash text unique not null
expires_at timestamptz not null
used_at timestamptz null
created_at timestamptz not null
```

### 4.7. `identity.tAuditEvent`

Не обязательно для первого MVP, но полезно для администрирования и безопасности.

Отвечает за:

- историю важных действий;
- расследование проблем;
- журналирование входов, выходов, блокировок и смены пароля.

Предлагаемые поля:

```text
id bigint generated always as identity primary key
user_id uuid null references identity.tUser(id)
actor_user_id uuid null references identity.tUser(id)
event_type varchar(80) not null
metadata jsonb not null
ip_address inet null
user_agent text null
created_at timestamptz not null
```

Примеры `event_type`:

```text
auth.sign_up
auth.sign_in
auth.logout
auth.password_changed
admin.user_disabled
admin.user_role_changed
```

## 5. MVP авторизации

Для первой реализации достаточно:

```text
identity.tUser
identity.tCredential
identity.tSession
```

Поток регистрации:

```text
Пользователь вводит email, имя, пароль
API проверяет email
API создает identity.tUser
API создает identity.tCredential с hash пароля
API создает identity.tSession
Frontend получает session token
Пользователь попадает в Dashboard
```

Поток входа:

```text
Пользователь вводит email и пароль
API ищет identity.tUser по email
API ищет password credential в identity.tCredential
API проверяет пароль
API создает identity.tSession
Frontend получает session token
Пользователь попадает в Dashboard или исходный redirect
```

Поток проверки сессии:

```text
Frontend отправляет Authorization: Bearer <token>
API считает hash(token)
API ищет активную identity.tSession
API проверяет expires_at и revoked_at
API возвращает текущего пользователя
```

Поток выхода:

```text
Frontend отправляет logout request
API находит session по token
API ставит revoked_at
Frontend удаляет локальный token
```

## 6. Что пока не проектируем глубоко

Чтобы не усложнять старт, пока не расписываем:

- двухфакторную авторизацию;
- OAuth;
- refresh/access JWT;
- организационные аккаунты;
- платные подписки;
- OAuth scopes;
- сложную RBAC/ABAC-модель.

Их можно добавить позже, когда базовая модель станет понятной и рабочей.

## 7. Открытые вопросы

Перед написанием миграций нужно решить:

1. Оставляем ли колонки в `snake_case`?
2. Нужна ли отдельная таблица `identity.tPerson` уже сейчас, или хватит
   `display_name` в `identity.tUser`?
3. Роли храним строкой в `identity.tUser.role` или делаем таблицы
   `identity.tRole` и `identity.tUserRole`?
4. Email обязателен для всех аккаунтов или позже разрешим phone-only login?
5. Нужно ли подтверждение email в первом MVP?
