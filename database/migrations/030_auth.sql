BEGIN;

CREATE TABLE auth."tIdentityType" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkIdentityType" PRIMARY KEY ("id"),
    CONSTRAINT "uqIdentityTypeCode" UNIQUE ("code"),
    CONSTRAINT "ckIdentityTypeCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE auth."tIdentity" (
    "id"                BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId"         BIGINT NOT NULL,
    "identityTypeId"    BIGINT NOT NULL,
    "normalizedValue"   CITEXT NULL,
    "displayValue"      VARCHAR(320) NULL,
    "isPrimary"         BOOLEAN NOT NULL DEFAULT FALSE,
    "isVerified"        BOOLEAN NOT NULL DEFAULT FALSE,
    "verifyDtm"         TIMESTAMPTZ NULL,
    "createDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokeDtm"         TIMESTAMPTZ NULL,
    CONSTRAINT "pkIdentity" PRIMARY KEY ("id"),
    CONSTRAINT "uqIdentityPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqIdentityIdAccountId" UNIQUE ("id", "accountId"),
    CONSTRAINT "fkIdentityAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkIdentityIdentityType" FOREIGN KEY ("identityTypeId")
        REFERENCES auth."tIdentityType" ("id"),
    CONSTRAINT "ckIdentityNormalizedValue" CHECK (
        ("revokeDtm" IS NULL AND length(btrim("normalizedValue"::TEXT)) BETWEEN 1 AND 320)
        OR "revokeDtm" IS NOT NULL
    ),
    CONSTRAINT "ckIdentityVerification" CHECK (
        ("isVerified" = FALSE AND "verifyDtm" IS NULL)
        OR ("isVerified" = TRUE AND "verifyDtm" IS NOT NULL)
    ),
    CONSTRAINT "ckIdentityRevokeDtm" CHECK (
        "revokeDtm" IS NULL OR "revokeDtm" >= "createDtm"
    )
);

CREATE UNIQUE INDEX "uqIdentityActiveTypeValue"
    ON auth."tIdentity" ("identityTypeId", "normalizedValue")
    WHERE "revokeDtm" IS NULL;

CREATE UNIQUE INDEX "uqIdentityPrimaryAccountType"
    ON auth."tIdentity" ("accountId", "identityTypeId")
    WHERE "isPrimary" = TRUE AND "revokeDtm" IS NULL;

CREATE INDEX "ixIdentityAccountId"
    ON auth."tIdentity" ("accountId", "id")
    WHERE "revokeDtm" IS NULL;

CREATE TABLE auth."tCredentialType" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "pkCredentialType" PRIMARY KEY ("id"),
    CONSTRAINT "uqCredentialTypeCode" UNIQUE ("code"),
    CONSTRAINT "ckCredentialTypeCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE auth."tCredential" (
    "id"                    BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId"             BIGINT NOT NULL,
    "credentialTypeId"      BIGINT NOT NULL,
    "credentialIdentifier"  VARCHAR(512) NULL,
    "secretHash"            BYTEA NOT NULL,
    "algorithm"             VARCHAR(64) NOT NULL,
    "algorithmParameters"   JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createDtm"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUseDtm"            TIMESTAMPTZ NULL,
    "expireDtm"             TIMESTAMPTZ NULL,
    "revokeDtm"             TIMESTAMPTZ NULL,
    CONSTRAINT "pkCredential" PRIMARY KEY ("id"),
    CONSTRAINT "uqCredentialPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkCredentialAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkCredentialCredentialType" FOREIGN KEY ("credentialTypeId")
        REFERENCES auth."tCredentialType" ("id"),
    CONSTRAINT "ckCredentialSecretHash" CHECK (octet_length("secretHash") >= 16),
    CONSTRAINT "ckCredentialAlgorithmParameters" CHECK (jsonb_typeof("algorithmParameters") = 'object'),
    CONSTRAINT "ckCredentialExpireDtm" CHECK (
        "expireDtm" IS NULL OR "expireDtm" > "createDtm"
    ),
    CONSTRAINT "ckCredentialRevokeDtm" CHECK (
        "revokeDtm" IS NULL OR "revokeDtm" >= "createDtm"
    )
);

CREATE INDEX "ixCredentialActiveAccount"
    ON auth."tCredential" ("accountId", "credentialTypeId", "id")
    WHERE "revokeDtm" IS NULL;

CREATE TABLE auth."tDevice" (
    "id"                BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId"         BIGINT NOT NULL,
    "deviceKeyDigest"   BYTEA NULL,
    "name"              VARCHAR(128) NULL,
    "platformCode"      VARCHAR(32) NULL,
    "firstSeenDtm"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenDtm"       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustDtm"          TIMESTAMPTZ NULL,
    "revokeDtm"         TIMESTAMPTZ NULL,
    "createDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkDevice" PRIMARY KEY ("id"),
    CONSTRAINT "uqDevicePublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqDeviceIdAccountId" UNIQUE ("id", "accountId"),
    CONSTRAINT "fkDeviceAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckDeviceKeyDigest" CHECK (
        "deviceKeyDigest" IS NULL OR octet_length("deviceKeyDigest") >= 32
    ),
    CONSTRAINT "ckDeviceLastSeenDtm" CHECK ("lastSeenDtm" >= "firstSeenDtm"),
    CONSTRAINT "ckDeviceRevokeDtm" CHECK (
        "revokeDtm" IS NULL OR "revokeDtm" >= "firstSeenDtm"
    )
);

