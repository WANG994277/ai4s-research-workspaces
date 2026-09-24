# AI4S 核心对象模型设计 V1.0

> 版本：V1.0  
> 用途：作为 AI4S 后续 PRD、数据模型、接口设计、权限控制、Agent 上下文管理、科研资产沉淀和原型设计的统一对象基线。  
> 前置基线：以 Unified Research Agent 为核心入口；科研项目作为逻辑项目边界；Space 承载上下文与权限；科研过程产出沉淀为科研资产；Skill / Model / Dataset 等既可作为可调用资源，也可作为科研过程中形成的资产。

---

# 一、设计目标

本对象模型重点解决以下问题：

1. **科研项目、项目空间、课题空间、个人空间之间是什么关系；**
2. **Research Task、Agent Session、Task Step 如何区分；**
3. **科研过程产物 Artifact 与正式科研资产 Asset 如何区分；**
4. **Skill、Agent、Model、Dataset 等为什么既可能是“资源”，也可能是“资产”；**
5. **历史会话如何与科研任务建立关联；**
6. **Research Agent 如何在当前 Project / Space 权限范围内获取上下文；**
7. **跨课题资产共享如何落到对象和权限模型；**
8. **AI4S 与 AI 中台、科研项目管理系统、设备系统如何建立对象映射。**

---

# 二、对象模型总览

AI4S 核心对象建议分为 7 个对象域：

```text
1. 身份与组织域
   ├─ User
   ├─ Role
   └─ Membership

2. 科研项目与空间域
   ├─ Project
   ├─ Space
   ├─ Project Space
   ├─ Topic Space
   └─ Personal Space

3. Research Agent 任务域
   ├─ Research Task
   ├─ Agent Session
   ├─ Task Step
   ├─ Human Decision
   └─ Task Execution

4. 科研过程与资产域
   ├─ Research Artifact
   ├─ Research Asset
   ├─ Asset Version
   └─ Asset Share

5. 科研能力与资源域
   ├─ Agent
   ├─ Skill
   ├─ Model
   ├─ Dataset
   ├─ Tool
   ├─ Software
   └─ MCP / Connector

6. 知识资源域
   ├─ Literature
   ├─ Patent
   ├─ Standard
   ├─ Knowledge Base
   └─ Knowledge Graph

7. 云上实验室域
   ├─ Instrument
   ├─ Instrument Sharing
   ├─ Experiment Task
   └─ Reagent / Consumable
```

---

# 三、核心关系总图

```text
User
 │
 ├──────── belongs to ──────── Project
 │                              │
 │                              ├── Project Space
 │                              │
 │                              ├── Topic Space A
 │                              ├── Topic Space B
 │                              └── Topic Space C
 │
 └──────── owns ───────────── Personal Space


Project + Space
      │
      ▼
Research Task
      │
      ├── Agent Session
      │      └── Message / Context
      │
      ├── Task Step
      │      ├── Agent
      │      ├── Skill
      │      ├── Model
      │      ├── Tool / MCP
      │      ├── Dataset
      │      └── Experiment Task
      │
      ├── Human Decision
      │
      └── Research Artifact
               │
               ▼
         Research Asset
               │
        ┌──────┼──────┐
        │      │      │
      Version Share  Publish
                      │
                      ▼
            Platform Research Resource
```

---

# 四、身份与组织域

## 4.1 User

代表 AI4S 的实际使用者。

### 核心字段

| 字段 | 说明 |
|---|---|
| user_id | 用户唯一标识 |
| name | 姓名 |
| organization_id | 所属组织 |
| department_id | 所属部门 |
| professional_tags | 专业/学科标签 |
| system_roles | 系统角色集合 |
| status | 用户状态 |
| created_at | 创建时间 |

### professional_tags 示例

```text
地球科学
材料科学
合成生物科学
油气勘探
储层工程
地球物理
催化材料
蛋白质设计
```

> 专业标签不等于权限角色，主要用于推荐、搜索、科研前沿和 Agent 上下文个性化。

---

## 4.2 Role

系统级角色。

当前角色基线：

```text
科研人员
分析化验人员
项目/课题负责人
科研项目管理人员
科研管理人员
科研决策人员
平台管理员
```

一个 User 可以同时拥有多个 Role。

---

## 4.3 Membership

Membership 用于描述：

> **某个用户在某个 Project / Space 中是什么身份。**

### 核心字段

