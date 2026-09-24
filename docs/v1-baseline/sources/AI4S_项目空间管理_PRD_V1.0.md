# AI4S 项目空间管理 PRD V1.0

> 版本：V1.0  
> 产品名称：AI4S 科研平台  
> 模块名称：项目空间管理  
> 适用角色：科研项目管理人员、平台管理员；项目/课题负责人按授权拥有部分查看或成员管理能力  
> 设计基线：科研项目作为 AI4S 中的逻辑项目边界，Space 作为科研上下文、成员协作和权限控制单元；一个科研项目下可包含一个项目空间和多个课题空间。项目空间管理仅负责 AI4S 内空间创建、成员管理、角色权限和空间配置，不重复建设科研项目申报、立项、经费、合同、验收等传统科研项目管理能力。  
> 本文档用途：作为原型、UI、前端、后端、权限、Project / Space 数据模型和测试设计的统一开发基线。

---

# 一、产品定位

项目空间管理用于管理 AI4S 中正式科研项目对应的科研空间体系。

其核心目标是解决四个问题：

1. **科研项目在 AI4S 中需要创建哪些空间；**
2. **哪些科研人员属于项目空间或课题空间；**
3. **不同成员在空间中具有什么角色和权限；**
4. **项目空间、课题空间如何与 Project ID、AI 中台资源空间及科研资产建立关系。**

项目空间管理属于 AI4S 的权限和科研协作基础能力，不是传统科研项目管理系统。

---

# 二、产品边界

## 2.1 本模块负责

- 创建项目空间；
- 创建课题空间；
- 关联 Project ID；
- 维护项目空间与课题空间层级；
- 空间成员管理；
- 空间角色分配；
- 空间权限配置；
- 空间状态管理；
- AI 中台资源空间映射；
- 空间归档 / 关闭；
- 空间操作审计。

---

## 2.2 本模块不负责

以下能力由外部科研项目管理系统承担，AI4S 仅做必要信息集成：

- 科研项目申报；
- 立项；
- 项目审批；
- 经费管理；
- 合同管理；
- 中期检查；
- 验收；
- 归档；
- 完整项目生命周期管理。

AI4S 只接收必要的：

```text
Project ID
项目编号
项目名称
项目负责人
项目状态
项目起止时间
课题关系
必要成员信息
```

---

# 三、空间模型

AI4S 当前正式采用以下空间模型：

```text
科研项目 Project
│
├─ 项目空间 Project Space
│
├─ 课题空间 Topic Space A
├─ 课题空间 Topic Space B
└─ 课题空间 Topic Space C
```

科研人员个人同时拥有：

```text
个人科研空间 Personal Space
```

个人空间不由“项目空间管理”模块创建。

---

# 四、核心对象关系

```text
Project
   │
   ├─ Project Space
   │
   └─ Topic Space × N
          │
          ├─ Membership
          │      ├─ User
          │      └─ Space Role
          │
          ├─ Research Task
          ├─ Agent Session
          └─ Research Asset
```

---

# 五、Project 与 Space 的关系

## 5.1 Project

Project 是正式科研项目的逻辑业务对象。

核心字段来自外部科研项目管理系统。

---

## 5.2 Project Space

通常一个正式科研项目对应一个项目公共空间：

```text
Project 1 : 1 Project Space
```

项目空间主要承载：

- 项目公共科研资产；
- 项目共享成果；
- 跨课题共享资源；
- 项目级协作内容。

---

## 5.3 Topic Space

一个课题对应一个独立课题空间：

```text
Project 1 : N Topic Space
```

核心原则：

> **一个课题 = 一个独立 Space。**

不同课题空间默认隔离，通过授权实现协同。

---

# 六、目标用户

## 6.1 科研项目管理人员

主要职责：

- 创建项目空间；
- 创建课题空间；
- 添加 / 移除成员；
- 设置项目角色和空间角色；
- 配置空间权限；
- 维护空间结构；
- 关闭或归档空间。

---

## 6.2 平台管理员

主要职责：

- 平台级空间治理；
- 项目空间创建规则；
- 系统级权限规则；
- 异常空间处理；
- 跨系统映射；
- 资源空间配置；
- 管理科研项目管理人员权限。

---

## 6.3 项目/课题负责人

默认不拥有完整空间管理权限。

按授权可拥有：

- 查看空间成员；
- 邀请成员；
- 移除部分成员；
- 配置课题成员；
- 查看或调整部分课题业务角色。

不能默认执行：

- 创建项目空间；
- 修改 Project ID；
- 跨项目迁移 Space；
- 修改系统级权限策略。

