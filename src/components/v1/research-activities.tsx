"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { Bot, Box, Database, GraduationCap, Plus, Search, Wrench } from "lucide-react";
import { notify } from "./store";
import { createComputingSeed, type ComputingCategory, type ComputingTask } from "./scientific-computing-domain";
import { Modal } from "./ui";
import { ScientificComputing } from "./scientific-computing";
import styles from "./research-activities.module.css";

const tabs = [
  { key: "agents", label: "智能体", type: "智能体" },
  { key: "skills", label: "技能", type: "技能" },
  { key: "modelDevelopment", label: "模型开发", type: "模型" },
  { key: "training", label: "模型训练", type: "模型训练" },
  { key: "inference", label: "模型推理", type: "模型推理" },
  { key: "datasets", label: "数据集", type: "数据集" },
  { key: "tools", label: "科研工具", type: "科研工具" },
  { key: "computing", label: "科学计算", type: "科学计算" },
] as const;

type TabKey = (typeof tabs)[number]["key"];
type CapabilityType = "智能体" | "技能" | "模型" | "数据集" | "科研工具";
type Capability = { id: string; name: string; description: string; category: string; type: CapabilityType; version: string; status: "已发布" | "开发中" | "测试中" | "已停用"; updatedAt: string; tone: "blue" | "violet" | "green" | "orange" | "red"; creator?: string };

const capabilities: Capability[] = [
  { id: "agent-catalyst", name: "催化机理研究助手", description: "面向催化反应机理的文献分析、机理推理与结果归纳", category: "科研分析", type: "智能体", version: "v1.2.0", status: "已发布", updatedAt: "2024-12-06 16:30", tone: "violet" },
  { id: "agent-shale", name: "页岩储层分析助手", description: "基于多源数据的页岩储层综合分析与评价", category: "地质研究", type: "智能体", version: "v0.8.1", status: "开发中", updatedAt: "2024-12-05 14:20", tone: "blue" },
  { id: "agent-literature", name: "文献综述助手", description: "油气领域文献检索、阅读总结与综述生成", category: "知识问答", type: "智能体", version: "v1.0.0", status: "测试中", updatedAt: "2024-12-03 10:15", tone: "green" },
  { id: "agent-fcc", name: "FCC 工艺优化助手", description: "基于工艺数据与机理模型的 FCC 装置优化建议", category: "工艺优化", type: "智能体", version: "v1.1.0", status: "已发布", updatedAt: "2024-11-28 19:42", tone: "orange" },
  { id: "agent-material", name: "分子性质预测助手", description: "用于分子性质预测与材料筛选", category: "材料计算", type: "智能体", version: "v0.9.3", status: "已停用", updatedAt: "2024-11-20 11:36", tone: "violet" },
  { id: "agent-crude", name: "原油性质分析助手", description: "原油物性数据分析与组分特征识别", category: "油气工程", type: "智能体", version: "v1.0.1", status: "开发中", updatedAt: "2024-11-18 09:21", tone: "red" },
  { id: "skill-literature", name: "文献检索 Skill", description: "支持关键词扩展、文献筛选与引用信息提取", category: "文献处理", type: "技能", version: "v2.1.0", status: "已发布", updatedAt: "2024-12-05 11:20", tone: "orange" },
  { id: "model-performance", name: "催化剂性能预测模型", description: "基于图神经网络预测催化活性与选择性", category: "回归预测", type: "模型", version: "v1.0.0", status: "已发布", updatedAt: "2024-12-08 10:15", tone: "violet" },
  { id: "dataset-experiment", name: "催化剂实验数据集", description: "包含催化剂配方、反应条件与性能测试结果", category: "实验数据", type: "数据集", version: "v3.2.0", status: "已发布", updatedAt: "2024-12-06 16:30", tone: "green" },
  { id: "tool-visualizer", name: "分子结构可视化工具", description: "支持分子三维结构可视化、构象分析与性质计算", category: "结构分析", type: "科研工具", version: "v1.4.2", status: "已发布", updatedAt: "2024-12-03 20:45", tone: "blue" },
];

const icons = { "智能体": Bot, "技能": GraduationCap, "模型": Box, "数据集": Database, "科研工具": Wrench } satisfies Record<CapabilityType, typeof Bot>;
const createLabels: Record<TabKey, string> = { agents: "新建智能体", skills: "新建技能", modelDevelopment: "新建模型", training: "发起训练任务", inference: "发起推理任务", datasets: "新建数据集", tools: "新建科研工具", computing: "发起计算任务" };