| 字段 | 说明 |
|---|---|
| membership_id | 成员关系 ID |
| user_id | 用户 |
| project_id | 所属项目 |
| space_id | 所属空间，可为空 |
| member_role | 项目/空间角色 |
| data_scope | 数据范围 |
| status | 有效/停用 |
| joined_at | 加入时间 |

### member_role 示例

```text
Project Manager
Project Member
Topic Leader
Topic Member
Space Admin
Asset Manager
Viewer
```

---

# 五、科研项目与空间域

# 5.1 Project

Project 是 AI4S 中正式科研项目的逻辑边界。

### 核心定义

> **Project 是项目级数据、权限、空间和科研资产关联的主索引。**

### 核心字段

| 字段 | 说明 |
|---|---|
| project_id | 科研项目唯一 ID |
| project_code | 外部科研项目编号 |
| project_name | 项目名称 |
| source_system | 项目信息来源系统 |
| external_project_id | 外部科研项目管理系统 ID |
| owner_org | 牵头单位 |
| project_manager | 项目负责人 |
| status | 项目状态 |
| start_date | 开始日期 |
| end_date | 结束日期 |

### 重要原则

AI4S 不负责完整的：

```text
申报 → 立项 → 经费 → 合同 → 验收 → 归档
```

Project 基础信息主要从外部科研项目管理系统集成。

---

# 5.2 Space

Space 是 AI4S 的：

> **科研上下文、权限和数据访问范围承载单元。**

统一对象模型建议不要为每一种空间建立完全不同的数据结构，而使用：

```text
Space
├─ PERSONAL
├─ PROJECT
└─ TOPIC
```

### 核心字段

| 字段 | 说明 |
|---|---|
| space_id | 空间唯一 ID |
| space_type | PERSONAL / PROJECT / TOPIC |
| space_name | 空间名称 |
| project_id | 所属 Project，个人非项目空间可为空 |
| parent_space_id | 上级空间 |
| owner_id | 空间负责人 |
| status | active / archived / closed |
| permission_policy | 默认空间权限策略 |
| external_resource_space_id | AI 中台资源空间映射 ID |
| created_at | 创建时间 |

---

# 5.3 Personal Space

每个科研人员拥有一个个人科研空间。

主要用于：

- 非正式科研；
- 个人探索；
- 私人 Agent 会话；
- 个人草稿；
- 我的资产。

### 个人空间与项目的关系

个人空间不等同于“项目成员个人目录”。

用户参与 Project 后，可以通过 Project ID 查询其本人在该项目下的：

- Agent 会话；
- Research Task；
- Research Artifact；
- Research Asset。

但不建议物理复制一套个人空间到项目下。

---

# 5.4 Project Space

项目空间是整个 Project 的公共科研协作空间。

主要承载：

- 项目公共科研资产；
- 项目共享成果；
- 跨课题协同资源；
- 项目范围公共任务或协作内容。

### 关系

```text
Project 1 : 1 Project Space
```

通常一个 Project 对应一个项目公共空间。

---

# 5.5 Topic Space

一个课题对应一个独立课题空间。

### 关系

```text
Project 1 : N Topic Space
```

例如：

```text
非常规油气前沿研究 Project
├─ 项目空间
├─ 页岩气储层评价课题空间
├─ 压裂机理研究课题空间
└─ 储层预测课题空间
```

### 核心原则

> 不同 Topic Space 默认隔离，支持授权协同。

---

# 六、Research Agent 任务域

# 6.1 Research Task

Research Task 是：

> **需要被持续推进、跟踪或形成科研产出的科研任务。**

不是每一次对话都必须生成 Research Task。

### 应创建 Research Task 的典型情况

- 长周期任务；
- 异步任务；
- 多步骤任务；
- 需要人工介入；
- 需要持续跟踪；
- 具有明显阶段性；
- 会形成正式 Research Artifact。

### 不需要创建 Research Task 的情况

- 简单问答；
- 单篇文献总结；
- 简单翻译；
- 一次性普通检索；
- 秒级或分钟级普通任务。

这些仅作为 Agent Session / Conversation 保存。

### 核心字段

| 字段 | 说明 |
|---|---|
| task_id | 任务 ID |
| task_name | 任务名称 |
| task_type | 文献研究/数据分析/计算/实验/综合研究等 |
| project_id | 所属项目 |
| space_id | 所属空间 |
| creator_id | 创建人 |
| owner_id | 当前负责人 |
| status | 任务状态 |
| priority | 优先级 |
| current_step_id | 当前执行步骤 |
| progress | 进度 |
| started_at | 开始时间 |
| completed_at | 完成时间 |
| parent_task_id | 父任务，可用于任务拆解 |

