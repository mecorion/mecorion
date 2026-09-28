BEGIN;

CREATE TABLE core."tUiNavigationGroup" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"      UUID NOT NULL DEFAULT gen_random_uuid(),
    "code"          VARCHAR(64) NOT NULL,
    "label"         VARCHAR(128) NULL,
    "placement"     VARCHAR(16) NOT NULL DEFAULT 'MAIN',
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "isEnabled"     BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkUiNavigationGroup" PRIMARY KEY ("id"),
    CONSTRAINT "uqUiNavigationGroupPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqUiNavigationGroupCode" UNIQUE ("code"),
    CONSTRAINT "ckUiNavigationGroupCode" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,63}$'),
    CONSTRAINT "ckUiNavigationGroupPlacement" CHECK ("placement" IN ('MAIN', 'FOOTER'))
);

CREATE TABLE core."tUiNavigationItem" (
    "id"            BIGINT GENERATED ALWAYS AS IDENTITY,
    "publicId"      UUID NOT NULL DEFAULT gen_random_uuid(),
    "groupId"       BIGINT NOT NULL,
    "code"          VARCHAR(64) NOT NULL,
    "label"         VARCHAR(128) NOT NULL,
    "iconCode"      VARCHAR(64) NOT NULL,
    "routePath"     VARCHAR(256) NOT NULL,
    "componentKey"  VARCHAR(128) NOT NULL,
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "isEnabled"     BOOLEAN NOT NULL DEFAULT TRUE,
    "createDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDtm"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkUiNavigationItem" PRIMARY KEY ("id"),
    CONSTRAINT "uqUiNavigationItemPublicId" UNIQUE ("publicId"),
    CONSTRAINT "uqUiNavigationItemCode" UNIQUE ("code"),
    CONSTRAINT "uqUiNavigationItemRoutePath" UNIQUE ("routePath"),
    CONSTRAINT "fkUiNavigationItemGroup" FOREIGN KEY ("groupId")
        REFERENCES core."tUiNavigationGroup" ("id"),
    CONSTRAINT "ckUiNavigationItemCode" CHECK ("code" ~ '^[a-z][a-z0-9._-]{1,63}$'),
    CONSTRAINT "ckUiNavigationItemRoutePath" CHECK ("routePath" ~ '^/[A-Za-z0-9/_-]*$'),
    CONSTRAINT "ckUiNavigationItemComponentKey" CHECK ("componentKey" ~ '^page\.[a-z][a-z0-9.-]{1,122}$')
);

CREATE TABLE core."tUiNavigationItemRole" (
    "navigationItemId" BIGINT NOT NULL,
    "roleId"           BIGINT NOT NULL,
    "accessType"       VARCHAR(16) NOT NULL,
    "createDtm"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pkUiNavigationItemRole" PRIMARY KEY ("navigationItemId", "roleId", "accessType"),
    CONSTRAINT "fkUiNavigationItemRoleItem" FOREIGN KEY ("navigationItemId")
        REFERENCES core."tUiNavigationItem" ("id") ON DELETE CASCADE,
    CONSTRAINT "fkUiNavigationItemRoleRole" FOREIGN KEY ("roleId")
        REFERENCES access."tRole" ("id"),
    CONSTRAINT "ckUiNavigationItemRoleAccessType" CHECK ("accessType" IN ('VISIBILITY', 'ROUTE'))
);

CREATE INDEX "ixUiNavigationItemGroup"
    ON core."tUiNavigationItem" ("groupId", "sortOrder", "id");

CREATE INDEX "ixUiNavigationItemRoleRole"
    ON core."tUiNavigationItemRole" ("roleId", "accessType", "navigationItemId");

CREATE TRIGGER "trgUiNavigationGroupSetUpdateDtm"
BEFORE UPDATE ON core."tUiNavigationGroup"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

CREATE TRIGGER "trgUiNavigationItemSetUpdateDtm"
BEFORE UPDATE ON core."tUiNavigationItem"
FOR EACH ROW EXECUTE FUNCTION core."fncSetUpdateDtm"();

COMMIT;
