# AI4S 科研技能 PRD V1.0

> 版本：V1.0  
> 产品名称：AI4S 科研平台  
> 模块名称：科研技能  
> 适用角色：科研人员、项目/课题负责人；科研管理人员、科研决策人员以查看为主；平台管理员负责技能治理  
> 设计基线：科研技能采用“Skill 广场”模式，面向科研人员提供技能发现、理解、调用和进入 Unified Research Agent 的能力入口；AI4S 不重复建设 Skill 开发能力，创建/开发能力复用 AI 中台。  
> 本文档用途：作为原型、UI、前端、后端、权限、Skill 接入、与 AI 中台集成及测试设计的统一开发基线。

---

# 一、产品定位

科研技能是 AI4S 面向科研人员的标准化可复用能力广场。

其核心目标是解决三个问题：

1. **平台有哪些科研 Skill 可以用？**
2. **某个 Skill 能做什么、适合什么场景、输入输出是什么？**
3. **如何把 Skill 直接用于当前科研任务或 Research Agent？**

科研技能不承担 Skill 开发、编排和底层运行环境建设。

---

# 二、核心产品原则

## 2.1 面向科研人员认知组织，不按技术形态组织

前台分类统一采用：

```text
全部
通用
地球科学
合成生物科学
材料科学
其他
```

不将以下技术概念作为一级分类：

```text
API
MCP
Plugin
Function
Web Service
```

这些仅作为后台属性或详情标签。

---

## 2.2 “发现与调用”是核心，不做开发平台

AI4S 科研技能模块主要负责：

> **发现 → 了解 → 调用 → 加入 Research Agent**

Skill 开发、发布前调试、版本构建等能力由 AI 中台提供。

---

## 2.3 Skill 默认由 Research Agent 自动调用

科研人员通常不需要先进入技能广场再选择 Skill。

Research Agent 可根据任务自动选择适合的 Skill。

科研技能模块主要服务于：

- 主动发现能力；
- 了解技能；
- 高级用户指定调用；
- 技能资产浏览；
- 技能复用。

---

## 2.4 科研技能与科研资产不是重复模块

两者区别：

> **科研技能：平台有哪些可发现、可调用的 Skill。**  
> **科研资产：我或当前项目拥有哪些 Skill 资产。**

同一个 Skill 对象可同时出现在不同产品视图中。

---

# 三、目标用户

## 3.1 科研人员

主要需求：

- 查看平台 Skill；
- 按学科筛选；
- 搜索 Skill；
- 查看 Skill 能力说明；
- 试用 Skill；
- 将 Skill 加入当前 Research Agent；
- 收藏常用 Skill。

---

## 3.2 项目/课题负责人

除科研人员能力外，进一步关注：

- 当前项目可用 Skill；
- 当前课题形成的 Skill；
- 项目团队共享 Skill；
- Skill 是否可在项目范围内复用。

---

## 3.3 平台管理员

主要负责：

- Skill 上架；
- 下架；
- 分类；
- 标签；
- 可见范围；
- 来源管理；
- 状态治理。

---

# 四、产品边界

## 4.1 本模块负责

- Skill 广场；
- Skill 分类；
- Skill 搜索；
- Skill 筛选；
- Skill 推荐；
- Skill 详情；
- Skill 收藏；
- Skill 调用；
- Skill 试用；
- 加入 Research Agent；
- 查看来源和版本；
- 查看可用范围；
- 跳转 AI 中台创建 Skill；
- Skill 发布后的平台展示。

---

## 4.2 本模块不负责

- Skill 开发；
- Skill 编排；
- Skill 代码编辑；
- Skill 调试环境；
- Skill 底层运行环境；
- Skill 版本构建；
- Skill 训练；
- 底层 API 管理。

以上能力复用 AI 中台。

---

# 五、一级页面结构

建议：

```text
科研技能
├─ Skill 广场
├─ Skill 搜索结果
├─ Skill 详情
├─ Skill 试用
└─ 我的 / 项目 Skill 跳转入口
```

其中“我的 Skill / 项目 Skill”的正式资产管理仍进入：

> **科研资产**

避免重复做一套资产管理。

---

# 六、Skill 广场

## 6.1 页面目标

Skill 广场重点回答：

> **现在有哪些科研技能可以直接用？**

页面不采用 Dashboard 形式。

---

## 6.2 页面结构

建议：

```text
科研技能
────────────────────────────────

[ 搜索 Skill 名称、能力或科研场景…… ]

全部｜通用｜地球科学｜合成生物科学｜材料科学｜其他

推荐 / 热门 / 最近使用（轻量，可选）

Skill 列表
[Skill卡片] [Skill卡片] [Skill卡片]
```

---

# 七、分类体系

一级分类固定为：