### 推荐状态

```text
DRAFT
PLANNING
RUNNING
WAITING_HUMAN
WAITING_RESOURCE
PAUSED
FAILED
COMPLETED
CANCELLED
```

---

# 6.2 Agent Session

Agent Session 是：

> **用户与 Unified Research Agent 的一次连续会话。**

### 核心字段

| 字段 | 说明 |
|---|---|
| session_id | 会话 ID |
| title | 会话标题 |
| user_id | 创建人 |
| project_id | 当前项目 |
| space_id | 当前空间 |
| task_id | 关联 Research Task，可为空 |
| visibility | PRIVATE / SHARED / COLLABORATIVE |
| status | active / archived |
| created_at | 创建时间 |
| updated_at | 最近更新时间 |

### 关键关系

```text
Agent Session N : 0..1 Research Task
```

即：

- 普通会话可以不绑定 Research Task；
- 一项正式 Research Task 可以对应一个或多个 Session。

例如：

```text
Research Task：页岩气储层敏感性分析
├─ Session 1：任务定义
├─ Session 2：数据分析
└─ Session 3：结果解释与方案优化
```

---

# 6.3 Task Step

Task Step 是 Research Agent 将任务拆解后的执行步骤。

### 示例

```text
Research Task
“分析页岩气储层影响因素并形成研究建议”

Step 1 检索相关文献
Step 2 筛选高相关论文
Step 3 抽取影响因素
Step 4 运行统计分析
Step 5 调用储层预测模型
Step 6 综合研究结论
Step 7 等待人工确认
Step 8 生成研究报告
```

### 核心字段

| 字段 | 说明 |
|---|---|
| step_id | 步骤 ID |
| task_id | 所属任务 |
| step_name | 步骤名称 |
| sequence | 顺序 |
| step_type | Agent / Skill / Tool / Model / Human / Experiment |
| executor_type | 执行器类型 |
| executor_id | Agent / Skill / Model / Tool ID |
| status | 状态 |
| input_refs | 输入引用 |
| output_refs | 输出引用 |
| started_at | 开始时间 |
| completed_at | 完成时间 |

---

# 6.4 Human Decision

用于记录：

> **Research Agent 执行过程中需要人工判断、确认或授权的节点。**

例如：

- 参数确认；
- 研究假设选择；
- 实验方案确认；
- 数据权限授权；
- 结果异常判断；
- 资产共享确认。

### 核心字段

| 字段 | 说明 |
|---|---|
| decision_id | 决策 ID |
| task_id | 所属任务 |
| step_id | 所属步骤 |
| decision_type | 决策类型 |
| question | 需要用户判断的问题 |
| options | 可选项 |
| agent_recommendation | Agent 建议 |
| reason | 推荐理由 |
| decision_user_id | 决策人 |
| decision_result | 最终选择 |
| status | pending / completed |
| decided_at | 决策时间 |

---

# 6.5 Task Execution

用于记录实际运行实例。

尤其适用于：

- Agent 长任务；
- 科学计算；
- 模型运行；
- 数据处理；
- 仿真计算；
- 外部软件任务。

### 字段示例

```text
execution_id
task_id
step_id
executor_id
execution_type
runtime_status
progress
resource_usage
external_execution_id
started_at
finished_at
error_info
```

---

# 七、科研过程与资产域

# 7.1 Research Artifact

Research Artifact 是：

> **科研过程中产生的中间或阶段性成果。**

它不一定已经是正式资产。

例如：

- 文献分析草稿；
- 中间数据表；
- 临时图表；
- 模型 V1；
- 实验方案 V2；
- 分析结果；
- Agent 生成的初稿。

### 核心字段

| 字段 | 说明 |
|---|---|
| artifact_id | 过程产物 ID |
| artifact_type | 类型 |
| name | 名称 |
| task_id | 来源 Research Task |
| session_id | 来源会话 |
| step_id | 来源执行步骤 |
| project_id | 所属项目 |
| space_id | 所属空间 |
| creator_id | 创建人 |
| source_type | AI / HUMAN / SYSTEM |
| status | draft / verified / promoted |
| provenance | 来源与生成过程 |
| created_at | 创建时间 |

---

# 7.2 Research Asset

Research Asset 是：

> **经过保存、确认或沉淀后，进入正式管理体系的科研对象。**

资产包括但不限于：

```text
智能体
Skill
模型
数据集
方案模板
科研报告
实验方案
分析结果
图表
其他科研成果
```