CREATE UNIQUE INDEX "uqDeviceActiveKeyDigest"
    ON auth."tDevice" ("accountId", "deviceKeyDigest")
    WHERE "deviceKeyDigest" IS NOT NULL AND "revokeDtm" IS NULL;

CREATE TABLE auth."tSessionStatus" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "isUsable"      BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkSessionStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqSessionStatusCode" UNIQUE ("code"),
    CONSTRAINT "ckSessionStatusCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE auth."tSession" (
    "id"                    BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId"             BIGINT NOT NULL,
    "deviceId"              BIGINT NULL,
    "sessionStatusId"       BIGINT NOT NULL,
    "ipAddressDigest"       BYTEA NULL,
    "userAgentDigest"       BYTEA NULL,
    "riskLevel"             SMALLINT NOT NULL DEFAULT 0,
    "createDtm"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenDtm"           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idleExpireDtm"         TIMESTAMPTZ NULL,
    "absoluteExpireDtm"     TIMESTAMPTZ NOT NULL,
    "revokeDtm"             TIMESTAMPTZ NULL,
    "revokeReasonCode"      VARCHAR(64) NULL,
    "revokeByAccountId"     BIGINT NULL,
    CONSTRAINT "pkSession" PRIMARY KEY ("id"),
    CONSTRAINT "uqSessionPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkSessionAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkSessionDeviceAccount" FOREIGN KEY ("deviceId", "accountId")
        REFERENCES auth."tDevice" ("id", "accountId"),
    CONSTRAINT "fkSessionStatus" FOREIGN KEY ("sessionStatusId")
        REFERENCES auth."tSessionStatus" ("id"),
    CONSTRAINT "fkSessionRevokeByAccount" FOREIGN KEY ("revokeByAccountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckSessionRiskLevel" CHECK ("riskLevel" BETWEEN 0 AND 100),
    CONSTRAINT "ckSessionIpAddressDigest" CHECK (
        "ipAddressDigest" IS NULL OR octet_length("ipAddressDigest") >= 16
    ),
    CONSTRAINT "ckSessionUserAgentDigest" CHECK (
        "userAgentDigest" IS NULL OR octet_length("userAgentDigest") >= 16
    ),
    CONSTRAINT "ckSessionLastSeenDtm" CHECK ("lastSeenDtm" >= "createDtm"),
    CONSTRAINT "ckSessionAbsoluteExpireDtm" CHECK ("absoluteExpireDtm" > "createDtm"),
    CONSTRAINT "ckSessionIdleExpireDtm" CHECK (
        "idleExpireDtm" IS NULL OR "idleExpireDtm" > "createDtm"
    ),
    CONSTRAINT "ckSessionRevokeDtm" CHECK (
        "revokeDtm" IS NULL OR "revokeDtm" >= "createDtm"
    ),
    CONSTRAINT "ckSessionRevokeReason" CHECK (
        ("revokeDtm" IS NULL AND "revokeReasonCode" IS NULL)
        OR ("revokeDtm" IS NOT NULL AND "revokeReasonCode" IS NOT NULL)
    )
);

CREATE INDEX "ixSessionActiveAccount"
    ON auth."tSession" ("accountId", "lastSeenDtm" DESC, "id" DESC)
    WHERE "revokeDtm" IS NULL;

CREATE INDEX "ixSessionExpiration"
    ON auth."tSession" ("absoluteExpireDtm", "id")
    WHERE "revokeDtm" IS NULL;

CREATE TABLE auth."tRefreshTokenStatus" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    "isUsable"      BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkRefreshTokenStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqRefreshTokenStatusCode" UNIQUE ("code"),
    CONSTRAINT "ckRefreshTokenStatusCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE auth."tRefreshToken" (
    "id"                    BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId"             BIGINT NOT NULL,
    "refreshTokenStatusId"  BIGINT NOT NULL,
    "familyPublicId"        UUID NOT NULL,
    "rotationNumber"        INTEGER NOT NULL,
    "tokenHash"             BYTEA NOT NULL,
    "createDtm"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireDtm"             TIMESTAMPTZ NOT NULL,
    "useDtm"                TIMESTAMPTZ NULL,
    "revokeDtm"             TIMESTAMPTZ NULL,
    "replaceByPublicId"     UUID NULL,
    CONSTRAINT "pkRefreshToken" PRIMARY KEY ("id"),
    CONSTRAINT "uqRefreshTokenPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqRefreshTokenHash" UNIQUE ("tokenHash"),
    CONSTRAINT "uqRefreshTokenFamilyRotation" UNIQUE ("familyPublicId", "rotationNumber"),
    CONSTRAINT "fkRefreshTokenSession" FOREIGN KEY ("sessionId")
        REFERENCES auth."tSession" ("id"),
    CONSTRAINT "fkRefreshTokenStatus" FOREIGN KEY ("refreshTokenStatusId")
        REFERENCES auth."tRefreshTokenStatus" ("id"),
    CONSTRAINT "fkRefreshTokenReplacement" FOREIGN KEY ("replaceByPublicId")
        REFERENCES auth."tRefreshToken" ("publicId") DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT "ckRefreshTokenRotationNumber" CHECK ("rotationNumber" >= 0),
    CONSTRAINT "ckRefreshTokenHash" CHECK (octet_length("tokenHash") >= 32),
    CONSTRAINT "ckRefreshTokenExpireDtm" CHECK ("expireDtm" > "createDtm"),
    CONSTRAINT "ckRefreshTokenUseDtm" CHECK (
        "useDtm" IS NULL OR "useDtm" >= "createDtm"
    ),
    CONSTRAINT "ckRefreshTokenRevokeDtm" CHECK (
        "revokeDtm" IS NULL OR "revokeDtm" >= "createDtm"
    )
);

