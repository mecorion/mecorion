BEGIN;

CREATE TABLE content."tContentStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkContentStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqContentStatusCode" UNIQUE ("code"),
    CONSTRAINT "ckContentStatusCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE content."tContentType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "parentContentTypeId" BIGINT NULL,
    "isContainer" BOOLEAN NOT NULL DEFAULT FALSE,
    "isPlayable" BOOLEAN NOT NULL DEFAULT FALSE,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkContentType" PRIMARY KEY ("id"),
    CONSTRAINT "uqContentTypeCode" UNIQUE ("code"),
    CONSTRAINT "fkContentTypeParent" FOREIGN KEY ("parentContentTypeId")
        REFERENCES content."tContentType" ("id"),
    CONSTRAINT "ckContentTypeCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$'),
    CONSTRAINT "ckContentTypeParent" CHECK ("parentContentTypeId" IS NULL OR "parentContentTypeId" <> "id")
);

CREATE TABLE content."tContent" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resourceId" BIGINT NOT NULL,
    "contentTypeId" BIGINT NOT NULL,
    "contentStatusId" BIGINT NOT NULL,
    "originalLanguageId" BIGINT NULL,
    "originalTitle" VARCHAR(512) NOT NULL,
    "releaseDt" DATE NULL,
    "durationMs" BIGINT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createByAccountId" BIGINT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retireDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkContent" PRIMARY KEY ("id"),
    CONSTRAINT "uqContentPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqContentResourceId" UNIQUE ("resourceId"),
    CONSTRAINT "fkContentResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkContentContentType" FOREIGN KEY ("contentTypeId") REFERENCES content."tContentType" ("id"),
    CONSTRAINT "fkContentContentStatus" FOREIGN KEY ("contentStatusId") REFERENCES content."tContentStatus" ("id"),
    CONSTRAINT "fkContentOriginalLanguage" FOREIGN KEY ("originalLanguageId") REFERENCES core."tLanguage" ("id"),
    CONSTRAINT "fkContentCreateByAccount" FOREIGN KEY ("createByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckContentTitle" CHECK (length(btrim("originalTitle")) BETWEEN 1 AND 512),
    CONSTRAINT "ckContentDuration" CHECK ("durationMs" IS NULL OR "durationMs" > 0),
    CONSTRAINT "ckContentMetadata" CHECK (jsonb_typeof("metadata") = 'object'),
    CONSTRAINT "ckContentRetireDtm" CHECK ("retireDtm" IS NULL OR "retireDtm" >= "createDtm")
);

CREATE INDEX "ixContentTypeStatus" ON content."tContent" ("contentTypeId", "contentStatusId", "id") WHERE "retireDtm" IS NULL;
CREATE INDEX "ixContentOriginalTitleTrgm" ON content."tContent" USING GIN ("originalTitle" gin_trgm_ops);

CREATE OR REPLACE FUNCTION content."fncValidateContentType"()
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
     WHERE contentItem."id" = NEW."contentId"
       AND contentItem."retireDtm" IS NULL;

    IF NOT (vContentTypeCode = ANY (TG_ARGV)) THEN
        RAISE EXCEPTION 'Content type % is not allowed for %', vContentTypeCode, TG_TABLE_NAME;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TABLE content."tTitleType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkTitleType" PRIMARY KEY ("id"),
    CONSTRAINT "uqTitleTypeCode" UNIQUE ("code")
);

CREATE TABLE content."tContentTitle" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "contentId" BIGINT NOT NULL,
    "languageId" BIGINT NULL,
    "titleTypeId" BIGINT NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "normalizedTitle" VARCHAR(512) NOT NULL,
    "isPreferred" BOOLEAN NOT NULL DEFAULT FALSE,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkContentTitle" PRIMARY KEY ("id"),
    CONSTRAINT "uqContentTitle" UNIQUE NULLS NOT DISTINCT ("contentId", "titleTypeId", "languageId", "normalizedTitle"),
    CONSTRAINT "fkContentTitleContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "fkContentTitleLanguage" FOREIGN KEY ("languageId") REFERENCES core."tLanguage" ("id"),
    CONSTRAINT "fkContentTitleTitleType" FOREIGN KEY ("titleTypeId") REFERENCES content."tTitleType" ("id"),
    CONSTRAINT "ckContentTitleValue" CHECK (length(btrim("title")) BETWEEN 1 AND 512),
    CONSTRAINT "ckContentTitleNormalized" CHECK (length(btrim("normalizedTitle")) BETWEEN 1 AND 512)
);

