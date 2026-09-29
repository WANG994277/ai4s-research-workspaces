# 科研空间参考图 Design QA

- source visual truth path: `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-5803d1dc-6133-4a14-a93d-7f4c5b0cd97a.png`
- implementation URL: `http://localhost:3000/research-spaces/project-rubber/assets`
- comparison URL: `http://localhost:3300/ai4s-research-space-qa.html`
- source pixels: 2318 × 1724（工具显示归一化为 1824 × 1356）
- implementation CSS viewport: 1824 × 1356
- comparison viewport: 1824 × 900；两侧以约 0.49 比例归一化显示
- state: 科研资产列表；新建菜单展开；桌面浅色主题
- browser evidence: Codex in-app Browser，3000 实际运行目录
- primary interactions tested: 类型页签、搜索入口、筛选弹层、新建菜单、复选框、行操作、分页、详情返回
- console: 新增 error/warn 为 0

## Full-view comparison evidence

参考图与3000实现已放在同一个浏览器对照页中比较。实现保留当前产品全局侧栏和顶栏；参考图Banner按用户明确要求省略。内容区的标题、科研资产/空间管理切换、分类统计块、搜索/筛选/新建工具栏、图标化表格、状态胶囊、操作列和底部分页均与参考图同构。

## Focused region comparison evidence

- 工具栏：分类块与搜索、筛选、新建保持同一视觉层级；新建下拉的位置、阴影、图标和行高与参考图一致。
- 表格：名称列采用彩色类型图标、主副文本；类型、版本、所属空间、创建人、更新时间、状态和操作列顺序一致。
- 状态：已发布/已共享使用绿色，未发布/审核中使用蓝色，草稿使用橙色，并带图标与文字。
- 分页：总数左置，页码、每页数量和跳页右置；数据使用当前项目真实演示对象，因此数量不伪造成128。
- 详情与管理：沿用同一深红主色、白底、细边框和页签语言，未继续使用旧蓝色科研空间视觉。

## Required fidelity surfaces

- Fonts and typography: 沿用项目既有 PingFang SC / Microsoft YaHei；标题、分类、表头、行内主副文本的字号和权重层级与参考图一致。
- Spacing and layout rhythm: 采用参考图的紧凑工具栏、72px数据行、44px图标、46px分类/输入控件和底部分页节奏。
- Colors and visual tokens: 科研空间局部使用 `#c8102e` 深红主色；灰阶表头、彩色类型标签与语义状态色均已对齐。
- Image quality and asset fidelity: 用户允许省略Banner；其余可见图标使用项目既有Lucide矢量图标，无占位图、emoji、CSS绘图或伪造品牌素材。
- Copy and content: 页面结构与参考图一致，资产名称和数量使用当前高性能合成橡胶项目的可追溯演示数据。

## Comparison history

### Iteration 1 — blocked

- [P1] 旧科研空间使用蓝色主操作、分散筛选、通用表格和普通按钮行，与参考图的信息密度、层级和红色视觉语言明显不符。
- [P1] 缺少类型统计块、彩色类型图标、状态胶囊、参考式新建下拉与完整分页。
- Fixes: 删除旧列表渲染路径，新增独立 `research-space-list.tsx`；重写工具栏、表格、筛选、新建菜单、状态和分页；增加8条当前项目资产用于验证密度。

### Iteration 2 — passed

- 参考图与实现同状态并排复核后，无残留P0/P1/P2问题。
- 可接受差异：保留产品现有全局导航；Banner按用户要求省略；资产统计使用实际演示数据；方案模板作为PRD第五类保留在新建菜单。

## Follow-up polish

- [P3] 若后续需要完全复刻参考图的能源主题Banner，可在用户确认品牌素材后补充，不影响当前验收。

final result: passed

---

# 科研资产蓝色双视图、发布流程与详情 Design QA

