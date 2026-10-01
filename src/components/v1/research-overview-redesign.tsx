"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, Database, FileText, FlaskConical, FolderKanban, Info, MessageSquareText, Plus, Search, Tag, Target, UserRound, UsersRound, X } from "lucide-react";
import { taskLabels } from "./domain";
import { profiles, userName } from "./seed";
import { useResearch } from "./store";
import type { Artifact, Membership, TaskStatus } from "./types";
import { Empty, Modal } from "./ui";
import css from "./research-overview.module.css";

const tabs = ["info", "members", "tasks", "outputs"] as const;
type Tab = (typeof tabs)[number];
const labels: Record<Tab, string> = { info: "科研信息", members: "课题成员", tasks: "科研任务", outputs: "科研产出" };
const roles: Record<Membership["role"], string> = { "Topic Leader": "课题负责人", "Space Admin": "空间管理员", Member: "研究人员", "Asset Manager": "资产管理员", Viewer: "观察成员" };
const stages = ["课题启动", "文献调研", "数据集构建", "模型初步建立", "优化实验验证", "课题结题"];
const date = (value?: string) => value?.slice(0, 10) || "—";
const time = (value?: string) => value ? value.slice(0, 16).replace("T", " ") : "—";
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const tone = (status: TaskStatus) => status === "COMPLETED" ? "success" : status === "RUNNING" || status === "PLANNING" ? "running" : status === "FAILED" || status === "CANCELLED" ? "danger" : "waiting";
const iconFor = (type: string) => /数据/.test(type) ? Database : /实验|方案/.test(type) ? FlaskConical : /模型/.test(type) ? Target : FileText;
function plannedDate(start?: string, end?: string, ratio = 0) {
  const a = new Date(`${date(start)}T00:00:00Z`).getTime();
  const b = new Date(`${date(end)}T00:00:00Z`).getTime();
  return Number.isFinite(a) && Number.isFinite(b) ? new Date(a + (b - a) * ratio).toISOString().slice(0, 10) : "—";
}
function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return <span className={`${css.avatar} ${large ? css.avatarLarge : ""}`} aria-hidden="true">{name.slice(-2)}</span>;
}
function Status({ value, color = "success" }: { value: string; color?: string }) {
  return <span className={`${css.status} ${css[color] || ""}`}><i />{value}</span>;
}
function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className={css.search}><Search size={17} /><span className="sr-only">{placeholder}</span><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />{value && <button type="button" aria-label="清空搜索" onClick={() => onChange("")}><X size={15} /></button>}</label>;
}
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className={css.select}><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{options.map(option => <option key={option} value={option}>{option || `全部${label.replace("筛选", "")}`}</option>)}</select></label>;
}
function Pager({ page, total, onChange }: { page: number; total: number; onChange: (value: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / 10));
  return <div className={css.pager}>{pages > 1 && <><button type="button" aria-label="上一页" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></button><b>{page}</b><button type="button" aria-label="下一页" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></button></>}<span>共 {total} 条</span></div>;
}