CREATE INDEX "ixContentTitleNormalizedTrgm" ON content."tContentTitle" USING GIN ("normalizedTitle" gin_trgm_ops);

CREATE TABLE content."tContentRelationType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isDirectional" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkContentRelationType" PRIMARY KEY ("id"),
    CONSTRAINT "uqContentRelationTypeCode" UNIQUE ("code")
);

CREATE TABLE content."tContentRelation" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "sourceContentId" BIGINT NOT NULL,
    "targetContentId" BIGINT NOT NULL,
    "contentRelationTypeId" BIGINT NOT NULL,
    "ordinal" INTEGER NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retireDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkContentRelation" PRIMARY KEY ("id"),
    CONSTRAINT "uqContentRelation" UNIQUE ("sourceContentId", "targetContentId", "contentRelationTypeId"),
    CONSTRAINT "fkContentRelationSource" FOREIGN KEY ("sourceContentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "fkContentRelationTarget" FOREIGN KEY ("targetContentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "fkContentRelationType" FOREIGN KEY ("contentRelationTypeId") REFERENCES content."tContentRelationType" ("id"),
    CONSTRAINT "ckContentRelationDifferent" CHECK ("sourceContentId" <> "targetContentId"),
    CONSTRAINT "ckContentRelationOrdinal" CHECK ("ordinal" IS NULL OR "ordinal" > 0),
    CONSTRAINT "ckContentRelationMetadata" CHECK (jsonb_typeof("metadata") = 'object')
);

CREATE INDEX "ixContentRelationTarget" ON content."tContentRelation" ("targetContentId", "contentRelationTypeId", "id") WHERE "retireDtm" IS NULL;

CREATE TABLE content."tContributorKind" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkContributorKind" PRIMARY KEY ("id"),
    CONSTRAINT "uqContributorKindCode" UNIQUE ("code")
);

CREATE TABLE content."tContributor" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resourceId" BIGINT NOT NULL,
    "contributorKindId" BIGINT NOT NULL,
    "primaryName" VARCHAR(512) NOT NULL,
    "normalizedName" VARCHAR(512) NOT NULL,
    "description" TEXT NULL,
    "originTerritoryId" BIGINT NULL,
    "beginDt" DATE NULL,
    "endDt" DATE NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createByAccountId" BIGINT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retireDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkContributor" PRIMARY KEY ("id"),
    CONSTRAINT "uqContributorPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqContributorResourceId" UNIQUE ("resourceId"),
    CONSTRAINT "fkContributorResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkContributorKind" FOREIGN KEY ("contributorKindId") REFERENCES content."tContributorKind" ("id"),
    CONSTRAINT "fkContributorOriginTerritory" FOREIGN KEY ("originTerritoryId") REFERENCES core."tTerritory" ("id"),
    CONSTRAINT "fkContributorCreateByAccount" FOREIGN KEY ("createByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckContributorName" CHECK (length(btrim("primaryName")) BETWEEN 1 AND 512),
    CONSTRAINT "ckContributorNormalizedName" CHECK (length(btrim("normalizedName")) BETWEEN 1 AND 512),
    CONSTRAINT "ckContributorDates" CHECK ("endDt" IS NULL OR "beginDt" IS NULL OR "endDt" >= "beginDt"),
    CONSTRAINT "ckContributorMetadata" CHECK (jsonb_typeof("metadata") = 'object')
);

CREATE INDEX "ixContributorNormalizedNameTrgm" ON content."tContributor" USING GIN ("normalizedName" gin_trgm_ops);

CREATE TABLE content."tContributorName" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "contributorId" BIGINT NOT NULL,
    "languageId" BIGINT NULL,
    "nameType" VARCHAR(32) NOT NULL,
    "name" VARCHAR(512) NOT NULL,
    "normalizedName" VARCHAR(512) NOT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkContributorName" PRIMARY KEY ("id"),
    CONSTRAINT "uqContributorName" UNIQUE NULLS NOT DISTINCT ("contributorId", "nameType", "languageId", "normalizedName"),
    CONSTRAINT "fkContributorNameContributor" FOREIGN KEY ("contributorId") REFERENCES content."tContributor" ("id"),
    CONSTRAINT "fkContributorNameLanguage" FOREIGN KEY ("languageId") REFERENCES core."tLanguage" ("id"),
    CONSTRAINT "ckContributorNameType" CHECK ("nameType" IN ('PRIMARY', 'ALIAS', 'LEGAL', 'FORMER', 'TRANSLITERATION')),
    CONSTRAINT "ckContributorNameValue" CHECK (length(btrim("name")) BETWEEN 1 AND 512),
    CONSTRAINT "ckContributorNameNormalized" CHECK (length(btrim("normalizedName")) BETWEEN 1 AND 512)
);

