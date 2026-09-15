BEGIN;

CREATE TABLE legal."tLegalStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "allowsPublication" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkLegalStatus" PRIMARY KEY ("id"),
    CONSTRAINT "uqLegalStatusCode" UNIQUE ("code")
);

CREATE TABLE legal."tPolicyDocument" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isRequiredForRegistration" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "pkPolicyDocument" PRIMARY KEY ("id"),
    CONSTRAINT "uqPolicyDocumentCode" UNIQUE ("code")
);

CREATE TABLE legal."tPolicyVersion" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policyDocumentId" BIGINT NOT NULL,
    "versionCode" VARCHAR(32) NOT NULL,
    "languageId" BIGINT NOT NULL,
    "contentDigest" BYTEA NOT NULL,
    "storageObjectId" BIGINT NULL,
    "effectiveDtm" TIMESTAMPTZ NOT NULL,
    "retireDtm" TIMESTAMPTZ NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkPolicyVersion" PRIMARY KEY ("id"),
    CONSTRAINT "uqPolicyVersionPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqPolicyVersionCodeLanguage" UNIQUE ("policyDocumentId", "versionCode", "languageId"),
    CONSTRAINT "fkPolicyVersionDocument" FOREIGN KEY ("policyDocumentId") REFERENCES legal."tPolicyDocument" ("id"),
    CONSTRAINT "fkPolicyVersionLanguage" FOREIGN KEY ("languageId") REFERENCES core."tLanguage" ("id"),
    CONSTRAINT "fkPolicyVersionStorageObject" FOREIGN KEY ("storageObjectId") REFERENCES media."tStorageObject" ("id"),
    CONSTRAINT "ckPolicyVersionDigest" CHECK (octet_length("contentDigest") = 32),
    CONSTRAINT "ckPolicyVersionRetireDtm" CHECK ("retireDtm" IS NULL OR "retireDtm" > "effectiveDtm")
);

CREATE TABLE legal."tAccountPolicyAcceptance" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "accountId" BIGINT NOT NULL,
    "policyVersionId" BIGINT NOT NULL,
    "acceptDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawDtm" TIMESTAMPTZ NULL,
    "ipAddressDigest" BYTEA NULL,
    CONSTRAINT "pkAccountPolicyAcceptance" PRIMARY KEY ("id"),
    CONSTRAINT "uqAccountPolicyAcceptance" UNIQUE ("accountId", "policyVersionId"),
    CONSTRAINT "fkAccountPolicyAcceptanceAccount" FOREIGN KEY ("accountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "fkAccountPolicyAcceptanceVersion" FOREIGN KEY ("policyVersionId") REFERENCES legal."tPolicyVersion" ("id"),
    CONSTRAINT "ckAccountPolicyAcceptanceWithdrawDtm" CHECK ("withdrawDtm" IS NULL OR "withdrawDtm" >= "acceptDtm"),
    CONSTRAINT "ckAccountPolicyAcceptanceIpDigest" CHECK ("ipAddressDigest" IS NULL OR octet_length("ipAddressDigest") >= 16)
);

CREATE TABLE legal."tResourceLegalStatus" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "resourceId" BIGINT NOT NULL,
    "legalStatusId" BIGINT NOT NULL,
    "territoryId" BIGINT NOT NULL,
    "sourceType" VARCHAR(32) NOT NULL,
    "declaredByAccountId" BIGINT NULL,
    "evidence" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "validFromDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntilDtm" TIMESTAMPTZ NULL,
    "revokeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkResourceLegalStatus" PRIMARY KEY ("id"),
    CONSTRAINT "fkResourceLegalStatusResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkResourceLegalStatusStatus" FOREIGN KEY ("legalStatusId") REFERENCES legal."tLegalStatus" ("id"),
    CONSTRAINT "fkResourceLegalStatusTerritory" FOREIGN KEY ("territoryId") REFERENCES core."tTerritory" ("id"),
    CONSTRAINT "fkResourceLegalStatusAccount" FOREIGN KEY ("declaredByAccountId") REFERENCES account."tAccount" ("id"),
    CONSTRAINT "ckResourceLegalStatusSource" CHECK ("sourceType" IN ('UPLOADER_DECLARATION', 'LICENSE', 'PUBLIC_DOMAIN', 'RIGHTS_HOLDER', 'COMPLAINT_DECISION', 'LEGAL_REVIEW')),
    CONSTRAINT "ckResourceLegalStatusEvidence" CHECK (jsonb_typeof("evidence") = 'object'),
    CONSTRAINT "ckResourceLegalStatusValidity" CHECK ("validUntilDtm" IS NULL OR "validUntilDtm" > "validFromDtm")
);

