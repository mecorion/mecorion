BEGIN;

CREATE TABLE access."tPermission" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"      UUID NOT NULL DEFAULT gen_random_uuid(),
    "serviceId"     BIGINT NOT NULL,
    "code"          VARCHAR(128) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "description"   VARCHAR(512) NULL,
    "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkPermission" PRIMARY KEY ("id"),
    CONSTRAINT "uqPermissionPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqPermissionCode" UNIQUE ("code"),
    CONSTRAINT "fkPermissionService" FOREIGN KEY ("serviceId")
        REFERENCES core."tService" ("id"),
    CONSTRAINT "ckPermissionCode" CHECK ("code" ~ '^[a-z][a-z0-9.]{2,127}$')
);

CREATE INDEX "ixPermissionServiceId"
    ON access."tPermission" ("serviceId", "id");

CREATE TABLE access."tRoleType" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    CONSTRAINT "pkRoleType" PRIMARY KEY ("id"),
    CONSTRAINT "uqRoleTypeCode" UNIQUE ("code"),
    CONSTRAINT "ckRoleTypeCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE access."tRole" (
    "id"                        BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"                  UUID NOT NULL DEFAULT gen_random_uuid(),
    "roleTypeId"                BIGINT NOT NULL,
    "code"                      VARCHAR(64) NOT NULL,
    "name"                      VARCHAR(128) NOT NULL,
    "description"               VARCHAR(512) NULL,
    "requiresGovernanceIdentity" BOOLEAN NOT NULL DEFAULT FALSE,
    "isSystemManaged"           BOOLEAN NOT NULL DEFAULT TRUE,
    "isActive"                  BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm"                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkRole" PRIMARY KEY ("id"),
    CONSTRAINT "uqRolePublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqRoleCode" UNIQUE ("code"),
    CONSTRAINT "fkRoleRoleType" FOREIGN KEY ("roleTypeId")
        REFERENCES access."tRoleType" ("id"),
    CONSTRAINT "ckRoleCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,63}$')
);

CREATE TABLE access."tRolePermission" (
    "roleId"        BIGINT NOT NULL,
    "permissionId"  BIGINT NOT NULL,
    "createDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkRolePermission" PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "fkRolePermissionRole" FOREIGN KEY ("roleId")
        REFERENCES access."tRole" ("id"),
    CONSTRAINT "fkRolePermissionPermission" FOREIGN KEY ("permissionId")
        REFERENCES access."tPermission" ("id")
);

CREATE INDEX "ixRolePermissionPermissionId"
    ON access."tRolePermission" ("permissionId", "roleId");

CREATE TABLE access."tScopeType" (
    "id"                    BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"                  VARCHAR(32) NOT NULL,
    "name"                  VARCHAR(128) NOT NULL,
    "requiresService"       BOOLEAN NOT NULL DEFAULT FALSE,
    "requiresResource"      BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkScopeType" PRIMARY KEY ("id"),
    CONSTRAINT "uqScopeTypeCode" UNIQUE ("code"),
    CONSTRAINT "ckScopeTypeCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE access."tScope" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"      UUID NOT NULL DEFAULT gen_random_uuid(),
    "scopeTypeId"   BIGINT NOT NULL,
    "parentScopeId" BIGINT NULL,
    "serviceId"     BIGINT NULL,
    "resourceId"    BIGINT NULL,
    "code"          VARCHAR(128) NULL,
    "name"          VARCHAR(128) NOT NULL,
    "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkScope" PRIMARY KEY ("id"),
    CONSTRAINT "uqScopePublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqScopeCode" UNIQUE ("code"),
    CONSTRAINT "uqScopeResource" UNIQUE ("resourceId"),
    CONSTRAINT "fkScopeScopeType" FOREIGN KEY ("scopeTypeId")
        REFERENCES access."tScopeType" ("id"),
    CONSTRAINT "fkScopeParent" FOREIGN KEY ("parentScopeId")
        REFERENCES access."tScope" ("id"),
    CONSTRAINT "fkScopeService" FOREIGN KEY ("serviceId")
        REFERENCES core."tService" ("id"),
    CONSTRAINT "fkScopeResource" FOREIGN KEY ("resourceId")
        REFERENCES core."tResource" ("id"),
    CONSTRAINT "ckScopeNotSelfParent" CHECK ("parentScopeId" IS NULL OR "parentScopeId" <> "id"),
    CONSTRAINT "ckScopeCode" CHECK (
        "code" IS NULL OR "code" ~ '^[a-z][a-z0-9._-]{1,127}$'
    )
);

CREATE INDEX "ixScopeParentScopeId"
    ON access."tScope" ("parentScopeId", "id")
    WHERE "parentScopeId" IS NOT NULL;

CREATE INDEX "ixScopeServiceId"
    ON access."tScope" ("serviceId", "id")
    WHERE "serviceId" IS NOT NULL;

CREATE OR REPLACE FUNCTION access."fncValidateScope"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vRequiresService BOOLEAN;
    vRequiresResource BOOLEAN;
