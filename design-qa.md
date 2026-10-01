# AI4S 科研工作台首页 Design QA

## 对比对象

- 源视觉 1（AI 为你推荐）：`/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-399953d4-6444-4b13-9ea7-9827eddbf920.png`，1538×852 px。
- 源视觉 2（科研活动）：`/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-a6184040-fc4f-4f0a-89ad-699fe62bea94.png`，1570×880 px。
- 源视觉 3（任务与产出）：`/var/folders/ny/0gm5yz7x0657nj80bs2wzrp00000gp/T/codex-clipboard-2190b2a2-317f-448b-9d48-4e25ec0a9f69.png`，2868×554 px。
- 浏览器实现证据：`output/workbench-home/implementation-final-1920x1080-top-v2.png`、`output/workbench-home/implementation-final-1920x1080-lower-v3.png`。
- 合并对比：`output/workbench-home/qa-compare-recommendations.png`、`output/workbench-home/qa-compare-activities.png`、`output/workbench-home/qa-compare-lower-panels.png`。
- 实现视口：1920×1080 CSS px，`deviceScaleFactor = 1`；补充验证 1280×900、1440×900。合并对比使用同宽等比缩放，不对密度差异做虚假精确判断。
- 状态：浅色主题，首页默认 Tab；另验证“科研资讯 (5)”选中态。

## 全视图对比

- 1920 实现保持参考图的蓝白科研 Hero、六个任务示例、大输入框、`8 / 15 / 12 / 26` 概览卡、等宽双栏运营面板与等宽任务/产出面板。
- 图 1 的 5 条原始推荐、分类数量、时间和按钮文案完整保留；唯一扩展是“科研资讯 (5)”Tab 及 5 条明确的演示资讯。
- 图 2 的 4 个 Tab、5 条活动、时间、说明和状态均与参考一致。
- 图 3 的 3 条任务、进度、相关课题、26 项产出、`10 / 6 / 6 / 4`、`38 / 23 / 23 / 15 / 4%` 以及 `2 / 3 / 5 / 3 / 3 / 5 / 8` 趋势全部保留。

## 局部对比与必检视觉面

- 字体与层级：使用项目现有 PingFang SC / Microsoft YaHei；区块标题、数据数字、正文、时间和辅助信息的层级与参考一致。
- 间距与布局：1920 下两组面板均为等宽双栏；参考局部组合图显示标题栏、Tab、五行列表、五列任务表与产出双区结构一致。
- 颜色与状态：工作台主体沿用蓝白；按参考图使用红色面板图标/激活 Tab，绿/黄/蓝状态同时保留中文文字；环图颜色顺序已与图 3 对齐。
- 图像与图标：使用现有科研 Hero、AI4S 品牌 Logo、Lucide 图标和 Recharts 图表；无 emoji、伪占位图或手工 SVG。
- 文案与内容：已进行逐字结构回归检查；推荐和活动说明允许换行，不再用单行省略号隐藏原文。

## 交互与可访问性

- 已验证任务示例写入 Composer、AI 推荐五类 Tab、科研活动四类 Tab、两个“查看全部”的明确演示反馈、科研资讯 5 条数据。
- Tab 使用 `role=tab`、`aria-selected`；图表有文本说明；按钮有可见焦点；状态不仅靠颜色。
- 1280、1440、1920 均无页面级水平溢出。1280/1440 下底部两面板改为单列以防止图表裁切；任务表保留安全的容器内滚动。
- 浏览器控制台检查：0 个 error，0 个 warning。

## 比较历史

- Pass 1：首版用当前空间动态数据替代了参考模拟数据，不符合用户的保留要求。
- Pass 2：改为固定演示数据，恢复图 1 / 2 / 3 的全部指定文案与数字，新增科研资讯 Tab。独立代码审查发现 1280/1440 底部裁切、查看全部错误跳转、单行省略与设计系统冲突。
- Pass 3：底部面板在较窄桌面视口改为单列，清理错误跳转，展开必须保留的原文，更新设计系统、环图颜色和精确数据回归。重新截图对比后无可操作 P0/P1/P2。

## 剩余 P3

- 浏览器验收截图为 JPEG 编码，与用户 PNG 源图并排放大时会显得更软；实际 1× CSS 视口中文字和边框清晰。

final result: passed