CREATE UNIQUE INDEX "uqResourceLegalStatusActive" ON legal."tResourceLegalStatus" ("resourceId", "territoryId") WHERE "revokeDtm" IS NULL;

CREATE TABLE legal."tLicenseType" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    CONSTRAINT "pkLicenseType" PRIMARY KEY ("id"),
    CONSTRAINT "uqLicenseTypeCode" UNIQUE ("code")
);

CREATE TABLE legal."tLicense" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resourceId" BIGINT NOT NULL,
    "licenseTypeId" BIGINT NOT NULL,
    "rightsHolderContributorId" BIGINT NULL,
    "licenseReference" VARCHAR(512) NULL,
    "evidenceStorageObjectId" BIGINT NULL,
    "validFromDt" DATE NULL,
    "validUntilDt" DATE NULL,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkLicense" PRIMARY KEY ("id"),
    CONSTRAINT "uqLicensePublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkLicenseResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkLicenseType" FOREIGN KEY ("licenseTypeId") REFERENCES legal."tLicenseType" ("id"),
    CONSTRAINT "fkLicenseRightsHolder" FOREIGN KEY ("rightsHolderContributorId") REFERENCES content."tContributor" ("id"),
    CONSTRAINT "fkLicenseEvidenceStorageObject" FOREIGN KEY ("evidenceStorageObjectId") REFERENCES media."tStorageObject" ("id"),
    CONSTRAINT "ckLicenseValidity" CHECK ("validUntilDt" IS NULL OR "validFromDt" IS NULL OR "validUntilDt" >= "validFromDt")
);

CREATE TABLE legal."tLicenseTerritory" (
    "licenseId" BIGINT NOT NULL,
    "territoryId" BIGINT NOT NULL,
    CONSTRAINT "pkLicenseTerritory" PRIMARY KEY ("licenseId", "territoryId"),
    CONSTRAINT "fkLicenseTerritoryLicense" FOREIGN KEY ("licenseId") REFERENCES legal."tLicense" ("id"),
    CONSTRAINT "fkLicenseTerritoryTerritory" FOREIGN KEY ("territoryId") REFERENCES core."tTerritory" ("id")
);

CREATE TABLE legal."tTakedown" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resourceId" BIGINT NOT NULL,
    "sourceReportId" BIGINT NULL,
    "territoryId" BIGINT NOT NULL,
    "reasonCode" VARCHAR(64) NOT NULL,
    "effectiveDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireDtm" TIMESTAMPTZ NULL,
    "revokeDtm" TIMESTAMPTZ NULL,
    CONSTRAINT "pkTakedown" PRIMARY KEY ("id"),
    CONSTRAINT "uqTakedownPublicId" UNIQUE ("publicId"),
    CONSTRAINT "fkTakedownResource" FOREIGN KEY ("resourceId") REFERENCES core."tResource" ("id"),
    CONSTRAINT "fkTakedownReport" FOREIGN KEY ("sourceReportId") REFERENCES moderation."tReport" ("id"),
    CONSTRAINT "fkTakedownTerritory" FOREIGN KEY ("territoryId") REFERENCES core."tTerritory" ("id"),
    CONSTRAINT "ckTakedownExpireDtm" CHECK ("expireDtm" IS NULL OR "expireDtm" > "effectiveDtm")
);

CREATE INDEX "ixTakedownEffectiveResource" ON legal."tTakedown" ("resourceId", "territoryId", "effectiveDtm") WHERE "revokeDtm" IS NULL;

