BEGIN;

CREATE TABLE account."tAccountStatus" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "isLoginAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkAccountStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqAccountStatusCode" UNIQUE ("code"),
    CONSTRAINT "ckAccountStatusCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE account."tAccount" (
    "id"                    BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountStatusId"       BIGINT NOT NULL,
    "registerDtm"           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusChangeDtm"       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletionRequestDtm"    TIMESTAMPTZ NULL,
    "anonymizeDtm"          TIMESTAMPTZ NULL,
    "createDtm"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkAccount" PRIMARY KEY ("id"),
    CONSTRAINT "uqAccountPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkAccountAccountStatus" FOREIGN KEY ("accountStatusId")
        REFERENCES account."tAccountStatus" ("id"),
    CONSTRAINT "ckAccountDeletionRequestDtm" CHECK (
        "deletionRequestDtm" IS NULL OR "deletionRequestDtm" >= "registerDtm"
    ),
    CONSTRAINT "ckAccountAnonymizeDtm" CHECK (
        "anonymizeDtm" IS NULL OR "anonymizeDtm" >= "registerDtm"
    )
);

CREATE INDEX "ixAccountAccountStatusId"
    ON account."tAccount" ("accountStatusId", "id");

CREATE TABLE account."tProfile" (
    "accountId"         BIGINT NOT NULL,
    "resourceId"        BIGINT NOT NULL,
    "username"          CITEXT NOT NULL,
    "displayName"       VARCHAR(128) NOT NULL,
    "bio"               VARCHAR(1024) NULL,
    "avatarResourceId"  BIGINT NULL,
    "isDiscoverable"    BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkProfile" PRIMARY KEY ("accountId"),
    CONSTRAINT "uqProfileResourceId" UNIQUE ("resourceId"),
    CONSTRAINT "uqProfileUsername" UNIQUE ("username"),
    CONSTRAINT "fkProfileAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkProfileResource" FOREIGN KEY ("resourceId")
        REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkProfileAvatarResource" FOREIGN KEY ("avatarResourceId")
        REFERENCES core."tResource" ("id"),
    CONSTRAINT "ckProfileUsername" CHECK (
        "username"::TEXT ~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$'
    ),
    CONSTRAINT "ckProfileDisplayName" CHECK (length(btrim("displayName")) BETWEEN 1 AND 128)
);

CREATE TABLE account."tAccountStatusHistory" (
    "id"                    BIGINT GENERATED ALWAYS AS IDENTITY,
    "accountId"             BIGINT NOT NULL,
    "accountStatusId"       BIGINT NOT NULL,
    "reasonCode"            VARCHAR(64) NULL,
    "changedByAccountId"    BIGINT NULL,
    "changeDtm"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkAccountStatusHistory" PRIMARY KEY ("id"),
    CONSTRAINT "fkAccountStatusHistoryAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkAccountStatusHistoryStatus" FOREIGN KEY ("accountStatusId")
        REFERENCES account."tAccountStatus" ("id"),
    CONSTRAINT "fkAccountStatusHistoryChangedBy" FOREIGN KEY ("changedByAccountId")
        REFERENCES account."tAccount" ("id")
);

CREATE INDEX "ixAccountStatusHistoryAccountId"
    ON account."tAccountStatusHistory" ("accountId", "changeDtm" DESC, "id" DESC);

CREATE TABLE account."tPersonAnchorStatus" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    CONSTRAINT "pkPersonAnchorStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqPersonAnchorStatusCode" UNIQUE ("code"),
    CONSTRAINT "ckPersonAnchorStatusCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE account."tPersonAnchor" (
    "id"                    BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "personAnchorStatusId"  BIGINT NOT NULL,
    "verificationLevel"     SMALLINT NOT NULL DEFAULT 0,
    "verifiedDtm"           TIMESTAMPTZ NULL,
    "createDtm"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkPersonAnchor" PRIMARY KEY ("id"),
    CONSTRAINT "uqPersonAnchorPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkPersonAnchorStatus" FOREIGN KEY ("personAnchorStatusId")
        REFERENCES account."tPersonAnchorStatus" ("id"),
    CONSTRAINT "ckPersonAnchorVerificationLevel" CHECK ("verificationLevel" BETWEEN 0 AND 10),
    CONSTRAINT "ckPersonAnchorVerifiedDtm" CHECK (
        ("verificationLevel" = 0 AND "verifiedDtm" IS NULL)
        OR ("verificationLevel" > 0 AND "verifiedDtm" IS NOT NULL)
    )
);

