\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    vAccountStatusId BIGINT;
    vAccountId BIGINT;
    vContentResourceTypeId BIGINT;
    vContributorResourceTypeId BIGINT;
    vPublicationResourceTypeId BIGINT;
    vCollectionResourceTypeId BIGINT;
    vActiveContentStatusId BIGINT;
    vTrackTypeId BIGINT;
    vAlbumTypeId BIGINT;
    vSeriesTypeId BIGINT;
    vSeasonTypeId BIGINT;
    vEpisodeTypeId BIGINT;
    vTrackResourceId BIGINT;
    vTrackContentId BIGINT;
    vAlbumResourceId BIGINT;
    vAlbumContentId BIGINT;
    vContributorResourceId BIGINT;
    vContributorId BIGINT;
    vPublicationResourceId BIGINT;
    vPublicationId BIGINT;
    vBlockedPublicationResourceId BIGINT;
    vBlockedPublicationId BIGINT;
    vDraftPublicationStatusId BIGINT;
    vPublishedPublicationStatusId BIGINT;
    vContributorKindId BIGINT;
    vArtistRoleId BIGINT;
    vAlbumKindId BIGINT;
    vLegalStatusId BIGINT;
    vWorldTerritoryId BIGINT;
    vSeriesResourceId BIGINT;
    vSeriesContentId BIGINT;
    vSeasonResourceId BIGINT;
    vSeasonContentId BIGINT;
    vEpisodeResourceId BIGINT;
    vEpisodeContentId BIGINT;
