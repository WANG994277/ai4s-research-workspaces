export interface ResearchSuperHubSource {
  css: string;
  markup: string;
  runtime: string;
}

const defaultTaskChatMarkup = `
<div style="display:flex;justify-content:flex-end;margin-bottom:16px;"><div style="max-width:70%;background:#2563EB;color:white;border-radius:14px 14px 4px 14px;padding:11px 16px;font-size:13px;line-height:1.6;">为运动型乘用车轮胎开发锡偶联 SSBR 新牌号，设计一批分子结构使纯胶 Tg 达到 -35±5℃，串行迭代用分子动力学预测 Tg。</div></div>
<div style="display:flex;gap:10px;margin-bottom:16px;"><div style="width:28px;height:28px;border-radius:50%;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-robot" style="font-size:11px;color:#2563EB;"></i></div><div style="max-width:78%;background:white;border:1.5px solid #E5E7EB;border-radius:14px 14px 14px 4px;padding:11px 16px;font-size:13px;line-height:1.7;color:#374151;">已读取项目记忆与 17 个专利配方。将按串行策略：设计候选 → RDKit 校验 → RadonPy MD 预测 Tg，不达标自动规划下一候选。先给出候选 C1/C2/C3。</div></div>
<div style="display:flex;justify-content:flex-end;margin-bottom:16px;"><div style="max-width:70%;background:#2563EB;color:white;border-radius:14px 14px 4px 14px;padding:11px 16px;font-size:13px;line-height:1.6;">先按方案 A 覆盖策略推进，禁用 Fox 方程。</div></div>
<div style="display:flex;gap:10px;"><div style="width:28px;height:28px;border-radius:50%;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-robot" style="font-size:11px;color:#2563EB;"></i></div><div style="max-width:78%;background:white;border:1.5px solid #E5E7EB;border-radius:14px 14px 14px 4px;padding:11px 16px;font-size:13px;line-height:1.7;color:#374151;">已确认方案 A、禁用 Fox。C1/C2/C3 已建链校验，正在提交 MD 预测；当前推荐 Top5，最高分 81.04。</div></div>`;