CREATE OR REPLACE FUNCTION legal."fncAssertPublicationLegalStatus"(
    pPublicationId BIGINT,
    pRequireCheck BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF (pRequireCheck OR EXISTS (
        SELECT 1
        FROM content."tPublication" publication
        JOIN content."tPublicationStatus" publicationStatus
          ON publicationStatus."id" = publication."publicationStatusId"
        WHERE publication."id" = pPublicationId
          AND publicationStatus."isPublic" = TRUE
    )) AND (
        NOT EXISTS (
            SELECT 1 FROM content."tPublicationContent" item
            WHERE item."publicationId" = pPublicationId
        )
        OR EXISTS (
            SELECT 1
            FROM content."tPublicationContent" publicationContent
            JOIN content."tContent" contentItem ON contentItem."id" = publicationContent."contentId"
            JOIN content."tContentStatus" contentStatus ON contentStatus."id" = contentItem."contentStatusId"
            WHERE publicationContent."publicationId" = pPublicationId
              AND (contentStatus."isPublic" = FALSE OR NOT EXISTS (
                SELECT 1
                FROM legal."tResourceLegalStatus" resourceLegal
                JOIN legal."tLegalStatus" legalStatus ON legalStatus."id" = resourceLegal."legalStatusId"
                WHERE resourceLegal."resourceId" = contentItem."resourceId"
                  AND legalStatus."allowsPublication" = TRUE
                  AND resourceLegal."revokeDtm" IS NULL
                  AND resourceLegal."validFromDtm" <= CURRENT_TIMESTAMP
                  AND (resourceLegal."validUntilDtm" IS NULL OR resourceLegal."validUntilDtm" > CURRENT_TIMESTAMP)
                  AND NOT EXISTS (
                    SELECT 1
                    FROM legal."tTakedown" takedown
                    WHERE takedown."resourceId" = contentItem."resourceId"
                      AND takedown."revokeDtm" IS NULL
                      AND takedown."effectiveDtm" <= CURRENT_TIMESTAMP
                      AND (takedown."expireDtm" IS NULL OR takedown."expireDtm" > CURRENT_TIMESTAMP)
                  )
              ))
        )
    ) THEN
        RAISE EXCEPTION 'Every publication content item requires an active publishable legal status';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION legal."fncValidatePublicationLegalStatus"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vIsPublic BOOLEAN;
BEGIN
    SELECT "isPublic" INTO STRICT vIsPublic
    FROM content."tPublicationStatus"
    WHERE "id" = NEW."publicationStatusId";
    IF vIsPublic THEN
        PERFORM legal."fncAssertPublicationLegalStatus"(NEW."id", TRUE);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgPublicationValidateLegalStatus"
BEFORE INSERT OR UPDATE OF "publicationStatusId", "publishDtm" ON content."tPublication"
FOR EACH ROW EXECUTE FUNCTION legal."fncValidatePublicationLegalStatus"();

CREATE OR REPLACE FUNCTION legal."fncValidatePublicationContentLegalStatus"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vPublicationId BIGINT;
BEGIN
    vPublicationId := CASE WHEN TG_OP = 'DELETE' THEN OLD."publicationId" ELSE NEW."publicationId" END;
    PERFORM legal."fncAssertPublicationLegalStatus"(vPublicationId);
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER "trgPublicationContentValidateLegalStatus"
AFTER INSERT OR UPDATE OR DELETE ON content."tPublicationContent"
FOR EACH ROW EXECUTE FUNCTION legal."fncValidatePublicationContentLegalStatus"();

CREATE OR REPLACE FUNCTION legal."fncValidateLegalStatusChange"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vPublicationId BIGINT;
    vResourceId BIGINT;
BEGIN
    vResourceId := CASE WHEN TG_OP = 'DELETE' THEN OLD."resourceId" ELSE NEW."resourceId" END;
    FOR vPublicationId IN
        SELECT publicationContent."publicationId"
        FROM content."tContent" contentItem
        JOIN content."tPublicationContent" publicationContent
          ON publicationContent."contentId" = contentItem."id"
        WHERE contentItem."resourceId" = vResourceId
    LOOP
        PERFORM legal."fncAssertPublicationLegalStatus"(vPublicationId);
    END LOOP;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER "trgResourceLegalStatusValidatePublications"
AFTER UPDATE OR DELETE ON legal."tResourceLegalStatus"
FOR EACH ROW EXECUTE FUNCTION legal."fncValidateLegalStatusChange"();

CREATE OR REPLACE FUNCTION legal."fncValidateContentStatusChange"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    vPublicationId BIGINT;
BEGIN
    FOR vPublicationId IN
        SELECT "publicationId"
        FROM content."tPublicationContent"
        WHERE "contentId" = NEW."id"
    LOOP
        PERFORM legal."fncAssertPublicationLegalStatus"(vPublicationId);
    END LOOP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trgContentValidatePublicationLegalStatus"
AFTER UPDATE OF "contentStatusId", "resourceId" ON content."tContent"
FOR EACH ROW EXECUTE FUNCTION legal."fncValidateContentStatusChange"();

CREATE TRIGGER "trgTakedownValidatePublications"
AFTER INSERT OR UPDATE OR DELETE ON legal."tTakedown"
FOR EACH ROW EXECUTE FUNCTION legal."fncValidateLegalStatusChange"();

COMMIT;
