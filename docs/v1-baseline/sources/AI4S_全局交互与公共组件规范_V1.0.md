# AI4S 全局交互与公共组件规范 V1.0

> 版本：V1.0  
> 产品名称：AI4S 科研平台  
> 文档性质：全局交互、公共组件、状态反馈与跨模块联动规范  
> 继承基线：AI4S 核心对象模型、角色权限矩阵、新版 IA、原型重构与产品设计基线及各模块 PRD V1.0  
> 设计目标：**通过统一组件和交互规则表达 Project / Space / 权限 / Research Task / Research Asset 等核心概念，避免各模块自行创造不同交互。**

---

# 1. 适用范围

本规范适用于：

- 科研工作台；
- 知识中心；
- 科研技能；
- 科研模型；
- 科研工具箱；
- 云上实验室；
- 科研资产；
- 项目空间管理；
- 科研管理工作台；
- 科研决策工作台 / 科研驾驶舱；
- 外部系统集成入口；
- 平台管理后台中与前台一致的公共状态。

本规范不定义新的业务对象，仅规范已有对象的交互表达。

---

# 2. 全局交互原则

## 2.1 上下文一致

同一用户在同一个 Space 下：

- 项目；
- 课题；
- 可访问知识；
- 可访问资产；
- 可调用能力；
- 可见 Research Task；
- 可见实验任务；

必须遵循同一权限计算结果。

不得出现“知识中心能看到，但 Research Agent 无权引用”之外的无解释差异；如存在对象自身 ACL 或外部授权差异，必须明确显示原因。

---

## 2.2 权限前置

对搜索、列表、Agent 调用、资源选择等交互，应在服务端或业务调用前完成权限过滤。

不得采用：

> 先把无权限数据返回前端，再通过 CSS 隐藏。

---

## 2.3 主操作唯一

页面、弹窗或抽屉原则上只设置一个最强主操作。

例如：

```text
[确认并继续]
[保存]
[发起预约]
[加入 Research Agent]
```

其他操作使用次级按钮、文本按钮或更多菜单。

---

## 2.4 渐进披露

默认展示用户完成当前任务必需的信息。

高级配置、来源详情、技术属性、历史版本和审计信息按需展开。

---

## 2.5 状态可恢复

对长周期 Research Task、模型运行、工具执行和实验任务，页面刷新、退出和再次进入后必须能够恢复业务状态。

---

## 2.6 不制造技术负担

科研人员前台不直接暴露：

- Pod；
- Container；
- Endpoint；
- Token；
- 服务器堆栈；
- MCP 协议细节；
- 模型框架配置；
- 原始 Agent Chain-of-Thought。

只展示科研人员需要理解的业务状态、能力来源和必要依赖。

---

# 3. 公共组件目录

建议形成以下统一组件库：

```text
AppShell
PrimaryNavigation
TopBar
SpaceSwitcher
CurrentContextIndicator
NotificationEntry

SearchBox
SearchModeSwitcher
FilterBar
AdvancedFilterDrawer
SortSelector
Pagination

StatusBadge
PermissionBadge
SourceBadge
VersionBadge

ObjectList
ObjectTable
ResourceCard
EmptyState
LoadingState
ErrorState
RestrictedState

Dialog
ConfirmDialog
SideDrawer
BottomSheet
Toast
InlineAlert

FileUploader
ResourceSelector
ResearchContextSelector
CapabilitySelector

TaskExecutionTrace
HumanDecisionSheet
TaskStatusHeader

ShareAssetDialog
SaveAsAssetDialog
PermissionRequestDialog
ExternalSystemJumpDialog
SourceProvenancePanel
VersionHistoryPanel
```

组件名称是设计/研发标识，不要求直接显示给用户。

---

# 4. AppShell

## 4.1 结构

```text
顶栏
├─ 产品标识
├─ 页面标题 / 面包屑（按需）
├─ 当前 Space
├─ 通知
└─ 用户

左侧
└─ 一级导航

主体
└─ 当前业务页面
```

## 4.2 一级导航规则

