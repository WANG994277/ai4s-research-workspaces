# 统一科研工作台 UI 概念稿 V2

- 日期：2026-09-20
- 交付：任务发起首页、多智能体执行工作区、计算与实验结果对照页。
- 生成方式：内置 image_gen；仅生成视觉讨论稿，未修改应用代码。
- 风格依据：现有 design-system/MASTER.md、白色侧栏/顶栏、酒红品牌色、浅灰底与细边框；延续 V1 首页稿。
- 导航变化：读、算、做的主入口合并为“科研工作台”，专业能力成为任务内视图。
- 三张图演示同一个任务 R-001 的不同阶段，课题为 CO₂ 加氢制甲醇催化剂研究。
- 执行中：候选 A/B 预测完成，C 计算中；实验规划等待依赖；真实实验尚未实施。
- 结果页：3/3 预测完成，人工实验后导入 EXP-007，当前等待结论确认。
- 结果数字为设计示例：A 82/78/−4，B 86/85/−1，C 84/80/−4；指标为转化率%，偏差单位为百分点，实测减预测。
- 所有任务、状态、数据与工具可用性均为概念示例，不代表真实执行。

## 01-home

文件：01-unified-home.png

完整生成提示词：

```text
Use case: ui-mockup. Deliver one polished high-fidelity flat desktop screenshot for the Chinese AI4S 科研平台 / PETROLAB, the next unified scientific-workbench concept of an existing enterprise product. ONE full application screen per image, landscape 16:10 or near 16:9, logical 1600x1000 desktop, high resolution crisp legible Chinese. No monitor, device, perspective, browser toolbar, presentation border, watermark, exploded view or extra screen panels.

Existing visual language is mandatory: a white 232px sidebar and white 56px topbar; pale cool gray #F5F6F8 page canvas; white surfaces; thin #D9DDE3 dividers; burgundy/crimson #B4232D primary actions, #8D1B24 deep red and #FBECEE pale-rose selected backgrounds. Body #1F2329, supporting #4E5969, muted #86909C. Microsoft YaHei/PingFang SC-like clean Chinese sans-serif with clear typesetting; logical body14px, caption12px, section16px semibold, page20px semibold, homepage hero28px only. 8px control corners, 12px card corners, restrained shadows only. Slim consistent Lucide-like line icons. Status colors blue for running, green complete, amber attention, gray waiting. No decorative gradients, 3D molecules/robots, glass effects, huge statistics or giant colorful backgrounds.

All three companion designs use the same shell: top left small crimson square with white A, text “AI4S 科研平台” with tiny “PETROLAB” below. Sidebar main entries “个人工作台”, active expanded “科研工作台”; its children “新建科研任务”, “全部任务”, “课题资料”, “能力与连接”. Other groups below “科研协作”, “科研驾驶舱”, “科研资产”. Below a fine divider and small “最近任务” heading, three short items “催化剂优化研究”, “标准条款对照”, “实验谱图分析”. Sidebar bottom “演示角色” with “科研人员⌄” dropdown and collapse icon. DO NOT include separate 读空间/算空间/做空间 sidebar entries: their capabilities are unified inside a task. Topbar “AI4S › 科研工作台”, a current-project selector “CO₂ 加氢制甲醇催化剂研究⌄”, right compact search “搜索任务、资料、成果”, bell, pale-rose avatar “张”. Uniform precise alignment and comfortable spacing. All research/metric/tool details here are illustrative UI state only; small “概念设计 · 示例数据” label in page header, do not place explanatory design annotations outside app. Every requested Chinese label should be accurate and legible.
SCREEN 1 OF 3: unified scientific task-start homepage. Sidebar child 新建科研任务 active pale rose with crimson left rule. Left/right main margin32px.
At main top small page heading “科研工作台”, right small text “查看全部任务 ›”. Center-left hero heading “今天想推进什么科研工作？” with secondary line “从文献证据到计算验证，围绕一个目标持续研究”.
Below large wide white task composer, approx content width1100 and190px tall, thin restrained crimson focus border. Placeholder “描述研究目标，或添加资料、数据与实验记录…” at top. Two small removable chips inside lower area “文献资料 · 12 篇 ×”, “历史实验.csv ×”. Bottom toolbar: plus “添加资料”, puzzle “技能⌄”, connection “工具与连接⌄”; far right subtle dropdown “自动规划⌄” and primary red button “开始科研任务 →”. A compact note below “已关联当前课题 · 可随时补充目标与约束”. Do not ask user to choose among agents or read/compute/do to begin.

Next section at y470 “从一个研究场景开始”, three equal shallow cards in one row:
1 simple literature icon, “从文献形成研究方案”, supporting “梳理证据，提出可验证的问题”, subtle mini tags “检索 · 研读 · 方案”;
2 simple computation icon, “从数据筛选候选方案”, supporting “准备数据，比较候选与计算结果”, mini tags “数据 · 计算 · 筛选”;
3 simple experiment icon, “从实验结果推进下一轮”, supporting “对照预测，定位差异并优化方案”, mini tags “实验 · 分析 · 迭代”.
Keep these as task templates, not a marketplace grid.

Below at y640 broad white panel “继续研究” with right “全部任务 ›”, three roomy divided rows, columns task title / current activity / state / next action:
“CO₂ 加氢催化剂优化研究” small “R-001 · 当前课题” / “文献已整理，候选预测进行中” / blue “计算中” / “查看进展 ›”;
“标准条款对照” small “R-002 · 昨天更新” / “差异清单已生成” / amber “待确认” / “继续核对 ›”;
“实验谱图分析” small “R-003 · 昨天完成” / “分析结果与报告已保存” / green “已完成” / “查看成果 ›”.
At bottom of main content a small understated project context strip: folder icon “当前课题资料” with text “12 篇文献   3 份数据   2 份实验记录”, and right “管理资料 ›”. All comfortably within canvas. Polished enterprise feel with clear task-centric hierarchy and ample room around the main composer.
```

