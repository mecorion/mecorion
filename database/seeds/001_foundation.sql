BEGIN;

INSERT INTO core."tService" ("code", "name") VALUES
    ('core', 'Mecorion Core'),
    ('account', 'Mecorion Account'),
    ('auth', 'Mecorion Auth'),
    ('access', 'Mecorion Access'),
    ('content', 'Mecorion Content'),
    ('media', 'Mecorion Media'),
    ('workflow', 'Mecorion Workflow'),
    ('moderation', 'Mecorion Moderation'),
    ('legal', 'Mecorion Legal'),
    ('music', 'Mecorion Music'),
    ('video', 'Mecorion Video'),
    ('library', 'Mecorion Library')
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "isActive" = TRUE;

INSERT INTO core."tResourceType" ("code", "name", "ownerServiceId")
SELECT seed."code", seed."name", service."id"
FROM (VALUES
    ('profile', 'Профиль', 'account'),
    ('content', 'Контент', 'content'),
    ('publication', 'Публикация', 'content'),
    ('contributor', 'Участник контента', 'content'),
    ('collection', 'Коллекция', 'library')
) AS seed("code", "name", "serviceCode")
JOIN core."tService" service ON service."code" = seed."serviceCode"
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "ownerServiceId" = EXCLUDED."ownerServiceId",
    "isActive" = TRUE;

INSERT INTO core."tLanguage" ("code", "name", "nativeName") VALUES
    ('en', 'English', 'English'),
    ('ru', 'Russian', 'Русский')
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "nativeName" = EXCLUDED."nativeName",
    "isActive" = TRUE;

INSERT INTO core."tTerritory" ("code", "name") VALUES
    ('WORLD', 'Весь мир'),
    ('US', 'США'),
    ('EU', 'Европейский союз'),
    ('RU', 'Россия')
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "isActive" = TRUE;

INSERT INTO account."tAccountStatus" ("code", "name", "isLoginAllowed") VALUES
    ('PENDING', 'Ожидает подтверждения', FALSE),
    ('ACTIVE', 'Активен', TRUE),
    ('FROZEN', 'Заморожен', FALSE),
    ('DELETION_PENDING', 'Ожидает удаления', FALSE),
    ('ANONYMIZED', 'Анонимизирован', FALSE),
    ('CLOSED', 'Закрыт', FALSE)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "isLoginAllowed" = EXCLUDED."isLoginAllowed";

INSERT INTO account."tPersonAnchorStatus" ("code", "name") VALUES
    ('UNVERIFIED', 'Не подтверждён'),
    ('VERIFIED', 'Подтверждён'),
    ('RESTRICTED', 'Ограничен'),
    ('RETIRED', 'Выведен из использования')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO account."tGovernanceEligibilityStatus" ("code", "name") VALUES
    ('PENDING', 'Ожидает проверки'),
    ('ELIGIBLE', 'Допущен к управлению'),
    ('SUSPENDED', 'Допуск приостановлен'),
    ('REVOKED', 'Допуск отозван')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO account."tIdentityEvidenceType" ("code", "name", "defaultRetention") VALUES
    ('HUMAN_VERIFICATION', 'Доказательство уникальности человека', INTERVAL '5 years'),
    ('GOVERNANCE_HISTORY', 'История управляющего допуска', INTERVAL '5 years'),
    ('ABUSE_PREVENTION', 'Доказательство для предотвращения злоупотреблений', INTERVAL '5 years')
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "defaultRetention" = EXCLUDED."defaultRetention",
    "isActive" = TRUE;

INSERT INTO account."tDeletionRequestStatus" ("code", "name") VALUES
    ('REQUESTED', 'Запрошено'),
    ('SCHEDULED', 'Запланировано'),
    ('PROCESSING', 'Выполняется'),
    ('COMPLETED', 'Завершено'),
    ('CANCELLED', 'Отменено'),
    ('REJECTED', 'Отклонено по обязательному основанию хранения')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO auth."tIdentityType" ("code", "name") VALUES
    ('EMAIL', 'Email'),
    ('MECORION_ID', 'Mecorion ID')
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "isActive" = TRUE;

INSERT INTO auth."tCredentialType" ("code", "name") VALUES
    ('PASSWORD', 'Пароль'),
    ('RECOVERY_SEED', 'Seed-фраза восстановления'),
    ('WEBAUTHN', 'WebAuthn credential')
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "isActive" = TRUE;

