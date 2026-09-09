BEGIN;

CREATE TABLE media."tStorageProvider" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "providerType" VARCHAR(32) NOT NULL,
    "endpointRef" VARCHAR(256) NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkStorageProvider" PRIMARY KEY ("id"),
    CONSTRAINT "uqStorageProviderCode" UNIQUE ("code"),
    CONSTRAINT "ckStorageProviderType" CHECK ("providerType" IN ('S3', 'LOCAL', 'ARCHIVE'))
);

CREATE TABLE media."tStorageObjectStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkStorageObjectStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqStorageObjectStatusCode" UNIQUE ("code")
);

CREATE TABLE media."tStorageObject" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storageProviderId" BIGINT NOT NULL,
    "storageObjectStatusId" BIGINT NOT NULL,
    "bucketName" VARCHAR(128) NOT NULL,
    "objectKey" VARCHAR(1024) NOT NULL,
    "versionId" VARCHAR(512) NULL,
    "sizeByte" BIGINT NOT NULL,
    "contentType" VARCHAR(255) NULL,
    "etag" VARCHAR(512) NULL,
    "sha256Digest" BYTEA NOT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifyDtm" TIMESTAMPTZ NULL,
    "deleteDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkStorageObject" PRIMARY KEY ("id"),
    CONSTRAINT "uqStorageObjectPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqStorageObjectLocation" UNIQUE NULLS NOT DISTINCT ("storageProviderId", "bucketName", "objectKey", "versionId"),
    CONSTRAINT "fkStorageObjectProvider" FOREIGN KEY ("storageProviderId") REFERENCES media."tStorageProvider" ("id"),
    CONSTRAINT "fkStorageObjectStatus" FOREIGN KEY ("storageObjectStatusId") REFERENCES media."tStorageObjectStatus" ("id"),
    CONSTRAINT "ckStorageObjectSize" CHECK ("sizeByte" >= 0),
    CONSTRAINT "ckStorageObjectSha256" CHECK (octet_length("sha256Digest") = 32),
    CONSTRAINT "ckStorageObjectDeleteDtm" CHECK ("deleteDtm" IS NULL OR "deleteDtm" >= "createDtm")
);

CREATE INDEX "ixStorageObjectSha256" ON media."tStorageObject" ("sha256Digest");

CREATE TABLE media."tAssetType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isTimed" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkAssetType" PRIMARY KEY ("id"),
    CONSTRAINT "uqAssetTypeCode" UNIQUE ("code")
);

CREATE TABLE media."tAssetStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isUsable" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkAssetStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqAssetStatusCode" UNIQUE ("code")
);

CREATE TABLE media."tAsset" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetTypeId" BIGINT NOT NULL,
    "assetStatusId" BIGINT NOT NULL,
    "languageId" BIGINT NULL,
    "title" VARCHAR(512) NULL,
    "durationMs" BIGINT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createByAccountId" BIGINT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retireDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkAsset" PRIMARY KEY ("id"),
    CONSTRAINT "uqAssetPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkAssetType" FOREIGN KEY ("assetTypeId") REFERENCES media."tAssetType" ("id"),
    CONSTRAINT "fkAssetStatus" FOREIGN KEY ("assetStatusId") REFERENCES media."tAssetStatus" ("id"),
    CONSTRAINT "fkAssetLanguage" FOREIGN KEY ("languageId") REFERENCES core."tLanguage" ("id"),
    CONSTRAINT "fkAssetCreateByAccount" FOREIGN KEY ("createByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckAssetDuration" CHECK ("durationMs" IS NULL OR "durationMs" > 0),
    CONSTRAINT "ckAssetMetadata" CHECK (jsonb_typeof("metadata") = 'object')
);

CREATE TABLE media."tAssetVariant" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetId" BIGINT NOT NULL,
    "storageObjectId" BIGINT NOT NULL,
    "variantCode" VARCHAR(64) NOT NULL,
    "container" VARCHAR(32) NULL,
    "codec" VARCHAR(64) NULL,
    "bitrateKbps" INTEGER NULL,
    "widthPx" INTEGER NULL,
    "heightPx" INTEGER NULL,
    "sampleRateHz" INTEGER NULL,
    "channelCount" SMALLINT NULL,
    "isSource" BOOLEAN NOT NULL DEFAULT FALSE,
    "isOfflineAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkAssetVariant" PRIMARY KEY ("id"),
    CONSTRAINT "uqAssetVariantPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqAssetVariantCode" UNIQUE ("assetId", "variantCode"),
    CONSTRAINT "uqAssetVariantStorageObject" UNIQUE ("storageObjectId"),
    CONSTRAINT "fkAssetVariantAsset" FOREIGN KEY ("assetId") REFERENCES media."tAsset" ("id"),
    CONSTRAINT "fkAssetVariantStorageObject" FOREIGN KEY ("storageObjectId") REFERENCES media."tStorageObject" ("id"),
    CONSTRAINT "ckAssetVariantBitrate" CHECK ("bitrateKbps" IS NULL OR "bitrateKbps" > 0),
    CONSTRAINT "ckAssetVariantDimensions" CHECK (("widthPx" IS NULL AND "heightPx" IS NULL) OR ("widthPx" > 0 AND "heightPx" > 0)),
    CONSTRAINT "ckAssetVariantSampleRate" CHECK ("sampleRateHz" IS NULL OR "sampleRateHz" > 0),
    CONSTRAINT "ckAssetVariantChannels" CHECK ("channelCount" IS NULL OR "channelCount" > 0)
);

