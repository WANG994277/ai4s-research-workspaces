# 读空间 / 算空间首页 UI 设计稿 · V1

- 日期：2026-09-20
- 生成方式：内置 image_gen（ui-mockup）。
- 类型：视觉讨论稿；本轮未修改应用代码。
- 风格依据：design-system/MASTER.md、src/app/globals.css、docs/cockpit/screenshots/projects.png。
- 交互依据：本任务用户提供的 Eureka 参考图及读/算空间重构讨论。
- 共同框架：白色侧栏、顶部课题选择、酒红主色、浅灰背景、细边框、任务输入、常用能力、继续任务。
- 读空间强调资料、证据与研究产物；算空间强调输入数据版本、方案确认与任务状态。
- 图中任务、数量和工具状态为设计示例。
- 交付：read-space-home-v1.png；compute-space-home-v1.png。

## 读空间完整生成提示词

```text
Use case: ui-mockup. Create a high-fidelity, implementation-ready desktop web application screen for the existing Chinese AI4S 科研平台 / PETROLAB. Output exactly ONE flat front-facing full application screenshot, landscape 16:10, ideally 2880x1800 (logical desktop 1440x900). No browser chrome, no monitor mockup, no perspective, no surrounding presentation frame, no extra panels outside screen. Chinese text must be crisply typeset, accurate and legible, not placeholder squiggles. Design is a sober, well-crafted enterprise scientific research application, with controlled whitespace and useful information density.

MANDATORY existing design language: white 232px left navigation, white 56px top bar, page background #F5F6F8, white work surfaces, fine #D9DDE3 separators. Brand/action color deep crimson #B4232D; deep #8D1B24; active pale rose #FBECEE. Main text #1F2329, secondary #4E5969, muted #86909C. Small semantic green #168B68 / blue #2878D0 / amber only for statuses or small icons. Microsoft YaHei / PingFang SC-like Chinese sans-serif, body logical 14px, auxiliary 12px, section titles 16px semibold, page title 20px semibold. 8px controls and 12px surface corners. Thin Lucide-style line icons. No large colored backgrounds, no decorative gradients, no floating 3D objects, no robot hero, no glass effects, no blue branded sidebar, no charts merely for decoration.

Shared app chrome: sidebar top small burgundy rounded square with white “A”, alongside “AI4S 科研平台”, tiny “PETROLAB” underneath. Main groups in sidebar with thin gray icons: “个人工作台”, “科研协作”, “读空间”, “算空间”, “做空间”, “科研驾驶舱”, “科研资产”. Footer sidebar divider then “演示角色”, dropdown “科研人员”, and a collapse icon. Topbar starts breadcrumb “AI4S › 读空间”; then a thin divider and compact current project selector “当前课题” and “CO₂ 加氢制甲醇催化剂研究⌄”. Right side compact search “搜索文献、数据、任务”, a notification bell and round muted rose avatar “张”. Keep every element inside canvas and aligned precisely. Retain the main app chrome for the paired screenshots. All data are illustrative UI examples, not factual research claims. Small label “原型演示” in page header. Do not put design notes on the image. Render selected space/content described next.
SCREEN: 读空间 task-start homepage. Sidebar “读空间” expanded with indented links “开始研究” (active pale rose with thin crimson left bar), “文献工作区”, “科研知识图谱”, “国内外标准对标”, “全网专利分析”, “科研报告撰写”. 算空间 and remaining groups collapsed.

Content within remaining 1208px canvas, padding 32px. At y=85 page header “读空间”, beside tiny gray “原型演示”; right text action “全部任务 ›”.
Main central content max-width 1000px. At y=145 heading “今天想研究什么？” in confident 28px semibold charcoal, subtitle “检索文献、研读证据，形成有依据的研究结论” in gray 14px. The header and input align left, balanced generous whitespace.
At y=220 a large white input surface ~1000x180 logical pixels, 12px corners, thin pale crimson border and almost invisible shadow. Placeholder upper left “描述研究问题，或添加文献开始分析…” in gray 15px. Lower part two small outlined removable attachment chips with file icons “催化剂研究.pdf ×” and “文献综述.pdf ×”. Bottom toolbar: plus with “添加资料”, puzzle icon “选择技能⌄”, database icon “数据来源⌄”; far right small selector “自动规划⌄” and solid crimson action “开始研究” with arrow. Below composer a very subtle small line “已关联当前课题 · 2 篇参考文献”.
Below at y=450 label “从常用能力开始”; right subtle “全部能力 ›”. Three adjacent compact white cards in ONE row, NOT six bulky dashboard cards. Each card has subtle line icon, group heading and two lightweight pill actions:
card 1 “发现资料” with “文献检索”, “专利分析”;
card 2 “研读与提取” with “文献精读”, “图表提取”;
card 3 “对比与表达” with “标准对标”, “报告撰写”.
Below at y=600 two aligned white modules: recent tasks at left about 680px wide; right a compact project-materials module about 300px.
Recent module header “继续研究”, right “查看全部 ›”. Three 54px rows separated by fine lines. Each row has gray line document icon, clear primary title, muted small time/context, a small status pill at right, then chevron:
“CO₂ 加氢催化剂文献对比” / “今天 10:24 · 12 篇文献” / amber “待确认”;
“催化剂性能数据提取” / “昨天 16:40 · 3 张数据表” / green “已完成”;
“阶段研究报告” / “昨天 14:20 · 版本 v2” / neutral “草稿”.
Project-materials header “课题资料”, small muted “示例数据”. Three icon-and-label rows: “文献与专利” value “12”, “结构化数据” value “3”, “报告与笔记” value “5”. Bottom small text link “查看资料与成果 ›”. Keep lower content inside y=870. Clean reading hierarchy; empty space is purposeful not empty screen. Main focus remains question input. No opaque popovers or dialogs in this first screen.
```