- source visual truth paths:
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-90e7cbf7-08b0-4581-a485-67c25dde4f38.png`（项目资产，1672×941）
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-25c1fdac-9fba-4191-9c08-ba312ac61ee1.png`（我的资产，1672×941）
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-ad1959fe-af3b-40c1-bd65-e37325ef006e.png`（发布资产，988×846）
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-3a853ac5-e476-42f7-90f8-a88de5f5c670.png`（智能体详情，2602×1776）
- implementation URLs:
  - `http://localhost:3000/research-spaces/project-rubber/assets`
  - `http://localhost:3000/research-spaces/project-rubber/assets?view=mine`
  - `http://localhost:3000/research-spaces/project-rubber/assets?view=mine&publish=skill-geology`
  - `http://localhost:3000/research-spaces/project-rubber/assets/agent-rubber-research?tab=overview`
- combined comparison and implementation screenshot URL: `http://localhost:3300/ai4s-research-assets-qa.html`
- comparison viewport: 1920×1080 CSS pixels；参考图与实现分别缩放进入等宽对照面板；1280×900另行检查布局韧性。
- browser evidence: Codex in-app Browser；项目资产、我的资产、发布步骤1、2、3和智能体概览均已打开验证。

## Full-view comparison evidence

- 项目资产：双层页签、类型统计、搜索/状态/归属/新建工具栏、实际归属列、状态和底部分页与参考图同构。
- 我的资产：发布情况替代实际归属/创建人列，查看/发布动作和说明文案与参考图同构；使用当前可追溯资产，因此数量不伪造成参考图数字。
- 智能体详情：摘要图标、标题简介、元数据、打开使用/共享、五个页签和基本信息卡与参考图同构。
- 发布资产：三步进度、左侧表单、右侧发布须知及底部操作与参考图同构；主色按用户要求由参考图红色映射为企业蓝。

## Focused region comparison evidence

- 字体与排版：保留当前项目中文系统字体；标题、页签、表头、主副文本和元数据层级清晰，未引入参考图品牌字体或远程字体。
- 间距与布局：1920下工具栏单行、表格无内部滚动；1280下页面宽度等于视口，表格仅在自身容器内滚动；详情摘要头和双列基本信息未溢出。
- 颜色与令牌：科研资产主色统一为 `#0969F6` / `#0057D9`，页面背景、卡片、表头和边框继承空间管理蓝白系统；类型语义色和状态色保留。
- 图像与图标：参考图Banner按既有用户要求省略；页面只使用项目Logo和Lucide矢量图标，没有占位图、emoji、CSS绘图或伪造品牌素材。
- 文案与内容：项目资产/我的资产定义、共享不改变归属、发布后保留在我的资产、审核后上架等规则均已显式呈现。

## Comparison history

### Iteration 1 — blocked

- [P1] 旧页面只有单一资产列表，缺少项目资产/我的资产、差异化列和发布三步流程。
- [P1] 旧详情使用通用卡片头和通用详情表，不符合参考图的摘要头、五页签和基本信息结构。
- [P1] 旧科研资产局部仍使用深红主色，与用户最新“参考空间管理改蓝色”要求冲突。
- Fixes: 重写列表视图层与发布弹窗，重构详情摘要和概览，并将科研资产令牌切换为蓝色。

### Iteration 2 — blocked

- [P2] 详情适用领域同时包含学科和同名标签，产生React重复key告警。
- Fix: 新增 `uniqueLabels` 领域函数及RED/GREEN回归测试，在详情渲染前稳定去重。

### Iteration 3 — passed

- 四组参考图与实现同屏复核后无残留P0/P1/P2问题。
- 可接受差异：保留当前产品全局侧栏和顶栏；Banner继续省略；红色按用户明确要求替换为蓝色；列表内容和数量使用当前项目实际演示状态。

## Follow-up polish

- [P3] 如果后续补充正式品牌Banner素材，可在不改变当前信息架构的前提下加入，但不影响本次验收。

final result: passed

---

# 知识资产、图谱目录与文献 AI 助手 Design QA