导航根据系统角色和授权动态生成。

不可见模块：

- 默认不展示；
- 不以 disabled 菜单大面积占位。

通过直链访问无权限模块时，展示 RestrictedState。

---

# 5. TopBar

TopBar 原则上只保留：

1. 页面名称；
2. Current Space；
3. 通知；
4. 用户入口。

如页面需要全局对象切换，例如科研管理工作台的组织范围，可在页面主区域提供，不与 SpaceSwitcher 混成一个控件。

---

# 6. SpaceSwitcher

## 6.1 定位

SpaceSwitcher 是 AI4S 全平台统一的科研上下文切换组件。

## 6.2 展示结构

建议：

```text
个人空间

项目 A
├─ 项目空间
├─ 课题空间 A1
└─ 课题空间 A2

项目 B
├─ 项目空间
└─ 课题空间 B1
```

只展示当前用户可进入的 Space。

---

## 6.3 搜索

当 Space 数量较多时支持：

- 项目名称；
- 项目编号；
- Space 名称。

---

## 6.4 当前项信息

显示：

```text
空间名称
空间类型
所属项目（如有）
```

不需要把 project_id / space_id 直接暴露给普通用户。

---

## 6.5 切换行为

切换前：

1. 检查当前页面是否有未提交表单；
2. 检查当前会话是否有未发送输入；
3. 对有数据丢失风险的状态提示确认。

切换后：

1. 更新 Current Research Context；
2. 重新计算 Membership / data_scope；
3. 更新当前模块数据；
4. 重新计算可访问资源；
5. 不迁移原对象归属。

---

## 6.6 切换提示

如当前会话有未保存内容：

```text
当前会话存在未发送内容。
切换空间不会迁移当前会话，原会话仍保留在原空间。

[取消] [继续切换]
```

---

# 7. CurrentContextIndicator

用于在科研工作台、知识中心、资产详情等需要强调上下文的位置轻量展示：

```text
当前项目：非常规油气前沿研究
当前空间：页岩气储层评价课题
```

Research Agent 输入区可进一步显示已显式关联对象：

```text
上下文：
页岩气储层评价课题 ×
实验数据集 V2 ×
研究报告 ×
```

默认上下文与用户显式添加的上下文应视觉区分。

---

# 8. 全局搜索框 SearchBox

## 8.1 公共能力

支持：

- 关键词输入；
- 清空；
- 回车搜索；
- 最近输入（按模块需要）；
- 搜索建议（按模块需要）；
- Loading；
- 无结果。

## 8.2 搜索作用域

搜索框必须明确属于当前模块，不设计一个未经需求定义的“全平台超级搜索”。

例如：

```text
知识中心 → 搜知识
科研技能 → 搜 Skill
科研模型 → 搜 Model
科研资产 → 搜 Asset
仪器设备共享 → 搜共享仪器
```

---

# 9. SearchModeSwitcher

仅在知识中心等已有多检索模式的页面使用。

知识中心固定支持：

```text
智能检索
关键词检索
高级检索
结构式检索
```

模式切换时保留可兼容的基础关键词，但不同模式专属参数不得错误复用。

---

# 10. FilterBar

## 10.1 默认筛选

首屏只展示高频条件。

例如：

```text
学科
类型
状态
时间
```

## 10.2 高级筛选

低频条件进入：

> 更多筛选 / 高级筛选

避免把 10～20 个筛选条件同时铺开。

## 10.3 已选条件

以 Chip 显示，支持单项删除和“清空全部”。

---

# 11. StatusBadge

状态文案必须来自已定义对象状态，不自行创造近义状态。

## 11.1 Research Task

前台统一：

```text
规划中
运行中
等待人工处理
等待资源
已暂停
执行失败
已完成
已取消
```

## 11.2 Experiment Task

```text
草稿
待接收
待执行
执行中
等待确认
已完成
已取消
异常
```

## 11.3 Space

```text
正常
暂停
已归档
已关闭
```

## 11.4 Research Asset

业务展示可结合：