## 算空间完整生成提示词

```text
Use case: ui-mockup. Create a high-fidelity, implementation-ready desktop web application screen for the existing Chinese AI4S 科研平台 / PETROLAB. Output exactly ONE flat front-facing full application screenshot, landscape 16:10, ideally 2880x1800 (logical desktop 1440x900). No browser chrome, no monitor mockup, no perspective, no surrounding presentation frame, no extra panels outside screen. Chinese text must be crisply typeset, accurate and legible, not placeholder squiggles. Design is a sober, well-crafted enterprise scientific research application, with controlled whitespace and useful information density.

MANDATORY existing design language: white 232px left navigation, white 56px top bar, page background #F5F6F8, white work surfaces, fine #D9DDE3 separators. Brand/action color deep crimson #B4232D; deep #8D1B24; active pale rose #FBECEE. Main text #1F2329, secondary #4E5969, muted #86909C. Small semantic green #168B68 / blue #2878D0 / amber only for statuses or small icons. Microsoft YaHei / PingFang SC-like Chinese sans-serif, body logical 14px, auxiliary 12px, section titles 16px semibold, page title 20px semibold. 8px controls and 12px surface corners. Thin Lucide-style line icons. No large colored backgrounds, no decorative gradients, no floating 3D objects, no robot hero, no glass effects, no blue branded sidebar, no charts merely for decoration.

Shared app chrome: sidebar top small burgundy rounded square with white “A”, alongside “AI4S 科研平台”, tiny “PETROLAB” underneath. Main groups in sidebar with thin gray icons: “个人工作台”, “科研协作”, “读空间”, “算空间”, “做空间”, “科研驾驶舱”, “科研资产”. Footer sidebar divider then “演示角色”, dropdown “科研人员”, and a collapse icon. Topbar starts breadcrumb “AI4S › 算空间”; then a thin divider and compact current project selector “当前课题” and “CO₂ 加氢制甲醇催化剂研究⌄”. Right side compact search “搜索文献、数据、任务”, a notification bell and round muted rose avatar “张”. Keep every element inside canvas and aligned precisely. Retain the main app chrome for the paired screenshots. All data are illustrative UI examples, not factual research claims. Small label “原型演示” in page header. Do not put design notes on the image. Render selected space/content described next.
SCREEN: 算空间 task-start homepage. Sidebar “读空间” collapsed; “算空间” expanded with indented links “开始计算” (active pale rose with thin crimson left bar), “智能设计与筛选”, “计算任务”, “科研数据与模型”, “工具与科学软件”. Remaining main groups collapsed.

Content within remaining 1208px canvas, padding 32px. At y=85 page header “算空间”, beside tiny gray “原型演示”; right outlined action “手动创建任务”.
Main central content max-width 1000px. At y=145 heading “把科研问题，变成可执行的计算” in confident 28px semibold charcoal. Subtitle “描述目标、关联数据，确认方案后开始计算” in gray 14px. Header/input align left.
At y=220 large white input surface ~1000x180 logical pixels, 12px corners, thin pale crimson border and almost invisible shadow. Placeholder upper left “例如：比较三种催化剂的吸附能，生成计算方案…” in gray 15px. Lower part outlined removable chips with relevant icons “候选结构 · 3 个 ×”, “输入数据 · v2 ×”. Bottom toolbar: plus “添加数据”, puzzle “选择技能⌄”, connected nodes “工具与资源⌄”; far right small selector “自动规划⌄” and solid crimson action “生成计算方案” with arrow. Below composer very subtle small line “先检查输入与参数，再提交计算任务”.
Below at y=450 label “从常用能力开始”; right “全部能力 ›”. Three adjacent compact white cards in ONE row, not six big dashboard cards. Each with small line icon, group heading and two lightweight pill actions:
card 1 “设计与求解” with “候选设计”, “仿真计算”;
card 2 “数据与模型” with “数据处理”, “模型评价”;
card 3 “分析与复用” with “结果分析”, “工具软件”.
Below at y=600 two aligned modules: compute task panel about680px at left; resource panel300px at right.
Task header “我的计算任务”, right “查看全部 ›”. Compact clean table with headers “任务”, “方法 / 工具”, “状态”, “操作”. Three55px rows:
row1 “催化剂表面吸附能计算”, small “TASK-1024 · 输入 v2”; tool “DFT / VASP”; cyan-blue status “运行中” and very thin progress bar with “68%”; action “查看”;
row2 “候选材料多目标筛选”, small “TASK-1025 · 3 个候选”; method “代理模型”; amber “待确认”; crimson text action “确认参数”;
row3 “分子动力学稳定性分析”, small “TASK-1023 · 输入 v1”; tool “MD / LAMMPS”; green “已完成”; action “查看结果”.
Resource panel header “工具与资源”, small muted “演示环境”. Three neat rows each with status dot and tool name: “VASP” / green “可用”; “LAMMPS” / green “可用”; “AI 中台” / gray “待接入”. Fine divider, small two-line note “提交时确认工具版本与运行资源”. Footer link “管理工具与连接 ›”. Keep below y870 and avoid scientific visualizations on homepage.
This is the companion of the reading homepage: identical proportions, same crimson actions and neutral chrome. Convey scientific computing through data chips, execution states, and tool registry; not via blue branding, 3D molecules or decorative charts. All task/resource data shown are illustrative under visible 原型演示/演示环境 labels.
```

