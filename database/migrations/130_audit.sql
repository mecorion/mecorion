BEGIN;

CREATE TABLE audit."tAuditCategory" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "defaultRetention" INTERVAL NULL,
    CONSTRAINT "pkAuditCategory" PRIMARY KEY ("id"),
    CONSTRAINT "uqAuditCategoryCode" UNIQUE ("code"),
    CONSTRAINT "ckAuditCategoryRetention" CHECK ("defaultRetention" IS NULL OR "defaultRetention" > INTERVAL '0 seconds')
);

CREATE TABLE audit."tAuditEvent" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auditCategoryId" BIGINT NOT NULL,
    "serviceId" BIGINT NOT NULL,
    "actorAccountId" BIGINT NULL,
    "actorSessionId" BIGINT NULL,
    "actionCode" VARCHAR(128) NOT NULL,
    "targetResourceId" BIGINT NULL,
    "outcomeCode" VARCHAR(16) NOT NULL,
    "correlationPublicId" UUID NULL,
    "ipAddressDigest" BYTEA NULL,
    "details" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "previousEventHash" BYTEA NULL,
    "eventHash" BYTEA NULL,
    "occurDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkAuditEvent" PRIMARY KEY ("id"),
    CONSTRAINT "uqAuditEventPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkAuditEventCategory" FOREIGN KEY ("auditCategoryId") REFERENCES audit."tAuditCategory" ("id"),
    CONSTRAINT "fkAuditEventService" FOREIGN KEY ("serviceId") REFERENCES core."tService" ("id"),
    CONSTRAINT "fkAuditEventActorAccount" FOREIGN KEY ("actorAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkAuditEventActorSession" FOREIGN KEY ("actorSessionId") REFERENCES auth."tSession" ("id"),
    CONSTRAINT "fkAuditEventTargetResource" FOREIGN KEY ("targetResourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "ckAuditEventActionCode" CHECK ("actionCode" ~ '^[a-z][a-z0-9.]{2,127}$'),
    CONSTRAINT "ckAuditEventOutcome" CHECK ("outcomeCode" IN ('SUCCESS', 'DENIED', 'FAILURE', 'PENDING')),
    CONSTRAINT "ckAuditEventIpDigest" CHECK ("ipAddressDigest" IS NULL OR octet_length("ipAddressDigest") >= 16),
    CONSTRAINT "ckAuditEventDetails" CHECK (jsonb_typeof("details") = 'object'),
    CONSTRAINT "ckAuditEventPreviousHash" CHECK ("previousEventHash" IS NULL OR octet_length("previousEventHash") = 32),
    CONSTRAINT "ckAuditEventHash" CHECK ("eventHash" IS NULL OR octet_length("eventHash") = 32)
);

CREATE INDEX "ixAuditEventActor" ON audit."tAuditEvent" ("actorAccountId", "occurDtm" DESC) WHERE "actorAccountId" IS NOT NULL;
CREATE INDEX "ixAuditEventTarget" ON audit."tAuditEvent" ("targetResourceId", "occurDtm" DESC) WHERE "targetResourceId" IS NOT NULL;
CREATE INDEX "ixAuditEventCorrelation" ON audit."tAuditEvent" ("correlationPublicId", "occurDtm") WHERE "correlationPublicId" IS NOT NULL;
CREATE INDEX "ixAuditEventOccurDtmBrin" ON audit."tAuditEvent" USING BRIN ("occurDtm");

CREATE OR REPLACE FUNCTION audit."fncPreventAuditMutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Audit events are immutable';
END;
$$;

CREATE TRIGGER "trgAuditEventPreventMutation"
BEFORE UPDATE OR DELETE ON audit."tAuditEvent"
FOR EACH ROW EXECUTE FUNCTION audit."fncPreventAuditMutation"();

COMMIT;