CREATE INDEX "ixContributorNameNormalizedTrgm" ON content."tContributorName" USING GIN ("normalizedName" gin_trgm_ops);

CREATE TABLE content."tContributorRelationType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkContributorRelationType" PRIMARY KEY ("id"),
    CONSTRAINT "uqContributorRelationTypeCode" UNIQUE ("code")
);

CREATE TABLE content."tContributorRelation" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "sourceContributorId" BIGINT NOT NULL,
    "targetContributorId" BIGINT NOT NULL,
    "contributorRelationTypeId" BIGINT NOT NULL,
    "beginDt" DATE NULL,
    "endDt" DATE NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkContributorRelation" PRIMARY KEY ("id"),
    CONSTRAINT "uqContributorRelation" UNIQUE NULLS NOT DISTINCT ("sourceContributorId", "targetContributorId", "contributorRelationTypeId", "beginDt"),
    CONSTRAINT "fkContributorRelationSource" FOREIGN KEY ("sourceContributorId") REFERENCES content."tContributor" ("id"),
    CONSTRAINT "fkContributorRelationTarget" FOREIGN KEY ("targetContributorId") REFERENCES content."tContributor" ("id"),
    CONSTRAINT "fkContributorRelationType" FOREIGN KEY ("contributorRelationTypeId") REFERENCES content."tContributorRelationType" ("id"),
    CONSTRAINT "ckContributorRelationDifferent" CHECK ("sourceContributorId" <> "targetContributorId"),
    CONSTRAINT "ckContributorRelationDates" CHECK ("endDt" IS NULL OR "beginDt" IS NULL OR "endDt" >= "beginDt")
);

CREATE TABLE content."tContributorRole" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkContributorRole" PRIMARY KEY ("id"),
    CONSTRAINT "uqContributorRoleCode" UNIQUE ("code")
);

CREATE TABLE content."tContentContributor" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "contentId" BIGINT NOT NULL,
    "contributorId" BIGINT NOT NULL,
    "contributorRoleId" BIGINT NOT NULL,
    "characterName" VARCHAR(256) NULL,
    "ordinal" INTEGER NULL,
    "isCredited" BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkContentContributor" PRIMARY KEY ("id"),
    CONSTRAINT "uqContentContributor" UNIQUE NULLS NOT DISTINCT ("contentId", "contributorId", "contributorRoleId", "characterName"),
    CONSTRAINT "fkContentContributorContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "fkContentContributorContributor" FOREIGN KEY ("contributorId") REFERENCES content."tContributor" ("id"),
    CONSTRAINT "fkContentContributorRole" FOREIGN KEY ("contributorRoleId") REFERENCES content."tContributorRole" ("id"),
    CONSTRAINT "ckContentContributorOrdinal" CHECK ("ordinal" IS NULL OR "ordinal" > 0)
);

CREATE INDEX "ixContentContributorContributor" ON content."tContentContributor" ("contributorId", "contributorRoleId", "contentId");

CREATE TABLE content."tPublicationStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkPublicationStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqPublicationStatusCode" UNIQUE ("code")
);

CREATE TABLE content."tPublication" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resourceId" BIGINT NOT NULL,
    "publicationStatusId" BIGINT NOT NULL,
    "slug" CITEXT NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "summary" TEXT NULL,
    "createByAccountId" BIGINT NULL,
    "publishDtm" TIMESTAMPTZ NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retireDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkPublication" PRIMARY KEY ("id"),
    CONSTRAINT "uqPublicationPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqPublicationResourceId" UNIQUE ("resourceId"),
    CONSTRAINT "uqPublicationSlug" UNIQUE ("slug"),
    CONSTRAINT "fkPublicationResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkPublicationStatus" FOREIGN KEY ("publicationStatusId") REFERENCES content."tPublicationStatus" ("id"),
    CONSTRAINT "fkPublicationCreateByAccount" FOREIGN KEY ("createByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckPublicationSlug" CHECK ("slug"::TEXT ~ '^[a-z0-9][a-z0-9-]{2,127}$'),
    CONSTRAINT "ckPublicationPublishDtm" CHECK ("publishDtm" IS NULL OR "publishDtm" >= "createDtm")
);

