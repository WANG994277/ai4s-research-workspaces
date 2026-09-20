'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocalState, useResearchProject } from '@/components/research/workspace-kit';
import { ProjectCollaboration } from '@/components/research/project-collaboration';
import { ArrowRight, BookOpen, Calculator, Check, Clock3, Database, FlaskConical, FolderKanban, Search, TriangleAlert } from 'lucide-react';
import { projects, literature, computeTasks, experiments, assets } from '@/mock/research';

type ProjectTab = '概览' | '任务与里程碑' | '关联资料' | '课题协同配置';
const initialTasks = [
  { id: 'TASK-01', projectId: 'PROJ-CCUS-01', title: '复核催化活性异常数据', owner: '张博士', due: '今天 18:00', status: '待处理' },
  { id: 'TASK-02', projectId: 'PROJ-CCUS-01', title: '提交中期评审材料', owner: '张博士', due: '3 天后', status: '待处理' },
  { id: 'TASK-03', projectId: 'PROJ-CCUS-01', title: '归档 VASP 计算结果', owner: '李工', due: '9 月 18 日', status: '已完成' },
  { id: 'TASK-04', projectId: 'PROJ-PE-02', title: '确认下一轮配方参数', owner: '李工', due: '明天', status: '待处理' },
  { id: 'TASK-05', projectId: 'PROJ-HDS-04', title: '准备固定床反应验证', owner: '赵博士', due: '9 月 19 日', status: '待处理' },
];