INSERT INTO auth."tSessionStatus" ("code", "name", "isUsable") VALUES
    ('ACTIVE', 'Активна', TRUE),
    ('EXPIRED', 'Истекла', FALSE),
    ('REVOKED', 'Отозвана', FALSE),
    ('COMPROMISED', 'Скомпрометирована', FALSE)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "isUsable" = EXCLUDED."isUsable";

INSERT INTO auth."tRefreshTokenStatus" ("code", "name", "isUsable") VALUES
    ('ACTIVE', 'Активен', TRUE),
    ('USED', 'Использован', FALSE),
    ('EXPIRED', 'Истёк', FALSE),
    ('REVOKED', 'Отозван', FALSE),
    ('REUSE_DETECTED', 'Обнаружено повторное использование', FALSE)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "isUsable" = EXCLUDED."isUsable";

INSERT INTO auth."tChallengeType" ("code", "name") VALUES
    ('EMAIL_VERIFY', 'Подтверждение email'),
    ('PASSWORD_RESET', 'Сброс пароля'),
    ('RECOVERY_SEED', 'Восстановление seed-фразой'),
    ('STEP_UP', 'Дополнительная проверка'),
    ('DEVICE_CONFIRM', 'Подтверждение устройства')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO access."tRoleType" ("code", "name") VALUES
    ('BASE', 'Базовая'),
    ('COMMUNITY', 'Общественное управление'),
    ('SYSTEM', 'Системная'),
    ('ENTITLEMENT', 'Привилегия подписки')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO access."tScopeType" (
    "code", "name", "requiresService", "requiresResource"
) VALUES
    ('GLOBAL', 'Вся платформа', FALSE, FALSE),
    ('SERVICE', 'Отдельный сервис', TRUE, FALSE),
    ('RESOURCE', 'Отдельный ресурс', FALSE, TRUE)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "requiresService" = EXCLUDED."requiresService",
    "requiresResource" = EXCLUDED."requiresResource";

INSERT INTO access."tRoleAssignmentStatus" ("code", "name", "isEffective") VALUES
    ('PENDING', 'Ожидает активации', FALSE),
    ('ACTIVE', 'Активно', TRUE),
    ('SUSPENDED', 'Приостановлено', FALSE),
    ('REVOKED', 'Отозвано', FALSE),
    ('EXPIRED', 'Истекло', FALSE)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "isEffective" = EXCLUDED."isEffective";

INSERT INTO access."tScope" ("scopeTypeId", "code", "name")
SELECT "id", 'global', 'Вся платформа'
FROM access."tScopeType"
WHERE "code" = 'GLOBAL'
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "isActive" = TRUE;

INSERT INTO access."tPermission" ("serviceId", "code", "name", "description")
SELECT service."id", seed."code", seed."name", seed."description"
FROM (VALUES
    ('account', 'account.profile.manage', 'Управление профилем', 'Изменение собственного профиля.'),
    ('auth', 'auth.session.read', 'Просмотр сессий', 'Просмотр собственных активных сессий.'),
    ('auth', 'auth.session.revoke', 'Завершение сессий', 'Завершение собственных сессий.'),
    ('content', 'content.read', 'Чтение контента', 'Просмотр опубликованного контента.'),
    ('content', 'content.submit', 'Предложение контента', 'Создание заявки на новый контент.'),
    ('content', 'content.upload', 'Загрузка контента', 'Загрузка ресурсов контента.'),
    ('content', 'content.review', 'Проверка контента', 'Участие в общественной проверке.'),
    ('content', 'content.merge', 'Объединение дублей', 'Подтверждение и объединение дублей.'),
    ('music', 'music.play', 'Прослушивание музыки', 'Воспроизведение доступной музыки.'),
    ('music', 'music.playlist.manage', 'Управление плейлистами', 'Создание и изменение собственных плейлистов.'),
    ('video', 'video.watch', 'Просмотр видео', 'Просмотр доступных видео.'),
    ('library', 'library.favorite.manage', 'Управление избранным', 'Добавление и удаление избранного.'),
    ('library', 'library.offline.use', 'Офлайн-доступ', 'Получение разрешённых офлайн-манифестов.'),
    ('library', 'library.offline.extended', 'Расширенный офлайн-доступ', 'Повышенные лимиты устройств или срока офлайн-доступа.'),
    ('moderation', 'moderation.report.create', 'Создание жалобы', 'Отправка жалобы на ресурс.'),
    ('moderation', 'moderation.report.review', 'Разбор жалоб', 'Участие в разборе пользовательских жалоб.'),
    ('moderation', 'moderation.restriction.manage', 'Управление ограничениями', 'Назначение и отзыв ограничений в разрешённом scope.'),
    ('workflow', 'workflow.request.review', 'Проверка заявок', 'Участие в маршруте проверки заявок.'),
    ('legal', 'legal.complaint.resolve', 'Правовое решение по жалобе', 'Фиксация правового результата обработки жалобы.'),
    ('access', 'governance.vote', 'Голосование', 'Участие в голосованиях платформы.'),
    ('access', 'agent.manage', 'Управление агентами', 'Назначение и контроль агентов.'),
    ('access', 'role.assign', 'Назначение ролей', 'Назначение ролей в разрешённом scope.'),
    ('core', 'platform.develop', 'Разработка платформы', 'Доступ к функциям разработчика.'),
    ('core', 'platform.admin', 'Администрирование платформы', 'Административные операции платформы.'),
    ('core', 'platform.owner', 'Владение платформой', 'Высший системный уровень доступа.')
) AS seed("serviceCode", "code", "name", "description")
JOIN core."tService" service ON service."code" = seed."serviceCode"
ON CONFLICT ("code") DO UPDATE SET
    "serviceId" = EXCLUDED."serviceId",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "isActive" = TRUE;

