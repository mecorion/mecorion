BEGIN;

INSERT INTO content."tExternalSource" ("code", "name", "baseUrl") VALUES
    ('MECORION_DEMO', 'Mecorion demo seed', NULL)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "baseUrl" = EXCLUDED."baseUrl";

DO $$
DECLARE
    vActiveAccountStatusId BIGINT;
    vEmailIdentityTypeId BIGINT;
    vRecoverySeedCredentialTypeId BIGINT;
    vProfileResourceTypeId BIGINT;
    vContentResourceTypeId BIGINT;
    vContributorResourceTypeId BIGINT;
    vPublicationResourceTypeId BIGINT;
    vCollectionResourceTypeId BIGINT;
    vVerifiedPersonStatusId BIGINT;
    vEligibleStatusId BIGINT;
    vRoleAssignmentStatusId BIGINT;
    vGlobalScopeId BIGINT;
    vWorldTerritoryId BIGINT;
    vRuLanguageId BIGINT;
    vContentStatusActiveId BIGINT;
    vContentStatusDraftId BIGINT;
    vTrackTypeId BIGINT;
    vAlbumTypeId BIGINT;
    vFilmTypeId BIGINT;
    vPublishedPublicationStatusId BIGINT;
    vDraftPublicationStatusId BIGINT;
    vPersonContributorKindId BIGINT;
    vOrganizationContributorKindId BIGINT;
    vPrimaryArtistRoleId BIGINT;
    vComposerRoleId BIGINT;
    vDirectorRoleId BIGINT;
    vProductionStudioRoleId BIGINT;
    vAlbumKindId BIGINT;
    vDeclaredLegalStatusId BIGINT;
    vDemoExternalSourceId BIGINT;
    vAudioAssetTypeId BIGINT;
    vVideoAssetTypeId BIGINT;
    vImageAssetTypeId BIGINT;
    vAssetReadyStatusId BIGINT;
    vPrimaryAudioRoleId BIGINT;
    vPrimaryVideoRoleId BIGINT;
    vCoverRoleId BIGINT;
    vPosterRoleId BIGINT;
    vStorageProviderId BIGINT;
    vStorageObjectStatusId BIGINT;
    vReportReasonId BIGINT;
    vReportOpenStatusId BIGINT;
    vCollectionPlaylistTypeId BIGINT;
    vRoleId BIGINT;
    vAccountId BIGINT;
    vIdentityId BIGINT;
    vProfileResourceId BIGINT;
    vPersonAnchorId BIGINT;
    vCredentialHash BYTEA;
    vArtistResourceId BIGINT;
    vArtistId BIGINT;
    vComposerResourceId BIGINT;
    vComposerId BIGINT;
    vStudioResourceId BIGINT;
    vStudioId BIGINT;
    vTrackResourceId BIGINT;
    vTrackContentId BIGINT;
    vAlbumResourceId BIGINT;
    vAlbumContentId BIGINT;
    vFilmResourceId BIGINT;
    vFilmContentId BIGINT;
    vAssetId BIGINT;
    vStorageObjectId BIGINT;
    vPublicationResourceId BIGINT;
    vPublicationId BIGINT;
    vCollectionResourceId BIGINT;
    vCollectionId BIGINT;
    vAgentAccountId BIGINT;
    vBaseAccountId BIGINT;
    vUser RECORD;