---

# 七、页面信息架构

建议项目空间管理包含五个二级功能：

```text
项目空间管理
├─ 项目空间
├─ 课题空间
├─ 空间成员
├─ 角色与权限
└─ 空间配置
```

---

# 八、项目空间列表

## 8.1 页面目标

用于查看 AI4S 已创建的项目空间。

---

## 8.2 列表字段

建议展示：

- 项目空间名称；
- Project ID；
- 项目编号；
- 项目名称；
- 项目负责人；
- 空间管理员；
- 课题空间数量；
- 成员数量；
- 空间状态；
- 创建时间；
- 更新时间。

---

## 8.3 搜索

支持：

- 项目名称；
- 项目编号；
- Project ID；
- 项目负责人；
- 空间管理员。

---

## 8.4 筛选

支持：

- 空间状态；
- 所属单位；
- 项目状态；
- 创建时间。

---

# 九、创建项目空间

## 9.1 创建前提

项目空间必须关联一个有效的正式 Project。

优先从已同步的科研项目中选择。

---

## 9.2 创建字段

建议包括：

```text
Project ID
项目名称
项目编号
项目空间名称
空间负责人
空间管理员
空间简介
默认权限策略
AI中台资源空间映射（可选）
```

其中项目名称和项目编号原则上从外部项目系统带入，不允许随意修改。

---

## 9.3 创建校验

需检查：

- Project ID 是否有效；
- 是否已经存在 Project Space；
- 当前用户是否有创建权限；
- 空间负责人是否有效；
- Project 当前是否允许创建 Space。

---

## 9.4 创建结果

创建成功后形成：

```text
Project
↓
Project Space
↓
Space ID
```

并生成默认 Membership 和基础权限关系。

---

# 十、项目空间详情

建议包含以下区域：

```text
空间概况
课题空间
成员
角色与权限
科研资产概览
空间配置
操作记录
```

科研资产仅展示概览和跳转，不在本模块重复建设资产管理。

---

# 十一、课题空间列表

## 11.1 页面目标

用于管理当前 Project 下的 Topic Space。

---

## 11.2 列表字段

建议：

- 课题空间名称；
- 课题编号；
- 所属 Project；
- 课题负责人；
- 成员数量；
- 资产数量；
- 空间状态；
- 创建时间；
- 更新时间。

---

# 十二、创建课题空间

## 12.1 创建方式

在指定 Project 下创建。

---

## 12.2 核心字段

```text
所属 Project
课题编号
课题名称
空间名称
课题负责人
空间管理员
课题成员（可后续配置）
空间简介
默认权限策略
AI中台资源空间映射（可选）
```

---

## 12.3 创建规则

- 一个 Topic Space 必须属于一个 Project；
- 一个课题原则上对应一个 Topic Space；
- 不允许无 Project 的正式 Topic Space；
- 不允许将 Topic Space 同时挂载到多个 Project。

---

# 十三、课题空间详情

建议包括：

```text
课题概况
成员
角色与权限
科研任务概览
科研资产概览
共享关系
空间配置
操作记录
```

Research Task 和科研资产只提供概览及跳转。

---

# 十四、空间成员管理

## 14.1 页面目标

统一管理用户与 Project / Space 的成员关系。

---

## 14.2 成员字段

建议展示：

- 姓名；
- 所属单位；
- 部门；
- 系统角色；
- 项目角色；
- 空间角色；
- 所属课题；
- 加入时间；
- 成员状态。

---

# 十五、添加成员

支持：

```text
选择用户
↓
选择 Project
↓
选择目标 Space
↓
配置项目角色 / 空间角色
↓
确认加入
```

---

## 15.1 添加范围

可添加到：

- Project Space；
- 一个或多个 Topic Space。

一个用户可同时属于同一 Project 下多个课题空间。

---

# 十六、成员移除

移除成员前必须检查：

- 是否为当前 Space 负责人；
- 是否拥有未转移的关键资产；
- 是否存在未完成的 Research Task；
- 是否存在待处理事项；
- 是否为唯一空间管理员。

---

## 16.1 移除后的基本规则

用户被移出 Space 后：

- 不再访问该 Space 新数据；
- 私人会话仍归本人，但失去该 Space 下无权资源的后续访问能力；
- 已沉淀至 Space 的项目资产仍归 Space；
- 历史操作记录保留；
- 已授权共享按照权限策略处理。

---

# 十七、项目成员与课题成员关系

建议遵循：

> 加入 Topic Space 的用户必须首先属于当前 Project。

即：

```text
Project Membership
   ↓
Topic Space Membership
```