CREATE TABLE content."tPublicationContent" (
    "publicationId" BIGINT NOT NULL,
    "contentId" BIGINT NOT NULL,
    "ordinal" INTEGER NOT NULL DEFAULT 1,
    "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkPublicationContent" PRIMARY KEY ("publicationId", "contentId"),
    CONSTRAINT "uqPublicationContentOrdinal" UNIQUE ("publicationId", "ordinal"),
    CONSTRAINT "fkPublicationContentPublication" FOREIGN KEY ("publicationId") REFERENCES content."tPublication" ("id"),
    CONSTRAINT "fkPublicationContentContent" FOREIGN KEY ("contentId") REFERENCES content."tContent" ("id"),
    CONSTRAINT "ckPublicationContentOrdinal" CHECK ("ordinal" > 0)
);

CREATE OR REPLACE FUNCTION content."fncValidatePublicationState"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vIsPublic BOOLEAN;
BEGIN
    SELECT "isPublic" INTO STRICT vIsPublic
    FROM content."tPublicationStatus"
    WHERE "id" = NEW."publicationStatusId";
    IF vIsPublic AND NEW."publishDtm" IS NULL THEN
        RAISE EXCEPTION 'Public publication status requires publishDtm';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgPublicationValidateState"
BEFORE INSERT OR UPDATE OF "publicationStatusId", "publishDtm" ON content."tPublication"
FOR EACH ROW EXECUTE FUNCTION content."fncValidatePublicationState"();

CREATE UNIQUE INDEX "uqPublicationContentPrimary" ON content."tPublicationContent" ("publicationId") WHERE "isPrimary" = TRUE;
CREATE UNIQUE INDEX "uqPublicationContentCanonical" ON content."tPublicationContent" ("contentId") WHERE "isPrimary" = TRUE;

CREATE TABLE content."tExternalSource" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "baseUrl" VARCHAR(1024) NULL,
    CONSTRAINT "pkExternalSource" PRIMARY KEY ("id"),
    CONSTRAINT "uqExternalSourceCode" UNIQUE ("code")
);

CREATE TABLE content."tResourceExternalIdentifier" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "resourceId" BIGINT NOT NULL,
    "externalSourceId" BIGINT NOT NULL,
    "externalType" VARCHAR(64) NOT NULL,
    "externalId" VARCHAR(512) NOT NULL,
    "sourceUrl" VARCHAR(2048) NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkResourceExternalIdentifier" PRIMARY KEY ("id"),
    CONSTRAINT "uqResourceExternalIdentifier" UNIQUE ("externalSourceId", "externalType", "externalId"),
    CONSTRAINT "fkResourceExternalIdentifierResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkResourceExternalIdentifierSource" FOREIGN KEY ("externalSourceId") REFERENCES content."tExternalSource" ("id")
);

CREATE TABLE content."tFingerprintType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isExactMatchAuthoritative" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkFingerprintType" PRIMARY KEY ("id"),
    CONSTRAINT "uqFingerprintTypeCode" UNIQUE ("code")
);

CREATE TABLE content."tResourceFingerprint" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "resourceId" BIGINT NOT NULL,
    "fingerprintTypeId" BIGINT NOT NULL,
    "algorithm" VARCHAR(64) NOT NULL,
    "algorithmVersion" VARCHAR(32) NOT NULL,
    "fingerprint" BYTEA NOT NULL,
    "fingerprintDigest" BYTEA NOT NULL,
    "qualityScore" NUMERIC(5,4) NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkResourceFingerprint" PRIMARY KEY ("id"),
    CONSTRAINT "uqResourceFingerprint" UNIQUE ("resourceId", "fingerprintTypeId", "algorithm", "algorithmVersion", "fingerprintDigest"),
    CONSTRAINT "fkResourceFingerprintResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkResourceFingerprintType" FOREIGN KEY ("fingerprintTypeId") REFERENCES content."tFingerprintType" ("id"),
    CONSTRAINT "ckResourceFingerprintLength" CHECK (octet_length("fingerprint") >= 8),
    CONSTRAINT "ckResourceFingerprintDigest" CHECK (octet_length("fingerprintDigest") = 32),
    CONSTRAINT "ckResourceFingerprintQuality" CHECK ("qualityScore" IS NULL OR "qualityScore" BETWEEN 0 AND 1)
);

CREATE INDEX "ixResourceFingerprintLookup" ON content."tResourceFingerprint" ("fingerprintTypeId", "algorithm", "algorithmVersion", "fingerprintDigest");

