const base = process.env.BASE_URL || "http://localhost:3000";

const routes = [
  "/workspace",
  "/knowledge",
  "/datasets",
  "/skills",
  "/models",
  ...["科研工具", "科研软件", "MCP"].map(
    (view) => `/tools?view=${encodeURIComponent(view)}`,
  ),
  ...["仪器设备纳管", "仪器设备共享", "实验任务管理", "实验试剂耗材管理"].map(
    (tab) => `/lab?tab=${encodeURIComponent(tab)}`,
  ),
  "/research-spaces/topic-a/assets",
  "/research-spaces/topic-a/assets/dataset-shale",
  ...["basic", "members", "roles", "topics", "sharing", "audit"].map(
    (view) => `/research-spaces/topic-a/manage/${view}`,
  ),
  ...["管理概览", "项目运行", "科研进展", "风险与异常", "科研成果"].map(
    (tab) => `/research-management?tab=${encodeURIComponent(tab)}`,
  ),
  "/dashboard",
  ...[
    "立项管理",
    "过程管理",
    "外协管理",
    "成果管理",
    "人才管理",
    "考核管理",
    "日常管理",
  ].map(
    (view) => `/project-management-external?view=${encodeURIComponent(view)}`,
  ),
  "/admin",
];

const checks = await Promise.all(
  routes.map(async (route) => {
    const response = await fetch(base + route);
    return { route, status: response.status };
  }),
);

for (const check of checks) {
  console.log(`${check.status} ${check.route}`);
  if (check.status !== 200) process.exitCode = 1;
}

for (const route of [
  "/workbench",
  "/read-space",
  "/compute-space",
  "/do-space",
  "/research-decision",
  "/assets",
  "/space-management",
]) {
  const response = await fetch(base + route, { redirect: "manual" });
  const body = await response.text();
  const redirect =
    response.status === 307 ||
    response.status === 308 ||
    body.includes("NEXT_REDIRECT");
  console.log(`${redirect ? "PASS" : "FAIL"} legacy ${route}`);
  if (!redirect) process.exitCode = 1;
}
