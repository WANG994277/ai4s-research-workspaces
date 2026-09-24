# AI4S 科研平台前端原型

本项目按《AI4S科研平台功能清单V1.0_0917 (3).xlsx》的功能说明调整。原型说明书辅助理解，枫清科技产品介绍用于交互参考。范围见 `docs/prototype-alignment.md`，逐行位置见 `docs/feature-coverage.md`。

保留8个科研业务模块、46个二级功能组。不呈现科研流程贯通、基础支撑、后台管理、运维、安全管理。科研项目管理和AI中台数据处理/模型训练采用来源占位说明。

## 本地运行

```bash
pnpm install --frozen-lockfile
pnpm dev
```

访问 `http://localhost:3000/workbench`。Windows 中文路径下开发服务器使用 webpack；生产构建使用 Next.js 默认构建器，并在 `next.config.ts` 中指定项目根目录。

```bash
pnpm run ts-check
pnpm run lint:build
pnpm build
```

## 原型结构

- 工作台：按定稿截图组织 Banner、五项指标、科研专区、AI 推荐、科研活动及科研概览。
- 全局导航：科研人员、课题负责人和科研管理人员演示角色；统一课题选择、命令搜索与二级入口。
- 业务页面：文献、实验方案、实验执行、仪器预约、笔记编辑、报告编辑、科研驾驶舱等采用相应业务工作区。
- 合并：文献工作区（检索/精读/提取/专题）、仪器与预约（台账/排期/统计）、实验执行与管理（台账/编排/记录/调优）、科研数据与模型（来源占位）。
- 旧路由：通过重定向进入新版归属页面。
- 集成边界：AI中台与外部系统页面展示来源标识和演示数据；正式深链、SSO、接口和数据回流需接入真实系统。

演示数据位于 `src/mock/research.ts`。新增笔记、报告、实验、方案、样品、预约、资产登记保存在浏览器 localStorage；既有专业页面部分状态仍为会话演示。真实AI、检索、设备控制和外部系统未接入。路由检查：开发服务启动后运行 `node scripts/check-prototype-routes.mjs`。

## 科研驾驶舱（2026-09-20 参考图版本）

`/dashboard?view=trend|strategy|resources|projects|outcomes` 分别提供态势、方向研判、资源、项目与成果看板；管理概览和科技树保留原有视图。顶部条件点击“查询”后生效，“导出汇总”导出顶部筛选范围内的全部分类数据。

专家确认申请、资源协调和成果共享申请保存在当前浏览器的 `ai4s-cockpit-actions-v1`，可通过“本机记录”查看；不会提交真实审批或发送通知。示例窗口为2019—2024，2025筛选用于检查无数据状态。

验证：`node --import tsx scripts/check-cockpit-data.mjs`；启动开发服务后运行 `node scripts/check-cockpit-pages.mjs`。交互、视觉与边界记录见 `docs/cockpit/acceptance.md` 和 `design-qa.md`。
