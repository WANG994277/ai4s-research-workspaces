"use client";

import { useMemo, useState } from "react";
import { ArrowUp, Bot, Box, ChartNoAxesColumnIncreasing, ChevronDown, ChevronRight, Database, FileText, FlaskConical, GraduationCap, Grid2X2, List, MoreHorizontal, Network, Plus, Search } from "lucide-react";
import { Modal } from "./ui";
import { notify } from "./store";
import styles from "./research-activities.module.css";

const categories = ["全部", "智能体", "技能", "模型", "数据集", "应用工具"] as const;
type Category = (typeof categories)[number];
type ResourceType = Exclude<Category, "全部">;
const typeIcons = { 智能体: Bot, 技能: GraduationCap, 模型: Box, 数据集: Database, 应用工具: FlaskConical };
const resources = [
  { id: "literature-agent", title: "催化剂文献助手", type: "智能体", icon: Bot, tone: "blue", status: "运行中", statusTone: "green", description: "面向催化剂研究的文献检索、阅读与总结，支持多源文献检索、关键词抽取和综述生成。", tags: ["文献检索", "总结", "科研问答"], updated: "2024-12-10 14:20", author: "林夏" },
  { id: "performance-model", title: "催化剂性能预测模型 v1.0", type: "模型", icon: Box, tone: "violet", status: "已发布", statusTone: "blue", description: "基于机器学习的催化剂性能预测模型，支持多种分子描述符和图神经网络，预测催化活性与选择性。", tags: ["回归预测", "PyTorch", "GNN"], updated: "2024-12-08 10:15", author: "林夏" },
  { id: "experiment-dataset", title: "催化剂实验数据集", type: "数据集", icon: Database, tone: "green", status: "已就绪", statusTone: "green", description: "当前空间的催化剂实验数据集，包含催化剂配方、反应条件与性能测试结果。", tags: ["256 GB", "催化剂数据", "实验数据"], updated: "2024-12-06 16:30", author: "林夏" },
  { id: "literature-skill", title: "文献检索 Skill", type: "技能", icon: GraduationCap, tone: "orange", status: "已完成", statusTone: "green", description: "一键检索相关领域文献，支持关键词扩展、高质量文献筛选与引用信息提取。", tags: ["文献检索", "引用提取", "PDF 解析"], updated: "2024-12-05 11:20", author: "林夏" },
  { id: "online-lab", title: "在线实验室", type: "应用工具", icon: FlaskConical, tone: "blue", status: "运行中", statusTone: "green", description: "基于 Jupyter 的交互式科研计算环境，预装主流科学计算库，支持数据分析与模型开发。", tags: ["Python", "Jupyter", "数据分析"], updated: "2024-12-04 09:18", author: "林夏" },
  { id: "molecular-visualizer", title: "分子结构可视化工具", type: "应用工具", icon: Network, tone: "green", status: "已就绪", statusTone: "green", description: "支持分子三维结构可视化、构象分析与性质计算，适用于催化剂分子设计与分析。", tags: ["分子可视化", "RDKit", "3D 渲染"], updated: "2024-12-03 20:45", author: "林夏" },
  { id: "experiment-designer", title: "实验方案设计器", type: "应用工具", icon: FileText, tone: "amber", status: "部分可用", statusTone: "orange", description: "基于大语言模型的实验方案生成工具，支持条件设定、方案推荐与优化建议。", tags: ["实验设计", "LLM", "方案优化"], updated: "2024-12-02 15:10", author: "林夏" },
  { id: "chart-tool", title: "科研绘图分析工具", type: "应用工具", icon: ChartNoAxesColumnIncreasing, tone: "blue", status: "已就绪", statusTone: "green", description: "支持科研数据可视化与图表生成，提供多种科学绘图模板，便于论文和报告撰写。", tags: ["数据可视化", "Matplotlib", "图表生成"], updated: "2024-12-01 13:26", author: "林夏" },
] as const;
const summaries = [
  { type: "智能体", count: 6, description: "助力科研创新的智能框架", icon: Bot, tone: "blue" },
  { type: "技能", count: 8, description: "可复用的科研技能组件", icon: GraduationCap, tone: "green" },
  { type: "模型", count: 5, description: "机器学习与科学计算模型", icon: Box, tone: "violet" },
  { type: "数据集", count: 12, description: "高质量科研数据资源", icon: Database, tone: "blue" },
] as const;