CREATE TABLE account."tAccountPerson" (
    "id"                BIGINT GENERATED ALWAYS AS IDENTITY,
    "accountId"         BIGINT NOT NULL,
    "personAnchorId"    BIGINT NOT NULL,
    "linkType"          VARCHAR(32) NOT NULL,
    "linkDtm"           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlinkDtm"         TIMESTAMPTZ NULL,
    CONSTRAINT "pkAccountPerson" PRIMARY KEY ("id"),
    CONSTRAINT "uqAccountPersonPair" UNIQUE ("accountId", "personAnchorId"),
    CONSTRAINT "fkAccountPersonAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkAccountPersonPersonAnchor" FOREIGN KEY ("personAnchorId")
        REFERENCES account."tPersonAnchor" ("id"),
    CONSTRAINT "ckAccountPersonLinkType" CHECK (
        "linkType" IN ('PRIMARY', 'RECOVERED', 'HISTORICAL', 'DUPLICATE')
    ),
    CONSTRAINT "ckAccountPersonUnlinkDtm" CHECK (
        "unlinkDtm" IS NULL OR "unlinkDtm" >= "linkDtm"
    )
);

CREATE UNIQUE INDEX "uqAccountPersonActiveAccount"
    ON account."tAccountPerson" ("accountId")
    WHERE "unlinkDtm" IS NULL;

CREATE INDEX "ixAccountPersonPersonAnchorId"
    ON account."tAccountPerson" ("personAnchorId", "linkDtm" DESC);

CREATE TABLE account."tGovernanceEligibilityStatus" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    CONSTRAINT "pkGovernanceEligibilityStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqGovernanceEligibilityStatusCode" UNIQUE ("code"),
    CONSTRAINT "ckGovernanceEligibilityStatusCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE account."tGovernanceEligibility" (
    "id"                            BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"                      UUID NOT NULL DEFAULT gen_random_uuid(),
    "personAnchorId"                BIGINT NOT NULL,
    "accountId"                     BIGINT NOT NULL,
    "governanceEligibilityStatusId" BIGINT NOT NULL,
    "grantDtm"                      TIMESTAMPTZ NULL,
    "revokeDtm"                     TIMESTAMPTZ NULL,
    "reviewRequired"                BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm"                     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"                     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkGovernanceEligibility" PRIMARY KEY ("id"),
    CONSTRAINT "uqGovernanceEligibilityPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkGovernanceEligibilityAccountPerson" FOREIGN KEY ("accountId", "personAnchorId")
        REFERENCES account."tAccountPerson" ("accountId", "personAnchorId"),
    CONSTRAINT "fkGovernanceEligibilityStatus" FOREIGN KEY ("governanceEligibilityStatusId")
        REFERENCES account."tGovernanceEligibilityStatus" ("id"),
    CONSTRAINT "ckGovernanceEligibilityDates" CHECK (
        "revokeDtm" IS NULL OR ("grantDtm" IS NOT NULL AND "revokeDtm" >= "grantDtm")
    )
);

CREATE UNIQUE INDEX "uqGovernanceEligibilityActivePerson"
    ON account."tGovernanceEligibility" ("personAnchorId")
    WHERE "revokeDtm" IS NULL;

CREATE UNIQUE INDEX "uqGovernanceEligibilityActiveAccount"
    ON account."tGovernanceEligibility" ("accountId")
    WHERE "revokeDtm" IS NULL;

CREATE TABLE account."tIdentityEvidenceType" (
    "id"                BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"              VARCHAR(32) NOT NULL,
    "name"              VARCHAR(128) NOT NULL,
    "defaultRetention"  INTERVAL NOT NULL DEFAULT INTERVAL '5 years',
    "isActive"          BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkIdentityEvidenceType" PRIMARY KEY ("id"),
    CONSTRAINT "uqIdentityEvidenceTypeCode" UNIQUE ("code"),
    CONSTRAINT "ckIdentityEvidenceTypeCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$'),
    CONSTRAINT "ckIdentityEvidenceTypeRetention" CHECK ("defaultRetention" > INTERVAL '0 seconds')
);

