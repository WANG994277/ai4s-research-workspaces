"use client";
import dynamic from "next/dynamic";
const loading = () => (
  <div className="v-loading" role="status">
    正在载入页面…
  </div>
);
const Workspace = dynamic(
  () => import("./workspace").then((m) => m.Workspace),
  { loading },
);
const Knowledge = dynamic(
  () => import("./knowledge").then((m) => m.KnowledgeCenter),
  { loading },
);
const Catalog = dynamic(() => import("./catalog").then((m) => m.Catalog), {
  loading,
});
const Assets = dynamic(() => import("./assets").then((m) => m.Assets), {
  loading,
});
const Lab = dynamic(() => import("./lab").then((m) => m.Lab), { loading });
const Spaces = dynamic(() => import("./spaces").then((m) => m.Spaces), {
  loading,
});
const Management = dynamic(
  () => import("./management").then((m) => m.Management),
  { loading },
);
const ExternalProject = dynamic(
  () => import("./integrations").then((m) => m.ExternalProject),
  { loading },
);
const Admin = dynamic(() => import("./integrations").then((m) => m.Admin), {
  loading,
});
export function BaselinePage({ module }: { module: string }) {
  switch (module) {
    case "workspace":
      return <Workspace />;
    case "knowledge":
      return <Knowledge />;
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
