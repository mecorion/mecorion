BEGIN;

CREATE TABLE workflow."tRequestType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "ownerServiceId" BIGINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkRequestType" PRIMARY KEY ("id"),
    CONSTRAINT "uqRequestTypeCode" UNIQUE ("code"),
    CONSTRAINT "fkRequestTypeOwnerService" FOREIGN KEY ("ownerServiceId") REFERENCES core."tService" ("id")
);

CREATE TABLE workflow."tRequestStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkRequestStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqRequestStatusCode" UNIQUE ("code")
);

CREATE TABLE workflow."tRequest" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestTypeId" BIGINT NOT NULL,
    "requestStatusId" BIGINT NOT NULL,
    "createByAccountId" BIGINT NULL,
    "title" VARCHAR(512) NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitDtm" TIMESTAMPTZ NULL,
    "completeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkRequest" PRIMARY KEY ("id"),
    CONSTRAINT "uqRequestPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkRequestType" FOREIGN KEY ("requestTypeId") REFERENCES workflow."tRequestType" ("id"),
    CONSTRAINT "fkRequestStatus" FOREIGN KEY ("requestStatusId") REFERENCES workflow."tRequestStatus" ("id"),
    CONSTRAINT "fkRequestCreateByAccount" FOREIGN KEY ("createByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckRequestTitle" CHECK (length(btrim("title")) BETWEEN 1 AND 512),
    CONSTRAINT "ckRequestPayload" CHECK (jsonb_typeof("payload") = 'object'),
    CONSTRAINT "ckRequestSubmitDtm" CHECK ("submitDtm" IS NULL OR "submitDtm" >= "createDtm"),
    CONSTRAINT "ckRequestCompleteDtm" CHECK ("completeDtm" IS NULL OR "completeDtm" >= "createDtm")
);

CREATE INDEX "ixRequestQueue" ON workflow."tRequest" ("requestStatusId", "requestTypeId", "createDtm", "id");
CREATE INDEX "ixRequestAccount" ON workflow."tRequest" ("createByAccountId", "createDtm" DESC, "id" DESC) WHERE "createByAccountId" IS NOT NULL;

CREATE TABLE workflow."tRequestTarget" (
    "requestId" BIGINT NOT NULL,
    "resourceId" BIGINT NOT NULL,
    "targetRole" VARCHAR(32) NOT NULL DEFAULT 'PRIMARY',
    CONSTRAINT "pkRequestTarget" PRIMARY KEY ("requestId", "resourceId", "targetRole"),
    CONSTRAINT "fkRequestTargetRequest" FOREIGN KEY ("requestId") REFERENCES workflow."tRequest" ("id"),
    CONSTRAINT "fkRequestTargetResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "ckRequestTargetRole" CHECK ("targetRole" IN ('PRIMARY', 'RELATED', 'DUPLICATE_SOURCE', 'DUPLICATE_TARGET'))
);

CREATE TABLE workflow."tRequestRevision" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "requestId" BIGINT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createByAccountId" BIGINT NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkRequestRevision" PRIMARY KEY ("id"),
    CONSTRAINT "uqRequestRevisionNumber" UNIQUE ("requestId", "revisionNumber"),
    CONSTRAINT "fkRequestRevisionRequest" FOREIGN KEY ("requestId") REFERENCES workflow."tRequest" ("id"),
    CONSTRAINT "fkRequestRevisionAccount" FOREIGN KEY ("createByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckRequestRevisionNumber" CHECK ("revisionNumber" > 0),
    CONSTRAINT "ckRequestRevisionPayload" CHECK (jsonb_typeof("payload") = 'object')
);

CREATE TABLE workflow."tReviewType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkReviewType" PRIMARY KEY ("id"),
    CONSTRAINT "uqReviewTypeCode" UNIQUE ("code")
);

CREATE TABLE workflow."tReview" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestId" BIGINT NOT NULL,
    "reviewTypeId" BIGINT NOT NULL,
    "reviewByAccountId" BIGINT NULL,
    "reviewerRoleCode" VARCHAR(64) NULL,
    "decisionCode" VARCHAR(32) NOT NULL,
    "score" NUMERIC(5,4) NULL,
    "comment" TEXT NULL,
    "evidence" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkReview" PRIMARY KEY ("id"),
    CONSTRAINT "uqReviewPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkReviewRequest" FOREIGN KEY ("requestId") REFERENCES workflow."tRequest" ("id"),
    CONSTRAINT "fkReviewType" FOREIGN KEY ("reviewTypeId") REFERENCES workflow."tReviewType" ("id"),
    CONSTRAINT "fkReviewAccount" FOREIGN KEY ("reviewByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckReviewActor" CHECK ("reviewByAccountId" IS NOT NULL OR "reviewerRoleCode" = 'SYSTEM'),
    CONSTRAINT "ckReviewDecision" CHECK ("decisionCode" IN ('APPROVE', 'REJECT', 'NEEDS_CHANGES', 'ABSTAIN', 'POSSIBLE_DUPLICATE')),
    CONSTRAINT "ckReviewScore" CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 1),
    CONSTRAINT "ckReviewEvidence" CHECK (jsonb_typeof("evidence") = 'object')
);

CREATE INDEX "ixReviewRequest" ON workflow."tReview" ("requestId", "createDtm", "id");

CREATE TABLE workflow."tRequestStatusHistory" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "requestId" BIGINT NOT NULL,
    "requestStatusId" BIGINT NOT NULL,
    "changeByAccountId" BIGINT NULL,
    "changeSource" VARCHAR(32) NOT NULL,
    "reason" TEXT NULL,
    "changeDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkRequestStatusHistory" PRIMARY KEY ("id"),
    CONSTRAINT "fkRequestStatusHistoryRequest" FOREIGN KEY ("requestId") REFERENCES workflow."tRequest" ("id"),
    CONSTRAINT "fkRequestStatusHistoryStatus" FOREIGN KEY ("requestStatusId") REFERENCES workflow."tRequestStatus" ("id"),
    CONSTRAINT "fkRequestStatusHistoryAccount" FOREIGN KEY ("changeByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckRequestStatusHistorySource" CHECK ("changeSource" IN ('AUTHOR', 'SYSTEM', 'COMMUNITY', 'COMPLAINT_PROCESS'))
);

CREATE INDEX "ixRequestStatusHistoryRequest" ON workflow."tRequestStatusHistory" ("requestId", "changeDtm" DESC, "id" DESC);
CREATE TRIGGER "trgRequestSetUpdateDtm" BEFORE UPDATE ON workflow."tRequest" FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

COMMIT;
