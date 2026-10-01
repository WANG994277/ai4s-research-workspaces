"use client";
import dynamic from "next/dynamic";
import { baselineModuleLoaders } from "./module-preload";
const loading = () => (
  <div className="v-loading" role="status">
    正在载入页面…
  </div>
);
const Workspace = dynamic(
  () => baselineModuleLoaders.workspace().then((m) => m.Workspace),
  { loading },
);
const AssistantWorkspace = dynamic(
  () => baselineModuleLoaders.assistant().then((m) => m.AssistantWorkspace),
  { loading },
);
const Knowledge = dynamic(
  () => baselineModuleLoaders.knowledge().then((m) => m.KnowledgeCenter),
  { loading },
);
const Datasets = dynamic(
  () => baselineModuleLoaders.datasets().then((m) => m.DatasetMarketplace),
  { loading },
);
const Catalog = dynamic(() => baselineModuleLoaders.catalog().then((m) => m.Catalog), {
  loading,
});
const Assets = dynamic(() => baselineModuleLoaders.assets().then((m) => m.Assets), {
  loading,
});
const Lab = dynamic(() => baselineModuleLoaders.lab().then((m) => m.Lab), { loading });
const Spaces = dynamic(() => baselineModuleLoaders.spaces().then((m) => m.Spaces), {
  loading,
});
const Management = dynamic(
  () => baselineModuleLoaders.management().then((m) => m.Management),
  { loading },
);
const ExternalProject = dynamic(
  () => baselineModuleLoaders.integrations().then((m) => m.ExternalProject),
  { loading },
);
const Admin = dynamic(() => baselineModuleLoaders.integrations().then((m) => m.Admin), {
  loading,
});
export function BaselinePage({ module }: { module: string }) {
  switch (module) {
    case "workspace":
      return <Workspace />;
    case "assistant":
      return <AssistantWorkspace assistant />;
    case "knowledge":
      return <Knowledge />;
    case "datasets":
      return <Datasets />;
    case "skills":
    case "models":
    case "tools":
      return <Catalog key={module} kind={module} />;
    case "assets":
      return <Assets />;
    case "lab":
      return <Lab />;
    case "space-management":
      return <Spaces />;
    case "research-management":
      return <Management />;
    case "research-decision":
      return <Management decision />;
    case "project-management-external":
      return <ExternalProject />;
    case "admin":
      return <Admin />;
    default:
      return null;
  }
}
