import type { Profile, Role } from "./types";

export interface NavigationChild {
  label: string;
  href: string;
}

export interface NavigationModule {
  id: string;
  name: string;
  href: string;
  group: string;
  roles: Role[];
  children: NavigationChild[];
  parentId?: string;
  integrated?: boolean;
}

const queryHref = (path: string, key: string, values: string[]) =>
  values.map((label) => ({
    label,
    href: `${path}?${key}=${encodeURIComponent(label)}`,
  }));

export const modules: NavigationModule[] = [
  {
    id: "workspace",
    name: "科研工作台",
    href: "/workspace",
    group: "科研执行",
    roles: ["researcher", "leader", "analyst"],
    children: [],
  },
  {
    id: "assistant",
    name: "科研超级中枢",
    href: "/assistant",
    group: "科研执行",
    roles: ["researcher", "leader", "analyst"],
    children: [],
  },
  {
    id: "my-resources",
    name: "科研资源中心",
    href: "/my-resources",
    group: "科研执行",
    roles: ["researcher", "analyst", "leader", "manager", "admin"],
    children: [
      { label: "知识中心", href: "/knowledge" },
      { label: "科研数据集", href: "/datasets" },
      { label: "科研技能", href: "/skills" },
      { label: "科研模型", href: "/models" },
      { label: "科研工具箱", href: "/tools?view=" + encodeURIComponent("科研工具") },
    ],
  },
  {
    id: "knowledge",
    name: "知识中心",
    href: "/knowledge",
    parentId: "my-resources",
    group: "科研执行",
    roles: ["researcher", "analyst", "leader", "manager"],
    children: [],
  },
  {
    id: "datasets",
    name: "科研数据集",
    href: "/datasets",
    parentId: "my-resources",
    group: "科研执行",
    roles: ["researcher", "analyst", "leader", "manager", "admin"],
    children: [],
  },
  {
    id: "skills",
    name: "科研技能",
    href: "/skills",
    parentId: "my-resources",
    group: "科研执行",
    roles: ["researcher", "leader", "manager", "admin"],
    children: [],
  },
  {
    id: "models",
    name: "科研模型",
    href: "/models",
    parentId: "my-resources",
    group: "科研执行",
    roles: ["researcher", "leader", "manager", "admin"],
    children: [],
  },
  {
    id: "tools",
    name: "科研工具箱",
    href: "/tools?view=" + encodeURIComponent("科研工具"),
    parentId: "my-resources",
    group: "科研执行",
    roles: ["researcher", "leader", "analyst", "admin"],
    children: queryHref("/tools", "view", ["科研工具", "科研软件", "MCP"]),
  },
  {
    id: "lab",
    name: "云上实验室",
    href: "/lab?tab=" + encodeURIComponent("仪器设备纳管"),
    group: "科研执行",
    roles: [
      "researcher",
      "analyst",
      "leader",
      "manager",
      "admin",
    ],
    children: queryHref("/lab", "tab", [
      "仪器设备纳管",
      "仪器设备共享",
      "实验任务管理",
      "实验试剂耗材管理",
    ]),
  },
  {
    id: "research-spaces",
    name: "科研空间",
    href: "/research-spaces/current/overview",
    group: "科研执行",
    roles: ["researcher", "analyst", "leader", "manager", "admin"],
    children: [
      { label: "课题概览", href: "/research-spaces/current/overview" },
      { label: "科研任务", href: "/research-spaces/current/tasks" },
      { label: "科研活动", href: "/research-spaces/current/activities" },
      { label: "科研资产", href: "/research-spaces/current/assets" },
    ],
  },
  {
    id: "research-management",
    name: "科研管理工作台",
    href: "/research-management?tab=" + encodeURIComponent("管理概览"),
    group: "科研协同与管理",
    roles: ["manager"],
    children: queryHref("/research-management", "tab", [
      "管理概览",
      "项目运行",
      "科研进展",
      "风险与异常",
      "科研成果",
    ]),
  },
  {
    id: "research-decision",
    name: "科研驾驶舱",
    href: "/dashboard?view=trend",
    group: "科研决策",
    roles: ["decision", "manager"],
    children: [
      { label: "科技态势分析", href: "/dashboard?view=trend" },
      { label: "战略方向研判", href: "/dashboard?view=strategy" },
      { label: "资源统筹配置", href: "/dashboard?view=resources" },
      { label: "重大项目监管", href: "/dashboard?view=projects" },
      { label: "科技成果展示", href: "/dashboard?view=outcomes" },
      { label: "科技树", href: "/dashboard?view=technology-tree" },
    ],
  },
  {
    id: "project-management-external",
    name: "科研项目管理",
    href: "/project-management-external?view=" + encodeURIComponent("立项管理"),
    group: "科研项目管理",
    roles: ["leader", "manager", "decision"],
    children: queryHref("/project-management-external", "view", [
      "立项管理",
      "过程管理",
      "外协管理",
      "成果管理",
      "人才管理",
      "考核管理",
      "日常管理",
    ]),
    integrated: true,
  },
  {
    id: "admin",
    name: "平台管理后台",
    href: "/admin",
    group: "系统管理",
    roles: ["admin"],
    children: [],
  },
];

