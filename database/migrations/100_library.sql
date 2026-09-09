BEGIN;

CREATE TABLE library."tCollectionType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkCollectionType" PRIMARY KEY ("id"),
    CONSTRAINT "uqCollectionTypeCode" UNIQUE ("code")
);

CREATE TABLE library."tCollection" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resourceId" BIGINT NOT NULL,
    "ownerAccountId" BIGINT NOT NULL,
    "collectionTypeId" BIGINT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "description" TEXT NULL,
    "visibilityCode" VARCHAR(16) NOT NULL DEFAULT 'PRIVATE',
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleteDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkCollection" PRIMARY KEY ("id"),
    CONSTRAINT "uqCollectionPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqCollectionResourceId" UNIQUE ("resourceId"),
    CONSTRAINT "fkCollectionResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkCollectionOwner" FOREIGN KEY ("ownerAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkCollectionType" FOREIGN KEY ("collectionTypeId") REFERENCES library."tCollectionType" ("id"),
    CONSTRAINT "ckCollectionName" CHECK (length(btrim("name")) BETWEEN 1 AND 256),
    CONSTRAINT "ckCollectionVisibility" CHECK ("visibilityCode" IN ('PRIVATE', 'UNLISTED', 'PUBLIC'))
);

CREATE INDEX "ixCollectionOwner" ON library."tCollection" ("ownerAccountId", "createDtm" DESC, "id" DESC) WHERE "deleteDtm" IS NULL;

CREATE TABLE library."tCollectionItem" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "collectionId" BIGINT NOT NULL,
    "resourceId" BIGINT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "addByAccountId" BIGINT NOT NULL,
    "addDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkCollectionItem" PRIMARY KEY ("id"),
    CONSTRAINT "fkCollectionItemCollection" FOREIGN KEY ("collectionId") REFERENCES library."tCollection" ("id"),
    CONSTRAINT "fkCollectionItemResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkCollectionItemAddBy" FOREIGN KEY ("addByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckCollectionItemOrdinal" CHECK ("ordinal" > 0),
    CONSTRAINT "ckCollectionItemRemoveDtm" CHECK ("removeDtm" IS NULL OR "removeDtm" >= "addDtm")
);

CREATE UNIQUE INDEX "uqCollectionItemActiveResource" ON library."tCollectionItem" ("collectionId", "resourceId") WHERE "removeDtm" IS NULL;
CREATE UNIQUE INDEX "uqCollectionItemActiveOrdinal" ON library."tCollectionItem" ("collectionId", "ordinal") WHERE "removeDtm" IS NULL;

CREATE TABLE library."tFavorite" (
    "accountId" BIGINT NOT NULL,
    "resourceId" BIGINT NOT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkFavorite" PRIMARY KEY ("accountId", "resourceId"),
    CONSTRAINT "fkFavoriteAccount" FOREIGN KEY ("accountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkFavoriteResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id")
);

CREATE INDEX "ixFavoriteResource" ON library."tFavorite" ("resourceId", "createDtm" DESC);

CREATE TABLE library."tPlaybackProgress" (
    "accountId" BIGINT NOT NULL,
    "contentId" BIGINT NOT NULL,
    "positionMs" BIGINT NOT NULL DEFAULT 0,
    "durationMs" BIGINT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "firstPlayDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPlayDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkPlaybackProgress" PRIMARY KEY ("accountId", "contentId"),
    CONSTRAINT "fkPlaybackProgressAccount" FOREIGN KEY ("accountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkPlaybackProgressContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "ckPlaybackProgressPosition" CHECK ("positionMs" >= 0),
    CONSTRAINT "ckPlaybackProgressDuration" CHECK ("durationMs" IS NULL OR "durationMs" > 0),
    CONSTRAINT "ckPlaybackProgressBounds" CHECK ("durationMs" IS NULL OR "positionMs" <= "durationMs"),
    CONSTRAINT "ckPlaybackProgressComplete" CHECK (("isCompleted" = FALSE AND "completeDtm" IS NULL) OR ("isCompleted" = TRUE AND "completeDtm" IS NOT NULL))
);

CREATE INDEX "ixPlaybackProgressRecent" ON library."tPlaybackProgress" ("accountId", "lastPlayDtm" DESC);

CREATE TABLE library."tPlaybackEvent" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "accountId" BIGINT NOT NULL,
    "contentId" BIGINT NOT NULL,
    "sessionId" BIGINT NULL,
    "eventType" VARCHAR(16) NOT NULL,
    "positionMs" BIGINT NULL,
    "occurDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkPlaybackEvent" PRIMARY KEY ("id", "occurDtm"),
    CONSTRAINT "fkPlaybackEventAccount" FOREIGN KEY ("accountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkPlaybackEventContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "fkPlaybackEventSession" FOREIGN KEY ("sessionId") REFERENCES auth."tSession" ("id"),
    CONSTRAINT "ckPlaybackEventType" CHECK ("eventType" IN ('START', 'PROGRESS', 'PAUSE', 'COMPLETE', 'SKIP')),
    CONSTRAINT "ckPlaybackEventPosition" CHECK ("positionMs" IS NULL OR "positionMs" >= 0)
) PARTITION BY RANGE ("occurDtm");

CREATE TABLE library."tPlaybackEventDefault" PARTITION OF library."tPlaybackEvent" DEFAULT;
CREATE INDEX "ixPlaybackEventDefaultAccount" ON library."tPlaybackEventDefault" ("accountId", "occurDtm" DESC);

CREATE TABLE library."tOfflineGrantStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isUsable" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkOfflineGrantStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqOfflineGrantStatusCode" UNIQUE ("code")
);

