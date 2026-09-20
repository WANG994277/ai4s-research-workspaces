# 读空间前端模拟版

依据 `AI4S_读空间_PRD_V1.0.md` 重构。功能和交互遵循 PRD，视觉参考用户设计图，采用白底、浅灰分层、朱丹红关键操作。

## 体验入口

启动项目：`pnpm dev`，打开 `http://localhost:3000/read-space`。

独立生产预览可设置 `AI4S_PREVIEW_DIR=.next-read-preview` 后运行 `pnpm build` 与 `pnpm start --port 3010`，避免并行开发覆盖预览构建。

| 页面 | 地址 | 主要体验 |
|---|---|---|
| 开始研究 | `/read-space` | 输入目标、上传与引用资料、研究模式、八种快捷模板、六种科研智能体 |
| 科研思路探索 | `/read-space/agent` | 可编辑计划、模拟执行、暂停重试、人工确认、五类研究产物 |
| 文献与标准检索 | `/literature-search` | AI/关键词/高级检索、筛选、批量科研操作、检索助手 |
| 文献研读 | `/literature-search/1` | 单篇/多篇、原文定位、语义标记、笔记、方法和参数产物 |
| 标准对标 | `/standards-benchmark` | 条款映射、指标、试验方法、适用性与来源确认 |
| 专利分析 | `/patent-analysis` | 检索筛选、技术地图、趋势、申请人、权利要求、空白候选 |
| 图表提取 | `/literature-search/data-extract` | 表格/曲线/示意图、坐标单位、人工校正、CSV/XLSX、来源追溯 |
| 科研写作 | `/research-writing` | 大纲、素材、正文编辑、证据引用、写作助手与报告导出 |
| 知识关系 | `/knowledge-graph` | 任务资源关系、节点展开、过滤、证据与关联研究 |
| 研究任务 | `/read-space/tasks` | 六种任务状态、检索、筛选与完整工作区恢复 |
| 验证草稿 | `/read-space/handoff` | 人工确认后进入算/做空间，模拟验证产物回流 |

## 数据与模拟

- 使用 Mock 科研资料和模拟执行过程，无需外部服务或模型密钥。
- 任务、资料、证据、产物、笔记、跨空间草稿保存于浏览器本地，同一浏览器刷新后可恢复。
- 用户上传的文件保存于 IndexedDB；支持浏览器原生可查看格式，其他文件支持模拟解析。
- 课题切换按 `projectId` 隔离任务，所有跨空间草稿携带来源任务、假设、参数、单位和证据。
- 研究空白和科学假设保留候选属性；人工笔记与 AI 笔记分别保存。
- 原型评审工具可以查看、编辑本地需求副本，导出本页或完整 PRD；不改写原始文档。

## 验证

- `node --import tsx scripts/check-read-space.ts`：计划排序、来源证据、产物关联、跨空间载荷与恢复路由。
- `node scripts/check-read-space-browser.js`：浏览器端完整研究主链路、人工确认、持久化、课题隔离和页面布局。需要安装 Playwright，或通过 `PLAYWRIGHT_MODULE` 指定已有运行时。
- 页面截图与测试结果位于本目录 `qa/`。
- 读空间专项类型检查：`npx tsc --project docs/read-space/tsconfig.json`。完整验收结果见 `QA.md`。