const defaultTaskPlanMarkup = `
<div style="padding:18px 16px 10px;display:flex;gap:10px;"><span style="width:42px;height:42px;display:grid;place-items:center;border-radius:9px;background:#EEF2F7;color:#60728E;"><i class="fa-solid fa-robot"></i></span><div><b style="display:block;font-size:13px;">认知智能体</b><small style="color:#9AA7BA;font-size:10px;font-family:monospace;">builtin:matl_coordinator</small></div></div>
<p style="padding:0 16px;color:#8695AA;font-size:10px;">绑定实验 5 个 · 下一批 1 项</p>
<ol style="list-style:none;margin:12px 0;padding:0 12px 20px;">
${[
  ["候选筛选与预测", "ID:7 · 已完成", "done"],
  ["聚合物选材（数字研发）", "ID:3 · 进行中", "current"],
  ["配方优化（数字小试）", "ID:4 · 待执行", "wait"],
  ["模流分析（数字试模）", "ID:5 · 待执行", "wait"],
  ["结论与决策", "ID:6 · 待执行", "wait"],
].map(([title, meta, state], index) => `<li style="display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:center;margin-bottom:10px;"><span style="width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:${state === "current" ? "#2563EB" : "#F0F4FA"};color:${state === "current" ? "#fff" : "#2563EB"};font-size:11px;font-weight:700;">${index + 1}</span><div style="padding:10px;border:${state === "current" ? "2px solid #2563EB" : "1px solid #E5E7EB"};border-radius:9px;background:#fff;"><b style="display:block;font-size:11px;">${title}</b><small style="display:block;margin-top:4px;color:#98A5B8;font-size:9px;">${meta}${state === "current" ? " · 当前" : ""}</small></div></li>`).join("")}
</ol>`;

export function prepareResearchTaskMarkup(markup: string) {
  return markup
    .replace('<div id="hub-home" class="hb2-home mnt-bg">', '<div id="hub-home" class="hb2-home mnt-bg" style="display:none;">')
    .replace('id="hub-detail" style="display:none;', 'id="hub-detail" style="display:flex;')
    .replace(
      'id="hub-single-pane" style="flex:1; overflow:hidden; display:flex;',
      'id="hub-single-pane" style="flex:1; overflow:hidden; display:none;',
    )
    .replace('id="hub-three-pane" style="display:none;', 'id="hub-three-pane" style="display:flex;')
    .replace(
      '<div style="flex:1;overflow-y:auto;padding:28px 40px;" id="hub-chat-area"></div>',
      `<div style="flex:1;overflow-y:auto;padding:28px 40px;" id="hub-chat-area">${defaultTaskChatMarkup}</div>`,
    )
    .replace(
      '<div id="hub-plan-body" style="display:flex;flex-direction:column;flex:1;"></div>',
      `<div id="hub-plan-body" style="display:flex;flex-direction:column;flex:1;">${defaultTaskPlanMarkup}</div>`,
    );
}

function sliceRequired(
  source: string,
  startMarker: string,
  endMarker: string,
  includeEnd = false,
) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`缺少科研超级中枢源码标记：${startMarker}`);
  const endStart = source.indexOf(endMarker, start + startMarker.length);
  if (endStart < 0) throw new Error(`缺少科研超级中枢源码标记：${endMarker}`);
  const end = includeEnd ? endStart + endMarker.length : endStart;
  return source.slice(start, end);
}

export function extractResearchSuperHub(source: string): ResearchSuperHubSource {
  const firstStyleStart = source.indexOf("<style>");
  const firstStyleEnd = source.indexOf("</style>", firstStyleStart);
  if (firstStyleStart < 0 || firstStyleEnd < 0) {
    throw new Error("科研超级中枢原型缺少基础样式");
  }

  const hubMarkup = sliceRequired(
    source,
    '<div id="page-hub"',
    "</div><!-- /page-hub -->",
    true,
  )
    .replace('class="page"', 'class="page active"')
    .replace(
      /<button onclick="closeHubDetail\(\)"[\s\S]*?返回首页<\/button>/g,
      "",
    );

  const modalMarkup = sliceRequired(
    source,
    "<!-- 新建项目（模板配置）弹窗 -->",
    "</body>",
  );

  const runtimeMarker = "// ── Page titles";
  const runtimeMarkerIndex = source.indexOf(runtimeMarker);
  if (runtimeMarkerIndex < 0) throw new Error("科研超级中枢原型缺少运行时代码");
  const runtimeStart = source.lastIndexOf("<script>", runtimeMarkerIndex);
  const runtimeEnd = source.indexOf("</script>", runtimeMarkerIndex);
  if (runtimeStart < 0 || runtimeEnd < 0) {
    throw new Error("科研超级中枢原型运行时代码不完整");
  }

  const rawRuntime = source.slice(runtimeStart + "<script>".length, runtimeEnd);
  const moduleRuntime = rawRuntime.replace(
    /\/\/ ── Init\s*document\.addEventListener\('DOMContentLoaded',[\s\S]*?\n}\);\s*/,
    "",
  )
    .replace(
      "function enterTaskWorkspace() {",
      "function enterTaskWorkspace() {\n  if (typeof window.__hubNavigateToTasks === 'function') { window.__hubNavigateToTasks(); return; }",
    )
    .replace(
      "function enterTemplateChat(name, tpl) {",
      "function enterTemplateChat(name, tpl) {\n  if (typeof window.__hubNavigateToTasks === 'function') { window.__hubNavigateToTasks(); return; }",
    )
    .replace(
      "function hubOpenExample(name) {",
      "function hubOpenExample(name) {\n  if (typeof window.__hubNavigateToTasks === 'function') { window.__hubNavigateToTasks(); return; }",
    )
    .replace(
      "function hubOpenTask(el, name, n) {",
      "function hubOpenTask(el, name, n) {\n  if (typeof window.__hubNavigateToTasks === 'function') { window.__hubNavigateToTasks(); return; }",
    );
  const functionNames = [...moduleRuntime.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)]
    .map((match) => match[1])
    .filter((name, index, values) => values.indexOf(name) === index);
  const globalBindings = `
Object.assign(window, { ${functionNames.join(", ")} });
if (!window.__researchSuperHubInitBound) {
  window.__researchSuperHubInitBound = true;
  window.addEventListener('research-super-hub:init', function (event) {
    var detail = event.detail || {};
    if (detail.view === 'tasks') {
      enterTaskWorkspace();
      if (detail.taskName) hubOpenTask(null, detail.taskName, detail.steps || 1);
    } else {
      enterHub();
      selectMode('read');
    }
    if (typeof renderMemberAvatars === 'function') renderMemberAvatars();
  });
}
`;

  return {
    css: source.slice(firstStyleStart + "<style>".length, firstStyleEnd),
    markup: `${hubMarkup}\n${modalMarkup}`,
    runtime: `${moduleRuntime}${globalBindings}`,
  };
}