CREATE TABLE library."tOfflineGrant" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" BIGINT NOT NULL,
    "deviceId" BIGINT NOT NULL,
    "contentId" BIGINT NOT NULL,
    "offlineGrantStatusId" BIGINT NOT NULL,
    "grantDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireDtm" TIMESTAMPTZ NOT NULL,
    "lastValidateDtm" TIMESTAMPTZ NULL,
    "revokeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkOfflineGrant" PRIMARY KEY ("id"),
    CONSTRAINT "uqOfflineGrantPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkOfflineGrantAccount" FOREIGN KEY ("accountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkOfflineGrantDeviceAccount" FOREIGN KEY ("deviceId", "accountId") REFERENCES auth."tDevice" ("id", "accountId"),
    CONSTRAINT "fkOfflineGrantContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "fkOfflineGrantStatus" FOREIGN KEY ("offlineGrantStatusId") REFERENCES library."tOfflineGrantStatus" ("id"),
    CONSTRAINT "ckOfflineGrantExpireDtm" CHECK ("expireDtm" > "grantDtm"),
    CONSTRAINT "ckOfflineGrantRevokeDtm" CHECK ("revokeDtm" IS NULL OR "revokeDtm" >= "grantDtm")
);

CREATE UNIQUE INDEX "uqOfflineGrantUsable" ON library."tOfflineGrant" ("accountId", "deviceId", "contentId") WHERE "revokeDtm" IS NULL;

CREATE TABLE library."tOfflineGrantAsset" (
    "offlineGrantId" BIGINT NOT NULL,
    "assetVariantId" BIGINT NOT NULL,
    CONSTRAINT "pkOfflineGrantAsset" PRIMARY KEY ("offlineGrantId", "assetVariantId"),
    CONSTRAINT "fkOfflineGrantAssetGrant" FOREIGN KEY ("offlineGrantId") REFERENCES library."tOfflineGrant" ("id"),
    CONSTRAINT "fkOfflineGrantAssetVariant" FOREIGN KEY ("assetVariantId") REFERENCES media."tAssetVariant" ("id")
);

CREATE OR REPLACE FUNCTION library."fncValidateOfflineGrantAsset"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM library."tOfflineGrant" offlineGrant
        JOIN media."tAssetVariant" assetVariant
          ON assetVariant."id" = NEW."assetVariantId"
         AND assetVariant."isOfflineAllowed" = TRUE
        JOIN media."tContentAsset" contentAsset
          ON contentAsset."assetId" = assetVariant."assetId"
         AND contentAsset."contentId" = offlineGrant."contentId"
        WHERE offlineGrant."id" = NEW."offlineGrantId"
    ) THEN
        RAISE EXCEPTION 'Offline asset must be allowed and attached to grant content';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgOfflineGrantAssetValidate"
BEFORE INSERT OR UPDATE ON library."tOfflineGrantAsset"
FOR EACH ROW EXECUTE FUNCTION library."fncValidateOfflineGrantAsset"();

CREATE TRIGGER "trgCollectionSetUpdateDtm" BEFORE UPDATE ON library."tCollection" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();
CREATE TRIGGER "trgCollectionValidateResourceType" BEFORE INSERT OR UPDATE OF "resourceId" ON library."tCollection" FOR EACH ROW EXECUTE FUNCTION core."fncValidateResourceType"('collection');

COMMIT;
