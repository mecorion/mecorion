import type {FastifyInstance} from "fastify";
import {requireAuth} from "../../core/http/auth-context.js";
import {readNavigationItems, roleRuleAllows} from "./platform.navigation.js";

export async function registerPlatformRoutes(app: FastifyInstance) {
  app.get("/api/v1/platform/navigation", async (request) => {
    const context = await requireAuth(request);
    const items = await readNavigationItems();
    const allowedPageCodes = items
      .filter((item) => item.groupIsEnabled && item.isEnabled && roleRuleAllows(item.accessRoles, context.roles))
      .map((item) => item.code);

    const visibleItems = items.filter((item) => (
      item.groupIsEnabled
      && item.isEnabled
      && roleRuleAllows(item.visibilityRoles, context.roles)
    ));
    const groups = [...new Map(visibleItems.map((item) => [item.groupCode, {
      id: item.groupId,
      code: item.groupCode,
      label: item.groupLabel,
      placement: item.groupPlacement,
      sortOrder: item.groupSortOrder,
      items: [] as Array<{code: string; title: string; icon: string; route: string; componentKey: string}>,
    }])).values()];
    const groupsByCode = new Map(groups.map((group) => [group.code, group]));
    for (const item of visibleItems) {
      groupsByCode.get(item.groupCode)?.items.push({
        code: item.code,
        title: item.label,
        icon: item.icon,
        route: item.route,
        componentKey: item.componentKey,
      });
    }

    return {groups, allowedPageCodes};
  });
}