export function ProjectWorkspace() {
  const { project } = useResearchProject();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(project.id);
  useEffect(() => setSelectedId(project.id), [project.id]);
  const [tab, setTab] = useState<ProjectTab>('概览');
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useLocalState('ai4s-project-tasks-v2', initialTasks);
  const [attachedAssetIds, setAttachedAssetIds] = useState<Record<string,string[]>>({});
  useEffect(() => {
    try { setAttachedAssetIds(JSON.parse(localStorage.getItem('ai4s-project-assets') ?? '{}')); }
    catch { setAttachedAssetIds({}); }
  }, []);
  const selected = projects.find((item) => item.id === selectedId) ?? projects[0];
  const visibleProjects = useMemo(() => projects.filter((item) => item.name.toLowerCase().includes(query.toLowerCase().trim())), [query]);
  const projectTasks = tasks.filter((item) => item.projectId === selected.id);
  const related = [...literature, ...computeTasks, ...experiments, ...assets].filter((item) => item.project === selected.name || (item.kind === 'asset' && attachedAssetIds[selected.id]?.includes(item.id)));
  const links = [
    { label: '文献与标准检索', href: '/literature-search', icon: BookOpen, color: '#2878D0' },
    { label: '智能计算模拟任务', href: '/compute-tasks', icon: Calculator, color: '#0788A8' },
    { label: '实验管理', href: '/experiments', icon: FlaskConical, color: '#168B68' },
    { label: '科研数据及知识', href: '/assets/data-knowledge', icon: Database, color: '#A6191E' },
  ];

  return <div className="mx-auto max-w-[1500px] space-y-4">
    <header className="border-t-[3px] border-[#6558D3] pb-4 pt-4"><p className="text-xs text-muted-foreground">科研协作 / 课题协作</p><h1 className="mt-1 text-2xl font-semibold">课题协作</h1><p className="mt-2 text-sm text-muted-foreground">围绕课题跟踪任务、里程碑和读算做产物。</p></header>
    <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-lg border border-line bg-white p-3"><div className="flex items-center gap-2 px-1 pb-3"><FolderKanban className="size-4 text-[#6558D3]" /><h2 className="text-sm font-semibold">我的课题</h2><span className="ml-auto text-xs text-muted-foreground">{projects.length}</span></div><div className="flex h-9 items-center gap-2 rounded-md border border-line px-2"><Search className="size-3.5 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索课题" aria-label="搜索课题" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></div><div className="mt-2 space-y-1">{visibleProjects.map((project) => <button key={project.id} onClick={() => {setSelectedId(project.id);router.replace(`/collaboration/projects?projectId=${project.id}`);setTab('概览');}} className={`w-full rounded-md border-l-[3px] px-3 py-3 text-left ${selected.id === project.id ? 'border-primary bg-[#FCEBEC]' : 'border-transparent hover:bg-[#F8FAFC]'}`}><span className="block text-[13px] font-medium leading-5">{project.name}</span><span className="mt-1 block text-[11px] text-muted-foreground">{project.id} · {project.owner}</span></button>)}{visibleProjects.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">未找到课题</p>}</div></aside>

      <div className="min-w-0 space-y-4">
        <section className="rounded-lg border border-line bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold">{selected.name}</h2><span className={`rounded px-2 py-1 text-[11px] ${selected.status === '需关注' ? 'bg-[#FFF0EF] text-[#D92D20]' : 'bg-[#EAF3FD] text-[#2878D0]'}`}>{selected.status}</span></div><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{selected.description}</p></div><span className="text-xs text-muted-foreground">负责人：{selected.owner}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 md:grid-cols-4">{[['课题编号',selected.id],['待处理任务',String(projectTasks.filter((task) => task.status !== '已完成').length)],['关联对象',String(related.length)],['最近更新',selected.updatedAt]].map(([label,value]) => <div key={label}><span className="block text-xs text-muted-foreground">{label}</span><strong className="mt-1 block text-sm font-semibold">{value}</strong></div>)}</div></section>

        <section className="overflow-hidden rounded-lg border border-line bg-white"><div className="flex gap-5 border-b border-line px-5">{(['概览','任务与里程碑','关联资料','课题协同配置'] as ProjectTab[]).map((name) => <button key={name} onClick={() => setTab(name)} className={`h-11 border-b-2 text-sm ${tab === name ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{name}</button>)}</div>
          {tab === '概览' && <div className="space-y-5 p-5"><div><h3 className="text-sm font-semibold">当前进展</h3><div className="mt-3 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E7EBF0]"><div className="h-full w-[68%] rounded-full bg-[#2878D0]" /></div><strong className="text-sm">68%</strong></div><p className="mt-2 text-xs text-muted-foreground">已完成文献调研与首轮计算，正在复核实验数据并准备中期评审。</p></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded-md border border-line p-4"><Clock3 className="size-4 text-[#2878D0]" /><strong className="mt-2 block text-sm">本周关键节点</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">中期评审材料 3 天后到期</p></div><div className="rounded-md border border-line p-4"><TriangleAlert className="size-4 text-[#D92D20]" /><strong className="mt-2 block text-sm">风险提醒</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">催化活性实验数据需复核</p></div><div className="rounded-md border border-line p-4"><Database className="size-4 text-[#168B68]" /><strong className="mt-2 block text-sm">关联产物</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">计算结果、实验记录和数据资产</p></div></div></div>}
          {tab === '课题协同配置' && <ProjectCollaboration projectId={selected.id} />}
          {tab === '任务与里程碑' && <div className="p-5"><h3 className="text-sm font-semibold">任务列表</h3><div className="mt-3 divide-y divide-line border-y border-line">{projectTasks.length ? projectTasks.map((task) => <div key={task.id} className="flex flex-wrap items-center gap-3 py-3"><button onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? {...item,status: item.status === '已完成' ? '待处理' : '已完成'} : item))} aria-label={`${task.status === '已完成' ? '恢复' : '完成'}${task.title}`} className={`flex size-5 items-center justify-center rounded border ${task.status === '已完成' ? 'border-[#168B68] bg-[#168B68] text-white' : 'border-line'}`}>{task.status === '已完成' && <Check className="size-3" />}</button><div className="min-w-0 flex-1"><strong className="text-[13px]">{task.title}</strong><span className="ml-2 text-[11px] text-muted-foreground">{task.id}</span></div><span className="text-xs text-muted-foreground">{task.owner}</span><span className="text-xs text-muted-foreground">{task.due}</span><span className={`rounded px-2 py-1 text-[11px] ${task.status === '已完成' ? 'bg-[#E9F7F1] text-[#168B68]' : 'bg-[#FFF4E5] text-[#B65E00]'}`}>{task.status}</span></div>) : <p className="py-8 text-center text-sm text-muted-foreground">该课题暂无待办任务</p>}</div><p className="mt-3 text-xs text-muted-foreground">任务状态为原型演示，正式项目审批仍在来源系统办理。</p></div>}
          {tab === '关联资料' && <div className="p-5"><h3 className="text-sm font-semibold">关联对象</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{related.length ? related.map((record) => <div key={record.id} className="rounded-md border border-line p-3"><span className="text-[11px] text-muted-foreground">{record.id} · {record.source}</span><strong className="mt-1 block text-[13px]">{record.name}</strong><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{record.description}</p></div>) : <p className="text-sm text-muted-foreground">暂无关联资料</p>}</div></div>}
        </section>

        <section className="rounded-lg border border-line bg-white p-5"><h2 className="text-sm font-semibold">进入读算做</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{links.map(({label,href,icon:Icon,color}) => <Link key={href} href={`${href}?projectId=${selected.id}`} className="group flex items-center gap-2 rounded-md border border-line p-3 hover:border-primary/40"><Icon className="size-4 shrink-0" style={{color}} /><span className="min-w-0 flex-1 text-xs">{label}</span><ArrowRight className="size-3.5 text-faint group-hover:text-primary" /></Link>)}</div></section>
      </div>
    </div>
  </div>;
}