```text
ALL
GENERAL
GEOSCIENCE
SYNTHETIC_BIOLOGY
MATERIALS_SCIENCE
OTHER
```

前台显示：

```text
全部
通用
地球科学
合成生物科学
材料科学
其他
```

---

## 7.1 二级标签

可以在详情和筛选中使用二级标签。

### 地球科学示例

- 油气勘探；
- 地球物理；
- 地球化学；
- 储层评价；
- 非常规油气；
- 地质建模；
- CCUS。

### 材料科学示例

- 催化材料；
- 储能材料；
- 高分子；
- 膜材料；
- 纳米材料；
- 计算材料。

### 合成生物科学示例

- 基因设计；
- 代谢工程；
- 蛋白质设计；
- 生物信息；
- 细胞工厂；
- 生物制造。

二级标签用于筛选和推荐，不建议成为固定左侧复杂树结构。

---

# 八、Skill 搜索

## 8.1 支持搜索内容

支持按：

- Skill 名称；
- Skill 描述；
- 能力关键词；
- 学科；
- 典型科研场景；
- 发布方；
- 标签。

---

## 8.2 搜索建议

输入时可推荐：

- 热门 Skill；
- 最近使用 Skill；
- 相关科研术语；
- 当前 Space 相关 Skill。

---

# 九、筛选条件

建议支持：

- 学科分类；
- 能力标签；
- 发布方；
- 可用范围；
- 是否已验证；
- 是否支持当前 Space；
- 是否需要额外权限。

排序方式：

```text
相关度
最近更新
使用频率
最近使用
```

不建议用复杂排行榜驱动科研人员选择。

---

# 十、Skill 卡片

每张卡片建议展示：

- Skill 名称；
- 一句话能力说明；
- 所属学科；
- 典型用途；
- 发布方；
- 版本；
- 可用状态；
- 关键标签。

示例：

```text
文献证据抽取 Skill

从论文中提取实验条件、关键结论和证据引用。

地球科学 · 文献分析
版本 V2.1
平台认证

[查看详情] [调用]
```

避免在卡片上展示大量技术参数。

---

# 十一、Skill 详情页

详情页核心回答四个问题：

1. **它能做什么？**
2. **什么时候适合用？**
3. **需要什么输入？**
4. **会产生什么输出？**

---

## 11.1 基础信息

包括：

- Skill 名称；
- 简介；
- 学科；
- 能力标签；
- 发布方；
- 来源；
- 当前版本；
- 更新时间；
- 可用状态；
- 可见范围。

---

## 11.2 能力说明

建议结构：

```text
适用场景
输入
输出
使用示例
限制条件
```

---

## 11.3 输入说明

例如：

```text
输入：
- 文献 PDF
- DOI
- 文献列表
- 文本内容
```

---

## 11.4 输出说明

例如：

```text
输出：
- 结构化实验条件
- 核心结论
- 证据引用
- JSON / 表格结果
```

---

## 11.5 使用示例

展示 2～3 个典型科研场景即可。

例如：

> 从 10 篇催化材料论文中抽取反应温度、催化剂组成和产率。

---

# 十二、Skill 调用

## 12.1 调用方式

支持三种方式：

### 方式一：直接调用

在 Skill 详情点击：

> **立即使用**

进入 Skill 轻量调用页。

---

### 方式二：发送至 Research Agent

点击：

> **在 Research Agent 中使用**

自动进入科研工作台，并将 Skill 加入当前输入上下文。

---

### 方式三：由 Agent 自动调用

用户无需感知 Skill 选择过程。

Research Agent 根据任务需要自动选择并调用。

---

# 十三、Skill 试用

## 13.1 定位

Skill 试用用于：

> **验证 Skill 是否适合当前任务。**

不是完整开发调试器。

---

## 13.2 页面结构

```text
Skill 信息
↓
输入区
↓
运行
↓
输出结果
↓
发送至 Research Agent
```

---

## 13.3 输入

按照 Skill 的 input_schema 动态生成表单。

例如：

- 文本；
- 文件；
- 数据集；
- 参数；
- 结构化字段。

---

## 13.4 输出

展示：

- 结果；
- 状态；
- 运行时间；
- 关键来源；
- 错误信息。

技术日志默认隐藏。

---

# 十四、发送至 Research Agent

用户从 Skill 详情点击：

> **在 Research Agent 中使用**

进入工作台后：

```text
已添加 Skill：
文献证据抽取 Skill
```

用户继续输入：

> “用这个 Skill 分析我上传的 20 篇论文。”

Research Agent 负责后续编排。

---

# 十五、加入当前任务

如果当前已有 Research Task：

支持：

> **加入当前研究**

将 Skill 加入当前 Task 可调用资源列表。

记录：

```text
task_id
skill_id
added_by
added_at
```

---

# 十六、最近使用

