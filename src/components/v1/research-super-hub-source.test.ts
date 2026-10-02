import test from "node:test";
import assert from "node:assert/strict";

test("baseline shell exposes its collapse control before the current-page label", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const shellPath = fileURLToPath(new URL("./shell.tsx", import.meta.url));
  const shell = readFileSync(shellPath, "utf8");
  const navStart = shell.indexOf('<nav aria-label="平台功能导航">');
  const sidebarHeader = shell.slice(0, navStart);
  const topbarTitleStart = shell.indexOf('<div className="v-top-title">');
  const currentPageLabel = shell.indexOf("当前页面：", topbarTitleStart);
  const topbarLead = shell.slice(topbarTitleStart, currentPageLabel);

  assert.match(topbarLead, /className="v-top-nav-toggle"/);
  assert.match(topbarLead, /aria-label=\{collapsed \? "展开导航" : "收起导航"\}/);
  assert.doesNotMatch(sidebarHeader, /className="v-sidebar-toggle"/);
});

test("sidebar hides the research execution group heading but keeps its modules", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const shellPath = fileURLToPath(new URL("./shell.tsx", import.meta.url));
  const shell = readFileSync(shellPath, "utf8");

  assert.match(shell, /group !== "科研执行"/);
  assert.match(shell, /workspace: Home/);
  assert.match(shell, /assistant: Orbit/);
  assert.match(shell, /"my-resources": LibraryBig/);
});

test("baseline toast automatically closes after one second", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const shellPath = fileURLToPath(new URL("./shell.tsx", import.meta.url));
  const shell = readFileSync(shellPath, "utf8");
  assert.match(shell, /setTimeout\(\(\) => notify\(""\), 1000\)/);
});

test("workspace switcher exposes virtual spaces and separate project actions", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const shellPath = fileURLToPath(new URL("./shell.tsx", import.meta.url));
  const shell = readFileSync(shellPath, "utf8");

  assert.match(shell, /<span>当前空间：<\/span>/);
  assert.match(shell, />个人空间</);
  assert.match(shell, />全部空间</);
  assert.match(shell, /className="v-space-project-expand"/);
  assert.match(shell, /className="v-space-project-select"/);
  assert.match(shell, /useState<"personal" \| "all" \| "">\("all"\)/);
  assert.ok(shell.indexOf("<strong>全部空间</strong>") < shell.indexOf("<strong>个人空间</strong>"));
});

test("space switching does not show an unsaved-content confirmation modal", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const shellPath = fileURLToPath(new URL("./shell.tsx", import.meta.url));
  const shell = readFileSync(shellPath, "utf8");

  assert.doesNotMatch(shell, /当前页面存在未提交内容/);
  assert.doesNotMatch(shell, /继续切换/);
  assert.doesNotMatch(shell, /pendingSpace/);
});

test("legacy hub extraction keeps every hub view without the old platform pages", async () => {
  const sourceModule = (await import("./research-super-hub-source").catch(() => ({}))) as {
    extractResearchSuperHub?: (source: string) => {
      css: string;
      markup: string;
      runtime: string;
    };
  };
  assert.equal(typeof sourceModule.extractResearchSuperHub, "function");

  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const htmlPath = fileURLToPath(
    new URL("../../../public/AI4S科研平台原型设计.html", import.meta.url),
  );
  const original = readFileSync(htmlPath, "utf8");
  const extracted = sourceModule.extractResearchSuperHub!(original);

  for (const required of [
    'id="page-hub"',
    'id="hub-home"',
    'id="hub-detail"',
    'id="hub-single-pane"',
    'id="hub-three-pane"',
    'id="hub-output-pane"',
    'id="np-bd"',
    'id="mem-bd"',
  ]) {
    assert.match(extracted.markup, new RegExp(required));
  }
  for (const requiredFunction of [
    "function enterHub",
    "function openHubCourse",
    "function renderHubSession",
    "function openTaskOutput",
  ]) {
    assert.match(extracted.runtime, new RegExp(requiredFunction));
  }
  assert.match(extracted.runtime, /Object\.assign\(window/);
  assert.match(extracted.runtime, /__hubNavigateToTasks/);
  assert.doesNotMatch(extracted.runtime, /switchPage\('workbench'\)/);
  assert.doesNotMatch(extracted.markup, /id="page-workbench"/);
  assert.doesNotMatch(extracted.markup, /返回首页/);
  assert.ok(
    extracted.css.length + extracted.markup.length + extracted.runtime.length < original.length,
  );
});

test("research hub defaults to the rubber formula task and central research model", async () => {
  const { extractResearchSuperHub } = await import("./research-super-hub-source");
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const htmlPath = fileURLToPath(
    new URL("../../../public/AI4S科研平台原型设计.html", import.meta.url),
  );
  const extracted = extractResearchSuperHub(readFileSync(htmlPath, "utf8"));

  assert.match(extracted.markup, /id="hb2-link-label">橡胶配方与性能预测<\/span>/);
  assert.match(extracted.markup, /<select class="cmp-select"><option>科研中枢大模型<\/option>/);
  assert.match(extracted.runtime, /var hubLinkedTask = '橡胶配方与性能预测';/);
});

test("template and example actions stop legacy navigation after routing to research tasks", async () => {
  const { extractResearchSuperHub } = await import("./research-super-hub-source");
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const htmlPath = fileURLToPath(
    new URL("../../../public/AI4S科研平台原型设计.html", import.meta.url),
  );
  const extracted = extractResearchSuperHub(readFileSync(htmlPath, "utf8"));

  for (const functionName of ["enterTemplateChat", "hubOpenExample", "hubOpenTask"]) {
    const start = extracted.runtime.indexOf(`function ${functionName}`);
    const body = extracted.runtime.slice(start, start + 260);
    assert.match(body, /window\.__hubNavigateToTasks\(\); return;/);
  }

  const hubComponent = readFileSync(
    fileURLToPath(new URL("./research-super-hub.tsx", import.meta.url)),
    "utf8",
  );
  assert.match(hubComponent, /router\.push\("\/research-spaces\/current\/tasks"\)/);
  assert.doesNotMatch(hubComponent, /sessionStorage\.setItem\(taskSnapshotKey/);
});

test("assistant route mounts the extracted hub without an iframe loader", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const routePath = fileURLToPath(
    new URL("../../app/(app)/assistant/page.tsx", import.meta.url),
  );
  const route = readFileSync(routePath, "utf8");

  assert.match(route, /ResearchSuperHub/);
  assert.doesNotMatch(route, /<iframe/);
  assert.doesNotMatch(route, /正在载入科研超级中枢/);
});

test("research task route reuses the complete extracted task workspace", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const routePath = fileURLToPath(
    new URL("../../app/(app)/research-spaces/[contextId]/tasks/page.tsx", import.meta.url),
  );
  const route = readFileSync(routePath, "utf8");

  assert.match(route, /ResearchSuperHub/);
  assert.match(route, /initialView="tasks"/);
  assert.match(route, /prepareResearchTaskMarkup/);
  assert.doesNotMatch(route, /ResearchTaskWorkspace/);
});

