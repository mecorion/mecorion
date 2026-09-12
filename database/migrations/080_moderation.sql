BEGIN;

CREATE TABLE moderation."tReportReason" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkReportReason" PRIMARY KEY ("id"),
    CONSTRAINT "uqReportReasonCode" UNIQUE ("code")
);

CREATE TABLE moderation."tReportStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkReportStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqReportStatusCode" UNIQUE ("code")
);

CREATE TABLE moderation."tReport" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resourceId" BIGINT NOT NULL,
    "reportByAccountId" BIGINT NULL,
    "reportReasonId" BIGINT NOT NULL,
    "reportStatusId" BIGINT NOT NULL,
    "description" TEXT NULL,
    "evidence" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkReport" PRIMARY KEY ("id"),
    CONSTRAINT "uqReportPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkReportResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkReportAccount" FOREIGN KEY ("reportByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkReportReason" FOREIGN KEY ("reportReasonId") REFERENCES moderation."tReportReason" ("id"),
    CONSTRAINT "fkReportStatus" FOREIGN KEY ("reportStatusId") REFERENCES moderation."tReportStatus" ("id"),
    CONSTRAINT "ckReportEvidence" CHECK (jsonb_typeof("evidence") = 'object'),
    CONSTRAINT "ckReportCloseDtm" CHECK ("closeDtm" IS NULL OR "closeDtm" >= "createDtm")
);

CREATE INDEX "ixReportQueue" ON moderation."tReport" ("reportStatusId", "createDtm", "id");
CREATE INDEX "ixReportResource" ON moderation."tReport" ("resourceId", "createDtm" DESC, "id" DESC);

CREATE TABLE moderation."tRestrictionStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isEffective" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkRestrictionStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqRestrictionStatusCode" UNIQUE ("code")
);

CREATE TABLE moderation."tRestriction" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" BIGINT NOT NULL,
    "scopeId" BIGINT NOT NULL,
    "permissionId" BIGINT NULL,
    "restrictionStatusId" BIGINT NOT NULL,
    "sourceType" VARCHAR(32) NOT NULL,
    "sourceReportId" BIGINT NULL,
    "reasonCode" VARCHAR(64) NOT NULL,
    "details" TEXT NULL,
    "validFromDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntilDtm" TIMESTAMPTZ NULL,
    "createByAccountId" BIGINT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkRestriction" PRIMARY KEY ("id"),
    CONSTRAINT "uqRestrictionPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkRestrictionAccount" FOREIGN KEY ("accountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkRestrictionScope" FOREIGN KEY ("scopeId") REFERENCES access."tScope" ("id"),
    CONSTRAINT "fkRestrictionPermission" FOREIGN KEY ("permissionId") REFERENCES access."tPermission" ("id"),
    CONSTRAINT "fkRestrictionStatus" FOREIGN KEY ("restrictionStatusId") REFERENCES moderation."tRestrictionStatus" ("id"),
    CONSTRAINT "fkRestrictionReport" FOREIGN KEY ("sourceReportId") REFERENCES moderation."tReport" ("id"),
    CONSTRAINT "fkRestrictionCreateByAccount" FOREIGN KEY ("createByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckRestrictionSource" CHECK ("sourceType" IN ('AUTOMATIC', 'COMMUNITY', 'COMPLAINT', 'SECURITY', 'LEGAL')),
    CONSTRAINT "ckRestrictionSourceReport" CHECK ("sourceType" <> 'COMPLAINT' OR "sourceReportId" IS NOT NULL),
    CONSTRAINT "ckRestrictionValidity" CHECK ("validUntilDtm" IS NULL OR "validUntilDtm" > "validFromDtm"),
    CONSTRAINT "ckRestrictionRevokeDtm" CHECK ("revokeDtm" IS NULL OR "revokeDtm" >= "createDtm")
);

CREATE INDEX "ixRestrictionEffectiveAccount" ON moderation."tRestriction" ("accountId", "scopeId", "permissionId") WHERE "revokeDtm" IS NULL;
CREATE INDEX "ixRestrictionExpiration" ON moderation."tRestriction" ("validUntilDtm", "id") WHERE "validUntilDtm" IS NOT NULL AND "revokeDtm" IS NULL;

CREATE TABLE moderation."tAppealStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkAppealStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqAppealStatusCode" UNIQUE ("code")
);

CREATE TABLE moderation."tAppeal" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restrictionId" BIGINT NOT NULL,
    "appealStatusId" BIGINT NOT NULL,
    "accountId" BIGINT NOT NULL,
    "statement" TEXT NOT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolveDtm" TIMESTAMPTZ NULL,
    "resolution" TEXT NULL,
    CONSTRAINT "pkAppeal" PRIMARY KEY ("id"),
    CONSTRAINT "uqAppealPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkAppealRestriction" FOREIGN KEY ("restrictionId") REFERENCES moderation."tRestriction" ("id"),
    CONSTRAINT "fkAppealStatus" FOREIGN KEY ("appealStatusId") REFERENCES moderation."tAppealStatus" ("id"),
    CONSTRAINT "fkAppealAccount" FOREIGN KEY ("accountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckAppealStatement" CHECK (length(btrim("statement")) > 0),
    CONSTRAINT "ckAppealResolveDtm" CHECK ("resolveDtm" IS NULL OR "resolveDtm" >= "createDtm")
);

CREATE UNIQUE INDEX "uqAppealActiveRestrictionAccount" ON moderation."tAppeal" ("restrictionId", "accountId") WHERE "resolveDtm" IS NULL;
CREATE TRIGGER "trgReportSetUpdateDtm" BEFORE UPDATE ON moderation."tReport" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

COMMIT;
