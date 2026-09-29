# 科研空间重构架构与复用决策

## 需求

以 2026-09-29《AI4S 科研空间 PRD V1.0》替代旧一级“科研资产”，把五类资产的建设、维护、共享、发布与当前空间的基本信息、成员、业务角色、课题、共享规则和审计统一到“科研空间”。Research Agent 保持唯一任务执行入口。

## 候选方案

1. 仅改旧 `assets.tsx` 标题并在页面中嵌入 `spaces.tsx`。集成成本低，但会保留“我的/项目资产”、独立项目空间中心、删除资产和通用发布等冲突心智，拒绝。
2. 保留两个组件，通过新页面拼接。可复用一部分 UI，但状态、路由、权限和动作仍分裂，难以满足同一对象闭环，拒绝。
3. 新建科研空间页面与领域适配层，复用现有全局壳层、状态仓库、基础对象和通用控件，旧页面只保留兼容跳转。选择。

## 成熟方案核对

- Next.js App Router 官方支持动态路径与客户端 `useSearchParams`，适合把 context、筛选、分页和详情 tab 置于 URL；现有应用已经用 Suspense 包裹壳层，无需更换路由框架。
- Radix Dialog 官方提供焦点圈定、Esc 关闭、标题播报和受控开关；现有 `Modal` 已基于该实现，继续复用，不自研弹层焦点管理。
- 项目已有 React 19、Next.js 16、Lucide、Radix、Zod、React Hook Form、Zustand。当前原型数据量小、单一 localStorage 状态已形成闭环，本轮不引入表格、权限或服务端状态新依赖；权限以纯函数领域适配层表达，便于后续替换真实 `allowed_actions` 接口。

## 选择与边界

- 新增 `/research-spaces/:contextId/assets`、资产详情、`manage/:view` 和 `builds/:requestId` 页面；旧 `/assets`、`/space-management` 校验后重定向。
- `State` 仍是唯一原型数据源，扩展而不复制 Asset/Version/Grant/Review/BuildRequest/Policy/Audit 语义；技术实体继续复用现有 Asset/Capability 模型。
- 现有 `canEnter/canRead/canEdit/canUse` 作为底层兼容判定；新科研空间适配层生成页面级 `allowed_actions`、禁用原因、范围和状态视图。真实系统接入后由服务端响应替换。
- 不连接真实 AI 中台、IAM、目录或项目系统；未接入、待回执、失败可演示但不伪造生产成功。

## UI 决策

继承当前项目蓝白企业科研设计系统，不使用朱丹红、橙色 CTA、Bento 或远程字体。危险动作可使用语义红并附文字；主按钮、链接、选中态和焦点统一为品牌蓝。只做桌面 1280/1440/1920。

## 未来替换路径

前端领域函数与本地 `transact` 对应 PRD 10.6 的 service actions。接入后保持页面和对象引用不变，将读模型、动作权限、幂等写入和回执状态替换为服务端接口；不需再次重构信息架构。