CREATE INDEX "ixRefreshTokenActiveSession"
    ON auth."tRefreshToken" ("sessionId", "createDtm" DESC, "id" DESC)
    WHERE "revokeDtm" IS NULL;

CREATE TABLE auth."tChallengeType" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "code"          VARCHAR(32) NOT NULL,
    "name"          VARCHAR(128) NOT NULL,
    CONSTRAINT "pkChallengeType" PRIMARY KEY ("id"),
    CONSTRAINT "uqChallengeTypeCode" UNIQUE ("code"),
    CONSTRAINT "ckChallengeTypeCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,31}$')
);

CREATE TABLE auth."tChallenge" (
    "id"                BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId"         BIGINT NOT NULL,
    "identityId"        BIGINT NULL,
    "challengeTypeId"   BIGINT NOT NULL,
    "secretHash"        BYTEA NOT NULL,
    "attemptCount"      INTEGER NOT NULL DEFAULT 0,
    "maxAttemptCount"   INTEGER NOT NULL DEFAULT 5,
    "createDtm"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireDtm"         TIMESTAMPTZ NOT NULL,
    "consumeDtm"        TIMESTAMPTZ NULL,
    CONSTRAINT "pkChallenge" PRIMARY KEY ("id"),
    CONSTRAINT "uqChallengePublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkChallengeAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkChallengeIdentityAccount" FOREIGN KEY ("identityId", "accountId")
        REFERENCES auth."tIdentity" ("id", "accountId"),
    CONSTRAINT "fkChallengeType" FOREIGN KEY ("challengeTypeId")
        REFERENCES auth."tChallengeType" ("id"),
    CONSTRAINT "ckChallengeSecretHash" CHECK (octet_length("secretHash") >= 16),
    CONSTRAINT "ckChallengeAttemptCount" CHECK (
        "attemptCount" >= 0 AND "maxAttemptCount" > 0 AND "attemptCount" <= "maxAttemptCount"
    ),
    CONSTRAINT "ckChallengeExpireDtm" CHECK ("expireDtm" > "createDtm"),
    CONSTRAINT "ckChallengeConsumeDtm" CHECK (
        "consumeDtm" IS NULL OR "consumeDtm" >= "createDtm"
    )
);

CREATE INDEX "ixChallengeActiveExpiry"
    ON auth."tChallenge" ("expireDtm", "id")
    WHERE "consumeDtm" IS NULL;

CREATE TABLE auth."tLoginAttempt" (
    "id"                BIGINT GENERATED ALWAYS AS IDENTITY,
    "accountId"         BIGINT NULL,
    "identityDigest"    BYTEA NULL,
    "ipAddressDigest"   BYTEA NULL,
    "isSuccessful"      BOOLEAN NOT NULL,
    "failureCode"       VARCHAR(64) NULL,
    "attemptDtm"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkLoginAttempt" PRIMARY KEY ("id"),
    CONSTRAINT "fkLoginAttemptAccount" FOREIGN KEY ("accountId")
        REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckLoginAttemptIdentityDigest" CHECK (
        "identityDigest" IS NULL OR octet_length("identityDigest") >= 16
    ),
    CONSTRAINT "ckLoginAttemptIpAddressDigest" CHECK (
        "ipAddressDigest" IS NULL OR octet_length("ipAddressDigest") >= 16
    ),
    CONSTRAINT "ckLoginAttemptFailure" CHECK (
        ("isSuccessful" = TRUE AND "failureCode" IS NULL)
        OR ("isSuccessful" = FALSE AND "failureCode" IS NOT NULL)
    )
);

CREATE INDEX "ixLoginAttemptAccountDtm"
    ON auth."tLoginAttempt" ("accountId", "attemptDtm" DESC)
    WHERE "accountId" IS NOT NULL;

CREATE INDEX "ixLoginAttemptIpDtm"
    ON auth."tLoginAttempt" ("ipAddressDigest", "attemptDtm" DESC)
    WHERE "ipAddressDigest" IS NOT NULL;

CREATE TRIGGER "trgDeviceSetUpdateDtm"
BEFORE UPDATE ON auth."tDevice"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

COMMIT;