BEGIN
    SELECT "id" INTO STRICT vAccountStatusId FROM account."tAccountStatus" WHERE "code" = 'ACTIVE';
    INSERT INTO account."tAccount" ("accountStatusId") VALUES (vAccountStatusId) RETURNING "id" INTO vAccountId;

    SELECT "id" INTO STRICT vContentResourceTypeId FROM core."tResourceType" WHERE "code" = 'content';
    SELECT "id" INTO STRICT vContributorResourceTypeId FROM core."tResourceType" WHERE "code" = 'contributor';
    SELECT "id" INTO STRICT vPublicationResourceTypeId FROM core."tResourceType" WHERE "code" = 'publication';
    SELECT "id" INTO STRICT vCollectionResourceTypeId FROM core."tResourceType" WHERE "code" = 'collection';
    SELECT "id" INTO STRICT vActiveContentStatusId FROM content."tContentStatus" WHERE "code" = 'ACTIVE';
    SELECT "id" INTO STRICT vTrackTypeId FROM content."tContentType" WHERE "code" = 'TRACK';
    SELECT "id" INTO STRICT vAlbumTypeId FROM content."tContentType" WHERE "code" = 'ALBUM';
    SELECT "id" INTO STRICT vSeriesTypeId FROM content."tContentType" WHERE "code" = 'SERIES';
    SELECT "id" INTO STRICT vSeasonTypeId FROM content."tContentType" WHERE "code" = 'SEASON';
    SELECT "id" INTO STRICT vEpisodeTypeId FROM content."tContentType" WHERE "code" = 'EPISODE';
    SELECT "id" INTO STRICT vDraftPublicationStatusId FROM content."tPublicationStatus" WHERE "code" = 'DRAFT';
    SELECT "id" INTO STRICT vPublishedPublicationStatusId FROM content."tPublicationStatus" WHERE "code" = 'PUBLISHED';
    SELECT "id" INTO STRICT vContributorKindId FROM content."tContributorKind" WHERE "code" = 'PERSON';
    SELECT "id" INTO STRICT vArtistRoleId FROM content."tContributorRole" WHERE "code" = 'PRIMARY_ARTIST';
    SELECT "id" INTO STRICT vAlbumKindId FROM music."tAlbumType" WHERE "code" = 'ALBUM';
    SELECT "id" INTO STRICT vLegalStatusId FROM legal."tLegalStatus" WHERE "code" = 'DECLARED';
    SELECT "id" INTO STRICT vWorldTerritoryId FROM core."tTerritory" WHERE "code" = 'WORLD';

    INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContentResourceTypeId) RETURNING "id" INTO vTrackResourceId;
    INSERT INTO content."tContent" ("resourceId", "contentTypeId", "contentStatusId", "originalTitle", "durationMs", "createByAccountId")
    VALUES (vTrackResourceId, vTrackTypeId, vActiveContentStatusId, 'Smoke Track', 180000, vAccountId)
    RETURNING "id" INTO vTrackContentId;
    INSERT INTO music."tTrack" ("contentId", "bpm") VALUES (vTrackContentId, 120);

    INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContentResourceTypeId) RETURNING "id" INTO vAlbumResourceId;
    INSERT INTO content."tContent" ("resourceId", "contentTypeId", "contentStatusId", "originalTitle", "createByAccountId")
    VALUES (vAlbumResourceId, vAlbumTypeId, vActiveContentStatusId, 'Smoke Album', vAccountId)
    RETURNING "id" INTO vAlbumContentId;
    INSERT INTO music."tAlbum" ("contentId", "albumTypeId") VALUES (vAlbumContentId, vAlbumKindId);
    INSERT INTO music."tAlbumTrack" ("albumContentId", "trackContentId", "trackNumber") VALUES (vAlbumContentId, vTrackContentId, 1);

    INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContributorResourceTypeId) RETURNING "id" INTO vContributorResourceId;
    INSERT INTO content."tContributor" ("resourceId", "contributorKindId", "primaryName", "normalizedName", "createByAccountId")
    VALUES (vContributorResourceId, vContributorKindId, 'Snoop Dog', 'snoop dog', vAccountId)
    RETURNING "id" INTO vContributorId;
    INSERT INTO content."tContributorName" ("contributorId", "nameType", "name", "normalizedName")
    VALUES (vContributorId, 'ALIAS', 'Snoop dog', 'snoop dog');
    INSERT INTO content."tContentContributor" ("contentId", "contributorId", "contributorRoleId")
    VALUES (vTrackContentId, vContributorId, vArtistRoleId);

    INSERT INTO legal."tResourceLegalStatus" ("resourceId", "legalStatusId", "territoryId", "sourceType", "declaredByAccountId")
    VALUES (vTrackResourceId, vLegalStatusId, vWorldTerritoryId, 'UPLOADER_DECLARATION', vAccountId);

    INSERT INTO core."tResource" ("resourceTypeId") VALUES (vPublicationResourceTypeId) RETURNING "id" INTO vPublicationResourceId;
    INSERT INTO content."tPublication" ("resourceId", "publicationStatusId", "slug", "title", "createByAccountId")
    VALUES (vPublicationResourceId, vDraftPublicationStatusId, 'smoke-track-publication', 'Smoke Track', vAccountId)
    RETURNING "id" INTO vPublicationId;
    INSERT INTO content."tPublicationContent" ("publicationId", "contentId", "ordinal", "isPrimary")
    VALUES (vPublicationId, vTrackContentId, 1, TRUE);
    UPDATE content."tPublication"
    SET "publicationStatusId" = vPublishedPublicationStatusId, "publishDtm" = CURRENT_TIMESTAMP
    WHERE "id" = vPublicationId;

    INSERT INTO core."tResource" ("resourceTypeId")
    VALUES (vPublicationResourceTypeId)
    RETURNING "id" INTO vBlockedPublicationResourceId;
    INSERT INTO content."tPublication" (
        "resourceId", "publicationStatusId", "slug", "title", "createByAccountId"
    ) VALUES (
        vBlockedPublicationResourceId, vDraftPublicationStatusId,
        'smoke-blocked-publication', 'Must remain unpublished', vAccountId
    ) RETURNING "id" INTO vBlockedPublicationId;
    INSERT INTO content."tPublicationContent" (
        "publicationId", "contentId", "ordinal", "isPrimary"
    ) VALUES (vBlockedPublicationId, vAlbumContentId, 1, TRUE);

    BEGIN
        UPDATE content."tPublication"
        SET "publicationStatusId" = vPublishedPublicationStatusId,
            "publishDtm" = CURRENT_TIMESTAMP
        WHERE "id" = vBlockedPublicationId;
        RAISE EXCEPTION 'Publication without legal status was unexpectedly allowed';
    EXCEPTION
        WHEN raise_exception THEN
            IF SQLERRM = 'Publication without legal status was unexpectedly allowed' THEN
                RAISE;
            END IF;
    END;

    INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContentResourceTypeId) RETURNING "id" INTO vSeriesResourceId;
    INSERT INTO content."tContent" ("resourceId", "contentTypeId", "contentStatusId", "originalTitle")
    VALUES (vSeriesResourceId, vSeriesTypeId, vActiveContentStatusId, 'Smoke Series') RETURNING "id" INTO vSeriesContentId;
    INSERT INTO video."tVideo" ("contentId", "videoKind") VALUES (vSeriesContentId, 'SERIES');

    INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContentResourceTypeId) RETURNING "id" INTO vSeasonResourceId;
    INSERT INTO content."tContent" ("resourceId", "contentTypeId", "contentStatusId", "originalTitle")
    VALUES (vSeasonResourceId, vSeasonTypeId, vActiveContentStatusId, 'Smoke Season 1') RETURNING "id" INTO vSeasonContentId;
    INSERT INTO video."tVideo" ("contentId", "videoKind") VALUES (vSeasonContentId, 'SEASON');
    INSERT INTO video."tSeason" ("contentId", "seriesContentId", "seasonNumber") VALUES (vSeasonContentId, vSeriesContentId, 1);

    INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContentResourceTypeId) RETURNING "id" INTO vEpisodeResourceId;
    INSERT INTO content."tContent" ("resourceId", "contentTypeId", "contentStatusId", "originalTitle", "durationMs")
    VALUES (vEpisodeResourceId, vEpisodeTypeId, vActiveContentStatusId, 'Smoke Episode 1', 2400000) RETURNING "id" INTO vEpisodeContentId;
    INSERT INTO video."tVideo" ("contentId", "videoKind", "runtimeMs") VALUES (vEpisodeContentId, 'EPISODE', 2400000);
    INSERT INTO video."tEpisode" ("contentId", "seriesContentId", "seasonContentId", "seasonNumber", "episodeNumber")
    VALUES (vEpisodeContentId, vSeriesContentId, vSeasonContentId, 1, 1);

    IF NOT EXISTS (SELECT 1 FROM content."tPublication" WHERE "id" = vPublicationId AND "publishDtm" IS NOT NULL) THEN
        RAISE EXCEPTION 'Publication was not published';
    END IF;
END;
$$;

ROLLBACK;
SELECT 'Mecorion content/music/video smoke test passed' AS "result";