如用户不属于 Project，则添加至 Topic Space 时自动先建立 Project Membership，或提示管理员完成加入。

---

# 十八、空间角色

建议不要无限增加系统角色。

空间内部采用 Space Role。

基础角色建议：

```text
Space Admin
Topic Leader
Member
Asset Manager
Viewer
```

具体中文展示可按业务定义。

---

## 18.1 Space Admin

权限包括：

- 管理空间成员；
- 配置空间角色；
- 管理部分空间设置；
- 查看空间操作记录。

---

## 18.2 Topic Leader

主要用于 Topic Space：

- 管理课题科研协作；
- 查看课题成员；
- 管理部分课题资产共享；
- 根据授权邀请成员。

---

## 18.3 Member

普通科研成员。

---

## 18.4 Asset Manager

负责特定资产共享和发布管理。

---

## 18.5 Viewer

以查看授权内容为主。

---

# 十九、系统角色与空间角色分离

必须区分：

```text
System Role
≠
Space Role
```

例如：

```text
系统角色：科研人员
空间角色：Topic Leader
```

表示该用户在整个系统中是科研人员，但在某个课题空间承担负责人角色。

---

# 二十、角色与权限配置

权限配置建议分层：

```text
系统权限
↓
项目角色
↓
空间角色
↓
Asset ACL
```

项目空间管理模块主要负责：

> **项目角色 + 空间角色**

不替代平台管理员的系统级角色配置。

---

# 二十一、空间权限项

V1.0 建议至少支持以下权限项：

```text
查看空间
查看成员
邀请成员
移除成员
配置成员角色

查看 Research Task
创建 Research Task
查看协同任务

查看空间资产
共享空间资产
管理空间资产

查看项目公共资产
引用跨课题共享资产

管理空间配置
关闭 / 归档空间
```

权限实现建议基于稳定 Permission Code，而非前端硬编码角色。

---

# 二十二、默认权限模板

建议提供基础模板：

## 项目空间管理员

- 成员管理；
- 角色配置；
- 空间配置；
- 项目公共资产管理；
- 查看项目空间操作记录。

## 课题负责人

- 查看课题成员；
- 管理科研协作；
- 创建 / 查看课题 Research Task；
- 查看课题资产；
- 按授权共享资产。

## 普通成员

- 使用 Research Agent；
- 创建本人科研任务；
- 使用有权科研资产；
- 查看授权协同内容。

---

# 二十三、数据范围

统一使用：

```text
SELF
SPACE
TOPIC
PROJECT
AUTHORIZED
GLOBAL
```

空间管理中重点使用：

- SPACE；
- TOPIC；
- PROJECT；
- AUTHORIZED。

---

# 二十四、项目内跨课题协同

默认模型：

```text
Topic Space A
    × 默认不可访问
Topic Space B
```

通过授权后：

```text
Topic Space A
↓
Asset / Task / Resource Share
↓
Topic Space B
```

项目空间管理负责维护：

- Space 关系；
- 成员关系；
- 基础权限。

具体科研资产共享由科研资产模块承担。

---

# 二十五、成员项目内个人内容的可见性

项目成员可查看其他成员在当前 Project 范围内明确共享或公开的科研内容。

不能默认查看：

- 用户整个个人空间；
- 其他 Project 数据；
- 私人 Agent 会话；
- 未共享草稿资产。

原则：

> **项目成员关系只建立协作边界，不自动取消个人隐私边界。**

---

# 二十六、空间状态

建议统一：

```text
ACTIVE
SUSPENDED
ARCHIVED
CLOSED
```

前台：

```text
正常
暂停
已归档
已关闭
```

---

# 二十七、暂停空间

暂停后：

- 禁止创建新的 Research Task；
- 禁止新增普通成员；
- 历史数据仍可按权限查看；
- 正在运行的任务由业务规则决定暂停或继续。

---

# 二十八、归档空间

适用于科研工作已结束但仍需保留数据。

归档后：

- 默认只读；
- 不再作为日常 Space 切换主要选项；
- 历史任务、会话、科研资产继续保留；
- 可按权限恢复。

---

# 二十九、关闭空间

关闭属于较高风险操作。

必须：

- 权限校验；
- 二次确认；
- 检查未完成任务；
- 检查关键共享关系；
- 记录操作原因。

不建议直接物理删除科研空间。

---

# 三十、删除空间

V1.0 原则上：

> **不向普通管理人员提供直接物理删除正式项目 / 课题 Space 的能力。**

仅平台管理员在特殊场景下执行受控删除，并保留审计记录。

---

