BEGIN;

CREATE TABLE video."tVideo" (
    "contentId" BIGINT NOT NULL,
    "videoKind" VARCHAR(16) NOT NULL,
    "runtimeMs" BIGINT NULL,
    "ageRatingCode" VARCHAR(32) NULL,
    "isInteractive" BOOLEAN NOT NULL DEFAULT FALSE,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkVideo" PRIMARY KEY ("contentId"),
    CONSTRAINT "fkVideoContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "ckVideoKind" CHECK ("videoKind" IN ('FILM', 'SERIES', 'SEASON', 'EPISODE', 'SHORT', 'ANIMATION', 'MUSIC_VIDEO')),
    CONSTRAINT "ckVideoRuntime" CHECK ("runtimeMs" IS NULL OR "runtimeMs" > 0)
);

CREATE OR REPLACE FUNCTION video."fncValidateVideoType"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vContentTypeCode VARCHAR(32);
BEGIN
    SELECT contentType."code"
      INTO STRICT vContentTypeCode
      FROM content."tContent" contentItem
      JOIN content."tContentType" contentType ON contentType."id" = contentItem."contentTypeId"
     WHERE contentItem."id" = NEW."contentId";

    IF vContentTypeCode <> NEW."videoKind" THEN
        RAISE EXCEPTION 'videoKind % does not match content type %', NEW."videoKind", vContentTypeCode;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgVideoValidateType"
BEFORE INSERT OR UPDATE OF "contentId", "videoKind" ON video."tVideo"
FOR EACH ROW EXECUTE FUNCTION video."fncValidateVideoType"();

CREATE TABLE video."tSeason" (
    "contentId" BIGINT NOT NULL,
    "seriesContentId" BIGINT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "titleOverride" VARCHAR(512) NULL,
    "releaseDt" DATE NULL,
    CONSTRAINT "pkSeason" PRIMARY KEY ("contentId"),
    CONSTRAINT "uqSeasonNumber" UNIQUE ("seriesContentId", "seasonNumber"),
    CONSTRAINT "fkSeasonContent" FOREIGN KEY ("contentId") REFERENCES video."tVideo" ("contentId"),
    CONSTRAINT "fkSeasonSeries" FOREIGN KEY ("seriesContentId") REFERENCES video."tVideo" ("contentId"),
    CONSTRAINT "ckSeasonDifferent" CHECK ("contentId" <> "seriesContentId"),
    CONSTRAINT "ckSeasonNumber" CHECK ("seasonNumber" > 0)
);

CREATE OR REPLACE FUNCTION video."fncValidateSeasonHierarchy"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vSelfKind VARCHAR(16);
    vSeriesKind VARCHAR(16);
BEGIN
    SELECT "videoKind" INTO STRICT vSelfKind
    FROM video."tVideo" WHERE "contentId" = NEW."contentId";

    SELECT "videoKind" INTO STRICT vSeriesKind
    FROM video."tVideo" WHERE "contentId" = NEW."seriesContentId";

    IF vSeriesKind <> 'SERIES' THEN
        RAISE EXCEPTION 'seriesContentId must reference a SERIES';
    END IF;

    IF vSelfKind <> 'SEASON' THEN
        RAISE EXCEPTION 'Season content must have videoKind SEASON';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgSeasonValidateHierarchy"
BEFORE INSERT OR UPDATE OF "contentId", "seriesContentId" ON video."tSeason"
FOR EACH ROW EXECUTE FUNCTION video."fncValidateSeasonHierarchy"();

CREATE TABLE video."tEpisode" (
    "contentId" BIGINT NOT NULL,
    "seriesContentId" BIGINT NOT NULL,
    "seasonContentId" BIGINT NULL,
    "seasonNumber" INTEGER NULL,
    "episodeNumber" INTEGER NOT NULL,
    "absoluteEpisodeNumber" INTEGER NULL,
    "airDt" DATE NULL,
    CONSTRAINT "pkEpisode" PRIMARY KEY ("contentId"),
    CONSTRAINT "uqEpisodeSeasonNumber" UNIQUE NULLS NOT DISTINCT ("seriesContentId", "seasonContentId", "episodeNumber"),
    CONSTRAINT "fkEpisodeContent" FOREIGN KEY ("contentId") REFERENCES video."tVideo" ("contentId"),
    CONSTRAINT "fkEpisodeSeries" FOREIGN KEY ("seriesContentId") REFERENCES video."tVideo" ("contentId"),
    CONSTRAINT "fkEpisodeSeason" FOREIGN KEY ("seasonContentId") REFERENCES video."tSeason" ("contentId"),
    CONSTRAINT "ckEpisodeDifferentSeries" CHECK ("contentId" <> "seriesContentId"),
    CONSTRAINT "ckEpisodeDifferentSeason" CHECK ("seasonContentId" IS NULL OR "contentId" <> "seasonContentId"),
    CONSTRAINT "ckEpisodeSeasonNumber" CHECK ("seasonNumber" IS NULL OR "seasonNumber" > 0),
    CONSTRAINT "ckEpisodeNumber" CHECK ("episodeNumber" > 0),
    CONSTRAINT "ckEpisodeAbsoluteNumber" CHECK ("absoluteEpisodeNumber" IS NULL OR "absoluteEpisodeNumber" > 0)
);

CREATE INDEX "ixEpisodeSeriesOrder" ON video."tEpisode" ("seriesContentId", "seasonNumber", "episodeNumber");

CREATE OR REPLACE FUNCTION video."fncValidateEpisodeHierarchy"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vSelfKind VARCHAR(16);
    vSeriesKind VARCHAR(16);
    vSeasonSeriesContentId BIGINT;
    vStoredSeasonNumber INTEGER;