export function ResearchActivities() {
  const params = useParams<Record<string, string | string[]>>();
  const queryParams = useSearchParams();
  const router = useRouter();
  const hasTask = Boolean(params.taskId);
  const requested = queryParams.get("tab") as TabKey | null;
  const [tab, setTab] = useState<TabKey>(hasTask ? "computing" : tabs.some(item => item.key === requested) ? requested! : "agents");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部");
  const [items, setItems] = useState<Capability[]>(capabilities);
  const [selected, setSelected] = useState<Capability | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const current = tabs.find(item => item.key === tab) ?? tabs[0];
  const taskMode: ComputingCategory | null = tab === "computing" ? "compute" : tab === "training" ? "training" : tab === "inference" ? "inference" : null;
  const filtered = useMemo(() => items.filter(item => item.type === current.type && (status === "全部" || item.status === status) && `${item.name}${item.description}${item.category}`.toLowerCase().includes(query.trim().toLowerCase())), [current.type, items, query, status]);

  function changeTab(next: TabKey) {
    setTab(next); setQuery(""); setStatus("全部");
    const contextId = Array.isArray(params.contextId) ? params.contextId[0] : params.contextId ?? "current";
    router.replace(`/research-spaces/${encodeURIComponent(contextId)}/activities?tab=${next}`);
  }

  function openCreate() {
    if (tab === "agents") {
      const contextId = Array.isArray(params.contextId) ? params.contextId[0] : params.contextId ?? "current";
      router.push(`/research-spaces/${encodeURIComponent(contextId)}/activities/agents/new`);
    } else if (["skills", "modelDevelopment"].includes(tab)) setCreateOpen(true);
    else notify(`${createLabels[tab]}：当前为本地演示入口。`);
  }

  function createCapability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) { notify(`请填写${current.label}名称`); return; }
    const description = String(data.get("description") ?? data.get("goal") ?? "").trim() || `用户创建的${current.label}`;
    const category = String(data.get("discipline") ?? "通用");
    setItems(previous => [{ id: `${tab}-${Date.now()}`, name, description, category, type: current.type as CapabilityType, version: "v1.0.0", status: "开发中", updatedAt: "2026-10-02 现在", tone: tab === "skills" ? "green" : "violet", creator: "林夏" }, ...previous]);
    setCreateOpen(false);
    notify(`${current.label}已创建`);
  }

  return <div className={styles.page}>
    {!hasTask && <><header className={styles.heading}><h1>科研活动</h1><p>在当前科研空间内进行能力构建与科学计算。</p></header><nav className={styles.tabs} aria-label="科研活动类型">{tabs.map(item => <button key={item.key} type="button" className={tab === item.key ? styles.activeTab : ""} aria-current={tab === item.key ? "page" : undefined} onClick={() => changeTab(item.key)}>{item.label}</button>)}</nav></>}
    {taskMode ? <ScientificComputing embedded initialCategory={taskMode} /> : <section className={styles.panel}>
      <div className={styles.toolbar}><label className={styles.search}><Search size={19}/><input value={query} onChange={event => setQuery(event.target.value)} aria-label={`搜索${current.label}`} placeholder={`搜索${current.label}名称 / 描述`} /></label><label className={styles.statusFilter}><span>状态</span><select aria-label={`筛选${current.label}状态`} value={status} onChange={event => setStatus(event.target.value)}><option>全部</option><option>已发布</option><option>开发中</option><option>测试中</option><option>已停用</option></select></label><button className={styles.createButton} type="button" onClick={openCreate}><Plus size={18}/>{createLabels[tab]}</button></div>
      <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th className={styles.check}><input type="checkbox" aria-label="选择当前页全部记录"/></th><th>名称</th><th>类型</th><th>版本</th><th>状态</th><th>创建人</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{filtered.map(item => { const Icon = icons[item.type]; return <tr key={item.id}><td className={styles.check}><input type="checkbox" aria-label={`选择 ${item.name}`}/></td><td><span className={styles.nameCell}><span className={`${styles.icon} ${styles[item.tone]}`}><Icon size={22}/></span><span><strong>{item.name}</strong><small>{item.description}</small></span></span></td><td><span className={styles.typePill}>{item.category}</span></td><td className={styles.version}>{item.version}</td><td><span className={`${styles.status} ${styles[`status${item.status}`]}`}><i/>{item.status}</span></td><td>{item.creator ?? "林夏"}</td><td className={styles.updated}>{item.updatedAt}</td><td><span className={styles.actions}><button type="button" onClick={() => setSelected(item)}>查看</button><button type="button" onClick={() => notify("已添加到科研超级中枢")}>添加使用</button></span></td></tr>; })}</tbody></table>{filtered.length === 0 && <div className={styles.empty}>没有找到符合条件的{current.label}。</div>}</div>
      <footer className={styles.footer}><span>共 {filtered.length} 条记录</span><div><button type="button" disabled aria-label="上一页">‹</button><b>1</b><button type="button" disabled aria-label="下一页">›</button><select aria-label="每页记录数" defaultValue="10"><option value="10">10 条/页</option></select></div></footer>
    </section>}
    <Modal title={selected?.name ?? "能力详情"} open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <div className={styles.detail}><p>{selected.description}</p><dl><div><dt>类型</dt><dd>{selected.type}</dd></div><div><dt>分类</dt><dd>{selected.category}</dd></div><div><dt>创建人</dt><dd>{selected.creator ?? "林夏"}</dd></div><div><dt>版本</dt><dd>{selected.version}</dd></div><div><dt>状态</dt><dd>{selected.status}</dd></div></dl></div>}</Modal>
    <Modal title={createLabels[tab]} open={createOpen} onClose={() => setCreateOpen(false)} wide><CreateCapabilityForm tab={tab} onSubmit={createCapability} onCancel={() => setCreateOpen(false)} /></Modal>
  </div>;
}