CREATE TABLE account."tRetainedIdentityEvidence" (
    "id"                        BIGINT GENERATED ALWAYS AS IDENTITY,
    "personAnchorId"            BIGINT NOT NULL,
    "identityEvidenceTypeId"    BIGINT NOT NULL,
    "evidenceDigest"            BYTEA NOT NULL,
    "encryptedPayload"          BYTEA NULL,
    "keyVersion"                VARCHAR(64) NOT NULL,
    "collectDtm"                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retainUntilDtm"            TIMESTAMPTZ NOT NULL,
    "eraseDtm"                  TIMESTAMPTZ NULL,
    CONSTRAINT "pkRetainedIdentityEvidence" PRIMARY KEY ("id"),
    CONSTRAINT "fkRetainedIdentityEvidencePersonAnchor" FOREIGN KEY ("personAnchorId")
        REFERENCES account."tPersonAnchor" ("id"),
    CONSTRAINT "fkRetainedIdentityEvidenceType" FOREIGN KEY ("identityEvidenceTypeId")
        REFERENCES account."tIdentityEvidenceType" ("id"),
    CONSTRAINT "ckRetainedIdentityEvidenceDigest" CHECK (octet_length("evidenceDigest") >= 32),
    CONSTRAINT "ckRetainedIdentityEvidenceRetainUntilDtm" CHECK ("retainUntilDtm" > "collectDtm"),
    CONSTRAINT "ckRetainedIdentityEvidenceEraseDtm" CHECK (
        "eraseDtm" IS NULL OR "eraseDtm" >= "collectDtm"
    )
);

CREATE UNIQUE INDEX "uqRetainedIdentityEvidenceActiveDigest"
    ON account."tRetainedIdentityEvidence" ("identityEvidenceTypeId", "evidenceDigest")
    WHERE "eraseDtm" IS NULL;

CREATE INDEX "ixRetainedIdentityEvidenceRetention"
    ON account."tRetainedIdentityEvidence" ("retainUntilDtm", "id")
    WHERE "eraseDtm" IS NULL;

CREATE TABLE account."tDeletionRequestStatus" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    CONSTRAINT "pkDeletionRequestStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqDeletionRequestStatusCode" UNIQUE ("code"),
    CONSTRAINT "ckDeletionRequestStatusCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE account."tDeletionRequest" (
    "id"                        BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"                  UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId"                 BIGINT NOT NULL,
    "deletionRequestStatusId"   BIGINT NOT NULL,
    "requestDtm"                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executeAfterDtm"           TIMESTAMPTZ NOT NULL,
    "completeDtm"               TIMESTAMPTZ NULL,
    "cancelDtm"                 TIMESTAMPTZ NULL,
    CONSTRAINT "pkDeletionRequest" PRIMARY KEY ("id"),
    CONSTRAINT "uqDeletionRequestPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkDeletionRequestAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkDeletionRequestStatus" FOREIGN KEY ("deletionRequestStatusId")
        REFERENCES account."tDeletionRequestStatus" ("id"),
    CONSTRAINT "ckDeletionRequestExecuteAfterDtm" CHECK ("executeAfterDtm" >= "requestDtm"),
    CONSTRAINT "ckDeletionRequestCompleteDtm" CHECK (
        "completeDtm" IS NULL OR "completeDtm" >= "requestDtm"
    ),
    CONSTRAINT "ckDeletionRequestCancelDtm" CHECK (
        "cancelDtm" IS NULL OR "cancelDtm" >= "requestDtm"
    ),
    CONSTRAINT "ckDeletionRequestResolution" CHECK (
        NOT ("completeDtm" IS NOT NULL AND "cancelDtm" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "uqDeletionRequestActiveAccount"
    ON account."tDeletionRequest" ("accountId")
    WHERE "completeDtm" IS NULL AND "cancelDtm" IS NULL;

CREATE TRIGGER "trgAccountSetUpdateDtm"
BEFORE UPDATE ON account."tAccount"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

CREATE TRIGGER "trgProfileSetUpdateDtm"
BEFORE UPDATE ON account."tProfile"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

CREATE TRIGGER "trgProfileValidateResourceType"
BEFORE INSERT OR UPDATE OF "resourceId" ON account."tProfile"
FOR EACH ROW EXECUTE FUNCTION core."fncValidateResourceType"('profile');

CREATE TRIGGER "trgPersonAnchorSetUpdateDtm"
BEFORE UPDATE ON account."tPersonAnchor"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

CREATE TRIGGER "trgGovernanceEligibilitySetUpdateDtm"
BEFORE UPDATE ON account."tGovernanceEligibility"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

COMMIT;