INSERT INTO access."tRole" (
    "roleTypeId", "code", "name", "description", "requiresGovernanceIdentity"
)
SELECT roleType."id", seed."code", seed."name", seed."description", seed."requiresGovernanceIdentity"
FROM (VALUES
    ('BASE', 'BASE', 'Base', 'Базовый пользователь Mecorion.', FALSE),
    ('COMMUNITY', 'AGENT', 'Agent', 'Загрузка и предложение контента.', TRUE),
    ('COMMUNITY', 'KEEPER', 'Keeper', 'Управление агентами и общественными процессами.', TRUE),
    ('COMMUNITY', 'MODERATOR', 'Moderator', 'Разбор жалоб и спорных случаев.', TRUE),
    ('ENTITLEMENT', 'SPONSOR', 'Sponsor', 'Привилегии спонсора.', FALSE),
    ('SYSTEM', 'DEVELOPER', 'Developer', 'Функции разработки платформы.', TRUE),
    ('SYSTEM', 'ADMIN', 'Admin', 'Администрирование платформы.', TRUE),
    ('SYSTEM', 'OWNER', 'Owner', 'Высший системный уровень.', TRUE)
) AS seed("roleTypeCode", "code", "name", "description", "requiresGovernanceIdentity")
JOIN access."tRoleType" roleType ON roleType."code" = seed."roleTypeCode"
ON CONFLICT ("code") DO UPDATE SET
    "roleTypeId" = EXCLUDED."roleTypeId",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "requiresGovernanceIdentity" = EXCLUDED."requiresGovernanceIdentity",
    "isActive" = TRUE;

INSERT INTO access."tRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM (VALUES
    ('BASE', 'account.profile.manage'),
    ('BASE', 'auth.session.read'),
    ('BASE', 'auth.session.revoke'),
    ('BASE', 'content.read'),
    ('BASE', 'music.play'),
    ('BASE', 'music.playlist.manage'),
    ('BASE', 'video.watch'),
    ('BASE', 'library.favorite.manage'),
    ('BASE', 'library.offline.use'),
    ('BASE', 'moderation.report.create'),
    ('AGENT', 'content.submit'),
    ('AGENT', 'content.upload'),
    ('KEEPER', 'content.review'),
    ('KEEPER', 'content.merge'),
    ('KEEPER', 'governance.vote'),
    ('KEEPER', 'agent.manage'),
    ('KEEPER', 'workflow.request.review'),
    ('MODERATOR', 'content.review'),
    ('MODERATOR', 'content.merge'),
    ('MODERATOR', 'governance.vote'),
    ('MODERATOR', 'workflow.request.review'),
    ('MODERATOR', 'moderation.report.review'),
    ('MODERATOR', 'moderation.restriction.manage'),
    ('MODERATOR', 'legal.complaint.resolve'),
    ('SPONSOR', 'library.offline.extended'),
    ('DEVELOPER', 'platform.develop'),
    ('ADMIN', 'platform.admin'),
    ('ADMIN', 'role.assign'),
    ('OWNER', 'platform.owner'),
    ('OWNER', 'platform.admin'),
    ('OWNER', 'role.assign'),
    ('OWNER', 'agent.manage')
) AS seed("roleCode", "permissionCode")
JOIN access."tRole" role ON role."code" = seed."roleCode"
JOIN access."tPermission" permission ON permission."code" = seed."permissionCode"
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

COMMIT;