BEGIN
    SELECT "videoKind" INTO STRICT vSelfKind
    FROM video."tVideo" WHERE "contentId" = NEW."contentId";
    SELECT "videoKind" INTO STRICT vSeriesKind
    FROM video."tVideo" WHERE "contentId" = NEW."seriesContentId";

    IF vSelfKind <> 'EPISODE' OR vSeriesKind <> 'SERIES' THEN
        RAISE EXCEPTION 'Episode must reference EPISODE content and SERIES parent';
    END IF;

    IF NEW."seasonContentId" IS NOT NULL THEN
        SELECT "seriesContentId", "seasonNumber"
          INTO STRICT vSeasonSeriesContentId, vStoredSeasonNumber
          FROM video."tSeason"
         WHERE "contentId" = NEW."seasonContentId";
        IF vSeasonSeriesContentId <> NEW."seriesContentId" THEN
            RAISE EXCEPTION 'Episode season belongs to another series';
        END IF;
        IF NEW."seasonNumber" IS NOT NULL AND NEW."seasonNumber" <> vStoredSeasonNumber THEN
            RAISE EXCEPTION 'Episode seasonNumber does not match seasonContentId';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgEpisodeValidateHierarchy"
BEFORE INSERT OR UPDATE OF "contentId", "seriesContentId", "seasonContentId", "seasonNumber" ON video."tEpisode"
FOR EACH ROW EXECUTE FUNCTION video."fncValidateEpisodeHierarchy"();

CREATE TABLE video."tEditionType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkEditionType" PRIMARY KEY ("id"),
    CONSTRAINT "uqEditionTypeCode" UNIQUE ("code")
);

CREATE TABLE video."tEdition" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contentId" BIGINT NOT NULL,
    "editionTypeId" BIGINT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "runtimeMs" BIGINT NULL,
    "releaseDt" DATE NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkEdition" PRIMARY KEY ("id"),
    CONSTRAINT "uqEditionPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqEditionName" UNIQUE ("contentId", "editionTypeId", "name"),
    CONSTRAINT "fkEditionContent" FOREIGN KEY ("contentId") REFERENCES video."tVideo" ("contentId"),
    CONSTRAINT "fkEditionType" FOREIGN KEY ("editionTypeId") REFERENCES video."tEditionType" ("id"),
    CONSTRAINT "ckEditionRuntime" CHECK ("runtimeMs" IS NULL OR "runtimeMs" > 0)
);

CREATE UNIQUE INDEX "uqEditionPrimaryContent" ON video."tEdition" ("contentId") WHERE "isPrimary" = TRUE;

CREATE TABLE video."tEditionAsset" (
    "editionId" BIGINT NOT NULL,
    "assetId" BIGINT NOT NULL,
    "roleCode" VARCHAR(32) NOT NULL,
    "ordinal" INTEGER NULL,
    CONSTRAINT "pkEditionAsset" PRIMARY KEY ("editionId", "assetId", "roleCode"),
    CONSTRAINT "fkEditionAssetEdition" FOREIGN KEY ("editionId") REFERENCES video."tEdition" ("id"),
    CONSTRAINT "fkEditionAssetAsset" FOREIGN KEY ("assetId") REFERENCES media."tAsset" ("id"),
    CONSTRAINT "ckEditionAssetRole" CHECK ("roleCode" IN ('VIDEO', 'AUDIO', 'SUBTITLE', 'CHAPTERS', 'POSTER')),
    CONSTRAINT "ckEditionAssetOrdinal" CHECK ("ordinal" IS NULL OR "ordinal" > 0)
);

CREATE TABLE video."tSubtitleMetadata" (
    "assetId" BIGINT NOT NULL,
    "subtitleKind" VARCHAR(16) NOT NULL,
    "isForced" BOOLEAN NOT NULL DEFAULT FALSE,
    "isHearingImpaired" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkSubtitleMetadata" PRIMARY KEY ("assetId"),
    CONSTRAINT "fkSubtitleMetadataAsset" FOREIGN KEY ("assetId") REFERENCES media."tAsset" ("id"),
    CONSTRAINT "ckSubtitleMetadataKind" CHECK ("subtitleKind" IN ('SUBTITLE', 'CAPTION', 'FORCED', 'SDH'))
);

CREATE TABLE video."tAudioMetadata" (
    "assetId" BIGINT NOT NULL,
    "audioKind" VARCHAR(16) NOT NULL,
    "dubStudioContributorId" BIGINT NULL,
    "isOriginal" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkAudioMetadata" PRIMARY KEY ("assetId"),
    CONSTRAINT "fkAudioMetadataAsset" FOREIGN KEY ("assetId") REFERENCES media."tAsset" ("id"),
    CONSTRAINT "fkAudioMetadataDubStudio" FOREIGN KEY ("dubStudioContributorId") REFERENCES content."tContributor" ("id"),
    CONSTRAINT "ckAudioMetadataKind" CHECK ("audioKind" IN ('ORIGINAL', 'DUB', 'VOICE_OVER', 'COMMENTARY', 'DESCRIPTIVE'))
);

CREATE TRIGGER "trgVideoSetUpdateDtm" BEFORE UPDATE ON video."tVideo" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();
CREATE TRIGGER "trgVideoValidateContentType" BEFORE INSERT OR UPDATE OF "contentId" ON video."tVideo" FOR EACH ROW EXECUTE FUNCTION content."fncValidateContentType"('FILM', 'SERIES', 'SEASON', 'EPISODE', 'SHORT', 'ANIMATION', 'MUSIC_VIDEO');

COMMIT;