### 核心字段

| 字段 | 说明 |
|---|---|
| asset_id | 资产 ID |
| asset_type | 资产类型 |
| asset_name | 名称 |
| project_id | 所属项目，可为空 |
| space_id | 所属空间 |
| owner_id | 所有者 |
| source_artifact_id | 来源 Artifact |
| current_version_id | 当前版本 |
| visibility | PRIVATE / SPACE / PROJECT / SHARED / PUBLIC |
| publish_status | 未发布 / 审核中 / 已发布 |
| lifecycle_status | active / archived |
| created_at | 创建时间 |

---

# 7.3 Artifact → Asset 生命周期

统一定义：

```text
Research Task / Agent Session
           ↓
Research Artifact
           ↓
保存 / 确认 / 版本化
           ↓
Research Asset
           ↓
共享 / 审核 / 发布
           ↓
Platform Research Resource
```

例如：

```text
模型 V1  ← Artifact
模型 V2  ← Artifact
模型 V3  ← Artifact
   ↓
确认 V3 为正式版本
   ↓
Model Asset V3
   ↓
审核发布
   ↓
科研模型广场
```

---

# 7.4 Asset Version

正式科研资产必须支持版本管理。

### 核心字段

```text
version_id
asset_id
version_number
version_name
content_ref
change_log
created_by
created_at
status
```

例如：

```text
V1.0
V1.1
V2.0
```

---

# 7.5 Asset Share

Asset Share 用于实现：

> **同一个 Project ID 下跨课题、跨空间科研资产共享。**

### 核心字段

| 字段 | 说明 |
|---|---|
| share_id | 分享记录 ID |
| asset_id | 资产 |
| source_space_id | 来源空间 |
| target_space_id | 目标空间 |
| target_user_id | 指定用户，可为空 |
| permission_level | 权限级别 |
| valid_from | 生效时间 |
| valid_to | 失效时间 |
| shared_by | 分享人 |
| status | 状态 |

### permission_level

```text
READ
REFERENCE
COPY
COLLABORATE
```

---

# 八、科研能力与资源域

科研能力资源与 Research Asset 不能简单理解为两个互斥概念。

一个对象可能先是科研资产，发布后再成为平台可调用资源。

---

# 8.1 Agent

代表可被 Unified Research Agent 调用的专业智能体。

### 示例

- 文献分析 Agent
- 专利分析 Agent
- 科研报告 Agent
- 数据分析 Agent
- 实验方案 Agent

### 核心字段

```text
agent_id
name
discipline
capability_tags
provider
source_system
external_agent_id
visibility
publish_status
version
```

---

# 8.2 Skill

代表标准化、可复用的科研技能。

### 分类

```text
通用
地球科学
合成生物科学
材料科学
其他
```

### 核心字段

```text
skill_id
name
discipline
description
input_schema
output_schema
provider
external_skill_id
version
availability
publish_status
```

---

# 8.3 Model

代表科研专业模型或通用模型。

### 核心字段

```text
model_id
name
discipline
model_type
provider
external_model_id
input_definition
output_definition
version
runtime_requirement
publish_status
```

模型创建、训练和部署主要复用 AI 中台。

---

# 8.4 Dataset

Dataset 具有双重身份：

### 作为 Research Asset

表示：

> 当前个人 / 项目拥有的数据集。

### 作为 Research Resource

表示：

> 已发布、可被其他科研人员或 Agent 调用的数据资源。

通过以下字段控制：

```text
ownership
visibility
publish_status
project_id
space_id
```

而不是复制两份 Dataset。

---

# 8.5 Tool

用于描述可执行工具能力。

例如：

- 数据清洗工具；
- 文献图表提取工具；
- 分子结构处理工具；
- 文件解析工具；
- 科学计算工具。

---

# 8.6 Software

代表外部科研软件。

例如：

```text
GROMACS
LAMMPS
Gaussian
Materials Studio
Petrel
专业地学软件
```

建议字段：

```text
software_id
name
discipline
software_type
access_method
source_system
launch_url
permission_requirement
availability
```

---

# 8.7 MCP / Connector

MCP / Connector 是技术接入形式，不建议作为科研人员的核心一级认知分类。

字段主要用于后台：

```text
connector_id
name
connector_type
endpoint
auth_type
capabilities
status
```

前台优先按照：

> **科研场景 / 学科 / 能力用途**

进行展示。

---

# 九、知识资源域

知识中心建议统一抽象为 Knowledge Resource。