```text
有效
已共享
审核中
已发布
已归档
已下架
```

具体发布状态与生命周期状态在详情中分开表达。

## 11.5 Skill / Model / Tool 等资源

优先统一为：

```text
可用
运行中（适用时）
等待资源（适用时）
需要授权
权限受限
维护中
暂不可用
已下架
```

---

# 12. PermissionBadge

用于明确表达：

```text
只读
可引用
可复制
可协作
可调用
需申请
权限受限
```

具体权限文案按对象类型映射。

资产详情建议增加：

```text
当前权限：可引用
权限来源：课题 A 共享
```

避免只显示“无编辑按钮”却不解释原因。

---

# 13. EmptyState

空状态必须说明：

1. 当前为什么为空；
2. 是否有下一步操作。

示例：

### 当前研究为空

```text
暂无持续进行中的科研任务。
[发起科研任务]
```

### 待处理为空

```text
当前没有需要你处理的事项。
```

无操作时不要强行放按钮。

---

# 14. LoadingState

## 14.1 页面加载

优先使用 Skeleton 保持布局稳定。

## 14.2 Agent / 智能检索

允许使用过程状态：

```text
正在理解问题
正在检索
正在分析
正在生成结果
```

过程信息必须是业务状态，不伪造精确进度。

## 14.3 长任务

如后端有真实 progress 字段可显示百分比；无真实进度时展示阶段状态，不生成虚假百分比。

---

# 15. ErrorState

错误信息统一包含：

```text
发生了什么
是否影响当前数据
用户可以做什么
```

不直接展示后台异常堆栈。

示例：

```text
部分外部知识源暂不可用，当前检索结果可能不完整。
[重新加载]
```

---

# 16. RestrictedState

根据业务策略分两类。

## 16.1 可以知道对象存在

展示：

```text
当前资源需要申请访问权限。
[申请权限]
```

仅在支持权限申请时展示按钮。

## 16.2 不允许暴露对象存在

直接不进入结果集，不显示资源名称、摘要等敏感元数据。

---

# 17. ConfirmDialog

必须用于：

- 删除；
- 归档；
- 关闭 Space；
- 取消任务；
- 撤销共享；
- 下架；
- 离开未保存表单；
- 高风险外部操作。

确认文案要说明业务后果。

不要只写：

> 确定吗？

应写：

> 关闭该课题空间后将停止新建 Research Task，历史任务和资产仍保留并按权限可追溯。

---

# 18. Toast 与 InlineAlert

## Toast

用于短暂反馈：

- 保存成功；
- 收藏成功；
- 已加入 Research Agent；
- 已提交权限申请。

## InlineAlert

用于需要持续保留的信息：

- 外部系统同步异常；
- 当前资源不可用；
- 当前 Space 已归档；
- 数据源结果不完整。

---

# 19. FileUploader

支持：

- 点击上传；
- 拖拽；
- 多文件；
- 进度；
- 失败重试；
- 删除未提交文件。

显示：

```text
文件名
文件类型
大小
状态
```

如涉及安全、格式或大小限制，在用户选择后即时校验，不用大段静态说明占据页面。

---

# 20. ResearchContextSelector

## 20.1 定位

用于科研工作台“科研上下文”。

## 20.2 可选择对象

严格来自已定义范围：

- 当前科研项目；
- 当前课题；
- Knowledge Resource；
- 项目资产；
- 我的资产；
- Dataset；
- 历史科研产出；
- 指定历史会话；
- 已授权跨课题资产。

## 20.3 选择器结构

```text
搜索
最近使用
当前 Space
我的资产
项目资产
知识资源
```

按权限返回数据。

## 20.4 已选对象

以 Chip 形式展示，可移除。

---

# 21. CapabilitySelector

## 21.1 定位

用于高级用户主动指定 Research Agent 可调用能力。

## 21.2 支持类型

```text
Agent
Skill
Model
Tool
Software
Dataset
MCP / Connector
```

MCP / Connector 只作为筛选或详情类型之一，不应视觉上压过科研业务能力。

