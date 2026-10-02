type ModuleLoader = () => Promise<unknown>;

export function createModulePreloader(loaders: Record<string, ModuleLoader>) {
  const requests = new Map<ModuleLoader, Promise<unknown>>();
  return (moduleId: string): Promise<unknown | undefined> => {
    const loader = loaders[moduleId];
    if (!loader) return Promise.resolve(undefined);
    const existing = requests.get(loader);
    if (existing) return existing;
    const request = loader();
    requests.set(loader, request);
    return request;
  };
}

export const workspaceLoader = () => import("./workspace").then((m) => m.Workspace);
export const assistantWorkspaceLoader = () => import("./assistant-workspace").then((m) => m.AssistantWorkspace);
export const knowledgeLoader = () => import("./knowledge").then((m) => m.KnowledgeCenter);
export const datasetsLoader = () => import("./datasets").then((m) => m.DatasetMarketplace);
export const catalogLoader = () => import("./catalog").then((m) => m.Catalog);
export const assetsLoader = () => import("./assets").then((m) => m.Assets);
export const labLoader = () => import("./lab").then((m) => m.Lab);
export const spacesLoader = () => import("./spaces").then((m) => m.Spaces);
export const managementLoader = () => import("./management").then((m) => m.Management);
const integrationsLoader = () => import("./integrations");
export const externalProjectLoader = () => integrationsLoader().then((m) => m.ExternalProject);
export const adminLoader = () => integrationsLoader().then((m) => m.Admin);

export const baselineModuleLoaders: Record<string, ModuleLoader> = {
  workspace: workspaceLoader,
  assistant: assistantWorkspaceLoader,
  knowledge: knowledgeLoader,
  datasets: datasetsLoader,
  skills: catalogLoader,
  models: catalogLoader,
  tools: catalogLoader,
  assets: assetsLoader,
  lab: labLoader,
  "space-management": spacesLoader,
  "research-management": managementLoader,
  "research-decision": managementLoader,
  "project-management-external": externalProjectLoader,
  admin: adminLoader,
};

export const isPreloadableBaselineModule = (moduleId: string) => moduleId in baselineModuleLoaders;
export const preloadBaselineModule = createModulePreloader(baselineModuleLoaders);

export function preloadBaselineModules(moduleIds: Iterable<string>) {
  return Promise.allSettled([...moduleIds].map(preloadBaselineModule));
}
