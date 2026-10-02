import { isPreloadableBaselineModule } from "./module-loaders";

export function preloadableNavigationModuleIds(
  visibleModuleIds: Iterable<string>,
  activeModuleId?: string,
) {
  return [...new Set(visibleModuleIds)].filter(
    (moduleId) =>
      moduleId !== activeModuleId && isPreloadableBaselineModule(moduleId),
  );
}

export function preloadableNavigationTargets<T extends { id: string; href: string }>(
  visibleModules: Iterable<T>,
  activeModuleId?: string,
) {
  const seen = new Set<string>();
  return [...visibleModules].filter((module) => {
    if (module.id === activeModuleId || seen.has(module.id)) return false;
    seen.add(module.id);
    return true;
  });
}