```text
Knowledge Resource
├─ Literature
├─ Patent
├─ Standard
├─ Internal Document
├─ Knowledge Base
└─ Knowledge Graph
```

### 通用字段

```text
knowledge_id
knowledge_type
title
source
discipline
metadata
permission_scope
external_id
source_system
```

Research Agent 引用知识时记录：

```text
session_id
task_id
knowledge_id
citation_type
```

从而实现科研证据链和来源追踪。

---

# 十、云上实验室对象域

当前范围严格限定为四项：

```text
仪器设备纳管
仪器设备共享
实验任务管理
实验试剂耗材管理
```

---

# 10.1 Instrument

代表科研仪器设备。

### 核心字段

```text
instrument_id
instrument_code
instrument_name
instrument_type
organization_id
location
connection_type
online_status
runtime_status
sharing_status
responsible_user
source_system
```

---

# 10.2 Instrument Sharing / Reservation

用于设备共享和预约。

### 核心字段

```text
reservation_id
instrument_id
project_id
space_id
applicant_id
start_time
end_time
purpose
status
approval_user
```

---

# 10.3 Experiment Task

实验任务与 Research Task 不是同一个对象。

### Research Task

代表：

> AI4S 中的整体科研任务。

### Experiment Task

代表：

> 云上实验室中具体需要执行的实验任务。

关系：

```text
Research Task
     │
     └── 0..N Experiment Task
```

### 核心字段

```text
experiment_task_id
research_task_id
project_id
space_id
experiment_name
requester_id
executor_id
instrument_id
status
input_requirements
result_ref
```

---

# 10.4 Reagent / Consumable

### 核心字段

```text
material_id
material_type
name
specification
inventory
unit
location
status
warning_threshold
```

使用记录：

```text
usage_id
material_id
experiment_task_id
user_id
quantity
used_at
```

---

# 十一、空间上下文模型

用户进入科研工作台后必须存在一个 Current Context。

建议定义：

```text
Current Research Context
├─ user_id
├─ project_id
├─ space_id
├─ active_session_id
├─ active_task_id
├─ accessible_asset_scope
└─ accessible_resource_scope
```

右上角切换 Space 后，需要重新计算：

- 可访问历史会话；
- 可访问 Research Task；
- 可访问知识；
- 可访问项目资产；
- 可调用模型；
- 可调用 Skill；
- 可使用工具；
- 可访问实验资源。

---

# 十二、历史会话、科研任务和科研资产之间的关系

这是后续产品设计的重点。

## 12.1 普通即时任务

```text
Agent Session
     ↓
回答用户
     ↓
结束
```

不创建 Research Task，也不自动形成 Research Asset。

---

## 12.2 持续科研任务

```text
Agent Session
     ↓
Research Task
     ↓
Task Step × N
     ↓
Research Artifact × N
     ↓
Research Asset
```

---

## 12.3 多次会话继续同一个科研任务

```text
Research Task
├─ Agent Session A
├─ Agent Session B
└─ Agent Session C
```

因此：

> **历史会话 ≠ 科研任务。**

历史会话是科研过程交互记录；Research Task 是持续科研工作的业务对象。

---

# 十三、项目资产与我的资产的数据模型

不建议创建两个完全独立的 Asset 表。

统一使用 Research Asset，通过：

```text
owner_id
project_id
space_id
visibility
```

决定展示位置。

---

## 我的资产

查询逻辑示例：

```text
owner_id = current_user
```

---

## 项目资产

查询逻辑示例：

```text
project_id = current_project
AND
(
    space_id IN accessible_spaces
    OR visibility = PROJECT
    OR asset_id IN authorized_assets
)
```

这样可以避免数据重复。

---

# 十四、科研技能 / 科研模型广场与科研资产的关系

仍然使用同一底层对象。

例如模型：

```text
我的资产
Model Asset
    ↓
申请发布
    ↓
审核
    ↓
publish_status = PUBLISHED
    ↓
科研模型广场展示
```

Skill 同理。

因此：

> **“科研资产”和“科研模型/科研技能广场”是同一对象在不同生命周期和不同产品视图中的表现。**

---

# 十五、AI 中台对象映射

AI4S 不重复建设以下能力：

- Agent 开发；
- Skill 开发；
- 模型训练；
- 模型部署；
- 数据集创建；
- 算力资源管理。

建议所有外部对象保存映射：

```text
source_system = AI_PLATFORM
external_object_id = xxx
external_resource_space_id = xxx
sync_status = synced
```