- source visual truth paths:
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-3cb83b97-bdfd-43ff-b2ff-32211d54b40d.png`
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-cbe4f117-7ec1-423c-8751-a4a9d5b1b979.png`
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-f9409b3e-79da-4abf-9cf5-bfa7eab3806c.png`
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-78a8ab1c-d6b9-4cb6-9fd4-da63991b8e36.png`
- implementation comparison artifact: `/Users/summer/Documents/ChatGPT/AI4S新修改/ai4s-research-workspaces-main/public/knowledge-three-task-qa.html`
- implementation URLs:
  - `http://localhost:3000/knowledge?tab=知识库`
  - `http://localhost:3000/knowledge?tab=知识图谱`
  - `http://localhost:3000/knowledge?id=k-paper&searched=1&q=储层&mode=智能检索`
- reference images are normalized with `object-fit: contain`; live implementation iframes are rendered at 1536×1024 CSS pixels and scaled to 0.48 in the combined comparison artifact.
- primary verification viewport: 1536×1024; final 3000 smoke viewport: 1280px wide.
- browser evidence: Codex in-app Browser; combined source/implementation comparison plus focused full-size implementation captures.
- primary interactions tested: asset tab switch, library open/back, library detail tabs, graph filters, list/card switch, page-size pagination, catalog search, graph open/back, graph entity search, AI suggestion question, AI composer, AI capability modal selection.
- console: new error/warn = 0.

## Full-view comparison evidence

- 知识库从单卡空页升级为双页签下的完整总览与详情；首屏信息密度、卡片间距和层级均与当前AI4S平台一致。
- 图谱目录复用参考图的搜索/筛选/高密度列表/分页构图，用AI4S蓝替代参考图的红色操作，实测主按钮为 `rgb(18, 104, 232)`。
- 文献右侧从“问题卡 + 能力网格”收敛为与科研超级中枢同源的单一对话面板，建议问题、消息、输入器和能力选择关系明确。

## Required fidelity surfaces

- Fonts and typography: 沿用项目系统字体与蓝白科研字阶；核心列表文本已提升至可读的10–13px，不用8px正文换取密度。
- Spacing and layout rhythm: 页签、工具栏、表格与详情均使用8/12/16/24px间距系统；1536px无页级溢出。
- Colors and visual tokens: 主操作 `#1268e8`，浅蓝状态层与冷灰边框对齐现有平台；未引入参考图红色。
- Image quality and asset fidelity: 图谱头图仅用于油气图谱，其他图谱使用中性浅蓝背景，避免主题错配；图标均使用项目已有Lucide矢量系统。
- Copy and content: 6个图谱、4个知识库、资源关联和图谱节点使用演示数据，但每个详情的学科、节点、定义与所选对象一致。

## Comparison history

### Iteration 1 — blocked

- [P1] 知识库仅有单卡且大面积空白；没有知识库/知识图谱页签。
- [P1] 文献AI助手与平台通用对话心智不一致；能力网格长期占据右侧空间。
- [P2] 图谱详情包含用户不需要的设置/导出/全屏按钮。
- Fixes: 新增知识资产双页签、完整知识库列表/详情、对话式AI助手/能力模态框，并删除三个图谱操作。

### Iteration 2 — blocked

- [P1] 新图谱目录的分页只有外观；多个图谱详情仍共用油气节点；实体搜索总选中中心节点。
- [P2] 列表缺少表格语义，知识库资源归属和层级导航历史不正确，部分文字过小。
- Fixes: 实现真实分页/页容量、领域化节点、匹配实体选中、ARIA table语义、库内资源映射、push层级导航和字号提升。

### Iteration 3 — passed

- 同屏对照与聚焦浏览器复验后，无残留P0/P1/P2。
- 可接受差异：保留当前全局导航与顶栏；图谱目录组件在1280px宽度使用内部横向表格滚动以保留全部列，页面本身不溢出。

final result: passed

---

# 空间管理三页参考图 Design QA