BEGIN
    SELECT "requiresService", "requiresResource"
      INTO STRICT vRequiresService, vRequiresResource
      FROM access."tScopeType"
     WHERE "id" = NEW."scopeTypeId";

    IF vRequiresService <> (NEW."serviceId" IS NOT NULL) THEN
        RAISE EXCEPTION 'Scope type and serviceId are inconsistent';
    END IF;

    IF vRequiresResource <> (NEW."resourceId" IS NOT NULL) THEN
        RAISE EXCEPTION 'Scope type and resourceId are inconsistent';
    END IF;

    IF NEW."parentScopeId" IS NOT NULL AND EXISTS (
        WITH RECURSIVE ancestor AS (
            SELECT scope."id", scope."parentScopeId"
              FROM access."tScope" scope
             WHERE scope."id" = NEW."parentScopeId"
            UNION ALL
            SELECT parent."id", parent."parentScopeId"
              FROM access."tScope" parent
              JOIN ancestor child ON child."parentScopeId" = parent."id"
        )
        SELECT 1 FROM ancestor WHERE "id" = NEW."id"
    ) THEN
        RAISE EXCEPTION 'Scope hierarchy cycle is not allowed';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgScopeValidate"
BEFORE INSERT OR UPDATE OF "scopeTypeId", "parentScopeId", "serviceId", "resourceId"
ON access."tScope"
FOR EACH ROW EXECUTE FUNCTION access."fncValidateScope"();

CREATE TABLE access."tRoleAssignmentStatus" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "isEffective"   BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkRoleAssignmentStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqRoleAssignmentStatusCode" UNIQUE ("code"),
    CONSTRAINT "ckRoleAssignmentStatusCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE access."tRoleAssignment" (
    "id"                        BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"                  UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId"                 BIGINT NOT NULL,
    "roleId"                    BIGINT NOT NULL,
    "scopeId"                   BIGINT NOT NULL,
    "roleAssignmentStatusId"    BIGINT NOT NULL,
    "assignByAccountId"         BIGINT NULL,
    "assignDtm"                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validFromDtm"              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntilDtm"             TIMESTAMPTZ NULL,
    "revokeDtm"                 TIMESTAMPTZ NULL,
    "revokeByAccountId"         BIGINT NULL,
    "revokeReasonCode"          VARCHAR(64) NULL,
    CONSTRAINT "pkRoleAssignment" PRIMARY KEY ("id"),
    CONSTRAINT "uqRoleAssignmentPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkRoleAssignmentAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkRoleAssignmentRole" FOREIGN KEY ("roleId")
        REFERENCES access."tRole" ("id"),
    CONSTRAINT "fkRoleAssignmentScope" FOREIGN KEY ("scopeId")
        REFERENCES access."tScope" ("id"),
    CONSTRAINT "fkRoleAssignmentStatus" FOREIGN KEY ("roleAssignmentStatusId")
        REFERENCES access."tRoleAssignmentStatus" ("id"),
    CONSTRAINT "fkRoleAssignmentAssignBy" FOREIGN KEY ("assignByAccountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkRoleAssignmentRevokeBy" FOREIGN KEY ("revokeByAccountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckRoleAssignmentValidity" CHECK (
        "validUntilDtm" IS NULL OR "validUntilDtm" > "validFromDtm"
    ),
    CONSTRAINT "ckRoleAssignmentRevokeDtm" CHECK (
        "revokeDtm" IS NULL OR "revokeDtm" >= "assignDtm"
    ),
    CONSTRAINT "ckRoleAssignmentRevokeReason" CHECK (
        ("revokeDtm" IS NULL AND "revokeReasonCode" IS NULL)
        OR ("revokeDtm" IS NOT NULL AND "revokeReasonCode" IS NOT NULL)
    )
);

CREATE OR REPLACE FUNCTION access."fncValidateRoleAssignment"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vRequiresGovernanceIdentity BOOLEAN;
BEGIN
    SELECT "requiresGovernanceIdentity"
      INTO STRICT vRequiresGovernanceIdentity
      FROM access."tRole"
     WHERE "id" = NEW."roleId";

    IF vRequiresGovernanceIdentity AND NOT EXISTS (
        SELECT 1
          FROM account."tGovernanceEligibility" eligibility
          JOIN account."tGovernanceEligibilityStatus" status
            ON status."id" = eligibility."governanceEligibilityStatusId"
         WHERE eligibility."accountId" = NEW."accountId"
           AND status."code" = 'ELIGIBLE'
           AND eligibility."grantDtm" IS NOT NULL
           AND eligibility."grantDtm" <= CURRENT_TIMESTAMP
           AND eligibility."revokeDtm" IS NULL
    ) THEN
        RAISE EXCEPTION 'Role requires an active governance identity';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgRoleAssignmentValidate"
BEFORE INSERT OR UPDATE OF "accountId", "roleId"
ON access."tRoleAssignment"
FOR EACH ROW EXECUTE FUNCTION access."fncValidateRoleAssignment"();

CREATE UNIQUE INDEX "uqRoleAssignmentActive"
    ON access."tRoleAssignment" ("accountId", "roleId", "scopeId")
    WHERE "revokeDtm" IS NULL;

CREATE INDEX "ixRoleAssignmentEffectiveAccount"
    ON access."tRoleAssignment" ("accountId", "scopeId", "roleId")
    WHERE "revokeDtm" IS NULL;

CREATE INDEX "ixRoleAssignmentScopeId"
    ON access."tRoleAssignment" ("scopeId", "roleId", "accountId")
    WHERE "revokeDtm" IS NULL;

CREATE TRIGGER "trgPermissionSetUpdateDtm"
BEFORE UPDATE ON access."tPermission"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

CREATE TRIGGER "trgRoleSetUpdateDtm"
BEFORE UPDATE ON access."tRole"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

CREATE TRIGGER "trgScopeSetUpdateDtm"
BEFORE UPDATE ON access."tScope"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

COMMIT;
