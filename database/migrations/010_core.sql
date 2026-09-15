BEGIN;

CREATE TABLE core."tService" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"      UUID NOT NULL DEFAULT gen_random_uuid(),
    "code"          VARCHAR(64) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkService" PRIMARY KEY ("id"),
    CONSTRAINT "uqServicePublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqServiceCode" UNIQUE ("code"),
    CONSTRAINT "ckServiceCode" CHECK ("code" ~ '^[a-z][a-z0-9._-]{1,63}$')
);

CREATE TABLE core."tResourceType" (
    "id"                BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"              VARCHAR(64) NOT NULL,
    "name"              VARCHAR(128) NOT NULL,
    "ownerServiceId"    BIGINT NOT NULL,
    "isActive"          BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkResourceType" PRIMARY KEY ("id"),
    CONSTRAINT "uqResourceTypeCode" UNIQUE ("code"),
    CONSTRAINT "fkResourceTypeOwnerService" FOREIGN KEY ("ownerServiceId")
        REFERENCES core."tService" ("id"),
    CONSTRAINT "ckResourceTypeCode" CHECK ("code" ~ '^[a-z][a-z0-9._-]{1,63}$')
);

CREATE TABLE core."tResource" (
    "id"                BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "resourceTypeId"    BIGINT NOT NULL,
    "createDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleteDtm"         TIMESTAMPTZ NULL,
    CONSTRAINT "pkResource" PRIMARY KEY ("id"),
    CONSTRAINT "uqResourcePublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkResourceResourceType" FOREIGN KEY ("resourceTypeId")
        REFERENCES core."tResourceType" ("id"),
    CONSTRAINT "ckResourceDeleteDtm" CHECK (
        "deleteDtm" IS NULL OR "deleteDtm" >= "createDtm"
    )
);

CREATE INDEX "ixResourceResourceTypeId"
    ON core."tResource" ("resourceTypeId", "id")
    WHERE "deleteDtm" IS NULL;

CREATE OR REPLACE FUNCTION core."fncValidateResourceType"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vResourceTypeCode VARCHAR(64);
BEGIN
    SELECT resourceType."code"
      INTO STRICT vResourceTypeCode
      FROM core."tResource" resource
      JOIN core."tResourceType" resourceType ON resourceType."id" = resource."resourceTypeId"
     WHERE resource."id" = NEW."resourceId"
       AND resource."deleteDtm" IS NULL;

    IF vResourceTypeCode <> TG_ARGV[0] THEN
        RAISE EXCEPTION 'Expected resource type %, received %', TG_ARGV[0], vResourceTypeCode;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TABLE core."tLanguage" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(16) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "nativeName"    VARCHAR(128) NULL,
    "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkLanguage" PRIMARY KEY ("id"),
    CONSTRAINT "uqLanguageCode" UNIQUE ("code"),
    CONSTRAINT "ckLanguageCode" CHECK ("code" ~ '^[a-z]{2,3}(-[A-Z]{2})?$')
);

CREATE TABLE core."tTerritory" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(8) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkTerritory" PRIMARY KEY ("id"),
    CONSTRAINT "uqTerritoryCode" UNIQUE ("code"),
    CONSTRAINT "ckTerritoryCode" CHECK ("code" ~ '^([A-Z]{2}|WORLD)$')
);

CREATE TABLE core."tOutboxEvent" (
    "id"                    BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerServiceId"        BIGINT NOT NULL,
    "aggregatePublicId"     UUID NULL,
    "eventType"             VARCHAR(128) NOT NULL,
    "eventVersion"          INTEGER NOT NULL DEFAULT 1,
    "payload"               JSONB NOT NULL,
    "occurDtm"              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishDtm"            TIMESTAMPTZ NULL,
    "attemptCount"          INTEGER NOT NULL DEFAULT 0,
    "lastError"             TEXT NULL,
    CONSTRAINT "pkOutboxEvent" PRIMARY KEY ("id"),
    CONSTRAINT "uqOutboxEventPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkOutboxEventOwnerService" FOREIGN KEY ("ownerServiceId")
        REFERENCES core."tService" ("id"),
    CONSTRAINT "ckOutboxEventType" CHECK ("eventType" ~ '^[a-z][a-z0-9.]{2,127}$'),
    CONSTRAINT "ckOutboxEventVersion" CHECK ("eventVersion" > 0),
    CONSTRAINT "ckOutboxEventPayload" CHECK (jsonb_typeof("payload") = 'object'),
    CONSTRAINT "ckOutboxEventAttemptCount" CHECK ("attemptCount" >= 0),
    CONSTRAINT "ckOutboxEventPublishDtm" CHECK (
        "publishDtm" IS NULL OR "publishDtm" >= "occurDtm"
    )
);

CREATE INDEX "ixOutboxEventUnpublished"
    ON core."tOutboxEvent" ("occurDtm", "id")
    WHERE "publishDtm" IS NULL;

CREATE TRIGGER "trgServiceSetUpdateDtm"
BEFORE UPDATE ON core."tService"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

CREATE TRIGGER "trgResourceTypeSetUpdateDtm"
BEFORE UPDATE ON core."tResourceType"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

CREATE TRIGGER "trgResourceSetUpdateDtm"
BEFORE UPDATE ON core."tResource"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

COMMIT;