例如：

```text
AI4S Model
    ↕
AI中台 Model ID

AI4S Skill
    ↕
AI中台 Skill ID

AI4S Dataset
    ↕
AI中台 Dataset ID
```

---

# 十六、外部科研项目管理系统映射

Project 对象建议保存：

```text
source_system
external_project_id
external_project_code
sync_status
last_sync_time
```

AI4S 只管理科研执行相关上下文，不重新建设传统科研项目管理。

---

# 十七、项目空间管理对象关系

项目空间管理模块主要维护：

```text
Project
   ↓
Space
   ↓
Membership
   ↓
Space Role / Permission
```

核心管理动作：

- 创建项目空间；
- 创建课题空间；
- 关联 Project ID；
- 配置成员；
- 配置空间角色；
- 配置权限；
- 关闭/归档空间；
- 映射 AI 中台资源空间。

---

# 十八、关键对象生命周期

## 18.1 Research Task

```text
Draft
  ↓
Planning
  ↓
Running
  ↓
Waiting Human / Waiting Resource
  ↓
Running
  ↓
Completed
```

---

## 18.2 Research Artifact

```text
Draft
  ↓
Generated
  ↓
Reviewed / Verified
  ↓
Promoted
```

---

## 18.3 Research Asset

```text
Created
  ↓
Versioned
  ↓
Shared
  ↓
Review
  ↓
Published
  ↓
Archived
```

---

## 18.4 Space

```text
Created
  ↓
Active
  ↓
Suspended
  ↓
Archived / Closed
```

---

# 十九、建议的核心 ID 体系

后续接口与数据库至少统一以下 ID：

```text
user_id
project_id
space_id
membership_id

task_id
session_id
step_id
decision_id
execution_id

artifact_id
asset_id
version_id
share_id

agent_id
skill_id
model_id
dataset_id
tool_id
software_id

instrument_id
experiment_task_id
reservation_id
material_id

knowledge_id
```

避免后续 PRD 和原型大量使用模糊的：

> “当前对象”“当前任务”“当前项目内容”

而无法落到数据结构。

---

# 二十、后续 PRD 必须遵守的对象边界

## 1. Conversation ≠ Research Task

一次对话可以只是普通即时问答。

---

## 2. Research Task ≠ Task Step

Research Task 是科研目标，Task Step 是执行步骤。

---

## 3. Research Artifact ≠ Research Asset

Artifact 是过程产物，Asset 是正式沉淀对象。

---

## 4. Research Asset ≠ Published Resource

资产可能只是个人或项目私有资产。

只有发布以后，才进入技能广场、模型广场或平台共享资源体系。

---

## 5. Project ≠ Space

Project 是科研项目业务对象。

Space 是 AI4S 中承载上下文和权限的工作空间。

---

## 6. Project Space ≠ Topic Space

项目空间面向项目级公共协作。

课题空间对应具体课题。

---

## 7. Experiment Task ≠ Research Task

Experiment Task 是科研任务中的实验执行对象。

---

## 8. System Role ≠ Space Role

系统角色决定用户总体能力。

空间角色决定用户在具体 Space 中的操作权限。

---

# 二十一、核心关系基线

最终核心关系可以压缩为：

```text
User
 │
 ├─ System Role
 │
 └─ Membership
        │
        ▼
Project
 │
 └─ Space
      │
      ▼
Research Task
 │
 ├─ Agent Session
 ├─ Task Step
 ├─ Human Decision
 ├─ Execution
 └─ Research Artifact
        │
        ▼
 Research Asset
        │
 ├─ Version
 ├─ Share
 └─ Publish
        │
        ▼
Agent / Skill / Model / Dataset / 其他科研资源
```

---

# 二十二、对象模型最终结论

AI4S 的数据和产品逻辑可以统一概括为：

> **Project 定义科研项目边界，Space 定义科研上下文和权限范围，Research Task 承载持续科研任务，Agent Session 承载人机交互过程，Task Step 记录 Agent 的执行过程，Research Artifact 承载科研过程产物，Research Asset 承载正式沉淀成果，Skill / Model / Dataset 等对象在发布后可进一步转化为平台可发现、可调用的科研资源。**

该对象模型作为后续：

- 科研工作台 PRD；
- 权限设计；
- 数据库设计；
- API 设计；
- Agent 上下文管理；
- 科研资产管理；
- 项目空间管理；
- 知识中心；
- 科研技能；
- 科研模型；
- 云上实验室；

的统一对象基线。