CREATE UNIQUE INDEX "uqAssetVariantSource" ON media."tAssetVariant" ("assetId") WHERE "isSource" = TRUE;

CREATE TABLE media."tContentAssetRole" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkContentAssetRole" PRIMARY KEY ("id"),
    CONSTRAINT "uqContentAssetRoleCode" UNIQUE ("code")
);

CREATE TABLE media."tContentAsset" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "contentId" BIGINT NOT NULL,
    "assetId" BIGINT NOT NULL,
    "contentAssetRoleId" BIGINT NOT NULL,
    "territoryId" BIGINT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
    "ordinal" INTEGER NULL,
    "validFromDtm" TIMESTAMPTZ NULL,
    "validUntilDtm" TIMESTAMPTZ NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkContentAsset" PRIMARY KEY ("id"),
    CONSTRAINT "uqContentAsset" UNIQUE NULLS NOT DISTINCT ("contentId", "assetId", "contentAssetRoleId", "territoryId"),
    CONSTRAINT "fkContentAssetContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "fkContentAssetAsset" FOREIGN KEY ("assetId") REFERENCES media."tAsset" ("id"),
    CONSTRAINT "fkContentAssetRole" FOREIGN KEY ("contentAssetRoleId") REFERENCES media."tContentAssetRole" ("id"),
    CONSTRAINT "fkContentAssetTerritory" FOREIGN KEY ("territoryId") REFERENCES core."tTerritory" ("id"),
    CONSTRAINT "ckContentAssetOrdinal" CHECK ("ordinal" IS NULL OR "ordinal" > 0),
    CONSTRAINT "ckContentAssetValidity" CHECK ("validUntilDtm" IS NULL OR "validFromDtm" IS NULL OR "validUntilDtm" > "validFromDtm")
);

CREATE INDEX "ixContentAssetContent" ON media."tContentAsset" ("contentId", "contentAssetRoleId", "ordinal");

CREATE TABLE media."tUploadStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkUploadStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqUploadStatusCode" UNIQUE ("code")
);

CREATE TABLE media."tUpload" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" BIGINT NOT NULL,
    "uploadStatusId" BIGINT NOT NULL,
    "expectedSizeByte" BIGINT NULL,
    "expectedSha256Digest" BYTEA NULL,
    "storageObjectId" BIGINT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireDtm" TIMESTAMPTZ NOT NULL,
    "completeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkUpload" PRIMARY KEY ("id"),
    CONSTRAINT "uqUploadPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqUploadStorageObject" UNIQUE ("storageObjectId"),
    CONSTRAINT "fkUploadAccount" FOREIGN KEY ("accountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkUploadStatus" FOREIGN KEY ("uploadStatusId") REFERENCES media."tUploadStatus" ("id"),
    CONSTRAINT "fkUploadStorageObject" FOREIGN KEY ("storageObjectId") REFERENCES media."tStorageObject" ("id"),
    CONSTRAINT "ckUploadExpectedSize" CHECK ("expectedSizeByte" IS NULL OR "expectedSizeByte" >= 0),
    CONSTRAINT "ckUploadExpectedSha256" CHECK ("expectedSha256Digest" IS NULL OR octet_length("expectedSha256Digest") = 32),
    CONSTRAINT "ckUploadExpireDtm" CHECK ("expireDtm" > "createDtm"),
    CONSTRAINT "ckUploadCompleteDtm" CHECK ("completeDtm" IS NULL OR "completeDtm" >= "createDtm")
);

CREATE INDEX "ixUploadActiveExpiry" ON media."tUpload" ("expireDtm", "id") WHERE "completeDtm" IS NULL;

CREATE TABLE media."tTranscodeJobStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkTranscodeJobStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqTranscodeJobStatusCode" UNIQUE ("code")
);

CREATE TABLE media."tTranscodeJob" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sourceAssetVariantId" BIGINT NOT NULL,
    "transcodeJobStatusId" BIGINT NOT NULL,
    "profileCode" VARCHAR(64) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDtm" TIMESTAMPTZ NULL,
    "finishDtm" TIMESTAMPTZ NULL,
    "lastError" TEXT NULL,
    CONSTRAINT "pkTranscodeJob" PRIMARY KEY ("id"),
    CONSTRAINT "uqTranscodeJobPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkTranscodeJobSource" FOREIGN KEY ("sourceAssetVariantId") REFERENCES media."tAssetVariant" ("id"),
    CONSTRAINT "fkTranscodeJobStatus" FOREIGN KEY ("transcodeJobStatusId") REFERENCES media."tTranscodeJobStatus" ("id"),
    CONSTRAINT "ckTranscodeJobAttempt" CHECK ("attemptCount" >= 0),
    CONSTRAINT "ckTranscodeJobDates" CHECK ("finishDtm" IS NULL OR "startDtm" IS NOT NULL AND "finishDtm" >= "startDtm")
);

CREATE INDEX "ixTranscodeJobQueue" ON media."tTranscodeJob" ("transcodeJobStatusId", "createDtm", "id");
CREATE TRIGGER "trgAssetSetUpdateDtm" BEFORE UPDATE ON media."tAsset" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

COMMIT;