可在 Skill 广场提供轻量：

> 最近使用

只展示少量 Skill。

避免形成复杂“我的工作台”。

完整资产管理仍进入科研资产。

---

# 十七、收藏

用户可以收藏常用 Skill。

收藏仅表示：

> 快捷访问。

不改变 Skill 所有权，也不生成新的科研资产。

---

# 十八、创建 Skill

## 18.1 入口

科研技能页可保留：

> **创建 Skill**

点击后：

```text
AI4S
↓
AI 中台 Skill 开发页面
```

---

## 18.2 跳转上下文

建议携带：

```text
user_id
project_id
space_id
return_url
source=AI4S
```

---

## 18.3 创建完成回流

AI 中台创建成功后：

```text
Skill
↓
回流 AI4S
↓
进入“我的资产”
```

如果用户具有发布权限，可继续：

> 申请发布到科研技能广场。

---

# 十九、Skill 生命周期

建议统一：

```text
创建
↓
开发 / 调试（AI中台）
↓
我的资产
↓
申请发布
↓
审核
↓
科研技能广场
↓
更新 / 下架
```

---

# 二十、科研资产与 Skill 广场关系

底层不创建重复 Skill。

统一对象：

```text
Skill Object
```

通过：

```text
owner_id
project_id
space_id
visibility
publish_status
```

决定展示位置。

---

## 20.1 我的 Skill

查询：

```text
owner_id = current_user
```

展示在：

> 科研资产 → 我的资产 → Skill

---

## 20.2 项目 Skill

查询：

```text
project_id = current_project
```

展示在：

> 科研资产 → 项目资产 → Skill

---

## 20.3 已发布 Skill

条件：

```text
publish_status = PUBLISHED
```

展示在：

> 科研技能广场

---

# 二十一、发布规则

Skill 发布需要至少满足：

- 基础信息完整；
- 输入输出定义完整；
- 可正常运行；
- 权限配置明确；
- 版本明确；
- 来源可追溯；
- 通过发布审核。

平台管理员或授权审核角色负责发布治理。

---

# 二十二、版本管理

正式 Skill 必须支持版本。

示例：

```text
V1.0
V1.1
V2.0
```

详情页默认展示当前稳定版本。

可查看：

- 版本号；
- 更新时间；
- 更新说明；
- 当前状态。

---

# 二十三、兼容性与依赖

Skill 可能依赖：

- Model；
- Dataset；
- Tool；
- Software；
- MCP；
- 外部 API。

详情页只展示科研人员需要知道的信息。

例如：

> 需要访问企业内部文献库  
> 需要调用材料性质预测模型

具体技术依赖放后台。

---

# 二十四、权限模型

Skill 权限遵循：

```text
System Role
∩
Project / Space 权限
∩
Skill ACL
```

---

## 24.1 公共 Skill

平台范围内可见、可调用。

---

## 24.2 项目 Skill

仅：

- 当前 Project 成员；
- 被授权用户；
- 被授权 Space。

可以访问。

---

## 24.3 课题 Skill

默认只在当前 Topic Space 可见。

支持授权共享至其他课题。

---

# 二十五、跨空间共享

项目内 Skill 可以通过科研资产模块共享。

例如：

```text
课题 A Skill
↓
共享至课题 B
↓
课题 B 可调用
```

支持权限：

```text
只读
可调用
可复制
可协作维护
```

科研技能广场只展示已正式发布对象，不直接承担跨课题共享管理。

---

# 二十六、Skill 调用权限校验

调用前必须检查：

- 当前用户是否有调用权限；
- 当前 Space 是否允许；
- 依赖资源是否有权限；
- 是否需要额外授权；
- 外部系统是否可用。

任何依赖权限不足时，不得由 Agent 绕过。

---

# 二十七、Skill 运行状态

用户侧建议统一：

```text
可用
暂不可用
权限受限
维护中
已下架
```

不展示复杂底层运行状态。

---

# 二十八、错误处理

## 28.1 无权限

提示：

> 当前 Skill 需要申请使用权限。

---

## 28.2 依赖资源不可用

提示：

> 当前 Skill 依赖的科研资源暂不可用，请稍后重试。

---

## 28.3 Skill 执行失败

展示：

- 失败原因；
- 是否可重试；
- 推荐操作。

不展示技术堆栈。

---

# 二十九、推荐逻辑

Skill 推荐可以参考：

- 当前学科；
- 当前 Space；
- 当前 Research Task；
- 最近使用；
- 当前输入任务；
- 用户专业标签。

但推荐必须保持轻量，不形成复杂推荐流。

---

# 三十、关键数据对象

核心对象：

```text
Skill
Skill Version
Skill Invocation
Skill Dependency
Skill Favorite
Skill Publish Record
```

---

# 三十一、核心字段建议