CREATE TABLE content."tDuplicateCandidateStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkDuplicateCandidateStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqDuplicateCandidateStatusCode" UNIQUE ("code")
);

CREATE TABLE content."tDuplicatePolicy" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "resourceTypeId" BIGINT NOT NULL,
    "autoConfirmThreshold" NUMERIC(5,4) NOT NULL,
    "communityReviewThreshold" NUMERIC(5,4) NOT NULL,
    "minimumEvidenceCount" SMALLINT NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkDuplicatePolicy" PRIMARY KEY ("id"),
    CONSTRAINT "uqDuplicatePolicyCode" UNIQUE ("code"),
    CONSTRAINT "fkDuplicatePolicyResourceType" FOREIGN KEY ("resourceTypeId") REFERENCES core."tResourceType" ("id"),
    CONSTRAINT "ckDuplicatePolicyThresholds" CHECK (
        "autoConfirmThreshold" BETWEEN 0 AND 1
        AND "communityReviewThreshold" BETWEEN 0 AND 1
        AND "autoConfirmThreshold" > "communityReviewThreshold"
    ),
    CONSTRAINT "ckDuplicatePolicyEvidenceCount" CHECK ("minimumEvidenceCount" > 0)
);

CREATE TABLE content."tDuplicateSignalRule" (
    "duplicatePolicyId" BIGINT NOT NULL,
    "evidenceType" VARCHAR(32) NOT NULL,
    "weight" NUMERIC(5,4) NOT NULL,
    "isAuthoritative" BOOLEAN NOT NULL DEFAULT FALSE,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkDuplicateSignalRule" PRIMARY KEY ("duplicatePolicyId", "evidenceType"),
    CONSTRAINT "fkDuplicateSignalRulePolicy" FOREIGN KEY ("duplicatePolicyId") REFERENCES content."tDuplicatePolicy" ("id"),
    CONSTRAINT "ckDuplicateSignalRuleWeight" CHECK ("weight" BETWEEN 0 AND 1)
);

CREATE TABLE content."tDuplicateCandidate" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leftResourceId" BIGINT NOT NULL,
    "rightResourceId" BIGINT NOT NULL,
    "duplicateCandidateStatusId" BIGINT NOT NULL,
    "confidence" NUMERIC(5,4) NOT NULL,
    "detectionMethod" VARCHAR(32) NOT NULL,
    "modelCode" VARCHAR(128) NULL,
    "modelVersion" VARCHAR(64) NULL,
    "detectDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolveDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkDuplicateCandidate" PRIMARY KEY ("id"),
    CONSTRAINT "uqDuplicateCandidatePublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqDuplicateCandidatePair" UNIQUE ("leftResourceId", "rightResourceId"),
    CONSTRAINT "fkDuplicateCandidateLeftResource" FOREIGN KEY ("leftResourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkDuplicateCandidateRightResource" FOREIGN KEY ("rightResourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkDuplicateCandidateStatus" FOREIGN KEY ("duplicateCandidateStatusId") REFERENCES content."tDuplicateCandidateStatus" ("id"),
    CONSTRAINT "ckDuplicateCandidateOrder" CHECK ("leftResourceId" < "rightResourceId"),
    CONSTRAINT "ckDuplicateCandidateConfidence" CHECK ("confidence" BETWEEN 0 AND 1),
    CONSTRAINT "ckDuplicateCandidateMethod" CHECK ("detectionMethod" IN ('RULE', 'FINGERPRINT', 'MODEL', 'COMMUNITY', 'IMPORT')),
    CONSTRAINT "ckDuplicateCandidateResolveDtm" CHECK ("resolveDtm" IS NULL OR "resolveDtm" >= "detectDtm")
);

CREATE INDEX "ixDuplicateCandidateQueue" ON content."tDuplicateCandidate" ("duplicateCandidateStatusId", "confidence" DESC, "id");

CREATE OR REPLACE FUNCTION content."fncValidateDuplicateCandidate"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vLeftTypeId BIGINT;
    vRightTypeId BIGINT;
BEGIN
    SELECT "resourceTypeId" INTO STRICT vLeftTypeId
    FROM core."tResource" WHERE "id" = NEW."leftResourceId";
    SELECT "resourceTypeId" INTO STRICT vRightTypeId
    FROM core."tResource" WHERE "id" = NEW."rightResourceId";
    IF vLeftTypeId <> vRightTypeId THEN
        RAISE EXCEPTION 'Duplicate candidates must have the same resource type';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgDuplicateCandidateValidate"
BEFORE INSERT OR UPDATE OF "leftResourceId", "rightResourceId" ON content."tDuplicateCandidate"
FOR EACH ROW EXECUTE FUNCTION content."fncValidateDuplicateCandidate"();

CREATE TABLE content."tDuplicateEvidence" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "duplicateCandidateId" BIGINT NOT NULL,
    "evidenceType" VARCHAR(32) NOT NULL,
    "score" NUMERIC(5,4) NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkDuplicateEvidence" PRIMARY KEY ("id"),
    CONSTRAINT "fkDuplicateEvidenceCandidate" FOREIGN KEY ("duplicateCandidateId") REFERENCES content."tDuplicateCandidate" ("id"),
    CONSTRAINT "ckDuplicateEvidenceScore" CHECK ("score" BETWEEN 0 AND 1),
    CONSTRAINT "ckDuplicateEvidenceDetails" CHECK (jsonb_typeof("details") = 'object')
);