BEGIN
    SELECT "id" INTO STRICT vActiveAccountStatusId FROM account."tAccountStatus" WHERE "code" = 'ACTIVE';
    SELECT "id" INTO STRICT vEmailIdentityTypeId FROM auth."tIdentityType" WHERE "code" = 'EMAIL';
    SELECT "id" INTO STRICT vRecoverySeedCredentialTypeId FROM auth."tCredentialType" WHERE "code" = 'RECOVERY_SEED';
    SELECT "id" INTO STRICT vProfileResourceTypeId FROM core."tResourceType" WHERE "code" = 'profile';
    SELECT "id" INTO STRICT vContentResourceTypeId FROM core."tResourceType" WHERE "code" = 'content';
    SELECT "id" INTO STRICT vContributorResourceTypeId FROM core."tResourceType" WHERE "code" = 'contributor';
    SELECT "id" INTO STRICT vPublicationResourceTypeId FROM core."tResourceType" WHERE "code" = 'publication';
    SELECT "id" INTO STRICT vCollectionResourceTypeId FROM core."tResourceType" WHERE "code" = 'collection';
    SELECT "id" INTO STRICT vVerifiedPersonStatusId FROM account."tPersonAnchorStatus" WHERE "code" = 'VERIFIED';
    SELECT "id" INTO STRICT vEligibleStatusId FROM account."tGovernanceEligibilityStatus" WHERE "code" = 'ELIGIBLE';
    SELECT "id" INTO STRICT vRoleAssignmentStatusId FROM access."tRoleAssignmentStatus" WHERE "code" = 'ACTIVE';
    SELECT "id" INTO STRICT vGlobalScopeId FROM access."tScope" WHERE "code" = 'global';
    SELECT "id" INTO STRICT vWorldTerritoryId FROM core."tTerritory" WHERE "code" = 'WORLD';
    SELECT "id" INTO STRICT vRuLanguageId FROM core."tLanguage" WHERE "code" = 'ru';
    SELECT "id" INTO STRICT vContentStatusActiveId FROM content."tContentStatus" WHERE "code" = 'ACTIVE';
    SELECT "id" INTO STRICT vContentStatusDraftId FROM content."tContentStatus" WHERE "code" = 'DRAFT';
    SELECT "id" INTO STRICT vTrackTypeId FROM content."tContentType" WHERE "code" = 'TRACK';
    SELECT "id" INTO STRICT vAlbumTypeId FROM content."tContentType" WHERE "code" = 'ALBUM';
    SELECT "id" INTO STRICT vFilmTypeId FROM content."tContentType" WHERE "code" = 'FILM';
    SELECT "id" INTO STRICT vPublishedPublicationStatusId FROM content."tPublicationStatus" WHERE "code" = 'PUBLISHED';
    SELECT "id" INTO STRICT vDraftPublicationStatusId FROM content."tPublicationStatus" WHERE "code" = 'DRAFT';
    SELECT "id" INTO STRICT vPersonContributorKindId FROM content."tContributorKind" WHERE "code" = 'PERSON';
    SELECT "id" INTO STRICT vOrganizationContributorKindId FROM content."tContributorKind" WHERE "code" = 'ORGANIZATION';
    SELECT "id" INTO STRICT vPrimaryArtistRoleId FROM content."tContributorRole" WHERE "code" = 'PRIMARY_ARTIST';
    SELECT "id" INTO STRICT vComposerRoleId FROM content."tContributorRole" WHERE "code" = 'COMPOSER';
    SELECT "id" INTO STRICT vDirectorRoleId FROM content."tContributorRole" WHERE "code" = 'DIRECTOR';
    SELECT "id" INTO STRICT vProductionStudioRoleId FROM content."tContributorRole" WHERE "code" = 'PRODUCTION_STUDIO';
    SELECT "id" INTO STRICT vAlbumKindId FROM music."tAlbumType" WHERE "code" = 'ALBUM';
    SELECT "id" INTO STRICT vDeclaredLegalStatusId FROM legal."tLegalStatus" WHERE "code" = 'DECLARED';
    SELECT "id" INTO STRICT vDemoExternalSourceId FROM content."tExternalSource" WHERE "code" = 'MECORION_DEMO';
    SELECT "id" INTO STRICT vAudioAssetTypeId FROM media."tAssetType" WHERE "code" = 'AUDIO';
    SELECT "id" INTO STRICT vVideoAssetTypeId FROM media."tAssetType" WHERE "code" = 'VIDEO';
    SELECT "id" INTO STRICT vImageAssetTypeId FROM media."tAssetType" WHERE "code" = 'IMAGE';
    SELECT "id" INTO STRICT vAssetReadyStatusId FROM media."tAssetStatus" WHERE "code" = 'READY';
    SELECT "id" INTO STRICT vPrimaryAudioRoleId FROM media."tContentAssetRole" WHERE "code" = 'PRIMARY_AUDIO';
    SELECT "id" INTO STRICT vPrimaryVideoRoleId FROM media."tContentAssetRole" WHERE "code" = 'PRIMARY_VIDEO';
    SELECT "id" INTO STRICT vCoverRoleId FROM media."tContentAssetRole" WHERE "code" = 'COVER';
    SELECT "id" INTO STRICT vPosterRoleId FROM media."tContentAssetRole" WHERE "code" = 'POSTER';
    SELECT "id" INTO STRICT vStorageProviderId FROM media."tStorageProvider" WHERE "code" = 'primary-s3';
    SELECT "id" INTO STRICT vStorageObjectStatusId FROM media."tStorageObjectStatus" WHERE "code" = 'AVAILABLE';
    SELECT "id" INTO STRICT vReportReasonId FROM moderation."tReportReason" WHERE "code" = 'WRONG_METADATA';
    SELECT "id" INTO STRICT vReportOpenStatusId FROM moderation."tReportStatus" WHERE "code" = 'OPEN';
    SELECT "id" INTO STRICT vCollectionPlaylistTypeId FROM library."tCollectionType" WHERE "code" = 'PLAYLIST';

    FOR vUser IN
        SELECT *
        FROM (VALUES
            ('base@mecorion.local', 'dev-base', 'Dev Base User', 'BASE',
             'option raccoon focus modify shine letter sweet wall tag job twin input',
             '711adf841beddc2e508d7a6c471e47295b4dbbd0d02076f9a6d800a41e6b9e7a'),
            ('agent@mecorion.local', 'dev-agent', 'Dev Agent User', 'AGENT',
             'scale stadium chicken flush rate between rely make invest install mistake river',
             'cf3be50af1e302ec978223c534fa02454f66b9bfe9efc77d82de723309be8c22'),
            ('moderator@mecorion.local', 'dev-moderator', 'Dev Moderator User', 'MODERATOR',
             'evolve copper answer online donate swing dragon memory measure whale stone expire',
             'bd7c51e5d5ca0288eb8596a9de5e24923174a8c5209016416299d47097c64465'),
            ('admin@mecorion.local', 'dev-admin', 'Dev Admin User', 'ADMIN',
             'hole behind arrange attitude person group merit swim custom announce loop mammal',
             '4e474b18bfae3c6ed5a71561fbfca6f6780fd44c11d2ec9e4ce5261139353bab'),
            ('owner@mecorion.local', 'dev-owner', 'Dev Owner User', 'OWNER',
             'evoke copy fury offer plate scorpion lottery outside grunt index claw olive',
             'eb7c24ae6bca8464eec930b9b13c1d22315da27561c94220132926bf7c075394'),
            ('founder@mecorion.local', 'dev-founder', 'Dev Founder User', 'FOUNDER',
             'cruel shiver vacuum wheat timber sword wisdom soon play purchase east jealous',
             '901339c778641c523725bb38782dd452b06020ee5a338e3635dbc9883d000e76')
        ) seed("email", "username", "displayName", "roleCode", "seedPhrase", "seedHashHex")
    LOOP
        SELECT identity."accountId", identity."id"
          INTO vAccountId, vIdentityId
          FROM auth."tIdentity" identity
         WHERE identity."identityTypeId" = vEmailIdentityTypeId
           AND identity."normalizedValue" = vUser."email"
           AND identity."revokeDtm" IS NULL;

        IF vAccountId IS NULL THEN
            INSERT INTO account."tAccount" ("accountStatusId")
            VALUES (vActiveAccountStatusId)
            RETURNING "id" INTO vAccountId;

            INSERT INTO core."tResource" ("resourceTypeId")
            VALUES (vProfileResourceTypeId)
            RETURNING "id" INTO vProfileResourceId;

            INSERT INTO account."tProfile" (
                "accountId", "resourceId", "username", "displayName", "bio"
            ) VALUES (
                vAccountId, vProfileResourceId, vUser."username", vUser."displayName",
                'Dev seed account for Mecorion testing.'
            );

            INSERT INTO auth."tIdentity" (
                "accountId", "identityTypeId", "normalizedValue", "displayValue",
                "isPrimary", "isVerified", "verifyDtm"
            ) VALUES (
                vAccountId, vEmailIdentityTypeId, vUser."email", vUser."email",
                TRUE, TRUE, CURRENT_TIMESTAMP
            ) RETURNING "id" INTO vIdentityId;
        ELSE
            UPDATE account."tAccount"
               SET "accountStatusId" = vActiveAccountStatusId,
                   "statusChangeDtm" = CURRENT_TIMESTAMP
             WHERE "id" = vAccountId;

            UPDATE account."tProfile"
               SET "username" = vUser."username",
                   "displayName" = vUser."displayName",
                   "bio" = 'Dev seed account for Mecorion testing.'
             WHERE "accountId" = vAccountId;

            UPDATE auth."tIdentity"
               SET "displayValue" = vUser."email",
                   "isPrimary" = TRUE,
                   "isVerified" = TRUE,
                   "verifyDtm" = COALESCE("verifyDtm", CURRENT_TIMESTAMP)
             WHERE "id" = vIdentityId;
        END IF;

        vCredentialHash := decode(vUser."seedHashHex", 'hex');

        IF NOT EXISTS (
            SELECT 1
              FROM auth."tCredential"
             WHERE "accountId" = vAccountId
               AND "credentialTypeId" = vRecoverySeedCredentialTypeId
               AND "secretHash" = vCredentialHash
               AND "revokeDtm" IS NULL
        ) THEN
            UPDATE auth."tCredential"
               SET "revokeDtm" = COALESCE("revokeDtm", CURRENT_TIMESTAMP)
             WHERE "accountId" = vAccountId
               AND "credentialTypeId" = vRecoverySeedCredentialTypeId
               AND "revokeDtm" IS NULL;

            INSERT INTO auth."tCredential" (
                "accountId", "credentialTypeId", "credentialIdentifier",
                "secretHash", "algorithm", "algorithmParameters"
            ) VALUES (
                vAccountId, vRecoverySeedCredentialTypeId, 'bip39-dev-seed',
                vCredentialHash, 'SHA256', '{"wordlist":"english","environment":"dev"}'::JSONB
            );
        END IF;

        -- Верификаторы позволяют проверить запрошенные позиции, не сохраняя
        -- отдельные слова seed phrase в auth-схеме.
        UPDATE auth."tCredential" credential
           SET "algorithmParameters" = jsonb_build_object(
               'wordlist', 'english',
               'environment', 'dev',
               'wordCount', array_length(regexp_split_to_array(vUser."seedPhrase", '\s+'), 1),
               'wordVerifiers', (
                   SELECT jsonb_agg(
                       encode(hmac(seedWord."word", 'mecorion-dev-seed-pepper', 'sha256'), 'hex')
                       ORDER BY seedWord."position"
                   )
                   FROM unnest(regexp_split_to_array(vUser."seedPhrase", '\s+'))
                        WITH ORDINALITY AS seedWord("word", "position")
               )
           )
         WHERE credential."accountId" = vAccountId
           AND credential."credentialTypeId" = vRecoverySeedCredentialTypeId
           AND credential."revokeDtm" IS NULL;

        SELECT "id" INTO STRICT vRoleId FROM access."tRole" WHERE "code" = 'BASE';
        INSERT INTO access."tRoleAssignment" (
            "accountId", "roleId", "scopeId", "roleAssignmentStatusId"
        ) VALUES (
            vAccountId, vRoleId, vGlobalScopeId, vRoleAssignmentStatusId
        )
        ON CONFLICT ("accountId", "roleId", "scopeId")
            WHERE "revokeDtm" IS NULL
        DO UPDATE SET
            "roleAssignmentStatusId" = EXCLUDED."roleAssignmentStatusId",
            "validUntilDtm" = NULL,
            "revokeDtm" = NULL,
            "revokeReasonCode" = NULL;

        IF vUser."roleCode" <> 'BASE' THEN
            IF vUser."roleCode" IN ('AGENT', 'KEEPER', 'MODERATOR', 'DEVELOPER', 'ADMIN', 'OWNER', 'FOUNDER') THEN
                SELECT accountPerson."personAnchorId"
                  INTO vPersonAnchorId
                  FROM account."tAccountPerson" accountPerson
                 WHERE accountPerson."accountId" = vAccountId
                   AND accountPerson."unlinkDtm" IS NULL
                 LIMIT 1;

                IF vPersonAnchorId IS NULL THEN
                    INSERT INTO account."tPersonAnchor" (
                        "personAnchorStatusId", "verificationLevel", "verifiedDtm"
                    ) VALUES (
                        vVerifiedPersonStatusId, 10, CURRENT_TIMESTAMP
                    ) RETURNING "id" INTO vPersonAnchorId;

                    INSERT INTO account."tAccountPerson" (
                        "accountId", "personAnchorId", "linkType"
                    ) VALUES (
                        vAccountId, vPersonAnchorId, 'PRIMARY'
                    );
                END IF;

                IF NOT EXISTS (
                    SELECT 1
                      FROM account."tGovernanceEligibility" eligibility
                      JOIN account."tGovernanceEligibilityStatus" status
                        ON status."id" = eligibility."governanceEligibilityStatusId"
                     WHERE eligibility."accountId" = vAccountId
                       AND status."code" = 'ELIGIBLE'
                       AND eligibility."revokeDtm" IS NULL
                ) THEN
                    INSERT INTO account."tGovernanceEligibility" (
                        "personAnchorId", "accountId", "governanceEligibilityStatusId",
                        "grantDtm", "reviewRequired"
                    ) VALUES (
                        vPersonAnchorId, vAccountId, vEligibleStatusId,
                        CURRENT_TIMESTAMP, FALSE
                    );
                END IF;
            END IF;

            SELECT "id" INTO STRICT vRoleId FROM access."tRole" WHERE "code" = vUser."roleCode";
            INSERT INTO access."tRoleAssignment" (
                "accountId", "roleId", "scopeId", "roleAssignmentStatusId"
            ) VALUES (
                vAccountId, vRoleId, vGlobalScopeId, vRoleAssignmentStatusId
            )
            ON CONFLICT ("accountId", "roleId", "scopeId")
                WHERE "revokeDtm" IS NULL
            DO UPDATE SET
                "roleAssignmentStatusId" = EXCLUDED."roleAssignmentStatusId",
                "validUntilDtm" = NULL,
                "revokeDtm" = NULL,
                "revokeReasonCode" = NULL;
        END IF;

        IF vUser."roleCode" = 'BASE' THEN vBaseAccountId := vAccountId; END IF;
        IF vUser."roleCode" = 'AGENT' THEN vAgentAccountId := vAccountId; END IF;

        vAccountId := NULL;
        vIdentityId := NULL;
        vProfileResourceId := NULL;
        vPersonAnchorId := NULL;
    END LOOP;

    SELECT identity."accountId"
      INTO STRICT vAgentAccountId
      FROM auth."tIdentity" identity
     WHERE identity."normalizedValue" = 'agent@mecorion.local'
       AND identity."revokeDtm" IS NULL;

    SELECT identity."accountId"
      INTO STRICT vBaseAccountId
      FROM auth."tIdentity" identity
     WHERE identity."normalizedValue" = 'base@mecorion.local'
       AND identity."revokeDtm" IS NULL;

    SELECT identifier."resourceId", contributor."id"
      INTO vArtistResourceId, vArtistId
      FROM content."tResourceExternalIdentifier" identifier
      JOIN content."tContributor" contributor ON contributor."resourceId" = identifier."resourceId"
     WHERE identifier."externalSourceId" = vDemoExternalSourceId
       AND identifier."externalType" = 'CONTRIBUTOR'
       AND identifier."externalId" = 'demo-artist-neon-pulse';

    IF vArtistId IS NULL THEN
        INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContributorResourceTypeId)
        RETURNING "id" INTO vArtistResourceId;

        INSERT INTO content."tContributor" (
            "resourceId", "contributorKindId", "primaryName", "normalizedName",
            "description", "originTerritoryId", "createByAccountId"
        ) VALUES (
            vArtistResourceId, vPersonContributorKindId, 'Neon Pulse', 'neon pulse',
            'Demo electronic artist for Mecorion Music testing.', vWorldTerritoryId, vAgentAccountId
        ) RETURNING "id" INTO vArtistId;

        INSERT INTO content."tResourceExternalIdentifier" (
            "resourceId", "externalSourceId", "externalType", "externalId", "isVerified"
        ) VALUES (
            vArtistResourceId, vDemoExternalSourceId, 'CONTRIBUTOR', 'demo-artist-neon-pulse', TRUE
        );
    END IF;

    SELECT identifier."resourceId", contributor."id"
      INTO vComposerResourceId, vComposerId
      FROM content."tResourceExternalIdentifier" identifier
      JOIN content."tContributor" contributor ON contributor."resourceId" = identifier."resourceId"
     WHERE identifier."externalSourceId" = vDemoExternalSourceId
       AND identifier."externalType" = 'CONTRIBUTOR'
       AND identifier."externalId" = 'demo-composer-mira-vale';

    IF vComposerId IS NULL THEN
        INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContributorResourceTypeId)
        RETURNING "id" INTO vComposerResourceId;

        INSERT INTO content."tContributor" (
            "resourceId", "contributorKindId", "primaryName", "normalizedName",
            "description", "originTerritoryId", "createByAccountId"
        ) VALUES (
            vComposerResourceId, vPersonContributorKindId, 'Mira Vale', 'mira vale',
            'Demo composer and director for cross-domain testing.', vWorldTerritoryId, vAgentAccountId
        ) RETURNING "id" INTO vComposerId;

        INSERT INTO content."tResourceExternalIdentifier" (
            "resourceId", "externalSourceId", "externalType", "externalId", "isVerified"
        ) VALUES (
            vComposerResourceId, vDemoExternalSourceId, 'CONTRIBUTOR', 'demo-composer-mira-vale', TRUE
        );
    END IF;

    SELECT identifier."resourceId", contributor."id"
      INTO vStudioResourceId, vStudioId
      FROM content."tResourceExternalIdentifier" identifier
      JOIN content."tContributor" contributor ON contributor."resourceId" = identifier."resourceId"
     WHERE identifier."externalSourceId" = vDemoExternalSourceId
       AND identifier."externalType" = 'CONTRIBUTOR'
       AND identifier."externalId" = 'demo-studio-mecorion';

    IF vStudioId IS NULL THEN
        INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContributorResourceTypeId)
        RETURNING "id" INTO vStudioResourceId;

        INSERT INTO content."tContributor" (
            "resourceId", "contributorKindId", "primaryName", "normalizedName",
            "description", "originTerritoryId", "createByAccountId"
        ) VALUES (
            vStudioResourceId, vOrganizationContributorKindId, 'Mecorion Demo Studio', 'mecorion demo studio',
            'Demo studio for video and media testing.', vWorldTerritoryId, vAgentAccountId
        ) RETURNING "id" INTO vStudioId;

        INSERT INTO content."tResourceExternalIdentifier" (
            "resourceId", "externalSourceId", "externalType", "externalId", "isVerified"
        ) VALUES (
            vStudioResourceId, vDemoExternalSourceId, 'CONTRIBUTOR', 'demo-studio-mecorion', TRUE
        );
    END IF;

    SELECT identifier."resourceId", contentItem."id"
      INTO vTrackResourceId, vTrackContentId
      FROM content."tResourceExternalIdentifier" identifier
      JOIN content."tContent" contentItem ON contentItem."resourceId" = identifier."resourceId"
     WHERE identifier."externalSourceId" = vDemoExternalSourceId
       AND identifier."externalType" = 'CONTENT'
       AND identifier."externalId" = 'demo-track-midnight-signal';

    IF vTrackContentId IS NULL THEN
        INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContentResourceTypeId)
        RETURNING "id" INTO vTrackResourceId;

        INSERT INTO content."tContent" (
            "resourceId", "contentTypeId", "contentStatusId", "originalLanguageId",
            "originalTitle", "releaseDt", "durationMs", "metadata", "createByAccountId"
        ) VALUES (
            vTrackResourceId, vTrackTypeId, vContentStatusActiveId, vRuLanguageId,
            'Midnight Signal', DATE '2026-01-15', 214000,
            '{"mood":"night-drive","demo":true}'::JSONB, vAgentAccountId
        ) RETURNING "id" INTO vTrackContentId;

        INSERT INTO music."tTrack" ("contentId", "isrc", "bpm", "musicalKey", "previewStartMs")
        VALUES (vTrackContentId, 'USMCR2600001', 124.00, 'Am', 30000);

        INSERT INTO content."tResourceExternalIdentifier" (
            "resourceId", "externalSourceId", "externalType", "externalId", "isVerified"
        ) VALUES (
            vTrackResourceId, vDemoExternalSourceId, 'CONTENT', 'demo-track-midnight-signal', TRUE
        );
    ELSE
        UPDATE content."tContent"
           SET "contentStatusId" = vContentStatusActiveId,
               "durationMs" = 214000,
               "metadata" = "metadata" || '{"demo":true}'::JSONB
         WHERE "id" = vTrackContentId;
    END IF;

    INSERT INTO content."tContentContributor" ("contentId", "contributorId", "contributorRoleId", "ordinal")
    VALUES (vTrackContentId, vArtistId, vPrimaryArtistRoleId, 1)
    ON CONFLICT ("contentId", "contributorId", "contributorRoleId", "characterName") DO NOTHING;

    INSERT INTO content."tContentContributor" ("contentId", "contributorId", "contributorRoleId", "ordinal")
    VALUES (vTrackContentId, vComposerId, vComposerRoleId, 2)
    ON CONFLICT ("contentId", "contributorId", "contributorRoleId", "characterName") DO NOTHING;

    INSERT INTO legal."tResourceLegalStatus" (
        "resourceId", "legalStatusId", "territoryId", "sourceType", "declaredByAccountId", "evidence"
    )
    SELECT vTrackResourceId, vDeclaredLegalStatusId, vWorldTerritoryId,
           'UPLOADER_DECLARATION', vAgentAccountId, '{"demo":true}'::JSONB
    WHERE NOT EXISTS (
        SELECT 1 FROM legal."tResourceLegalStatus"
        WHERE "resourceId" = vTrackResourceId AND "territoryId" = vWorldTerritoryId AND "revokeDtm" IS NULL
    );

    SELECT identifier."resourceId", contentItem."id"
      INTO vAlbumResourceId, vAlbumContentId
      FROM content."tResourceExternalIdentifier" identifier
      JOIN content."tContent" contentItem ON contentItem."resourceId" = identifier."resourceId"
     WHERE identifier."externalSourceId" = vDemoExternalSourceId
       AND identifier."externalType" = 'CONTENT'
       AND identifier."externalId" = 'demo-album-synthetic-dawn';

    IF vAlbumContentId IS NULL THEN
        INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContentResourceTypeId)
        RETURNING "id" INTO vAlbumResourceId;

        INSERT INTO content."tContent" (
            "resourceId", "contentTypeId", "contentStatusId", "originalLanguageId",
            "originalTitle", "releaseDt", "metadata", "createByAccountId"
        ) VALUES (
            vAlbumResourceId, vAlbumTypeId, vContentStatusActiveId, vRuLanguageId,
            'Synthetic Dawn', DATE '2026-01-15',
            '{"demo":true}'::JSONB, vAgentAccountId
        ) RETURNING "id" INTO vAlbumContentId;

        INSERT INTO music."tAlbum" ("contentId", "albumTypeId", "releaseDt")
        VALUES (vAlbumContentId, vAlbumKindId, DATE '2026-01-15');

        INSERT INTO content."tResourceExternalIdentifier" (
            "resourceId", "externalSourceId", "externalType", "externalId", "isVerified"
        ) VALUES (
            vAlbumResourceId, vDemoExternalSourceId, 'CONTENT', 'demo-album-synthetic-dawn', TRUE
        );
    END IF;

    INSERT INTO music."tAlbumTrack" ("albumContentId", "trackContentId", "discNumber", "trackNumber")
    VALUES (vAlbumContentId, vTrackContentId, 1, 1)
    ON CONFLICT ("albumContentId", "trackContentId") DO NOTHING;

    SELECT identifier."resourceId", contentItem."id"
      INTO vFilmResourceId, vFilmContentId
      FROM content."tResourceExternalIdentifier" identifier
      JOIN content."tContent" contentItem ON contentItem."resourceId" = identifier."resourceId"
     WHERE identifier."externalSourceId" = vDemoExternalSourceId
       AND identifier."externalType" = 'CONTENT'
       AND identifier."externalId" = 'demo-film-aurora-station';

    IF vFilmContentId IS NULL THEN
        INSERT INTO core."tResource" ("resourceTypeId") VALUES (vContentResourceTypeId)
        RETURNING "id" INTO vFilmResourceId;

        INSERT INTO content."tContent" (
            "resourceId", "contentTypeId", "contentStatusId", "originalLanguageId",
            "originalTitle", "releaseDt", "durationMs", "metadata", "createByAccountId"
        ) VALUES (
            vFilmResourceId, vFilmTypeId, vContentStatusActiveId, vRuLanguageId,
            'Aurora Station', DATE '2026-02-20', 5400000,
            '{"genre":"sci-fi","demo":true}'::JSONB, vAgentAccountId
        ) RETURNING "id" INTO vFilmContentId;

        INSERT INTO video."tVideo" ("contentId", "videoKind", "runtimeMs", "ageRatingCode")
        VALUES (vFilmContentId, 'FILM', 5400000, '12+');

        INSERT INTO content."tResourceExternalIdentifier" (
            "resourceId", "externalSourceId", "externalType", "externalId", "isVerified"
        ) VALUES (
            vFilmResourceId, vDemoExternalSourceId, 'CONTENT', 'demo-film-aurora-station', TRUE
        );
    ELSE
        UPDATE content."tContent"
           SET "contentStatusId" = vContentStatusActiveId,
               "durationMs" = 5400000,
               "metadata" = "metadata" || '{"demo":true}'::JSONB
         WHERE "id" = vFilmContentId;
    END IF;

    INSERT INTO content."tContentContributor" ("contentId", "contributorId", "contributorRoleId", "ordinal")
    VALUES (vFilmContentId, vComposerId, vDirectorRoleId, 1)
    ON CONFLICT ("contentId", "contributorId", "contributorRoleId", "characterName") DO NOTHING;

    INSERT INTO content."tContentContributor" ("contentId", "contributorId", "contributorRoleId", "ordinal")
    VALUES (vFilmContentId, vStudioId, vProductionStudioRoleId, 2)
    ON CONFLICT ("contentId", "contributorId", "contributorRoleId", "characterName") DO NOTHING;

    INSERT INTO legal."tResourceLegalStatus" (
        "resourceId", "legalStatusId", "territoryId", "sourceType", "declaredByAccountId", "evidence"
    )
    SELECT vFilmResourceId, vDeclaredLegalStatusId, vWorldTerritoryId,
           'UPLOADER_DECLARATION', vAgentAccountId, '{"demo":true}'::JSONB
    WHERE NOT EXISTS (
        SELECT 1 FROM legal."tResourceLegalStatus"
        WHERE "resourceId" = vFilmResourceId AND "territoryId" = vWorldTerritoryId AND "revokeDtm" IS NULL
    );

    -- Demo audio asset for music playback/upload testing.
    IF NOT EXISTS (
        SELECT 1 FROM media."tContentAsset"
        WHERE "contentId" = vTrackContentId AND "contentAssetRoleId" = vPrimaryAudioRoleId
    ) THEN
        INSERT INTO media."tStorageObject" (
            "storageProviderId", "storageObjectStatusId", "bucketName", "objectKey",
            "sizeByte", "contentType", "sha256Digest", "verifyDtm"
        ) VALUES (
            vStorageProviderId, vStorageObjectStatusId, 'mecorion-dev',
            'demo/music/midnight-signal/source.mp3', 5120000, 'audio/mpeg',
            digest('demo/music/midnight-signal/source.mp3', 'sha256'), CURRENT_TIMESTAMP
        )
        ON CONFLICT ("storageProviderId", "bucketName", "objectKey", "versionId")
        DO UPDATE SET "storageObjectStatusId" = EXCLUDED."storageObjectStatusId"
        RETURNING "id" INTO vStorageObjectId;

        INSERT INTO media."tAsset" (
            "assetTypeId", "assetStatusId", "languageId", "title",
            "durationMs", "createByAccountId"
        ) VALUES (
            vAudioAssetTypeId, vAssetReadyStatusId, vRuLanguageId,
            'Midnight Signal audio source', 214000, vAgentAccountId
        ) RETURNING "id" INTO vAssetId;

        INSERT INTO media."tAssetVariant" (
            "assetId", "storageObjectId", "variantCode", "container", "codec",
            "bitrateKbps", "sampleRateHz", "channelCount", "isSource", "isOfflineAllowed"
        ) VALUES (
            vAssetId, vStorageObjectId, 'SOURCE_MP3', 'mp3', 'mp3',
            320, 44100, 2, TRUE, TRUE
        );

        INSERT INTO media."tContentAsset" (
            "contentId", "assetId", "contentAssetRoleId", "territoryId", "isPrimary", "ordinal"
        ) VALUES (
            vTrackContentId, vAssetId, vPrimaryAudioRoleId, vWorldTerritoryId, TRUE, 1
        );
    END IF;

    -- Demo video asset for video playback/upload testing.
    IF NOT EXISTS (
        SELECT 1 FROM media."tContentAsset"
        WHERE "contentId" = vFilmContentId AND "contentAssetRoleId" = vPrimaryVideoRoleId
    ) THEN
        INSERT INTO media."tStorageObject" (
            "storageProviderId", "storageObjectStatusId", "bucketName", "objectKey",
            "sizeByte", "contentType", "sha256Digest", "verifyDtm"
        ) VALUES (
            vStorageProviderId, vStorageObjectStatusId, 'mecorion-dev',
            'demo/video/aurora-station/source.mp4', 104857600, 'video/mp4',
            digest('demo/video/aurora-station/source.mp4', 'sha256'), CURRENT_TIMESTAMP
        )
        ON CONFLICT ("storageProviderId", "bucketName", "objectKey", "versionId")
        DO UPDATE SET "storageObjectStatusId" = EXCLUDED."storageObjectStatusId"
        RETURNING "id" INTO vStorageObjectId;

        INSERT INTO media."tAsset" (
            "assetTypeId", "assetStatusId", "languageId", "title",
            "durationMs", "createByAccountId"
        ) VALUES (
            vVideoAssetTypeId, vAssetReadyStatusId, vRuLanguageId,
            'Aurora Station video source', 5400000, vAgentAccountId
        ) RETURNING "id" INTO vAssetId;

        INSERT INTO media."tAssetVariant" (
            "assetId", "storageObjectId", "variantCode", "container", "codec",
            "bitrateKbps", "widthPx", "heightPx", "isSource", "isOfflineAllowed"
        ) VALUES (
            vAssetId, vStorageObjectId, 'SOURCE_MP4_1080P', 'mp4', 'h264',
            5000, 1920, 1080, TRUE, TRUE
        );

        INSERT INTO media."tContentAsset" (
            "contentId", "assetId", "contentAssetRoleId", "territoryId", "isPrimary", "ordinal"
        ) VALUES (
            vFilmContentId, vAssetId, vPrimaryVideoRoleId, vWorldTerritoryId, TRUE, 1
        );
    END IF;

    -- Publications for basic content browsing tests.
    IF NOT EXISTS (SELECT 1 FROM content."tPublication" WHERE "slug" = 'demo-midnight-signal') THEN
        INSERT INTO core."tResource" ("resourceTypeId") VALUES (vPublicationResourceTypeId)
        RETURNING "id" INTO vPublicationResourceId;

        INSERT INTO content."tPublication" (
            "resourceId", "publicationStatusId", "slug", "title", "summary", "createByAccountId"
        ) VALUES (
            vPublicationResourceId, vDraftPublicationStatusId, 'demo-midnight-signal',
            'Midnight Signal', 'Demo music track for base user playback tests.', vAgentAccountId
        ) RETURNING "id" INTO vPublicationId;

        INSERT INTO content."tPublicationContent" ("publicationId", "contentId", "ordinal", "isPrimary")
        VALUES (vPublicationId, vTrackContentId, 1, TRUE);

        UPDATE content."tPublication"
           SET "publicationStatusId" = vPublishedPublicationStatusId,
               "publishDtm" = CURRENT_TIMESTAMP
         WHERE "id" = vPublicationId;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM content."tPublication" WHERE "slug" = 'demo-aurora-station') THEN
        INSERT INTO core."tResource" ("resourceTypeId") VALUES (vPublicationResourceTypeId)
        RETURNING "id" INTO vPublicationResourceId;

        INSERT INTO content."tPublication" (
            "resourceId", "publicationStatusId", "slug", "title", "summary", "createByAccountId"
        ) VALUES (
            vPublicationResourceId, vDraftPublicationStatusId, 'demo-aurora-station',
            'Aurora Station', 'Demo video item for base user watch tests.', vAgentAccountId
        ) RETURNING "id" INTO vPublicationId;

        INSERT INTO content."tPublicationContent" ("publicationId", "contentId", "ordinal", "isPrimary")
        VALUES (vPublicationId, vFilmContentId, 1, TRUE);

        UPDATE content."tPublication"
           SET "publicationStatusId" = vPublishedPublicationStatusId,
               "publishDtm" = CURRENT_TIMESTAMP
         WHERE "id" = vPublicationId;
    END IF;

    -- Base user's playlist and favorite for library tests.
    SELECT "id"
      INTO vCollectionId
      FROM library."tCollection"
     WHERE "ownerAccountId" = vBaseAccountId
       AND "name" = 'Dev Base Favorites'
       AND "deleteDtm" IS NULL
     LIMIT 1;

    IF vCollectionId IS NULL THEN
        INSERT INTO core."tResource" ("resourceTypeId") VALUES (vCollectionResourceTypeId)
        RETURNING "id" INTO vCollectionResourceId;

        INSERT INTO library."tCollection" (
            "resourceId", "ownerAccountId", "collectionTypeId", "name", "description", "visibilityCode"
        ) VALUES (
            vCollectionResourceId, vBaseAccountId, vCollectionPlaylistTypeId,
            'Dev Base Favorites', 'Seeded playlist for library API testing.', 'PRIVATE'
        ) RETURNING "id" INTO vCollectionId;

    END IF;

    INSERT INTO library."tCollectionItem" (
        "collectionId", "resourceId", "ordinal", "addByAccountId"
    ) VALUES (
        vCollectionId, vTrackResourceId, 1, vBaseAccountId
    )
    ON CONFLICT ("collectionId", "resourceId")
        WHERE "removeDtm" IS NULL
    DO NOTHING;

    INSERT INTO library."tFavorite" ("accountId", "resourceId")
    VALUES (vBaseAccountId, vTrackResourceId)
    ON CONFLICT ("accountId", "resourceId") DO NOTHING;

    -- Agent-created report, visible for moderator queue tests.
    INSERT INTO moderation."tReport" (
        "resourceId", "reportByAccountId", "reportReasonId", "reportStatusId",
        "description", "evidence"
    )
    SELECT vFilmResourceId, vAgentAccountId, vReportReasonId, vReportOpenStatusId,
           'Demo report: video metadata requires moderator review.',
           '{"demo":true,"expectedModeratorAction":"triage"}'::JSONB
    WHERE NOT EXISTS (
        SELECT 1 FROM moderation."tReport"
        WHERE "resourceId" = vFilmResourceId
          AND "reportByAccountId" = vAgentAccountId
          AND "closeDtm" IS NULL
    );
END;
$$;

COMMIT;
