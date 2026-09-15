\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    vActiveStatusId BIGINT;
    vUnverifiedStatusId BIGINT;
    vEligibilityStatusId BIGINT;
    vEmailTypeId BIGINT;
    vPasswordTypeId BIGINT;
    vSessionStatusId BIGINT;
    vTokenStatusId BIGINT;
    vBaseRoleId BIGINT;
    vAgentRoleId BIGINT;
    vEligibleStatusId BIGINT;
    vGlobalScopeId BIGINT;
    vAssignmentStatusId BIGINT;
    vAccountId BIGINT;
    vProfileResourceTypeId BIGINT;
    vProfileResourceId BIGINT;
    vPersonAnchorId BIGINT;
    vSessionId BIGINT;
BEGIN
    SELECT "id" INTO STRICT vActiveStatusId
    FROM account."tAccountStatus" WHERE "code" = 'ACTIVE';

    SELECT "id" INTO STRICT vUnverifiedStatusId
    FROM account."tPersonAnchorStatus" WHERE "code" = 'UNVERIFIED';

    SELECT "id" INTO STRICT vEligibilityStatusId
    FROM account."tGovernanceEligibilityStatus" WHERE "code" = 'PENDING';

    SELECT "id" INTO STRICT vEmailTypeId
    FROM auth."tIdentityType" WHERE "code" = 'EMAIL';

    SELECT "id" INTO STRICT vPasswordTypeId
    FROM auth."tCredentialType" WHERE "code" = 'PASSWORD';

    SELECT "id" INTO STRICT vSessionStatusId
    FROM auth."tSessionStatus" WHERE "code" = 'ACTIVE';

    SELECT "id" INTO STRICT vTokenStatusId
    FROM auth."tRefreshTokenStatus" WHERE "code" = 'ACTIVE';

    SELECT "id" INTO STRICT vBaseRoleId
    FROM access."tRole" WHERE "code" = 'BASE';

    SELECT "id" INTO STRICT vAgentRoleId
    FROM access."tRole" WHERE "code" = 'AGENT';

    SELECT "id" INTO STRICT vEligibleStatusId
    FROM account."tGovernanceEligibilityStatus" WHERE "code" = 'ELIGIBLE';

    SELECT "id" INTO STRICT vGlobalScopeId
    FROM access."tScope" WHERE "code" = 'global';

    SELECT "id" INTO STRICT vAssignmentStatusId
    FROM access."tRoleAssignmentStatus" WHERE "code" = 'ACTIVE';

    INSERT INTO account."tAccount" ("accountStatusId")
    VALUES (vActiveStatusId)
    RETURNING "id" INTO vAccountId;

    SELECT "id" INTO STRICT vProfileResourceTypeId
    FROM core."tResourceType" WHERE "code" = 'profile';

    INSERT INTO core."tResource" ("resourceTypeId")
    VALUES (vProfileResourceTypeId)
    RETURNING "id" INTO vProfileResourceId;

    INSERT INTO account."tProfile" (
        "accountId", "resourceId", "username", "displayName"
    ) VALUES (
        vAccountId, vProfileResourceId,
        'foundation_smoke_user', 'Foundation Smoke User'
    );

    INSERT INTO account."tPersonAnchor" (
        "personAnchorStatusId", "verificationLevel"
    ) VALUES (vUnverifiedStatusId, 0)
    RETURNING "id" INTO vPersonAnchorId;

    INSERT INTO account."tAccountPerson" (
        "accountId", "personAnchorId", "linkType"
    ) VALUES (vAccountId, vPersonAnchorId, 'PRIMARY');

    INSERT INTO account."tGovernanceEligibility" (
        "personAnchorId", "accountId", "governanceEligibilityStatusId"
    ) VALUES (vPersonAnchorId, vAccountId, vEligibilityStatusId);

    INSERT INTO auth."tIdentity" (
        "accountId", "identityTypeId", "normalizedValue", "displayValue",
        "isPrimary", "isVerified", "verifyDtm"
    ) VALUES (
        vAccountId, vEmailTypeId, 'foundation-smoke@example.invalid',
        'foundation-smoke@example.invalid', TRUE, TRUE, CURRENT_TIMESTAMP
    );

    INSERT INTO auth."tCredential" (
        "accountId", "credentialTypeId", "secretHash", "algorithm"
    ) VALUES (
        vAccountId, vPasswordTypeId, decode(repeat('ab', 32), 'hex'), 'argon2id'
    );

    INSERT INTO auth."tSession" (
        "accountId", "sessionStatusId", "absoluteExpireDtm"
    ) VALUES (
        vAccountId, vSessionStatusId, CURRENT_TIMESTAMP + INTERVAL '30 days'
    ) RETURNING "id" INTO vSessionId;

    INSERT INTO auth."tRefreshToken" (
        "sessionId", "refreshTokenStatusId", "familyPublicId", "rotationNumber",
        "tokenHash", "expireDtm"
    ) VALUES (
        vSessionId, vTokenStatusId, gen_random_uuid(), 0,
        decode(repeat('cd', 32), 'hex'), CURRENT_TIMESTAMP + INTERVAL '30 days'
    );

    INSERT INTO access."tRoleAssignment" (
        "accountId", "roleId", "scopeId", "roleAssignmentStatusId"
    ) VALUES (
        vAccountId, vBaseRoleId, vGlobalScopeId, vAssignmentStatusId
    );

    BEGIN
        INSERT INTO access."tRoleAssignment" (
            "accountId", "roleId", "scopeId", "roleAssignmentStatusId"
        ) VALUES (
            vAccountId, vAgentRoleId, vGlobalScopeId, vAssignmentStatusId
        );
        RAISE EXCEPTION 'AGENT role without governance identity was unexpectedly allowed';
    EXCEPTION
        WHEN raise_exception THEN
            IF SQLERRM = 'AGENT role without governance identity was unexpectedly allowed' THEN
                RAISE;
            END IF;
    END;

    UPDATE account."tGovernanceEligibility"
    SET "governanceEligibilityStatusId" = vEligibleStatusId,
        "grantDtm" = CURRENT_TIMESTAMP,
        "reviewRequired" = FALSE
    WHERE "accountId" = vAccountId;

    UPDATE account."tPersonAnchor"
    SET "personAnchorStatusId" = (
            SELECT "id" FROM account."tPersonAnchorStatus" WHERE "code" = 'VERIFIED'
        ),
        "verificationLevel" = 1,
        "verifiedDtm" = CURRENT_TIMESTAMP
    WHERE "id" = vPersonAnchorId;

    INSERT INTO access."tRoleAssignment" (
        "accountId", "roleId", "scopeId", "roleAssignmentStatusId"
    ) VALUES (
        vAccountId, vAgentRoleId, vGlobalScopeId, vAssignmentStatusId
    );

    IF NOT EXISTS (
        SELECT 1
        FROM access."tRoleAssignment" assignment
        JOIN access."tRole" role ON role."id" = assignment."roleId"
        WHERE assignment."accountId" = vAccountId
          AND role."code" = 'BASE'
          AND assignment."revokeDtm" IS NULL
    ) THEN
        RAISE EXCEPTION 'BASE role assignment was not created';
    END IF;
END;
$$;

ROLLBACK;

SELECT 'Mecorion foundation smoke test passed' AS "result";