CREATE TABLE content."tResourceMerge" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "sourceResourceId" BIGINT NOT NULL,
    "targetResourceId" BIGINT NOT NULL,
    "duplicateCandidateId" BIGINT NULL,
    "decisionSource" VARCHAR(32) NOT NULL,
    "mergeByAccountId" BIGINT NULL,
    "mergeDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NULL,
    CONSTRAINT "pkResourceMerge" PRIMARY KEY ("id"),
    CONSTRAINT "uqResourceMergeSource" UNIQUE ("sourceResourceId"),
    CONSTRAINT "fkResourceMergeSource" FOREIGN KEY ("sourceResourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkResourceMergeTarget" FOREIGN KEY ("targetResourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkResourceMergeCandidate" FOREIGN KEY ("duplicateCandidateId") REFERENCES content."tDuplicateCandidate" ("id"),
    CONSTRAINT "fkResourceMergeAccount" FOREIGN KEY ("mergeByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckResourceMergeDifferent" CHECK ("sourceResourceId" <> "targetResourceId"),
    CONSTRAINT "ckResourceMergeDecisionSource" CHECK ("decisionSource" IN ('AUTOMATIC', 'COMMUNITY', 'COMPLAINT_RESOLUTION'))
);

CREATE OR REPLACE FUNCTION content."fncValidateResourceMerge"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        WITH RECURSIVE mergePath AS (
            SELECT mergeItem."sourceResourceId", mergeItem."targetResourceId"
            FROM content."tResourceMerge" mergeItem
            WHERE mergeItem."sourceResourceId" = NEW."targetResourceId"
            UNION ALL
            SELECT nextItem."sourceResourceId", nextItem."targetResourceId"
            FROM content."tResourceMerge" nextItem
            JOIN mergePath prior ON nextItem."sourceResourceId" = prior."targetResourceId"
        )
        SELECT 1 FROM mergePath WHERE "targetResourceId" = NEW."sourceResourceId"
    ) THEN
        RAISE EXCEPTION 'Resource merge cycle is not allowed';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgResourceMergeValidate"
BEFORE INSERT OR UPDATE OF "sourceResourceId", "targetResourceId" ON content."tResourceMerge"
FOR EACH ROW EXECUTE FUNCTION content."fncValidateResourceMerge"();

CREATE TRIGGER "trgContentSetUpdateDtm" BEFORE UPDATE ON content."tContent" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();
CREATE TRIGGER "trgContributorSetUpdateDtm" BEFORE UPDATE ON content."tContributor" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();
CREATE TRIGGER "trgPublicationSetUpdateDtm" BEFORE UPDATE ON content."tPublication" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();
CREATE TRIGGER "trgDuplicatePolicySetUpdateDtm" BEFORE UPDATE ON content."tDuplicatePolicy" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();
CREATE TRIGGER "trgContentValidateResourceType" BEFORE INSERT OR UPDATE OF "resourceId" ON content."tContent" FOR EACH ROW EXECUTE FUNCTION core."fncValidateResourceType"('content');
CREATE TRIGGER "trgContributorValidateResourceType" BEFORE INSERT OR UPDATE OF "resourceId" ON content."tContributor" FOR EACH ROW EXECUTE FUNCTION core."fncValidateResourceType"('contributor');
CREATE TRIGGER "trgPublicationValidateResourceType" BEFORE INSERT OR UPDATE OF "resourceId" ON content."tPublication" FOR EACH ROW EXECUTE FUNCTION core."fncValidateResourceType"('publication');

COMMIT;