export function visibleModule(id: string, p: Profile) {
  const item = modules.find((moduleItem) => moduleItem.id === id);
  return (
    !!item &&
    (item.roles.some((role) => p.roles.includes(role)) || p.grants.includes(id))
  );
}

export function visibleModules(p: Profile) {
  return modules.filter((module) => !module.parentId && visibleModule(module.id, p));
}

export function visibleChildren(module: NavigationModule, p: Profile) {
  return module.children.filter((child) => {
    const childModule = modules.find(
      (item) => item.parentId === module.id && item.href === child.href,
    );
    return !childModule || visibleModule(childModule.id, p);
  });
}

export function moduleForPath(pathname: string) {
  return modules.find(
    (module) =>
      pathname === module.href.split("?")[0] ||
      pathname.startsWith(`/${module.id}`),
  );
}

const activityLabels: Record<string, string> = {
  agents: "智能体",
  skills: "技能",
  modelDevelopment: "模型开发",
  training: "模型训练",
  inference: "模型推理",
  datasets: "数据集",
  tools: "科研工具",
  computing: "科学计算",
};

const dashboardLabels: Record<string, string> = {
  trend: "科技态势分析",
  strategy: "战略方向研判",
  resources: "资源统筹配置",
  projects: "重大项目监管",
  outcomes: "科技成果展示",
  "technology-tree": "科技树",
};

function queryValue(query: string | URLSearchParams, key: string) {
  return (typeof query === "string" ? new URLSearchParams(query) : query).get(key) ?? "";
}

export function breadcrumbForRoute(pathname: string, query: string | URLSearchParams): [string, string] {
  if (pathname === "/workspace") return ["科研工作台", "工作台首页"];
  if (pathname === "/assistant") return ["科研超级中枢", "智能协作"];
  if (pathname === "/my-resources") return ["科研资源中心", "我的资源"];
  if (pathname === "/knowledge" || pathname.startsWith("/knowledge/")) return ["科研资源中心", "知识中心"];
  if (pathname === "/datasets") return ["科研资源中心", "科研数据集"];
  if (pathname === "/skills") return ["科研资源中心", "科研技能"];
  if (pathname === "/models") return ["科研资源中心", "科研模型"];
  if (pathname === "/tools") return ["科研资源中心", queryValue(query, "view") || "科研工具"];
  if (pathname === "/lab") return ["云上实验室", queryValue(query, "tab") || "仪器设备纳管"];

  if (pathname.startsWith("/research-spaces/")) {
    if (/\/activities\/computing\/training-/.test(pathname)) return ["科研空间", "模型训练"];
    if (/\/activities\/computing\/inference-/.test(pathname)) return ["科研空间", "模型推理"];
    if (/\/activities\/computing\//.test(pathname) || /\/computing(?:\/|$)/.test(pathname)) return ["科研空间", "科学计算"];
    if (/\/activities\/agents\/new\/?$/.test(pathname)) return ["科研空间", "新建智能体"];
    if (/\/activities\/?$/.test(pathname)) return ["科研空间", activityLabels[queryValue(query, "tab")] || "科研活动"];
    if (/\/assets(?:\/|$)/.test(pathname)) return ["科研空间", "科研资产"];
    if (/\/tasks\/?$/.test(pathname)) return ["科研空间", "科研任务"];
    if (/\/overview\/?$/.test(pathname)) return ["科研空间", "课题概览"];
    if (/\/manage(?:\/|$)/.test(pathname)) return ["科研空间", "空间管理"];
    if (/\/builds(?:\/|$)/.test(pathname)) return ["科研空间", "空间构建"];
    return ["科研空间", "课题概览"];
  }

  if (pathname === "/research-management") return ["科研管理工作台", queryValue(query, "tab") || "管理概览"];
  if (pathname === "/dashboard" || pathname === "/research-decision") return ["科研驾驶舱", dashboardLabels[queryValue(query, "view")] || "科技态势分析"];
  if (pathname === "/project-management-external") return ["科研项目管理", queryValue(query, "view") || "立项管理"];
  if (pathname === "/admin" || pathname.startsWith("/manage/")) return ["平台管理后台", "管理首页"];

  const current = moduleForPath(pathname);
  if (current?.parentId) {
    const parent = modules.find((item) => item.id === current.parentId);
    return [parent?.name ?? current.name, current.name];
  }
  if (current) return [current.name, "首页"];
  return ["科研平台", "首页"];
}