## 21.3 结构

```text
搜索能力
最近使用
推荐能力
按学科
按类型
```

## 21.4 选择后

显示资源 Chip，例如：

```text
页岩储层甜点预测模型 V3.2 ×
文献证据抽取 Skill ×
```

---

# 22. ResourceSelector 通用资源选择器

适用于：

- 加入当前研究；
- 选择模型 / Skill / Tool；
- 选择 Asset；
- 选择仪器；
- 选择 Space 成员。

要求：

1. 搜索；
2. 关键筛选；
3. 当前权限状态；
4. 单选 / 多选模式明确；
5. 已选项可回显；
6. 无权限对象不返回或受限显示。

---

# 23. TaskStatusHeader

在 Research Task 详情 / 会话恢复态统一显示：

```text
Research Task 名称
当前状态
所属 Project / Space
当前阶段
最近更新时间
```

主操作根据状态变化：

| 状态 | 典型主操作 |
|---|---|
| 规划中 | 开始 / 修改计划 |
| 运行中 | 查看运行 |
| 等待人工 | 处理 |
| 等待资源 | 查看详情 |
| 已暂停 | 恢复执行 |
| 失败 | 重新执行 / 调整方案 |
| 已完成 | 查看产出 / 继续研究 |

操作必须继续受权限控制。

---

# 24. TaskExecutionTrace

## 24.1 目标

让科研人员理解：

> Research Agent 做到哪一步、用了什么关键依据、产生了什么结果。

## 24.2 默认层级

```text
✓ 已完成步骤
● 当前步骤
○ 下一步
```

每个步骤可按需展示：

- step_name；
- step_type；
- 关键资源；
- 状态；
- 输出引用；
- 运行时间；
- 错误 / 等待原因。

## 24.3 展开详情

可查看：

- 使用数据；
- 使用文献；
- Skill；
- Model；
- Tool；
- Experiment Task；
- Research Artifact。

## 24.4 禁止内容

不展示：

- 隐藏推理链；
- 系统提示词；
- 密钥；
- 内部安全策略；
- 无业务价值的原始日志。

---

# 25. HumanDecisionSheet

## 25.1 交互形式

统一使用 Bottom Sheet / 底部抽屉。

## 25.2 内容

```text
需要你确认

问题
Agent 建议
建议原因
相关依据（可展开）

选项
○ A
● B
○ 自定义

[暂不处理] [确认并继续]
```

## 25.3 提交后

1. 记录 Human Decision；
2. 更新对应 Task Step；
3. Research Task 恢复运行；
4. 从“需要我处理”移除；
5. 记录审计。

---

# 26. SaveAsAssetDialog

用于将 Research Artifact 正式沉淀为 Research Asset。

## 26.1 保存目标

固定支持：

```text
我的资产
当前课题资产
项目公共资产（需权限）
```

不擅自增加新的资产归属层级。

## 26.2 表单

至少包括：

- 资产名称；
- 资产类型（来自已支持 Asset Type）；
- 保存位置；
- 版本说明（按需）；
- 简介（按需）。

## 26.3 自动继承

系统自动保留：

```text
project_id
space_id
task_id
session_id
source_artifact_id
creator_id
```

用户无需重复填写来源字段。

---

# 27. ShareAssetDialog

## 27.1 分享目标

V1.0 项目内重点支持：

```text
项目空间
指定课题空间
指定成员
```

## 27.2 权限级别

固定至少支持：

```text
只读
可引用
可复制
可协作
```

## 27.3 有效期

```text
长期有效
指定时间
```

## 27.4 结果提示

必须明确：

> 分享不会改变原资产归属。

---

# 28. PermissionRequestDialog

仅在制度允许申请权限时使用。

内容建议：

- 申请对象；
- 当前权限；
- 申请权限；
- 使用目的；
- 关联 Project / Space；
- 备注。

审批流程不在本规范中自行定义；如后端/业务未定义审批链，只提交申请记录或跳转既有权限流程。

---

# 29. ExternalSystemJumpDialog

用于：

