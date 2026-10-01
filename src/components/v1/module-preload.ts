export const baselineModuleLoaders = {
  workspace: () => import("./workspace"),
  assistant: () => import("./assistant-workspace"),
  knowledge: () => import("./knowledge"),
  datasets: () => import("./datasets"),
  catalog: () => import("./catalog"),
  assets: () => import("./assets"),
  lab: () => import("./lab"),
  spaces: () => import("./spaces"),
  management: () => import("./management"),
  integrations: () => import("./integrations"),
} as const;

type BaselineModuleKey = keyof typeof baselineModuleLoaders;

const baselineModuleAliases: Record<string, BaselineModuleKey> = {
  workspace: "workspace",
  knowledge: "knowledge",
  datasets: "datasets",
  skills: "catalog",
  models: "catalog",
  tools: "catalog",
  assets: "assets",
  lab: "lab",
  "space-management": "spaces",
  "research-management": "management",
  "research-decision": "management",
  "project-management-external": "integrations",
  admin: "integrations",
};

export function createModulePreloader<Key extends string>(
  loaders: Record<Key, () => Promise<unknown>>,
  aliases: Record<string, Key>,
) {
  const inFlight = new Map<Key, Promise<void>>();

  return (moduleId: string): Promise<void> => {
    const key = aliases[moduleId];
    if (!key) return Promise.resolve();

    const existing = inFlight.get(key);
    if (existing) return existing;

    const load = loaders[key]().then(() => undefined).catch((error) => {
      inFlight.delete(key);
      throw error;
    });
    inFlight.set(key, load);
    return load;
  };
}

export function resolveBaselineModuleKey(moduleId: string) {
  return baselineModuleAliases[moduleId];
}

export function collectNavigationWarmupTargets(
  modules: Array<{
    id: string;
    href: string;
    children: Array<{ href: string }>;
  }>,
) {
  const seen = new Set<string>();
  return modules.flatMap((module) =>
    [module.href, ...module.children.map((child) => child.href)].flatMap(
      (href) => {
        if (seen.has(href)) return [];
        seen.add(href);
        return [{
          moduleId: module.id,
          href,
          path: href.split(/[?#]/, 1)[0],
        }];
      },
    ),
  );
}

export const preloadBaselineModule = createModulePreloader(
  baselineModuleLoaders,
  baselineModuleAliases,
);