# 三十一、空间切换器联动

项目空间管理完成创建后，对有权限用户自动进入：

> 全局 Space 切换器

例如：

```text
非常规油气前沿研究
├─ 项目空间
├─ 页岩气储层评价
└─ 压裂机理研究
```

用户只看到自己有权限进入的 Space。

---

# 三十二、Space Context

进入 Space 后建立：

```text
Current Research Context
├─ user_id
├─ project_id
├─ space_id
├─ memberships
├─ data_scope
└─ accessible_resources
```

用于 Research Agent 和所有业务模块权限计算。

---

# 三十三、与科研资产联动

Space 决定科研资产的：

- 归属；
- 查询范围；
- 共享目标；
- 权限边界。

例如：

```text
asset.project_id = P001
asset.space_id = T001
```

表示资产归属于 P001 项目下 T001 课题空间。

---

# 三十四、与 Research Task 联动

Research Task 创建时必须记录：

```text
project_id
space_id
```

Space 被关闭或归档后，需要校验未完成 Research Task。

---

# 三十五、与历史会话联动

Agent Session 同样记录：

```text
project_id
space_id
```

空间切换后，历史会话列表默认只显示当前 Space 下用户有权访问的会话。

---

# 三十六、与 AI 中台资源空间映射

## 36.1 目的

AI4S 的 Project / Topic Space 可与 AI 中台的资源空间建立映射，以便复用：

- Agent；
- Skill；
- Model；
- Dataset；
- 算力；
- 其他中台资源。

---

## 36.2 映射字段

建议：

```text
space_id
external_resource_space_id
source_system
sync_status
last_sync_time
```

---

## 36.3 映射原则

AI4S Space 和 AI 中台资源空间不要求完全一一等同，但必须建立清晰映射关系。

V1.0 优先支持：

```text
AI4S Topic Space
↔
AI中台资源空间
```

或：

```text
AI4S Project Space
↔
AI中台资源空间
```

具体映射粒度由实施方案确定。

---

# 三十七、与外部科研项目管理系统集成

项目空间管理仅从外部系统读取必要 Project 信息。

建议字段：

```text
external_project_id
project_code
project_name
project_manager
project_status
start_date
end_date
topic_list
```

AI4S 保存同步状态：

```text
source_system
sync_status
last_sync_time
```

---

# 三十八、项目变更同步

如果外部系统发生：

- 项目负责人变化；
- 项目状态变化；
- 课题变化；
- 项目终止；

AI4S 应提示科研项目管理人员检查对应 Space。

不建议未经人工确认直接大规模删除或迁移 Space。

---

# 三十九、权限冲突处理

当多个角色叠加时：

> 默认采用权限并集，但对象级显式拒绝和数据隔离规则优先。

例如：

```text
科研人员 + 科研项目管理人员
```

用户既可以科研使用，也可以管理授权项目 Space。

但仍不能因此访问其他 Project 的科研内容。

---

# 四十、无权限状态

用户访问无权限 Space 时：

```text
你当前没有该科研空间的访问权限。
```

如允许申请：

```text
[申请加入]
```

是否提供申请加入根据实际制度配置。

---

# 四十一、关键审计行为

必须记录：

- 创建项目空间；
- 创建课题空间；
- 修改空间信息；
- 添加成员；
- 移除成员；
- 角色变更；
- 权限变更；
- 空间状态变化；
- AI 中台空间映射变化；
- 关闭 / 归档空间；
- 高风险配置变更。

---

# 四十二、关键数据对象

本模块直接依赖：

```text
Project
Space
Membership
Space Role
Permission
Role-Permission Mapping
Space Configuration
Space Mapping
Audit Log
```

---

# 四十三、核心字段建议

## 43.1 Space

```text
space_id
space_type
space_name
project_id
parent_space_id
owner_id
admin_user_ids
status
permission_policy
external_resource_space_id
created_by
created_at
updated_at
```

---

## 43.2 Membership

```text
membership_id
user_id
project_id
space_id
member_role
data_scope
status
joined_at
updated_at
```

---

## 43.3 Space Role

```text
space_role_id
role_name
role_code
space_type
description
status
```

---

## 43.4 Permission

```text
permission_id
permission_code
permission_name
resource_type
operation
```

---

## 43.5 Role Permission Mapping

```text
space_role_id
permission_id
scope
```

---

# 四十四、推荐接口边界

## 项目空间列表

```text
GET /space-management/project-spaces
```

---

## 创建项目空间

```text
POST /space-management/project-spaces
```

---

## 课题空间列表

```text
GET /space-management/topic-spaces
```

---

