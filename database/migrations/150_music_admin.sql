BEGIN;

-- Contributor remains the canonical cross-service identity. tArtist only marks
-- that contributor as a Music entity and stores Music-specific moderation data.
CREATE TABLE music."tArtist" (
    "contributorId" BIGINT NOT NULL,
    "artistStatus" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "createDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkArtist" PRIMARY KEY ("contributorId"),
    CONSTRAINT "fkArtistContributor" FOREIGN KEY ("contributorId") REFERENCES content."tContributor" ("id"),
    CONSTRAINT "ckArtistStatus" CHECK ("artistStatus" IN ('DRAFT', 'PENDING', 'ACTIVE', 'RESTRICTED', 'RETIRED'))
);

CREATE TRIGGER "trgArtistSetUpdateDtm"
BEFORE UPDATE ON music."tArtist"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

-- Existing demo/catalog contributors become artists when they are already
-- credited on a track or album. The migration is therefore data-safe.
INSERT INTO music."tArtist" ("contributorId", "artistStatus")
SELECT DISTINCT link."contributorId", 'ACTIVE'
FROM content."tContentContributor" link
JOIN content."tContent" item ON item."id" = link."contentId"
JOIN content."tContentType" type ON type."id" = item."contentTypeId"
JOIN content."tContributorRole" role ON role."id" = link."contributorRoleId"
WHERE type."code" IN ('TRACK', 'ALBUM')
  AND role."code" IN ('PRIMARY_ARTIST', 'FEATURED_ARTIST')
ON CONFLICT ("contributorId") DO NOTHING;

COMMIT;