export function ResearchActivities() {
  const [category, setCategory] = useState<Category>("全部");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("最新创建");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<(typeof resources)[number] | null>(null);
  const filtered = useMemo(() => {
    const matched = resources.filter((item) => (category === "全部" || item.type === category) && (item.title + item.description + item.tags.join(" ")).toLowerCase().includes(query.trim().toLowerCase()));
    return sort === "名称排序" ? [...matched].sort((a, b) => a.title.localeCompare(b.title, "zh-CN")) : sort === "最早创建" ? [...matched].reverse() : matched;
  }, [category, query, sort]);

  return <div className={styles.page}>
    <div className={styles.headingRow}>
      <div><h1>科研活动</h1><p>创建和查看当前空间关联的智能体、模型、数据集、Skill 与应用工具。</p></div>
      <details className={styles.createMenu}>
        <summary><Plus size={20} strokeWidth={3} />新建资源<ChevronDown size={16} /></summary>
        <div className={styles.createOptions}>{(["智能体", "技能", "模型", "数据集", "应用工具"] as ResourceType[]).map((type) => {
          const Icon = typeIcons[type];
          return <button key={type} type="button" aria-label={"新建" + type} onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); notify("新建" + type + "：当前为本地演示入口。"); }}><Icon size={19} />新建{type === "技能" ? " Skill" : type}</button>;
        })}</div>
      </details>
    </div>
    <div className={styles.summaryGrid} aria-label="资源概况">{summaries.map(({ type, count, description, icon: Icon, tone }) => <button className={styles.summaryCard} key={type} type="button" onClick={() => setCategory(type)}><span className={styles.summaryIcon + " " + styles[tone]}><Icon size={35} strokeWidth={2.5} /></span><span className={styles.summaryContent}><strong>{type}</strong><span className={styles.summaryCount}>{count}<ArrowUp size={17} /></span><small>{description}</small></span><ChevronRight className={styles.summaryArrow} size={20} /></button>)}</div>
    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label="按资源类型筛选">{categories.map((item) => <button key={item} type="button" className={category === item ? styles.activeFilter : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}</div>
      <div className={styles.toolbarRight}>
        <label className={styles.search}><Search size={18} /><input aria-label="搜索当前空间的资源" placeholder="搜索当前空间的资源..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className={styles.sort}>排序：<select aria-label="资源排序" value={sort} onChange={(event) => setSort(event.target.value)}><option>最新创建</option><option>最早创建</option><option>名称排序</option></select><ChevronDown size={16} /></label>
        <div className={styles.viewSwitch} role="group" aria-label="资源显示方式"><button type="button" aria-label="网格视图" aria-pressed={view === "grid"} className={view === "grid" ? styles.selectedView : ""} onClick={() => setView("grid")}><Grid2X2 size={19} fill="currentColor" /></button><button type="button" aria-label="列表视图" aria-pressed={view === "list"} className={view === "list" ? styles.selectedView : ""} onClick={() => setView("list")}><List size={21} /></button></div>
      </div>
    </div>
    {filtered.length ? <div className={styles.resourceGrid + " " + (view === "list" ? styles.listView : "")}>{filtered.map((item) => {
      const Icon = item.icon;
      return <article className={styles.resourceCard} key={item.id}>
        <div className={styles.resourceTop}><span className={styles.resourceIcon + " " + styles[item.tone]}><Icon size={32} strokeWidth={2.5} /></span><div className={styles.resourceName}><h2>{item.title}</h2><span>{item.type}</span></div><span className={styles.status + " " + styles[item.statusTone]}><i />{item.status}</span></div>
        <p className={styles.description}>{item.description}</p>
        <div className={styles.tags}>{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className={styles.cardFooter}><span>更新于 {item.updated}</span><span className={styles.author}>{item.author}</span><details className={styles.moreMenu}><summary aria-label={item.title + "的更多操作"}><MoreHorizontal size={20} /></summary><div><button type="button" aria-label={"查看" + item.title + "详情"} onClick={() => setSelected(item)}>查看详情</button><button type="button" aria-label={"复制" + item.title + "链接"} onClick={() => notify(item.title + "：已复制资源链接（本地演示）。")}>复制链接</button></div></details></div>
      </article>;
    })}</div> : <div className={styles.empty}>没有找到匹配的资源。<button type="button" onClick={() => { setQuery(""); setCategory("全部"); }}>清除筛选</button></div>}
    <Modal title={selected?.title ?? "资源详情"} open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <div className={styles.detail}><p>{selected.description}</p><p>类型：{selected.type}　状态：{selected.status}</p><p>更新于 {selected.updated} · {selected.author}</p></div>}</Modal>
  </div>;
}