## 创建课题空间

```text
POST /space-management/topic-spaces
```

---

## 空间详情

```text
GET /spaces/{space_id}
PATCH /spaces/{space_id}
```

---

## 空间成员

```text
GET /spaces/{space_id}/members
POST /spaces/{space_id}/members
DELETE /spaces/{space_id}/members/{user_id}
```

---

## 空间角色

```text
PATCH /spaces/{space_id}/members/{user_id}/role
```

---

## 权限配置

```text
GET /spaces/{space_id}/permissions
PATCH /spaces/{space_id}/permissions
```

---

## 空间状态

```text
POST /spaces/{space_id}/archive
POST /spaces/{space_id}/suspend
POST /spaces/{space_id}/close
```

---

# 四十五、空状态与异常状态

## 45.1 无项目空间

提示：

> 当前尚未创建 AI4S 项目空间。

对有权限用户显示：

> [创建项目空间]

---

## 45.2 无课题空间

提示：

> 当前项目尚未配置课题空间。

---

## 45.3 外部 Project 未同步

提示：

> 暂未获取到对应科研项目信息，请检查项目系统同步状态。

---

## 45.4 AI 中台资源空间映射异常

提示：

> 当前科研空间与 AI 中台资源空间的映射异常，部分 AI 能力可能暂不可用。

---

# 四十六、性能要求

- 项目空间列表首屏尽量在 2 秒内加载；
- 成员列表支持分页和搜索；
- 角色权限变更后尽快生效；
- Space 切换器与权限缓存及时刷新；
- 外部 Project / AI 中台映射状态应可查询。

---

# 四十七、原型页面清单

本 PRD 至少对应：

1. 项目空间列表；
2. 创建项目空间；
3. 项目空间详情；
4. 项目空间编辑；
5. 课题空间列表；
6. 创建课题空间；
7. 课题空间详情；
8. 空间成员列表；
9. 添加成员；
10. 移除成员确认；
11. 成员角色设置；
12. 角色与权限配置；
13. 空间配置；
14. AI 中台资源空间映射；
15. 空间暂停确认；
16. 空间归档确认；
17. 空间关闭确认；
18. 无权限状态；
19. 外部项目同步异常状态；
20. 空间操作审计记录。

---

# 四十八、核心验收标准

## 48.1 项目空间

- [ ] 可从有效 Project 创建项目空间；
- [ ] 一个 Project 原则上只有一个 Project Space；
- [ ] Space 与 Project ID 正确关联；
- [ ] 项目空间可进入全局 Space 切换器。

---

## 48.2 课题空间

- [ ] 一个课题可建立一个独立 Topic Space；
- [ ] Topic Space 必须挂载所属 Project；
- [ ] 同一 Project 可拥有多个 Topic Space；
- [ ] 不同 Topic Space 默认数据隔离。

---

## 48.3 成员

- [ ] 支持添加成员；
- [ ] 支持移除成员；
- [ ] 支持一个成员加入多个 Topic Space；
- [ ] Topic Space 成员必须属于所属 Project；
- [ ] 移除成员前检查未完成任务和关键资产。

---

## 48.4 角色与权限

- [ ] 系统角色与空间角色分开；
- [ ] 支持 Space Role；
- [ ] 支持成员角色配置；
- [ ] 支持权限模板；
- [ ] 支持 Project / Space / Asset ACL 联动；
- [ ] 项目/课题负责人不默认获得平台级空间管理权。

---

## 48.5 空间状态

- [ ] 支持正常、暂停、归档、关闭；
- [ ] 正式 Space 不默认物理删除；
- [ ] 关闭 / 归档前校验未完成任务；
- [ ] 历史资产、任务和会话在归档后可追溯。

---

## 48.6 集成

- [ ] 支持外部科研项目管理系统 Project 信息映射；
- [ ] 不在 AI4S 重复建设科研项目全生命周期管理；
- [ ] 支持 AI 中台资源空间映射；
- [ ] 映射异常可识别和处理。

---

# 四十九、最终产品基线

项目空间管理最终定义为：

> **AI4S 中面向科研项目管理人员和平台管理员的科研空间治理模块，以正式科研项目 Project ID 为逻辑边界，负责创建和维护项目空间、课题空间、成员关系、空间角色和权限，并通过 Project / Space / Membership / ACL 建立统一科研上下文和数据访问边界；项目空间管理只负责 AI4S 内科研空间治理，不重复建设传统科研项目管理系统。**

核心关系统一为：

> **Project → Project / Topic Space → Membership → Space Role → Permission → Research Task / Agent Session / Research Asset。**