## 02-running

文件：02-task-running.png

完整生成提示词：

```text
Use case: ui-mockup. Deliver one polished high-fidelity flat desktop screenshot for the Chinese AI4S 科研平台 / PETROLAB, the next unified scientific-workbench concept of an existing enterprise product. ONE full application screen per image, landscape 16:10 or near 16:9, logical 1600x1000 desktop, high resolution crisp legible Chinese. No monitor, device, perspective, browser toolbar, presentation border, watermark, exploded view or extra screen panels.

Existing visual language is mandatory: a white 232px sidebar and white 56px topbar; pale cool gray #F5F6F8 page canvas; white surfaces; thin #D9DDE3 dividers; burgundy/crimson #B4232D primary actions, #8D1B24 deep red and #FBECEE pale-rose selected backgrounds. Body #1F2329, supporting #4E5969, muted #86909C. Microsoft YaHei/PingFang SC-like clean Chinese sans-serif with clear typesetting; logical body14px, caption12px, section16px semibold, page20px semibold, homepage hero28px only. 8px control corners, 12px card corners, restrained shadows only. Slim consistent Lucide-like line icons. Status colors blue for running, green complete, amber attention, gray waiting. No decorative gradients, 3D molecules/robots, glass effects, huge statistics or giant colorful backgrounds.

All three companion designs use the same shell: top left small crimson square with white A, text “AI4S 科研平台” with tiny “PETROLAB” below. Sidebar main entries “个人工作台”, active expanded “科研工作台”; its children “新建科研任务”, “全部任务”, “课题资料”, “能力与连接”. Other groups below “科研协作”, “科研驾驶舱”, “科研资产”. Below a fine divider and small “最近任务” heading, three short items “催化剂优化研究”, “标准条款对照”, “实验谱图分析”. Sidebar bottom “演示角色” with “科研人员⌄” dropdown and collapse icon. DO NOT include separate 读空间/算空间/做空间 sidebar entries: their capabilities are unified inside a task. Topbar “AI4S › 科研工作台”, a current-project selector “CO₂ 加氢制甲醇催化剂研究⌄”, right compact search “搜索任务、资料、成果”, bell, pale-rose avatar “张”. Uniform precise alignment and comfortable spacing. All research/metric/tool details here are illustrative UI state only; small “概念设计 · 示例数据” label in page header, do not place explanatory design annotations outside app. Every requested Chinese label should be accurate and legible.
SCREEN 2 OF 3: same research task R-001 actively coordinating agents and executing a prediction. Sidebar recent task “催化剂优化研究” highlighted pale rose. Main page top title “CO₂ 加氢催化剂优化研究”, blue status “执行中”, small “R-001”; right neutral outlined “暂停任务” and “全部产物”. Supporting goal line “比较候选性能，形成可验证的实验方案”.

Below thin white task-specific plan strip with small numbered/check circles: “证据整理 ✓” → “数据校验 ✓” → active “计算筛选” → muted “实验方案” → muted “实验验证”; right “调整计划”. This is the plan for THIS task, not global navigation.

Main body below plan is TWO side-by-side panes (in addition to global sidebar). Left pane about390px is conversational task progress. Right pane uses remaining~850px for professional content. White surfaces separated by thin borders, not floating overlays. Align top and bottom.

LEFT PANE: header “任务协作” and secondary text link “执行记录”. Show a pale-gray short user bubble “结合课题文献和历史实验数据，比较三种催化剂方案，并准备下一轮验证实验。” Then AI4S assistant icon and clear short response “已完成资料与数据校验，正在评估 3 个候选。计算结果确认后，将继续准备实验方案。” Below an expandable section heading “协作进展” with four compact activity rows/cards, each has small line icon and status pill:
“文献研究智能体” green “已完成”; subline “12 篇文献 → 证据表 v1”;
“数据分析智能体” green “已完成”; subline “历史实验数据 → 候选数据 v2”;
“计算分析智能体” blue “运行中”; subline “代理模型预测 · 2/3 已完成”;
“实验规划智能体” gray “等待依赖”; subline “等待预测完成后准备方案”.
Below a compact bordered capability summary “本步骤使用” with understated chips “参数检查 Skill”, “Python”, “代理模型 v1.3”. User shouldn't have to configure these before starting.
Bottom anchored input composer “补充约束，或调整当前计划…” with plus and crimson arrow-send. Keep lines readable, no repeated paragraphs, no chain-of-thought transcript.

RIGHT PANE: title “候选预测对比” and small “数据 v2 · 模型 v1.3”. A tab row “候选对比” active crimson underline; “输入数据”, “代码”, “日志”, “实验方案” inactive. Below restrained progress banner with blue small dot, text “代理模型预测中”, small “2/3 已完成” and thin progress indicator at67%; right “查看运行”.
Main table: headers “候选”, “预测转化率（%）”, “状态”.
A row: “候选 A” / “82” / green “预测完成”;
B row: “候选 B” / “86” / green “预测完成”;
C row: “候选 C” / em dash “—” / blue “计算中”.
Under table muted line “示例数据 · 当前结果尚未齐全，待全部完成后比较”.
Below a compact execution details section “运行记录” with monospaced readable short lines:
“10:22  输入数据与参数校验通过”
“10:23  候选 A、B 预测完成”
“10:24  正在计算候选 C”
Metadata row “RUN-024   Python · 受控运行环境”.
Bottom an “已形成产物” row with two outlined file tiles “证据表 v1” / “候选数据 v2”, each small preview icon. Final subtle callout “下一步：确认候选结果，生成实验方案” and gray small label “真实实验需人工确认后实施”. Do NOT show experiment completed, automatic hardware execution, or final winner while C is unfinished. Clear visual balance: task discussion at left, real inspectable data at right.
```