function CreateCapabilityForm({ tab, onSubmit, onCancel }: { tab: TabKey; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return <form className={styles.createForm} onSubmit={onSubmit}>
    {tab === "skills" && <><section><div className={styles.formGrid}><label>技能名称<input name="name" maxLength={30} required placeholder="例如：催化剂表征数据整理（不超过 30 字）"/></label><label>学科领域<select name="discipline" defaultValue="通用"><option>通用</option><option>材料科学</option><option>地球科学</option><option>化学化工</option><option>油气工程</option></select></label></div><fieldset><legend>应用场景 <small>可多选</small></legend>{["文献调研", "数据分析", "实验设计", "科学计算", "科研绘图", "论文写作", "专利与标准", "编程与自动化"].map(item => <label className={styles.checkOption} key={item}><input type="checkbox" name="scenes" value={item}/>{item}</label>)}</fieldset><label>技能形态<select name="skillForm" defaultValue="工具编排型"><option>工具编排型</option><option>指令型</option><option>脚本型</option></select><small className={styles.help}>按步骤调用科研工具箱中的 MCP 工具，加载时连带加载依赖工具</small></label><label>说明<textarea name="description" rows={2} placeholder="一句话说明技能能做什么"/></label><label>何时使用<textarea name="when" rows={2} placeholder="Research Agent 据此判断是否调用，例如：用户要整理多篇论文中的催化实验条件时"/></label><label>任务步骤<textarea name="steps" rows={4} required placeholder={"每行一步，例如：\n检索目标反应的文献\n抽取反应条件与结果\n输出对比表"}/></label><fieldset><legend>调用的工具（来自科研工具箱） <small>可多选</small></legend>{["内部文献库连接", "Zotero 文献管理", "专利库", "标准条款解析", "科研数据清洗工具", "科研数据格式转换", "Plotly.js", "Apache ECharts", "Matplotlib", "Pandoc 文档转换", "LaTeX 排版 (TeX Live)", "GROMACS", "LAMMPS", "Packmol", "RDKit", "3Dmol.js", "VASP", "Quantum ESPRESSO", "pymatgen", "ASE", "segyio", "Madagascar / Seismic Unix", "lasio / welly", "OPM Flow", "PyVista", "ObsPy", "AlphaFold2 / ColabFold", "Mol*", "Biopython", "BLAST+", "Primer3", "DNA Chisel", "COBRApy", "远程计算"].map(item => <label className={styles.checkOption} key={item}><input type="checkbox" name="uses" value={item}/>{item}</label>)}</fieldset><label>可见范围<select name="visibility" defaultValue="仅自己"><option>仅自己</option><option>团队共享</option></select></label></section></>}
    {tab === "modelDevelopment" && <><section><h3>模型基础信息</h3><div className={styles.formGrid}><label>模型名称<input name="name" maxLength={30} required placeholder="不超过 30 个字"/></label><label>学科领域<select name="discipline"><option>通用</option><option>材料科学</option><option>地球科学</option><option>化学化工</option><option>油气工程</option></select></label><label>研究方向<select name="direction"><option>通用研究</option><option>催化材料</option><option>储层评价</option><option>分子模拟</option></select></label><fieldset><legend>模型类型</legend>{["预测", "文本生成", "视觉理解", "科学计算"].map(item => <label className={styles.checkOption} key={item}><input type="checkbox" name="modelTypes" value={item}/>{item}</label>)}</fieldset><fieldset><legend>任务类型</legend>{["性质预测", "分类识别", "结构生成", "代理建模"].map(item => <label className={styles.checkOption} key={item}><input type="checkbox" name="taskTypes" value={item}/>{item}</label>)}</fieldset><label>模型架构<select name="architecture"><option>Transformer</option><option>GNN</option><option>CNN</option><option>混合架构</option></select></label><label>基础模型<select name="baseModel"><option>—</option><option>通用科研大模型</option><option>催化剂性能预测模型</option></select></label><label>模型来源<select name="source"><option>训练任务产出</option><option>上传权重文件</option></select></label></div><label>模型描述<textarea name="description" rows={3} placeholder="说明模型能预测什么、适用范围与精度"/></label></section></>}
    <div className={styles.formActions}><button type="button" onClick={onCancel}>取消</button><button type="submit">确定创建</button></div>
  </form>;
}

function TaskListPanel({ taskMode, query, setQuery, status, setStatus, createLabel }: { taskMode: ComputingCategory; query: string; setQuery: (value: string) => void; status: string; setStatus: (value: string) => void; createLabel: string }) {
  const rows = useMemo(() => createComputingSeed("topic-a").filter(item => item.category === taskMode && (status === "全部" || item.status === status) && `${item.name}${item.type}${item.software ?? ""}${item.model ?? ""}${item.owner}`.toLowerCase().includes(query.trim().toLowerCase())), [query, status, taskMode]);
  const title = taskMode === "compute" ? "计算任务" : taskMode === "training" ? "模型训练" : "模型推理";
  return <section className={styles.panel}>
    <div className={styles.toolbar}><label className={styles.search}><Search size={19}/><input value={query} onChange={event => setQuery(event.target.value)} aria-label={`搜索${title}`} placeholder={`搜索${title}名称 / 负责人`} /></label><label className={styles.statusFilter}><span>状态</span><select aria-label={`筛选${title}状态`} value={status} onChange={event => setStatus(event.target.value)}><option>全部</option><option>运行中</option><option>排队中</option><option>已完成</option><option>失败</option><option>已停止</option></select></label><button className={styles.createButton} type="button" onClick={() => notify(`${createLabel}：当前为本地演示入口。`)}><Plus size={18}/>{createLabel}</button></div>
    <div className={styles.tableScroll}><table className={`${styles.table} ${styles.taskTable}`}><thead><tr><th className={styles.check}><input type="checkbox" aria-label="选择当前页全部任务"/></th><th>任务名称</th><th>{taskMode === "compute" ? "计算类型" : "关联模型 / 版本"}</th><th>{taskMode === "compute" ? "所属软件 / 工具" : taskMode === "training" ? "训练数据集" : "输入数据"}</th><th>负责人</th><th>更新时间</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.map(row => <TaskRow key={row.id} row={row} taskMode={taskMode}/>)}</tbody></table>{rows.length === 0 && <div className={styles.empty}>没有符合条件的{title}。</div>}</div>
    <footer className={styles.footer}><span>共 {rows.length} 条记录</span><div><button type="button" disabled aria-label="上一页">‹</button><b>1</b><button type="button" disabled aria-label="下一页">›</button><select aria-label="每页记录数" defaultValue="10"><option value="10">10 条/页</option></select></div></footer>
  </section>;
}

function TaskRow({ row, taskMode }: { row: ComputingTask; taskMode: ComputingCategory }) {
  const base = `/research-spaces/${encodeURIComponent(row.spaceId)}/activities/computing/${encodeURIComponent(row.id)}`;
  return <tr><td className={styles.check}><input type="checkbox" aria-label={`选择 ${row.name}`}/></td><td><span className={styles.nameCell}><span className={`${styles.icon} ${styles.blue}`}><Box size={22}/></span><span><strong>{row.name}</strong><small>{taskMode === "compute" ? row.note || "科研计算任务" : row.inputFile}</small></span></span></td><td>{taskMode === "compute" ? row.type : row.model}</td><td>{taskMode === "compute" ? row.software : row.inputFile}</td><td>{row.owner}</td><td className={styles.updated}>{row.updatedAt}</td><td><span className={`${styles.status} ${styles.taskStatus}`}><i/>{row.status}</span></td><td><span className={styles.actions}><Link href={base}>查看</Link><button type="button" onClick={() => notify(`任务「${row.name}」操作已记录`)}>{row.status === "已完成" ? "下载结果" : row.status === "运行中" ? "停止" : "运行"}</button></span></td></tr>;
}