test("migrated hub suppresses native blue focus rings on form controls", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const componentPath = fileURLToPath(
    new URL("./research-super-hub.tsx", import.meta.url),
  );
  const component = readFileSync(componentPath, "utf8");

  assert.match(component, /textarea:focus/);
  assert.match(component, /input:focus/);
  assert.match(component, /select:focus/);
  assert.match(component, /outline:\s*none\s*!important/);
  assert.match(component, /box-shadow:\s*none\s*!important/);
});

test("research task workspace fills the available viewport height", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const componentPath = fileURLToPath(
    new URL("./research-super-hub.tsx", import.meta.url),
  );
  const component = readFileSync(componentPath, "utf8");

  assert.match(component, /research-super-hub-host[^\n]*height:\s*calc\(100dvh - 80px\)/);
  assert.match(component, /margin:\s*0 -24px -36px/);
  assert.doesNotMatch(component, /margin:\s*-22px -24px -36px/);
  assert.match(component, /research-super-hub-host\s*>\s*div[^\n]*height:\s*100%/);
  assert.match(component, /hub-three-pane\s*>\s*div:first-child[^\n]*width:\s*320px/);
  assert.match(component, /hub-tree-name[\s\S]*?text-overflow:\s*clip/);
  assert.match(component, /hub-three-pane\s*>\s*div:last-child[^\n]*width:\s*360px/);
  assert.match(component, /hub-plan-body[\s\S]*?white-space:\s*normal/);
});

test("research overview no longer shows the enter conversation action", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  for (const file of ["research-overview.tsx", "research-overview-redesign.tsx"]) {
    const filePath = fileURLToPath(new URL(`./${file}`, import.meta.url));
    assert.doesNotMatch(readFileSync(filePath, "utf8"), /进入会话/);
  }
});

test("research overview task actions open the default rubber-formula conversation", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  for (const file of ["research-overview.tsx", "research-overview-redesign.tsx"]) {
    const filePath = fileURLToPath(new URL(`./${file}`, import.meta.url));
    const source = readFileSync(filePath, "utf8");
    assert.doesNotMatch(source, /tasks\?task=/);
    assert.match(source, /tasks\?session=rubber-formula/);
  }
});

test("research output detail actions open the current space my-assets page", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const filePath = fileURLToPath(new URL("./research-overview-redesign.tsx", import.meta.url));
  const source = readFileSync(filePath, "utf8");
  assert.match(source, /href=\{`\$\{base\}\/assets\?view=\$\{encodeURIComponent\("我的资产"\)\}`\}/);
  assert.doesNotMatch(source, /setOutputDetail\(output\)/);
});

test("task query initializes the routed task without restoring a hub snapshot", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const componentPath = fileURLToPath(
    new URL("./research-super-hub.tsx", import.meta.url),
  );
  const component = readFileSync(componentPath, "utf8");

  assert.match(component, /query\.get\("task"\)/);
  assert.doesNotMatch(component, /taskSnapshotKey/);
  assert.match(component, /hubOpenTask/);
  assert.match(component, /renderRoutedTaskConversation/);
  assert.match(component, /invokeLegacyInitialization/);
  assert.doesNotMatch(component, /existingRuntime\.remove/);
});