- source visual truth paths:
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-ee82da09-2bd2-45d2-9da1-07aa70fedb88.png`（全部空间）
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-d0d28832-0126-4299-8cfb-f8b43c2f41b2.png`（新建空间）
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-2385d4a8-1857-435b-bfb0-8ac2d9981d10.png`（空间成员）
- implementation URLs: `manage/spaces`、`manage/new`、`manage/members`
- browser evidence: 3000生产构建，1280×900与1920×1080桌面视口

## Fidelity and interaction evidence

- 页面关系按参考图落为“全部空间 → 新建空间 → 进入具体空间管理成员”，不再将三种职责塞在同一旧页签卡片内。
- 全部空间页的标题、筛选栏、主按钮、表头顺序、空间类型图标、负责人、状态胶囊和底部分页同构。
- 新建空间页的基本信息双列布局、成员初始化表、协作共享开关和底部操作区同构。
- 成员页的筛选项、角色/课题/数据范围列、在线状态和最近登录同构；保留项目全局导航作为已确认例外。
- 首轮在1440视口发现筛选按钮换行、表格横向滚动和多余底部页签，已全部修正；最终无残留P0/P1/P2问题。
- 目录“新建空间”已实测跳转到独立表单；生产页面控制台error/warn为0，页面宽度不超过1280/1920视口。

final result: passed

---

# 知识中心三页参考图 Design QA

- source visual truth paths:
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-a98190c3-27eb-45d6-a1f6-e881115a8e83.png` （知识发现首页）
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-579bb20e-fbc6-4f7f-ad15-03edf4657aa9.png` （文献详情）
  - `/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-181b7587-f084-4c06-81a6-97aba7c1188d.png` （知识图谱详情）
- implementation URLs:
  - `http://localhost:3000/knowledge`
  - `http://localhost:3000/knowledge?id=k-paper&searched=1&q=%E5%82%A8%E5%B1%82&mode=%E6%99%BA%E8%83%BD%E6%A3%80%E7%B4%A2`
  - `http://localhost:3000/knowledge?tab=%E7%9F%A5%E8%AF%86%E5%9B%BE%E8%B0%B1`
- implementation viewport: 1536 × 1024 CSS pixels
- browser evidence: Codex in-app Browser，3000 实际运行目录
- navigation exception: 用户明确要求不参考图中左侧导航，实现保留当前平台导航与顶栏。

## Fidelity and interaction evidence

- 首页：科研主题背景、居中标题/副标题、蓝色智能检索切换、主搜索、推荐问题、7个分类卡片和三栏内容区均与参考图同构。
- 用户指定7个分类卡片仅作静态展示；箭头、按钮/链接语义和跳转逻辑已移除，实测为7卡片、0按钮、0链接、0箭头。
- 文献详情：顶部元数据与操作、摘要页签、底部操作栏、AI研究助手和AI能力双区右侧栏完整；页签可切换且具备 tablist/tabpanel 语义。
- 图谱详情：油田场景顶部、搜索/工具栏、实体/关系筛选、中心图谱和右侧概念详情与参考图同构；关系筛选、节点选择和同步缩放均已实测。
- 三页在1536px宽度的 `scrollWidth` 都不超过视口；首页统计为7个分类入口、3个主内容面板、4个推荐问题按钮。

## Comparison history

### Iteration 1 — blocked

- [P1] 图谱关系筛选未影响可见节点，筛选后可保留过期详情。
- [P1] 缩放仅作用于节点，SVG连线与节点端点错位。
- [P2] 文献页签缺少完整ARIA语义；无对应资源的图谱节点收藏按钮仍可点击。
- Fixes: 新增关系分组过滤、可见选中实体回退、SVG/节点共享缩放变量、禁用无资源收藏及完整页签语义。

### Iteration 2 — passed

- 与三张原图按同桌面视口复核，无残留 P0/P1/P2 问题。
- 可接受差异：保留当前导航/顶栏；数字、文献名和机构使用项目现有可追溯演示数据；参考图的未接入外部文献能力以明确的原型反馈替代。

final result: passed