- 创建 Skill → AI 中台；
- 创建 Model → AI 中台；
- 创建 Dataset → AI 中台；
- 创建 Agent → AI 中台；
- 进入科研项目管理系统；
- 打开外部科研软件。

弹窗说明：

```text
即将进入：AI 中台模型开发
当前项目：……
当前空间：……
完成后可返回 AI4S。

[取消] [继续]
```

不需要每次都弹窗；对用户熟悉的低风险跳转可直接打开。首次、跨系统授权或存在上下文传递时优先说明。

---

# 30. SourceProvenancePanel

适用于：

- Research Artifact；
- Research Asset；
- AI 检索摘要；
- 模型结果；
- 实验结果；
- 知识资源。

可展示：

```text
来源类型
来源系统
来源 Task / Session / Step
使用版本
创建 / 生成时间
关键引用
```

以支持科研证据链和追溯。

---

# 31. VersionHistoryPanel

用于正式资产、Skill、Model 等有版本对象。

结构：

```text
当前版本
历史版本
变更说明
创建人
时间
状态
```

禁止新版本无痕覆盖旧版本。

---

# 32. 通知与待处理交互

## 32.1 强通知范围

仅对：

- Human Decision；
- 长任务完成；
- 长任务失败；
- 关键资源不可用；
- 跨空间共享申请；
- 协作邀请 / @本人；
- 必须本人处理的实验异常。

普通 Agent 步骤不发送强提醒。

## 32.2 “需要我处理”与通知区别

```text
通知 = 告知
需要我处理 = 必须由本人做出操作才能继续
```

不能把所有通知都堆入“需要我处理”。

---

# 33. 表单交互规范

## 33.1 字段分组

长表单按业务分组，避免单页堆叠几十个字段。

## 33.2 必填

只对真正必填字段标识。

## 33.3 即时校验

包括：

- 格式；
- 重复；
- 时间冲突；
- 权限；
- Project / Space 有效性；
- 外部对象状态。

## 33.4 提交失败

保留用户已填数据。

---

# 34. 列表与详情联动

打开详情后返回列表时应保留：

- 当前分页；
- 搜索词；
- 筛选条件；
- 排序；
- 视图模式。

Space 已发生切换时应重新计算数据，不强行恢复旧 Space 的结果。

---

# 35. 批量操作规范

仅在对象有明确批量业务价值时提供。

已有合理场景：

- 知识检索结果批量收藏 / 加入上下文 / 发送至 Agent；
- 空间成员批量添加（如实施需要）；
- 管理列表批量导出（如既有需求明确）。

不得为了“完整后台体验”机械增加批量删除、批量发布、批量审批。

---

# 36. 长任务离开页面

用户离开运行中的 Research Task 时：

- 任务后台继续；
- 无需强制阻止离开；
- 页面可提示“任务将在后台继续”；
- 完成 / 失败后按通知规则提醒；
- 再次进入恢复状态。

如果当前操作尚未真正提交，则按未保存表单处理。

---

# 37. Space 与对象交互矩阵

| 对象 | 是否记录 project_id | 是否记录 space_id | Space 切换时处理 |
|---|---:|---:|---|
| Agent Session | 是（项目场景） | 是 | 不迁移，列表重新过滤 |
| Research Task | 是 | 是 | 不迁移，按新范围查询 |
| Research Artifact | 是（项目场景） | 是 | 保留原归属 |
| Research Asset | 可为空 | 是 | 项目资产重新过滤 |
| Knowledge Resource | 可有 | 可有 | 重新执行权限过滤 |
| Skill / Model / Tool 调用 | 记录调用上下文 | 记录调用上下文 | 重新校验权限 |
| Experiment Task | 是 | 是 | 按新范围查询 |
| Instrument | 不一定 | 不一定 | 依据组织/资源权限 |
| Reservation | 是 | 是 | 保留原申请上下文 |

---

# 38. 权限交互统一判定

所有核心业务操作统一按：

```text
System Role
∩ Project Membership
∩ Space Membership / Space Role
∩ Object ACL
∩ External Authorization（如适用）
```

