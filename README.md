# AI4S 科研平台前端原型

当前版本依据2026-09-24提供的15份V1.0 PRD、对象模型、权限矩阵和IA重构，默认入口 `/workspace`。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://localhost:3000/workspace 。用户入口提供6类演示角色。桌面Web为本次设计和验证范围。

## 当前结构

统一Research Agent工作台、知识中心、科研数据广场、科研技能、科研模型、科研工具箱、云上实验室、科研空间、科研管理工作台、科研驾驶舱、科研项目管理与平台治理入口。科研空间合并科研资产建设/维护与当前空间日常管理，旧“科研资产”“项目空间管理”仅保留兼容重定向。左侧显示完整功能树，无权限入口锁定；工作台、知识中心与科研数据无二级菜单，工具箱固定科研工具/科研软件/MCP，科研项目管理固定七个二级入口。

- [需求落点及集成边界](docs/v1-baseline/coverage.md)
- [逐模块PRD最终审查](docs/v1-baseline/prd-final-audit.md)
- [验收记录](docs/v1-baseline/acceptance.md)
- [架构与复用选择](docs/v1-baseline/architecture.md)
- [科研数据广场 ADR](docs/v1-baseline/adr-research-data-marketplace.md)
- [设计系统](design-system/ai4s-v1-baseline/MASTER.md)
- [科研空间架构与复用决策](docs/research-space/architecture.md)
- [科研空间PRD落点](docs/research-space/coverage.md)

```bash
pnpm run ts-check
pnpm run lint:build
node --import tsx --test src/components/v1/*.test.ts
node scripts/check-research-space.mjs
node scripts/check-v1-ui.mjs
node scripts/check-v1-routes.mjs
AI4S_PREVIEW_DIR=.next-v1-prod pnpm build
```

页面与对象实现位于 `src/components/v1`；数据保存在当前浏览器独立localStorage键，不改旧版数据。AI执行、检索、模型、设备及外部系统使用明确标注的本地演示或未连接状态，未接真实后端、SSO或设备控制。权限原型不能代替服务端鉴权。

此前版本记录保存在 `docs/v1-baseline/previous-readme.md`，不再作为当前功能边界。
