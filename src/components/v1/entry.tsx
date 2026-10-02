"use client";
import dynamic from "next/dynamic";
import { adminLoader, assistantWorkspaceLoader, assetsLoader, catalogLoader, datasetsLoader, externalProjectLoader, knowledgeLoader, labLoader, managementLoader, spacesLoader, workspaceLoader } from "./module-loaders";
const loading = () => (
  <div className="v-loading" role="status">
    正在载入页面…
  </div>
);
const Workspace = dynamic(
  workspaceLoader,
  { loading },
);
const AssistantWorkspace = dynamic(
  assistantWorkspaceLoader,
  { loading },
);
const Knowledge = dynamic(
  knowledgeLoader,
  { loading },
);
const Datasets = dynamic(
  datasetsLoader,
  { loading },
);
const Catalog = dynamic(catalogLoader, {
  loading,
});
const Assets = dynamic(assetsLoader, {
  loading,
});
const Lab = dynamic(labLoader, { loading });
const Spaces = dynamic(spacesLoader, {
  loading,
});
const Management = dynamic(
  managementLoader,
  { loading },
);
const ExternalProject = dynamic(
  externalProjectLoader,
  { loading },
);
const Admin = dynamic(adminLoader, {
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