## 31.1 Skill

```text
skill_id
name
description
discipline
capability_tags
owner_id
project_id
space_id
provider
source_system
external_skill_id
visibility
publish_status
availability
current_version
created_at
updated_at
```

---

## 31.2 Skill Version

```text
version_id
skill_id
version_number
input_schema
output_schema
change_log
status
created_by
created_at
```

---

## 31.3 Skill Invocation

```text
invocation_id
skill_id
user_id
project_id
space_id
task_id
session_id
input_ref
output_ref
status
started_at
completed_at
```

---

# 三十二、与 AI 中台集成

AI4S 与 AI 中台至少需要同步：

- skill_id 映射；
- Skill 名称；
- 描述；
- 版本；
- 输入输出；
- 状态；
- 发布状态；
- 来源；
- 调用地址 / 外部 ID；
- 权限信息。

建议保留：

```text
source_system = AI_PLATFORM
external_skill_id
sync_status
last_sync_time
```

---

# 三十三、推荐接口边界

## Skill 列表

```text
GET /skills
```

支持：

```text
discipline
keyword
tags
availability
publish_status
page
page_size
```

---

## Skill 详情

```text
GET /skills/{skill_id}
```

---

## Skill 调用

```text
POST /skills/{skill_id}/invoke
```

---

## 添加至 Research Agent

```text
POST /sessions/{session_id}/skills
```

---

## 添加至 Research Task

```text
POST /research-tasks/{task_id}/skills
```

---

## 收藏

```text
POST /skills/{skill_id}/favorite
DELETE /skills/{skill_id}/favorite
```

---

## 创建跳转

```text
GET /skills/create-entry
```

返回 AI 中台跳转地址。

---

# 三十四、性能要求

- Skill 广场首屏列表尽量在 2 秒内加载；
- 分类切换尽量在 1 秒内反馈；
- Skill 调用支持流式或状态反馈；
- 长任务 Skill 调用自动纳入 Research Task 状态；
- 页面刷新不丢失正在执行的调用状态。

---

# 三十五、审计要求

需要记录：

- Skill 调用；
- 跨空间 Skill 使用；
- Skill 发布；
- Skill 下架；
- 权限变更；
- Skill 版本更新；
- Skill 与 Research Task 的关联。

---

# 三十六、原型页面清单

本 PRD 至少对应：

1. 科研技能广场；
2. 分类筛选状态；
3. Skill 搜索结果；
4. Skill 详情；
5. Skill 试用页；
6. 调用能力选择器中的 Skill 列表；
7. 加入 Research Agent 状态；
8. 加入当前 Research Task 状态；
9. Skill 权限受限状态；
10. 创建 Skill 跳转确认；
11. Skill 版本信息；
12. Skill 不可用 / 执行失败状态。

---

# 三十七、核心验收标准

## 37.1 Skill 广场

- [ ] 支持全部、通用、地球科学、合成生物科学、材料科学、其他分类；
- [ ] 支持搜索；
- [ ] 支持筛选；
- [ ] Skill 卡片信息简洁；
- [ ] 不按 MCP / API / Plugin 技术类型作为主要分类。

---

## 37.2 Skill 详情

- [ ] 明确展示能做什么；
- [ ] 明确展示适用场景；
- [ ] 明确展示输入；
- [ ] 明确展示输出；
- [ ] 明确展示来源、版本和可用范围。

---

## 37.3 调用

- [ ] 可直接试用；
- [ ] 可发送至 Research Agent；
- [ ] 可加入当前 Research Task；
- [ ] Agent 可自动调用；
- [ ] 调用前完成权限校验。

---

## 37.4 创建与资产

- [ ] AI4S 不提供 Skill 开发环境；
- [ ] 创建 Skill 跳转 AI 中台；
- [ ] 创建成功后可回流“我的资产”；
- [ ] 发布后进入科研技能广场；
- [ ] Skill 广场和科研资产底层不重复建对象。

---

## 37.5 权限

- [ ] 项目 / 课题 Skill 按 Space 权限控制；
- [ ] 跨空间 Skill 需要授权；
- [ ] Research Agent 不得绕过 Skill ACL；
- [ ] 无权限对象不允许执行。

---

# 三十八、最终产品基线

科研技能最终定义为：

> **AI4S 中面向科研人员的科研 Skill 发现与调用入口，以通用、地球科学、合成生物科学、材料科学和其他为主要分类，支持搜索、查看详情、试用、调用并直接加入 Unified Research Agent 或当前 Research Task；Skill 创建与开发能力复用 AI 中台，个人和项目形成的 Skill 统一沉淀至科研资产，正式发布后进入科研技能广场。**

核心链路统一为：

> **发现 Skill → 了解能力 → 调用 → 进入科研任务 → 形成复用能力。**