export function ResearchOverviewRedesign() {
  const { s, p, space } = useResearch();
  const params = useParams<Record<string, string | string[]>>();
  const query = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [memberDetail, setMemberDetail] = useState<Membership | null>(null);
  const [outputDetail, setOutputDetail] = useState<Artifact | null>(null);
  const routeId = first(params.contextId);
  const context = routeId && routeId !== "current" ? s.spaces.find(item => item.id === routeId) : space;
  const tabValue = query.get("tab") as Tab | null;
  const tab: Tab = tabValue && tabs.includes(tabValue) ? tabValue : "info";
  if (!context) return <Empty>课题不存在或已不可访问。</Empty>;
  const project = s.projects.find(item => item.id === context.projectId);
  const members = s.members.filter(item => item.spaceId === context.id && item.status === "active");
  const tasks = s.tasks.filter(item => item.spaceId === context.id);
  const outputs = s.artifacts.filter(item => item.spaceId === context.id);
  const lead = members.find(item => item.role === "Topic Leader") ?? members[0];
  const owner = lead ? userName(lead.userId) : userName(context.ownerId);
  const base = `/research-spaces/${encodeURIComponent(context.id)}`;
  const latest = [context.createdAt, ...tasks.map(item => item.updatedAt), ...outputs.map(item => item.updatedAt)].sort().at(-1);
  const catalyst = /催化/.test(context.name);
  const intro = catalyst ? "本课题面向催化领域关键反应的高效催化需求，基于数据驱动与实验验证相结合的方法，开展催化材料配方优化研究。通过多源数据分析、机器学习建模和高通量筛选，探索高活性、高选择性、高稳定性的催化剂配方体系，为工业应用提供理论指导和实验依据。" : context.description || `围绕${context.name}开展科研任务、资料整理与成果协作。`;
  const goals = catalyst ? ["建立催化剂配方与性能的关联模型", "提升催化剂活性和选择性", "形成可工业化应用的优化配方方案", "发表论文并申请相关专利"] : ["明确课题目标与研究路线", "完成关键数据与资料整理", "推进实验和分析验证", "形成可复核的科研成果"];
  const requirements = ["完成文献调研与数据收集分析", "构建研究模型并验证关键假设", "设计并执行实验方案", "形成技术报告和学术成果"];
  const start = project?.start ?? date(context.createdAt);
  const end = project?.end;
  const dates = stages.map((_, i) => plannedDate(start, end, i / (stages.length - 1)));
  const today = new Date().toISOString().slice(0, 10);
  const nextStage = dates.findIndex(value => value !== "—" && value > today);
  const currentStage = nextStage < 0 ? stages.length - 1 : Math.max(0, nextStage - 1);
  function changeTab(next: Tab) { setSearch(""); setFilter(""); setStateFilter(""); setPage(1); router.replace(`${base}/overview?tab=${next}`); }
  function changeSearch(value: string) { setSearch(value); setPage(1); }
  const memberRows = members.filter(item => `${userName(item.userId)} ${roles[item.role]} ${project?.discipline ?? ""}`.includes(search.trim()) && (!filter || roles[item.role] === filter) && (!stateFilter || stateFilter === "进行中"));
  const taskRows = tasks.filter(item => `${item.name} ${userName(item.ownerId)} ${item.type}`.includes(search.trim()) && (!filter || item.type === filter) && (!stateFilter || taskLabels[item.status] === stateFilter)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const outputRows = outputs.filter(item => `${item.name} ${item.type} ${item.content}`.includes(search.trim()) && (!filter || item.type === filter) && (!stateFilter || item.status === stateFilter)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const take = <T,>(rows: T[]) => rows.slice((page - 1) * 10, page * 10);
  return <div className={css.page}>
    <div className={css.crumb}><Link href="/research-spaces/current/overview">科研空间</Link><span>/</span>{context.name}<span>/</span><strong>课题概览</strong></div>
    <header className={css.header}><div className={css.titleRow}><div className={css.title}><h1>{context.name}</h1><Status value={context.status === "ACTIVE" ? "进行中" : context.status === "SUSPENDED" ? "已暂停" : "已结束"} color={context.status === "ACTIVE" ? "success" : "waiting"} /></div><div className={css.actions}><Link className={css.secondaryButton} href={`${base}/tasks${tasks[0] ? `?task=${tasks[0].id}` : ""}`}><MessageSquareText size={17} />进入会话</Link><Link className={css.primaryButton} href="/workspace"><Plus size={18} />发起科研任务</Link></div></div><div className={css.meta}><span><UserRound />课题负责人：<b>{owner}</b></span><span><CalendarDays />课题周期：<b>{start} 至 {end ?? "未设置"}</b></span><span><FolderKanban />所属项目：<b>{project?.name ?? "未关联项目"}</b></span><span><UsersRound />成员：<b>{members.length} 人</b></span></div></header>
    <nav className={css.tabs} role="tablist" aria-label="课题概览内容">{tabs.map(key => <button type="button" role="tab" aria-selected={tab === key} className={tab === key ? css.selected : ""} onClick={() => changeTab(key)} key={key}>{labels[key]}</button>)}</nav>
    {tab === "info" && <section className={css.infoGrid}><div className={css.infoMain}><article className={css.card}><h2><FileText />课题简介</h2><p className={css.intro}>{intro}</p></article><div className={css.goals}><article className={css.card}><h2><Target />研究目标</h2><ul>{goals.map(goal => <li key={goal}>{goal}</li>)}</ul></article><article className={css.card}><h2><ClipboardCheck />任务要求</h2><ul>{requirements.map(item => <li key={item}>{item}</li>)}</ul></article></div></div><aside className={`${css.card} ${css.basic}`}><h2><Info />基本信息</h2><dl><div><dt><Target />所属方向</dt><dd>{project?.discipline ?? "未设置"}</dd></div><div><dt><UserRound />课题负责人</dt><dd><Avatar name={owner} />{owner}</dd></div><div><dt><UsersRound />成员数</dt><dd>{members.length} 人</dd></div><div><dt><CalendarDays />课题周期</dt><dd>{start} 至 {end ?? "未设置"}</dd></div><div><dt><Clock3 />最近更新</dt><dd>{time(latest)}</dd></div><div><dt><FolderKanban />所属项目</dt><dd>{project?.name ?? "未关联项目"}</dd></div><div><dt><Tag />关键词</dt><dd className={css.keywords}>{(catalyst ? ["催化剂", "配方优化", "机器学习", "高通量筛选"] : [project?.discipline ?? "科研", context.name]).map(word => <span key={word}>{word}</span>)}</dd></div></dl></aside><article className={`${css.card} ${css.progress}`}><h2><MessageSquareText />当前科研进展</h2><div className={css.milestones}>{stages.map((stage, i) => <div className={`${css.milestone} ${i < currentStage ? css.done : ""} ${i === currentStage ? css.current : ""}`} key={stage}><span className={css.node}>{i < currentStage && <Check size={14} />}</span><strong>{stage}</strong><time>{dates[i]}</time>{i === currentStage && <span className={css.currentHint}>当前阶段</span>}</div>)}</div><p className={css.progressNote}>按项目周期展示计划节点；实际完成情况以科研任务记录为准。</p></article></section>}
    {tab === "members" && <section className={css.listCard}><div className={css.listHeading}><div><h2><UsersRound />课题成员列表</h2><p>共 {members.length} 位成员，覆盖课题研究与协作角色</p></div><div className={css.filters}><SearchField value={search} onChange={changeSearch} placeholder="搜索成员姓名、角色或研究方向" /><SelectField label="筛选角色" value={filter} options={["", ...new Set(members.map(item => roles[item.role]))]} onChange={value => { setFilter(value); setPage(1); }} /><SelectField label="筛选状态" value={stateFilter} options={["", "进行中"]} onChange={value => { setStateFilter(value); setPage(1); }} /></div></div><div className={css.tableScroll}><table className={css.table}><thead><tr><th>成员信息</th><th>角色</th><th>所属方向</th><th>参与任务数</th><th>最近活跃时间</th><th>状态</th><th>操作</th></tr></thead><tbody>{take(memberRows).map(member => { const name = userName(member.userId); const owned = tasks.filter(task => task.ownerId === member.userId || task.participants.includes(member.userId)); const recent = owned.map(task => task.updatedAt).sort().at(-1) ?? member.joinedAt; return <tr key={member.id}><td><span className={css.person}><Avatar name={name} large /><span><strong>{name}</strong><small>{project?.organization ?? "课题组"}</small></span></span></td><td><span className={css.pill}>{roles[member.role]}</span></td><td>{project?.discipline ?? "—"}</td><td>{owned.length}</td><td>{time(recent)}</td><td><Status value="进行中" /></td><td><button type="button" className={css.textAction} onClick={() => setMemberDetail(member)}>查看详情 <ArrowRight size={15} /></button></td></tr>; })}</tbody></table>{!memberRows.length && <Empty>没有符合筛选条件的成员。</Empty>}</div><Pager page={page} total={memberRows.length} onChange={setPage} /></section>}
    {tab === "tasks" && <section className={css.listCard}><div className={css.listHeading}><div><h2><ClipboardCheck />科研任务列表</h2><p>共 {tasks.length} 个任务，按更新时间倒序排列</p></div><div className={css.filters}><SearchField value={search} onChange={changeSearch} placeholder="搜索任务名称、负责人或关键词" /><SelectField label="筛选任务阶段" value={filter} options={["", ...new Set(tasks.map(item => item.type))]} onChange={value => { setFilter(value); setPage(1); }} /><SelectField label="筛选任务状态" value={stateFilter} options={["", ...new Set(tasks.map(item => taskLabels[item.status]))]} onChange={value => { setStateFilter(value); setPage(1); }} /></div></div><div className={css.tableScroll}><table className={css.table}><thead><tr><th>任务名称</th><th>任务阶段</th><th>负责人</th><th>更新时间</th><th>状态</th><th>协作人数</th><th>操作</th></tr></thead><tbody>{take(taskRows).map(task => { const Icon = iconFor(task.type); const name = userName(task.ownerId); return <tr key={task.id}><td><span className={css.itemName}><span className={css.itemIcon}><Icon size={21} /></span><span><strong>{task.name}</strong><small>{task.next || task.reason || "查看任务研究过程与成果"}</small></span></span></td><td><span className={css.pill}>{task.type}</span></td><td><span className={css.person}><Avatar name={name} />{name}</span></td><td>{time(task.updatedAt)}</td><td><Status value={taskLabels[task.status]} color={tone(task.status)} /></td><td>{task.participants.length}</td><td><Link className={task.status === "RUNNING" || task.status === "WAITING_HUMAN" ? css.rowPrimary : css.rowSecondary} href={`${base}/tasks?task=${task.id}`}>{task.status === "RUNNING" || task.status === "WAITING_HUMAN" ? "继续任务" : "查看任务"}</Link></td></tr>; })}</tbody></table>{!taskRows.length && <Empty action={!tasks.length ? <Link className={css.primaryButton} href="/workspace">发起科研任务</Link> : undefined}>{tasks.length ? "没有符合筛选条件的任务。" : "当前课题还没有科研任务。"}</Empty>}</div><Pager page={page} total={taskRows.length} onChange={setPage} /></section>}
    {tab === "outputs" && <section className={css.listCard}><div className={css.listHeading}><div><h2><FileText />科研产出列表</h2><p>共 {outputs.length} 项产出，可查看版本、状态和来源任务</p></div></div><div className={css.outputFilters}><SearchField value={search} onChange={changeSearch} placeholder="搜索产出名称、描述或关键词" /><SelectField label="筛选产出类型" value={filter} options={["", ...new Set(outputs.map(item => item.type))]} onChange={value => { setFilter(value); setPage(1); }} /><SelectField label="筛选产出状态" value={stateFilter} options={["", ...new Set(outputs.map(item => item.status))]} onChange={value => { setStateFilter(value); setPage(1); }} /></div><div className={css.tableScroll}><table className={css.table}><thead><tr><th>产出名称</th><th>类型</th><th>来源任务</th><th>版本</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{take(outputRows).map(output => { const Icon = iconFor(output.type); const source = tasks.find(task => task.id === output.taskId); return <tr key={output.id}><td><span className={css.itemName}><span className={css.itemIcon}><Icon size={21} /></span><span><strong>{output.name}</strong><small>{output.content || "科研任务产出"}</small></span></span></td><td><span className={css.pill}>{output.type}</span></td><td><span className={css.source}><strong>{source?.name ?? "独立调用"}</strong><small><Avatar name={userName(output.ownerId)} />{userName(output.ownerId)}</small></span></td><td><span className={css.version}>{output.version}</span></td><td><Status value={output.status} color={/发布|完成|确认/.test(output.status) ? "success" : "waiting"} /></td><td>{time(output.updatedAt)}</td><td><button type="button" className={css.textAction} onClick={() => setOutputDetail(output)}>查看详情 <ArrowRight size={15} /></button></td></tr>; })}</tbody></table>{!outputRows.length && <Empty>{outputs.length ? "没有符合筛选条件的产出。" : "当前课题还没有科研产出。"}</Empty>}</div><Pager page={page} total={outputRows.length} onChange={setPage} /></section>}
    <Modal title="成员详情" open={!!memberDetail} onClose={() => setMemberDetail(null)}>{memberDetail && <dl className={css.detailList}><div><dt>姓名</dt><dd>{userName(memberDetail.userId)}</dd></div><div><dt>课题角色</dt><dd>{roles[memberDetail.role]}</dd></div><div><dt>所属方向</dt><dd>{project?.discipline ?? "—"}</dd></div><div><dt>加入时间</dt><dd>{date(memberDetail.joinedAt)}</dd></div></dl>}</Modal>
    <Modal title={outputDetail?.name ?? "产出详情"} open={!!outputDetail} onClose={() => setOutputDetail(null)}>{outputDetail && <><p className={css.detailContent}>{outputDetail.content || "暂无产出描述。"}</p><dl className={css.detailList}><div><dt>类型</dt><dd>{outputDetail.type}</dd></div><div><dt>版本</dt><dd>{outputDetail.version}</dd></div><div><dt>状态</dt><dd>{outputDetail.status}</dd></div><div><dt>来源任务</dt><dd>{tasks.find(task => task.id === outputDetail.taskId)?.name ?? "独立调用"}</dd></div><div><dt>更新时间</dt><dd>{time(outputDetail.updatedAt)}</dd></div></dl></>}</Modal>
    <span className="sr-only">当前用户：{profiles[s.profileKey]?.name ?? p.name}</span>
  </div>;
}