判断。

前端按钮显隐只是体验层；后端仍必须再次校验。

---

# 39. 搜索与推荐权限

搜索建议、自动补全、相关推荐也属于数据返回范围。

因此：

- 无权限内部资料不得出现在搜索建议；
- 无权限项目资产不得出现在 Agent 上下文推荐；
- 无权 Skill / Model 不得被 Agent 推荐为可调用；
- 被授权共享资源应显示权限来源。

---

# 40. 公共组件复用矩阵

| 组件 | 工作台 | 知识中心 | 技能/模型/工具 | 云上实验室 | 科研资产 | 空间管理 | 管理/决策 |
|---|---:|---:|---:|---:|---:|---:|---:|
| SpaceSwitcher | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 按场景 |
| SearchBox | 会话搜索 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| FilterBar | 当前研究 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| StatusBadge | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| PermissionBadge | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 只读说明 |
| ResearchContextSelector | ✓ | 发送至 Agent | 发送至 Agent | Agent 联动 | Agent 联动 | — | — |
| CapabilitySelector | ✓ | — | — | — | — | — | — |
| TaskExecutionTrace | ✓ | — | 长任务回工作台 | Research Task 联动 | 来源跳转 | — | 只读下钻 |
| HumanDecisionSheet | ✓ | — | — | 异常联动 | 共享确认按需 | — | — |
| ShareAssetDialog | — | — | — | — | ✓ | 跳转资产 | — |
| SaveAsAssetDialog | ✓ | — | 模型结果可联动 | 实验结果可联动 | ✓ | — | — |
| ExternalSystemJumpDialog | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

# 41. 可访问性与易用性

至少满足：

- 不仅依赖颜色表达状态；
- 主按钮文字明确，不只用图标；
- 表单错误与字段就近展示；
- 键盘可访问核心输入和弹窗；
- 表格空态和加载态清晰；
- 长文本可展开 / 收起；
- 关键状态具备文字标签。

---

# 42. 审计交互

前台不需要把审计日志铺满业务页面。

对高风险操作：

- 分享；
- 发布；
- 权限变更；
- Space 状态变化；
- 关键 Human Decision；
- Task 取消 / 重试；
- 实验结果确认；

系统后台记录审计，前台在必要详情页提供“操作记录 / 来源与记录”入口。

---

# 43. 公共组件验收 Checklist

## Space

- [ ] 所有业务模块使用统一 SpaceSwitcher；
- [ ] 切换后数据和权限同步刷新；
- [ ] 不迁移原有对象；
- [ ] 用户只看到有权限 Space。

## 权限

- [ ] 搜索阶段已过滤权限；
- [ ] 操作前再次校验；
- [ ] Agent 不绕过 ACL；
- [ ] 权限来源可解释。

## Agent

- [ ] 输入区一级操作只有附件、科研上下文、调用能力、研究模式；
- [ ] 有执行轨迹；
- [ ] 人工决策使用 Bottom Sheet；
- [ ] 长任务可恢复。

## 资产

- [ ] Artifact → Asset 有明确保存动作；
- [ ] 分享与发布分开；
- [ ] 分享权限级别统一；
- [ ] 保留版本和来源。

## 状态

- [ ] 各对象使用统一状态词；
- [ ] 无真实进度时不伪造百分比；
- [ ] 错误信息可理解；
- [ ] 外部系统异常可识别。

---

# 44. 最终规范

AI4S 公共交互体系最终围绕以下四条主线统一：

```text
Current User
    ↓
Project / Space Context
    ↓
Object Permission
    ↓
Business Action / Agent Execution
```

以及：

```text
Research Task
    ↓
Task Step / Execution / Human Decision
    ↓
Research Artifact
    ↓
Research Asset
    ↓
Share / Publish / Reuse
```

所有模块应优先复用本规范中的 Space、权限、状态、资源选择、Agent 轨迹、人工决策、资产沉淀和外部系统跳转交互，不再为同一对象设计多套相互冲突的组件。