## 03-results

文件：03-results-comparison.png

完整生成提示词：

```text
Use case: ui-mockup. Deliver one polished high-fidelity flat desktop screenshot for the Chinese AI4S 科研平台 / PETROLAB, the next unified scientific-workbench concept of an existing enterprise product. ONE full application screen per image, landscape 16:10 or near 16:9, logical 1600x1000 desktop, high resolution crisp legible Chinese. No monitor, device, perspective, browser toolbar, presentation border, watermark, exploded view or extra screen panels.

Existing visual language is mandatory: a white 232px sidebar and white 56px topbar; pale cool gray #F5F6F8 page canvas; white surfaces; thin #D9DDE3 dividers; burgundy/crimson #B4232D primary actions, #8D1B24 deep red and #FBECEE pale-rose selected backgrounds. Body #1F2329, supporting #4E5969, muted #86909C. Microsoft YaHei/PingFang SC-like clean Chinese sans-serif with clear typesetting; logical body14px, caption12px, section16px semibold, page20px semibold, homepage hero28px only. 8px control corners, 12px card corners, restrained shadows only. Slim consistent Lucide-like line icons. Status colors blue for running, green complete, amber attention, gray waiting. No decorative gradients, 3D molecules/robots, glass effects, huge statistics or giant colorful backgrounds.

All three companion designs use the same shell: top left small crimson square with white A, text “AI4S 科研平台” with tiny “PETROLAB” below. Sidebar main entries “个人工作台”, active expanded “科研工作台”; its children “新建科研任务”, “全部任务”, “课题资料”, “能力与连接”. Other groups below “科研协作”, “科研驾驶舱”, “科研资产”. Below a fine divider and small “最近任务” heading, three short items “催化剂优化研究”, “标准条款对照”, “实验谱图分析”. Sidebar bottom “演示角色” with “科研人员⌄” dropdown and collapse icon. DO NOT include separate 读空间/算空间/做空间 sidebar entries: their capabilities are unified inside a task. Topbar “AI4S › 科研工作台”, a current-project selector “CO₂ 加氢制甲醇催化剂研究⌄”, right compact search “搜索任务、资料、成果”, bell, pale-rose avatar “张”. Uniform precise alignment and comfortable spacing. All research/metric/tool details here are illustrative UI state only; small “概念设计 · 示例数据” label in page header, do not place explanatory design annotations outside app. Every requested Chinese label should be accurate and legible.
SCREEN 3 OF 3: later state of THE SAME task R-001 after predictions completed, an experiment plan was confirmed, people carried out experiments, and batch EXP-007 was imported. Sidebar same active recent “催化剂优化研究”. Page title “CO₂ 加氢催化剂优化研究”, amber status “待确认结论”, small “R-001”; right neutral outlined “导出结果”. Under title short status line “3/3 预测完成 · 实验数据已导入 · 批次 EXP-007”.
Below slim task-specific plan strip: “证据整理 ✓” → “数据校验 ✓” → “计算筛选 ✓” → “实验验证 ✓” → active “结果分析”. Tiny right “查看完整计划”.

Main body two panes plus sidebar, same proportions as screen2. LEFT conversation pane about390px, RIGHT professional results wider. No popups.
LEFT header “任务协作”. User bubble “实验结果已上传，请对照预测，看看下一轮优先验证哪个候选。” Assistant reply “已对齐反应条件，并完成预测与实测对照。” Below small evidence-backed analysis card heading “本批次观察”, three concise numbered observations:
“B 的实测转化率最高：85%”
“B 的预测偏差最小：−1 个百分点”
“建议优先开展 B 的重复性验证”
Small muted note “单批次结果尚不足以确认稳定优势”.
Below cite-like chips “候选数据 v2”, “预测运行 RUN-024”, “实验批次 EXP-007”.
Then task decision card heading “下一步建议”, short “补充重复实验，检查候选表现是否稳定。” with two restrained actions primary “生成下一轮方案” and secondary “调整分析”.
Bottom anchored composer “继续追问，或补充实验条件…” with plus and crimson send. This task hasn't already claimed a globally optimal catalyst.

RIGHT content title “预测与实验结果对照”. Tabs “结果对照” active crimson underline; “实验记录”, “数据”, “报告”. Small light-gray subtitle “CO₂ 转化率 · 反应条件已对齐 · 示例数据”. 
A clean grouped vertical bar chart as primary scientific visualization. Y axis “转化率（%）”, ticks 0 25 50 75 100. X axis exactly “候选 A”, “候选 B”, “候选 C”. Blue bars legend “预测”, burgundy bars legend “实测”. Precisely show A prediction82 measured78; B prediction86 measured85; C prediction84 measured80. Numeric labels atop all bars. No extra series, no decorations, no false scientific icons. Bar heights must reflect exact numbers, use identical0–100scale.
Below chart compact comparison table, headers “候选”, “预测（%）”, “实测（%）”, “偏差（百分点）”. Rows exactly “A | 82 | 78 | −4”, “B | 86 | 85 | −1”, “C | 84 | 80 | −4”. Highlight B softly in pale rose. Tiny footnote “偏差 = 实测 − 预测”.
Below at bottom of right pane narrow provenance strip headed “来源与版本” with four small connected file labels “证据表 v1 → 数据 v2 → RUN-024 → EXP-007”; dates not needed. Below compact artifact row three file tiles “候选对照.csv”, “结果分析.ipynb”, “阶段报告草稿”. This is the product results state, not a presentation dashboard. Keep chart, table, lineage readable and all within screen.
```

