import type {DatabaseClient} from "../../core/database.js";
import {query} from "../../core/database.js";

export const NAVIGATION_ICON_CODES = [
  "home", "search", "boxes", "grid", "star", "download", "music", "play",
  "book", "graduation-cap", "cloud", "shield", "users", "badge-check",
  "git-pull-request", "user", "settings", "circle-alert",
] as const;

export const PAGE_COMPONENT_KEYS = [
  "page.dashboard", "page.explore", "page.spaces", "page.services",
  "page.saved", "page.downloads", "page.music", "page.video", "page.books",
  "page.course", "page.drive", "page.vpn", "page.agents",
  "page.resolutions", "page.requests", "page.profile", "page.settings",
  "page.support",
] as const;

export interface NavigationItemRecord {
  id: string;
  code: string;
  label: string;
  icon: string;
  route: string;
  componentKey: string;
  sortOrder: number;
  isEnabled: boolean;
  groupId: string;
  groupCode: string;
  groupLabel: string | null;
  groupPlacement: "MAIN" | "FOOTER";
  groupSortOrder: number;
  groupIsEnabled: boolean;
  visibilityRoles: string[];
  accessRoles: string[];
}

export async function readNavigationItems(client: DatabaseClient = {query}) {
  const result = await client.query<NavigationItemRecord>(`
    SELECT item."publicId"::TEXT AS "id", item."code", item."label", item."iconCode" AS "icon",
      item."routePath" AS "route", item."componentKey", item."sortOrder", item."isEnabled",
      navigationGroup."publicId"::TEXT AS "groupId", navigationGroup."code" AS "groupCode",
      navigationGroup."label" AS "groupLabel", navigationGroup."placement" AS "groupPlacement",
      navigationGroup."sortOrder" AS "groupSortOrder", navigationGroup."isEnabled" AS "groupIsEnabled",
      COALESCE(array_agg(DISTINCT role."code") FILTER (WHERE itemRole."accessType" = 'VISIBILITY'), ARRAY[]::VARCHAR[]) AS "visibilityRoles",
      COALESCE(array_agg(DISTINCT role."code") FILTER (WHERE itemRole."accessType" = 'ROUTE'), ARRAY[]::VARCHAR[]) AS "accessRoles"
    FROM core."tUiNavigationItem" item
    JOIN core."tUiNavigationGroup" navigationGroup ON navigationGroup."id" = item."groupId"
    LEFT JOIN core."tUiNavigationItemRole" itemRole ON itemRole."navigationItemId" = item."id"
    LEFT JOIN access."tRole" role ON role."id" = itemRole."roleId" AND role."isActive" = TRUE
    GROUP BY item."id", navigationGroup."id"
    ORDER BY navigationGroup."sortOrder", navigationGroup."id", item."sortOrder", item."id"
  `);
  return result.rows;
}

export function roleRuleAllows(rule: string[], accountRoles: string[]) {
  return rule.length === 0 || rule.some((role) => accountRoles.includes(role));
}
