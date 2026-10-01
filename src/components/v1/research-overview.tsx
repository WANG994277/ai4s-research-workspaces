"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, FolderKanban, MessageSquareText, Play, Target, UsersRound } from "lucide-react";
import { taskLabels } from "./domain";
import { profiles, userName } from "./seed";
import { useResearch } from "./store";
import { Badge, Empty, Table } from "./ui";

const tabKeys = ["info", "members", "tasks", "outputs"] as const;
const tabLabels = { info: "科研信息", members: "课题成员", tasks: "科研任务", outputs: "科研产出" } as const;

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function ResearchOverview() {
  const { s, p, space } = useResearch();
  const params = useParams<Record<string, string | string[]>>();
  const query = useSearchParams();
  const router = useRouter();
  const routeId = param(params.contextId);
  const context = routeId && routeId !== "current" ? s.spaces.find((item) => item.id === routeId) : space;
  const tabValue = query.get("tab") as (typeof tabKeys)[number] | null;
  const tab = tabValue && tabKeys.includes(tabValue) ? tabValue : "info";
  if (!context) return <Empty>课题不存在或已不可访问。</Empty>;
  const project = s.projects.find((item) => item.id === context.projectId);
  const members = s.members.filter((item) => item.spaceId === context.id && item.status === "active");
  const tasks = s.tasks.filter((item) => item.spaceId === context.id);
  const outputs = s.artifacts.filter((item) => item.spaceId === context.id);
  const lead = members.find((item) => item.role === "Topic Leader") ?? members[0];
  const owner = lead ? userName(lead.userId) : userName(context.ownerId);
  const base = `/research-spaces/${encodeURIComponent(context.id)}`;
  const selectTab = (next: string) => router.replace(`${base}/overview?tab=${next}`);

  return <div className="rs-overview">
    <div className="rs-overview-crumb">科研空间 <span>/</span> {context.name} <span>/</span> 课题概览</div>
    <header className="rs-overview-head"><div><div className="rs-title-line"><h1>{context.name}</h1><Badge>{context.status === "ACTIVE" ? "进行中" : context.status}</Badge></div><div className="rs-meta"><span><UsersRound />课题负责人：{owner}</span><span><CalendarDays />课题周期：{project?.start ?? "2026-01-01"} 至 {project?.end ?? "2026-12-31"}</span><span><FolderKanban />所属项目：{project?.name ?? "高效催化材料研究项目"}</span><span><UsersRound />成员：{members.length || 5} 人</span></div></div><div className="rs-overview-actions"><Link className="v-button" href={`${base}/tasks${tasks[0] ? `?task=${tasks[0].id}` : ""}`}><MessageSquareText size={15} />进入会话</Link><Link className="v-button primary" href="/workspace"><Play size={15} />发起科研任务</Link></div></header>
    <nav className="rs-overview-tabs" role="tablist" aria-label="课题概览内容">{tabKeys.map((key) => <button type="button" role="tab" aria-selected={tab === key} className={tab === key ? "selected" : ""} onClick={() => selectTab(key)} key={key}>{tabLabels[key]}</button>)}</nav>
    {tab === "info" && <section className="rs-info-grid"><div className="rs-info-main"><article><h2><FolderKanban />课题简介</h2><p>本课题面向催化领域关键反应的高效催化需求，基于数据驱动与实验验证相结合的方法，开展催化材料配方优化研究。通过多源数据分析、机器学习建模和高通量筛选，为工业应用提供理论指导和实验依据。</p></article><div className="rs-goals"><article><h2><Target />研究目标</h2><ul><li>建立催化剂配方与性能的关联模型</li><li>实现催化剂活性和选择性的显著提升</li><li>形成可工业化应用的优化配方方案</li><li>发表高水平论文并申请相关专利</li></ul></article><article><h2><Play />任务要求</h2><ul><li>完成文献调研与数据收集分析</li><li>构建催化剂性能预测模型</li><li>设计并验证优化配方实验方案</li><li>形成技术报告和学术成果</li></ul></article></div></div><aside><h2>科研信息</h2><dl><div><dt>所属方向</dt><dd>{project?.discipline ?? "催化化学 · 能源与化工"}</dd></div><div><dt>课题负责人</dt><dd>{owner}</dd></div><div><dt>成员数</dt><dd>{members.length || 5} 人</dd></div><div><dt>最近更新</dt><dd>{context.createdAt.slice(0, 10)}</dd></div><div><dt>关键词</dt><dd><span>催化剂</span><span>配方优化</span><span>机器学习</span><span>高通量筛选</span></dd></div></dl></aside><article className="rs-progress"><h2>当前科研进展</h2><div>{[["课题启动", "2026-01-01", "done"], ["文献调研完成", "2026-02-28", "done"], ["数据集构建完成", "2026-04-30", "done"], ["模型初步建立", "2026-07-31", "current"], ["优化实验验证", "2026-10-31", ""], ["课题结题", "2026-12-31", ""]].map(([label, date, state]) => <span className={state} key={label}><i /> <b>{label}</b><small>{date}</small></span>)}</div></article></section>}
    {tab === "members" && (members.length ? <Table headers={["成员", "课题角色", "职责", "状态", "加入时间"]} rows={members.map((member) => [<span className="rs-person" key="name"><i>{userName(member.userId).slice(0, 1)}</i><b>{userName(member.userId)}</b></span>, member.role, member.role === "Topic Leader" ? "研究路线与关键决策" : "科研任务执行与协作", <Badge key="status">正常</Badge>, member.joinedAt.slice(0, 10)])} /> : <Empty>当前课题还没有成员。</Empty>)}
    {tab === "tasks" && (tasks.length ? <Table headers={["任务名称", "任务阶段", "负责人", "更新时间", "状态", "操作"]} rows={tasks.map((task) => [task.name, task.type, userName(task.ownerId), task.updatedAt.slice(0, 16).replace("T", " "), <Badge key="status">{taskLabels[task.status]}</Badge>, <Link className="v-button" href={`${base}/tasks?task=${task.id}`} key="action">查看/继续任务</Link>])} /> : <Empty action={<Link className="v-button primary" href="/workspace">发起科研任务</Link>}>当前课题还没有科研任务。</Empty>)}
    {tab === "outputs" && (outputs.length ? <Table headers={["名称", "类型", "版本", "状态", "来源任务", "更新时间"]} rows={outputs.map((output) => [output.name, output.type, output.version, <Badge key="status">{output.status}</Badge>, tasks.find((task) => task.id === output.taskId)?.name ?? "—", output.updatedAt.slice(0, 16).replace("T", " ")])} /> : <Empty>当前课题还没有科研产出。</Empty>)}
    <span className="sr-only">当前用户：{profiles[s.profileKey]?.name ?? p.name}</span>
  </div>;
}
