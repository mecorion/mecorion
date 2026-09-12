BEGIN;

CREATE TABLE music."tAlbumType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkAlbumType" PRIMARY KEY ("id"),
    CONSTRAINT "uqAlbumTypeCode" UNIQUE ("code")
);

CREATE TABLE music."tTrack" (
    "contentId" BIGINT NOT NULL,
    "isrc" VARCHAR(15) NULL,
    "bpm" NUMERIC(6,2) NULL,
    "musicalKey" VARCHAR(16) NULL,
    "isExplicit" BOOLEAN NOT NULL DEFAULT FALSE,
    "previewStartMs" BIGINT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkTrack" PRIMARY KEY ("contentId"),
    CONSTRAINT "uqTrackIsrc" UNIQUE ("isrc"),
    CONSTRAINT "fkTrackContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "ckTrackIsrc" CHECK ("isrc" IS NULL OR "isrc" ~ '^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$'),
    CONSTRAINT "ckTrackBpm" CHECK ("bpm" IS NULL OR "bpm" > 0),
    CONSTRAINT "ckTrackPreviewStart" CHECK ("previewStartMs" IS NULL OR "previewStartMs" >= 0)
);

CREATE TABLE music."tAlbum" (
    "contentId" BIGINT NOT NULL,
    "albumTypeId" BIGINT NOT NULL,
    "upc" VARCHAR(32) NULL,
    "releaseDt" DATE NULL,
    "discCount" SMALLINT NOT NULL DEFAULT 1,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkAlbum" PRIMARY KEY ("contentId"),
    CONSTRAINT "uqAlbumUpc" UNIQUE ("upc"),
    CONSTRAINT "fkAlbumContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "fkAlbumType" FOREIGN KEY ("albumTypeId") REFERENCES music."tAlbumType" ("id"),
    CONSTRAINT "ckAlbumDiscCount" CHECK ("discCount" > 0)
);

CREATE TABLE music."tAlbumTrack" (
    "albumContentId" BIGINT NOT NULL,
    "trackContentId" BIGINT NOT NULL,
    "discNumber" SMALLINT NOT NULL DEFAULT 1,
    "trackNumber" SMALLINT NOT NULL,
    "titleOverride" VARCHAR(512) NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkAlbumTrack" PRIMARY KEY ("albumContentId", "trackContentId"),
    CONSTRAINT "uqAlbumTrackPosition" UNIQUE ("albumContentId", "discNumber", "trackNumber"),
    CONSTRAINT "fkAlbumTrackAlbum" FOREIGN KEY ("albumContentId") REFERENCES music."tAlbum" ("contentId"),
    CONSTRAINT "fkAlbumTrackTrack" FOREIGN KEY ("trackContentId") REFERENCES music."tTrack" ("contentId"),
    CONSTRAINT "ckAlbumTrackDifferent" CHECK ("albumContentId" <> "trackContentId"),
    CONSTRAINT "ckAlbumTrackDisc" CHECK ("discNumber" > 0),
    CONSTRAINT "ckAlbumTrackNumber" CHECK ("trackNumber" > 0)
);

CREATE INDEX "ixAlbumTrackTrack" ON music."tAlbumTrack" ("trackContentId", "albumContentId");

CREATE TABLE music."tLyrics" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trackContentId" BIGINT NOT NULL,
    "languageId" BIGINT NOT NULL,
    "lyricsType" VARCHAR(16) NOT NULL,
    "plainText" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
    "sourceContributorId" BIGINT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkLyrics" PRIMARY KEY ("id"),
    CONSTRAINT "uqLyricsPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqLyricsVersion" UNIQUE ("trackContentId", "languageId", "lyricsType"),
    CONSTRAINT "fkLyricsTrack" FOREIGN KEY ("trackContentId") REFERENCES music."tTrack" ("contentId"),
    CONSTRAINT "fkLyricsLanguage" FOREIGN KEY ("languageId") REFERENCES core."tLanguage" ("id"),
    CONSTRAINT "fkLyricsSourceContributor" FOREIGN KEY ("sourceContributorId") REFERENCES content."tContributor" ("id"),
    CONSTRAINT "ckLyricsType" CHECK ("lyricsType" IN ('ORIGINAL', 'TRANSLATION', 'ROMANIZATION')),
    CONSTRAINT "ckLyricsText" CHECK (length("plainText") > 0)
);

CREATE UNIQUE INDEX "uqLyricsPrimaryTrackLanguage" ON music."tLyrics" ("trackContentId", "languageId") WHERE "isPrimary" = TRUE;

CREATE TABLE music."tLyricsLine" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "lyricsId" BIGINT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "startMs" BIGINT NULL,
    "endMs" BIGINT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "pkLyricsLine" PRIMARY KEY ("id"),
    CONSTRAINT "uqLyricsLineNumber" UNIQUE ("lyricsId", "lineNumber"),
    CONSTRAINT "fkLyricsLineLyrics" FOREIGN KEY ("lyricsId") REFERENCES music."tLyrics" ("id"),
    CONSTRAINT "ckLyricsLineNumber" CHECK ("lineNumber" > 0),
    CONSTRAINT "ckLyricsLineTime" CHECK ("startMs" IS NULL OR "startMs" >= 0),
    CONSTRAINT "ckLyricsLineEnd" CHECK ("endMs" IS NULL OR "startMs" IS NOT NULL AND "endMs" >= "startMs"),
    CONSTRAINT "ckLyricsLineText" CHECK (length("text") > 0)
);

CREATE INDEX "ixLyricsLineTimeline" ON music."tLyricsLine" ("lyricsId", "startMs") WHERE "startMs" IS NOT NULL;
CREATE TRIGGER "trgTrackValidateContentType" BEFORE INSERT OR UPDATE OF "contentId" ON music."tTrack" FOR EACH ROW EXECUTE FUNCTION content."fncValidateContentType"('TRACK');
CREATE TRIGGER "trgAlbumValidateContentType" BEFORE INSERT OR UPDATE OF "contentId" ON music."tAlbum" FOR EACH ROW EXECUTE FUNCTION content."fncValidateContentType"('ALBUM');
CREATE TRIGGER "trgTrackSetUpdateDtm" BEFORE UPDATE ON music."tTrack" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();
CREATE TRIGGER "trgAlbumSetUpdateDtm" BEFORE UPDATE ON music."tAlbum" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();
CREATE TRIGGER "trgLyricsSetUpdateDtm" BEFORE UPDATE ON music."tLyrics" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

COMMIT;
