BEGIN;

INSERT INTO content."tContentStatus" ("code", "name", "isPublic") VALUES
    ('DRAFT', 'Черновик', FALSE), ('PENDING', 'На проверке', FALSE),
    ('ACTIVE', 'Активен', TRUE), ('RESTRICTED', 'Ограничен', FALSE),
    ('MERGED', 'Объединён с другим объектом', FALSE), ('RETIRED', 'Выведен', FALSE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isPublic" = EXCLUDED."isPublic";

INSERT INTO content."tContentType" ("code", "name", "isContainer", "isPlayable") VALUES
    ('MUSIC', 'Музыка', TRUE, FALSE), ('TRACK', 'Трек', FALSE, TRUE),
    ('ALBUM', 'Альбом', TRUE, FALSE), ('VIDEO', 'Видео', TRUE, FALSE),
    ('FILM', 'Фильм', FALSE, TRUE), ('SERIES', 'Сериал', TRUE, FALSE),
    ('SEASON', 'Сезон', TRUE, FALSE), ('EPISODE', 'Эпизод', FALSE, TRUE),
    ('SHORT', 'Короткометражное видео', FALSE, TRUE),
    ('ANIMATION', 'Анимация', FALSE, TRUE), ('MUSIC_VIDEO', 'Музыкальное видео', FALSE, TRUE),
    ('BOOK', 'Книга', FALSE, FALSE), ('COURSE', 'Курс', TRUE, FALSE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isContainer" = EXCLUDED."isContainer", "isPlayable" = EXCLUDED."isPlayable";

UPDATE content."tContentType" child
SET "parentContentTypeId" = parent."id"
FROM content."tContentType" parent
WHERE (child."code", parent."code") IN (
    ('TRACK', 'MUSIC'), ('ALBUM', 'MUSIC'),
    ('FILM', 'VIDEO'), ('SERIES', 'VIDEO'), ('SEASON', 'VIDEO'),
    ('EPISODE', 'VIDEO'), ('SHORT', 'VIDEO'), ('ANIMATION', 'VIDEO'), ('MUSIC_VIDEO', 'VIDEO')
);

INSERT INTO content."tTitleType" ("code", "name") VALUES
    ('CANONICAL', 'Каноническое'), ('ALIAS', 'Альтернативное'),
    ('TRANSLATION', 'Перевод'), ('TRANSLITERATION', 'Транслитерация'),
    ('FORMER', 'Прежнее')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO content."tContentRelationType" ("code", "name", "isDirectional") VALUES
    ('CONTAINS', 'Содержит', TRUE), ('SEQUEL_OF', 'Продолжение', TRUE),
    ('PREQUEL_OF', 'Предыстория', TRUE), ('VERSION_OF', 'Версия', TRUE),
    ('ADAPTATION_OF', 'Адаптация', TRUE), ('RELATED', 'Связан', FALSE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isDirectional" = EXCLUDED."isDirectional";

INSERT INTO content."tContributorKind" ("code", "name") VALUES
    ('PERSON', 'Человек'), ('GROUP', 'Группа'), ('ORGANIZATION', 'Организация')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO content."tContributorRelationType" ("code", "name") VALUES
    ('MEMBER_OF', 'Участник группы'), ('FORMER_MEMBER_OF', 'Бывший участник'),
    ('SUBSIDIARY_OF', 'Дочерняя организация'), ('SUCCESSOR_OF', 'Правопреемник')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO content."tContributorRole" ("code", "name") VALUES
    ('PRIMARY_ARTIST', 'Основной исполнитель'), ('FEATURED_ARTIST', 'Приглашённый исполнитель'),
    ('COMPOSER', 'Композитор'), ('LYRICIST', 'Автор текста'), ('PRODUCER', 'Продюсер'),
    ('ACTOR', 'Актёр'), ('DIRECTOR', 'Режиссёр'), ('SCREENWRITER', 'Сценарист'),
    ('VOICE_ACTOR', 'Актёр озвучки'), ('DUBBING_STUDIO', 'Студия озвучки'),
    ('PRODUCTION_STUDIO', 'Студия производства'), ('DISTRIBUTOR', 'Дистрибьютор'),
    ('RIGHTS_HOLDER', 'Правообладатель')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isActive" = TRUE;

INSERT INTO content."tPublicationStatus" ("code", "name", "isPublic") VALUES
    ('DRAFT', 'Черновик', FALSE), ('PENDING', 'На проверке', FALSE),
    ('PUBLISHED', 'Опубликована', TRUE), ('RESTRICTED', 'Ограничена', FALSE),
    ('TAKEN_DOWN', 'Удалена по требованию', FALSE), ('ARCHIVED', 'В архиве', FALSE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isPublic" = EXCLUDED."isPublic";

INSERT INTO content."tExternalSource" ("code", "name", "baseUrl") VALUES
    ('MUSICBRAINZ', 'MusicBrainz', 'https://musicbrainz.org'),
    ('IMDB', 'IMDb', 'https://www.imdb.com'), ('TMDB', 'TMDB', 'https://www.themoviedb.org'),
    ('ISRC', 'ISRC', NULL), ('WIKIDATA', 'Wikidata', 'https://www.wikidata.org')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "baseUrl" = EXCLUDED."baseUrl";

INSERT INTO content."tFingerprintType" ("code", "name", "isExactMatchAuthoritative") VALUES
    ('AUDIO_ACOUSTIC', 'Акустический отпечаток', TRUE),
    ('VIDEO_PERCEPTUAL', 'Перцептивный отпечаток видео', TRUE),
    ('IMAGE_PERCEPTUAL', 'Перцептивный отпечаток изображения', FALSE),
    ('TEXT_SIMHASH', 'Отпечаток текста', FALSE), ('FILE_SHA256', 'SHA-256 файла', TRUE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isExactMatchAuthoritative" = EXCLUDED."isExactMatchAuthoritative";

INSERT INTO content."tDuplicateCandidateStatus" ("code", "name") VALUES
    ('OPEN', 'Требует решения'), ('AUTO_CONFIRMED', 'Автоматически подтверждён'),
    ('COMMUNITY_REVIEW', 'Проверка сообществом'), ('DUPLICATE', 'Подтверждённый дубль'),
    ('NOT_DUPLICATE', 'Не является дублем'), ('MERGED', 'Объединён')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO content."tDuplicatePolicy" (
    "code", "name", "resourceTypeId", "autoConfirmThreshold",
    "communityReviewThreshold", "minimumEvidenceCount"
)
SELECT seed."code", seed."name", resourceType."id", seed."autoThreshold", seed."reviewThreshold", seed."minimumEvidenceCount"
FROM (VALUES
    ('CONTENT_DEFAULT', 'Дедупликация контента', 'content', 0.9500::NUMERIC, 0.6500::NUMERIC, 2::SMALLINT),
    ('CONTRIBUTOR_DEFAULT', 'Дедупликация участников', 'contributor', 0.9700::NUMERIC, 0.7000::NUMERIC, 2::SMALLINT)
) seed("code", "name", "resourceTypeCode", "autoThreshold", "reviewThreshold", "minimumEvidenceCount")
JOIN core."tResourceType" resourceType ON resourceType."code" = seed."resourceTypeCode"
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name", "resourceTypeId" = EXCLUDED."resourceTypeId",
    "autoConfirmThreshold" = EXCLUDED."autoConfirmThreshold",
    "communityReviewThreshold" = EXCLUDED."communityReviewThreshold",
    "minimumEvidenceCount" = EXCLUDED."minimumEvidenceCount", "isActive" = TRUE;

INSERT INTO content."tDuplicateSignalRule" (
    "duplicatePolicyId", "evidenceType", "weight", "isAuthoritative"
)
SELECT policy."id", seed."evidenceType", seed."weight", seed."isAuthoritative"
FROM (VALUES
    ('CONTENT_DEFAULT', 'EXTERNAL_ID', 1.0000::NUMERIC, TRUE),
    ('CONTENT_DEFAULT', 'AUDIO_FINGERPRINT', 1.0000::NUMERIC, TRUE),
    ('CONTENT_DEFAULT', 'VIDEO_FINGERPRINT', 1.0000::NUMERIC, TRUE),
    ('CONTENT_DEFAULT', 'TITLE_SIMILARITY', 0.3000::NUMERIC, FALSE),
    ('CONTENT_DEFAULT', 'CONTRIBUTOR_OVERLAP', 0.3500::NUMERIC, FALSE),
    ('CONTENT_DEFAULT', 'DURATION_SIMILARITY', 0.2000::NUMERIC, FALSE),
    ('CONTRIBUTOR_DEFAULT', 'EXTERNAL_ID', 1.0000::NUMERIC, TRUE),
    ('CONTRIBUTOR_DEFAULT', 'NAME_SIMILARITY', 0.3500::NUMERIC, FALSE),
    ('CONTRIBUTOR_DEFAULT', 'ALIAS_MATCH', 0.3500::NUMERIC, FALSE),
    ('CONTRIBUTOR_DEFAULT', 'CATALOG_OVERLAP', 0.5000::NUMERIC, FALSE),
    ('CONTRIBUTOR_DEFAULT', 'IMAGE_SIMILARITY', 0.2500::NUMERIC, FALSE),
    ('CONTRIBUTOR_DEFAULT', 'DESCRIPTION_SIMILARITY', 0.1000::NUMERIC, FALSE)
) seed("policyCode", "evidenceType", "weight", "isAuthoritative")
JOIN content."tDuplicatePolicy" policy ON policy."code" = seed."policyCode"
ON CONFLICT ("duplicatePolicyId", "evidenceType") DO UPDATE SET
    "weight" = EXCLUDED."weight", "isAuthoritative" = EXCLUDED."isAuthoritative", "isActive" = TRUE;

INSERT INTO media."tStorageProvider" ("code", "name", "providerType") VALUES
    ('primary-s3', 'Основное S3-хранилище', 'S3')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isActive" = TRUE;

INSERT INTO media."tStorageObjectStatus" ("code", "name") VALUES
    ('PENDING', 'Ожидается'), ('AVAILABLE', 'Доступен'), ('QUARANTINED', 'В карантине'),
    ('DELETING', 'Удаляется'), ('DELETED', 'Удалён'), ('CORRUPT', 'Повреждён')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO media."tAssetType" ("code", "name", "isTimed") VALUES
    ('AUDIO', 'Аудио', TRUE), ('VIDEO', 'Видео', TRUE), ('IMAGE', 'Изображение', FALSE),
    ('SUBTITLE', 'Субтитры', TRUE), ('LYRICS', 'Текст песни', TRUE),
    ('DOCUMENT', 'Документ', FALSE), ('CHAPTERS', 'Главы/таймкоды', TRUE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isTimed" = EXCLUDED."isTimed";

INSERT INTO media."tAssetStatus" ("code", "name", "isUsable") VALUES
    ('DRAFT', 'Черновик', FALSE), ('PROCESSING', 'Обрабатывается', FALSE),
    ('READY', 'Готов', TRUE), ('QUARANTINED', 'В карантине', FALSE),
    ('RESTRICTED', 'Ограничен', FALSE), ('RETIRED', 'Выведен', FALSE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isUsable" = EXCLUDED."isUsable";

INSERT INTO media."tContentAssetRole" ("code", "name") VALUES
    ('PRIMARY_AUDIO', 'Основное аудио'), ('PRIMARY_VIDEO', 'Основное видео'),
    ('POSTER', 'Постер'), ('COVER', 'Обложка'), ('THUMBNAIL', 'Миниатюра'),
    ('SUBTITLE', 'Субтитры'), ('AUDIO_TRACK', 'Аудиодорожка'), ('LYRICS', 'Текст песни')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO media."tUploadStatus" ("code", "name") VALUES
    ('CREATED', 'Создана'), ('UPLOADING', 'Загружается'), ('UPLOADED', 'Загружена'),
    ('VERIFIED', 'Проверена'), ('FAILED', 'Ошибка'), ('EXPIRED', 'Истекла'), ('CANCELLED', 'Отменена')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO media."tTranscodeJobStatus" ("code", "name") VALUES
    ('QUEUED', 'В очереди'), ('RUNNING', 'Выполняется'), ('SUCCEEDED', 'Завершено'),
    ('FAILED', 'Ошибка'), ('CANCELLED', 'Отменено')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO workflow."tRequestStatus" ("code", "name", "isFinal") VALUES
    ('DRAFT', 'Черновик', FALSE), ('SUBMITTED', 'Отправлена', FALSE),
    ('AUTO_CHECK', 'Автоматическая проверка', FALSE), ('COMMUNITY_REVIEW', 'Проверка сообществом', FALSE),
    ('NEEDS_CHANGES', 'Нужны изменения', FALSE), ('APPROVED', 'Одобрена', TRUE),
    ('REJECTED', 'Отклонена', TRUE), ('CANCELLED', 'Отменена', TRUE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isFinal" = EXCLUDED."isFinal";

INSERT INTO workflow."tRequestType" ("code", "name", "ownerServiceId")
SELECT seed."code", seed."name", service."id"
FROM (VALUES
    ('CREATE_CONTENT', 'Создание контента', 'content'), ('CREATE_CONTRIBUTOR', 'Создание участника', 'content'),
    ('CREATE_PUBLICATION', 'Создание публикации', 'content'), ('UPDATE_RESOURCE', 'Изменение ресурса', 'content'),
    ('MERGE_DUPLICATE', 'Объединение дублей', 'content'), ('UPLOAD_MEDIA', 'Загрузка медиа', 'media')
) seed("code", "name", "serviceCode")
JOIN core."tService" service ON service."code" = seed."serviceCode"
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "ownerServiceId" = EXCLUDED."ownerServiceId", "isActive" = TRUE;

INSERT INTO workflow."tReviewType" ("code", "name") VALUES
    ('AUTOMATIC', 'Автоматическая проверка'), ('AGENT', 'Проверка агентом'),
    ('KEEPER', 'Проверка хранителем'), ('MODERATOR', 'Проверка модератором'),
    ('COMMUNITY_VOTE', 'Голосование сообщества'), ('COMPLAINT', 'Разбор жалобы')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO moderation."tReportReason" ("code", "name") VALUES
    ('COPYRIGHT', 'Нарушение авторских прав'), ('DUPLICATE', 'Дубликат'),
    ('WRONG_METADATA', 'Ошибочные сведения'), ('ABUSE', 'Злоупотребление'),
    ('ILLEGAL_CONTENT', 'Незаконный контент'), ('OTHER', 'Другое')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isActive" = TRUE;

INSERT INTO moderation."tReportStatus" ("code", "name", "isFinal") VALUES
    ('OPEN', 'Открыта', FALSE), ('TRIAGE', 'Первичная проверка', FALSE),
    ('INVESTIGATING', 'Рассматривается', FALSE), ('RESOLVED', 'Решена', TRUE),
    ('REJECTED', 'Отклонена', TRUE), ('DUPLICATE', 'Объединена с другой жалобой', TRUE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isFinal" = EXCLUDED."isFinal";

INSERT INTO moderation."tRestrictionStatus" ("code", "name", "isEffective") VALUES
    ('PENDING', 'Ожидает начала', FALSE), ('ACTIVE', 'Активно', TRUE),
    ('SUSPENDED', 'Приостановлено', FALSE), ('EXPIRED', 'Истекло', FALSE), ('REVOKED', 'Отозвано', FALSE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isEffective" = EXCLUDED."isEffective";

INSERT INTO moderation."tAppealStatus" ("code", "name", "isFinal") VALUES
    ('SUBMITTED', 'Подана', FALSE), ('REVIEWING', 'Рассматривается', FALSE),
    ('UPHELD', 'Ограничение оставлено', TRUE), ('OVERTURNED', 'Ограничение отменено', TRUE),
    ('CANCELLED', 'Отменена', TRUE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isFinal" = EXCLUDED."isFinal";

INSERT INTO legal."tLegalStatus" ("code", "name", "allowsPublication") VALUES
    ('UNRESOLVED', 'Правовой статус не определён', FALSE),
    ('DECLARED', 'Права заявлены загрузившим', TRUE), ('LICENSED', 'Лицензирован', TRUE),
    ('PUBLIC_DOMAIN', 'Общественное достояние', TRUE), ('RESTRICTED', 'Ограничен', FALSE),
    ('DISPUTED', 'Оспаривается', FALSE), ('TAKEN_DOWN', 'Удалён по требованию', FALSE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "allowsPublication" = EXCLUDED."allowsPublication";

INSERT INTO legal."tLicenseType" ("code", "name") VALUES
    ('DIRECT', 'Прямая лицензия'), ('OPEN', 'Открытая лицензия'),
    ('PUBLIC_DOMAIN', 'Общественное достояние'), ('PLATFORM_AGREEMENT', 'Соглашение с платформой')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO legal."tPolicyDocument" ("code", "name", "isRequiredForRegistration") VALUES
    ('TERMS_OF_SERVICE', 'Условия использования', TRUE),
    ('PRIVACY_POLICY', 'Политика конфиденциальности', TRUE),
    ('UPLOAD_POLICY', 'Правила загрузки контента', FALSE),
    ('COMMUNITY_GOVERNANCE', 'Правила общественного управления', FALSE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isRequiredForRegistration" = EXCLUDED."isRequiredForRegistration";

INSERT INTO library."tCollectionType" ("code", "name") VALUES
    ('PLAYLIST', 'Плейлист'), ('WATCHLIST', 'Список просмотра'),
    ('READING_LIST', 'Список чтения'), ('MIXED', 'Смешанная коллекция')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO library."tOfflineGrantStatus" ("code", "name", "isUsable") VALUES
    ('ACTIVE', 'Активен', TRUE), ('EXPIRED', 'Истёк', FALSE),
    ('REVOKED', 'Отозван', FALSE), ('DEVICE_REMOVED', 'Устройство удалено', FALSE)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isUsable" = EXCLUDED."isUsable";

INSERT INTO music."tAlbumType" ("code", "name") VALUES
    ('ALBUM', 'Альбом'), ('EP', 'Мини-альбом'), ('SINGLE', 'Сингл'),
    ('COMPILATION', 'Сборник'), ('SOUNDTRACK', 'Саундтрек'), ('LIVE', 'Концертный альбом')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO video."tEditionType" ("code", "name") VALUES
    ('THEATRICAL', 'Театральная'), ('DIRECTORS_CUT', 'Режиссёрская'),
    ('EXTENDED', 'Расширенная'), ('RESTORED', 'Реставрация'),
    ('CENSORED', 'Цензурированная'), ('ALTERNATE', 'Альтернативная')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO audit."tAuditCategory" ("code", "name", "defaultRetention") VALUES
    ('AUTH', 'Авторизация и безопасность', INTERVAL '5 years'),
    ('ACCOUNT', 'Жизненный цикл аккаунта', INTERVAL '5 years'),
    ('GOVERNANCE', 'Роли, голосования и управление', INTERVAL '5 years'),
    ('MODERATION', 'Жалобы и санкции', INTERVAL '5 years'),
    ('LEGAL', 'Лицензии и правовые действия', NULL),
    ('CONTENT', 'Изменения контента', INTERVAL '5 years')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "defaultRetention" = EXCLUDED."defaultRetention";

COMMIT;
