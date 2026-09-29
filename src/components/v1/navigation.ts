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
    group: "核心入口",
    roles: ["researcher", "leader", "analyst"],
    children: [],
  },
  {
    id: "assistant",
    name: "科研超级中枢",
    href: "/assistant",
    group: "超级中枢",
    roles: ["researcher", "leader", "analyst"],
    children: [],
  },
  {
    id: "knowledge",
    name: "知识中心",
    href: "/knowledge",
    group: "科研广场",
    roles: ["researcher", "analyst", "leader", "manager"],
    children: [],
  },
  {
    id: "datasets",
    name: "科研数据",
    href: "/datasets",
    group: "科研广场",
    roles: ["researcher", "analyst", "leader", "manager", "admin"],
    children: [],
  },
  {
    id: "skills",
    name: "科研技能",
    href: "/skills",
    group: "科研广场",
    roles: ["researcher", "leader", "manager", "admin"],
    children: [],
  },
  {
    id: "models",
    name: "科研模型",
    href: "/models",
    group: "科研广场",
    roles: ["researcher", "leader", "manager", "admin"],
    children: [],
  },
  {
    id: "tools",
    name: "科研工具箱",
    href: "/tools",
    group: "科研广场",
    roles: ["researcher", "leader", "analyst", "admin"],
    children: queryHref("/tools", "view", ["科研工具", "科研软件", "MCP"]),
  },
  {
    id: "lab",
    name: "云上实验室",
    href: "/lab?tab=" + encodeURIComponent("仪器设备纳管"),
    group: "实验空间",
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
    href: "/research-spaces/current/assets",
    group: "资产空间",
    roles: ["researcher", "analyst", "leader", "manager", "admin"],
    children: [
      { label: "科研资产", href: "/research-spaces/current/assets" },
      { label: "空间管理", href: "/research-spaces/current/manage/basic" },
    ],
  },
  {
    id: "task-history",
    name: "历史任务",
    href: "/task-history",
    group: "历史任务入口",
    roles: ["researcher", "analyst", "leader"],
    children: [],
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
  return modules.filter((module) => visibleModule(module.id, p));
}

export function moduleForPath(pathname: string) {
  return modules.find(
    (module) =>
      pathname === module.href.split("?")[0] ||
      pathname.startsWith(`/${module.id}`),
  );
}
