'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Database, Search, X } from 'lucide-react';
import type { Capability } from '@/lib/capabilities';
import { capabilities } from '@/lib/capabilities';
import { assets, projects, tools, type ResearchRecord } from '@/mock/research';
import { useSidebar } from '@/components/layout/sidebar-context';
import { Tabs, NextActions, useLocalState } from '@/components/research/workspace-kit';
import { AssetRegister } from '@/components/research/asset-register';
import { useSearchParams } from 'next/navigation';

const versionFor = (record: ResearchRecord) => record.id.includes('MODEL') ? 'v2' : record.id.includes('PLAN') ? 'v3' : 'v1';

export function AssetWorkspace({ item }: { item: Capability }) {
  const { role } = useSidebar();
  const params = useSearchParams();
  const [assetType, setAssetType] = useState(params.get('category') === 'outcome' ? '科研成果' : '全部');
  const [query, setQuery] = useState('');
  const [registered,setRegistered]=useLocalState<ResearchRecord[]>('ai4s-registered-assets',[]);
  const availableAssets=[...assets,...registered];
  const [selected, setSelected] = useState<ResearchRecord | null>(null);
  const [targetProject, setTargetProject] = useState(projects[0].id);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [attachments, setAttachments] = useState<Record<string,string[]>>({});
  const categoryRecords = item.href.endsWith('/data-knowledge') ? availableAssets.filter((record) => (record.id.includes('DATA') || record.id.includes('KNOW') || record.id.includes('RESULT')) && (assetType === '全部' || record.id.includes(assetType === '科研数据' ? 'DATA' : assetType === '科研知识' ? 'KNOW' : 'RESULT')))
    : item.href.endsWith('/models') ? availableAssets.filter((record) => record.id.includes('MODEL'))
    : item.href.endsWith('/plans') ? availableAssets.filter((record) => record.id.includes('PLAN')) : tools;
  const rows = useMemo(() => categoryRecords.filter((record) => `${record.name} ${record.id} ${record.project}`.toLowerCase().includes(query.toLowerCase().trim())), [categoryRecords, query]);
  const canApprove = role === 'lead' || role === 'manager' || role === 'admin';

  useEffect(() => {
    try {
      setSubscribedIds(JSON.parse(localStorage.getItem('ai4s-subscribed-assets') ?? '[]'));
      setApprovedIds(JSON.parse(localStorage.getItem('ai4s-approved-assets') ?? '[]'));
      setAttachments(JSON.parse(localStorage.getItem('ai4s-project-assets') ?? '{}'));
    } catch {
      setSubscribedIds([]); setApprovedIds([]); setAttachments({});
    }
  }, []);

  const subscribe = (record: ResearchRecord) => {
    const next = subscribedIds.includes(record.id) ? subscribedIds.filter((id) => id !== record.id) : [...subscribedIds,record.id];
    localStorage.setItem('ai4s-subscribed-assets',JSON.stringify(next));setSubscribedIds(next);
  };
  const approve = (record: ResearchRecord) => {
    const next = [...new Set([...approvedIds,record.id])];
    localStorage.setItem('ai4s-approved-assets',JSON.stringify(next));setApprovedIds(next);
    setFeedback(`${record.name} 已通过审核，可复用到课题。`);
  };
  const reuse = (record: ResearchRecord) => {
    const next = {...attachments,[targetProject]:[...new Set([...(attachments[targetProject] ?? []),record.id])]};
    localStorage.setItem('ai4s-project-assets',JSON.stringify(next));setAttachments(next);
    setFeedback(`${record.name} 已关联至 ${projects.find((project) => project.id === targetProject)?.name ?? targetProject}。`);
  };
  const selectedApproved = selected && (selected.status === '已完成' || approvedIds.includes(selected.id));

  return <div className="mx-auto max-w-[1500px] space-y-4">
    <div className="flex justify-end"><AssetRegister onCreate={(record)=>{setRegistered(all=>[...all,record]);setFeedback("资产已登记，审核后可共享使用。");}}/></div>
    {item.href.endsWith('/data-knowledge') && <Tabs tabs={['全部','科研数据','科研知识','科研成果']} value={assetType} onChange={setAssetType} />}
    <header className="border-t-[3px] border-primary pb-4 pt-4"><p className="text-xs text-muted-foreground">科研资产</p><h1 className="mt-1 text-2xl font-semibold">{item.label}</h1><p className="mt-2 text-sm text-muted-foreground">按课题、版本和权限查找科研资产，审核后可复用到新的科研工作。</p></header>
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-line bg-white p-2" aria-label="资产分类">{capabilities.filter((entry) => entry.group === '科研资产').map((entry) => <Link key={entry.id} href={entry.href} className={`shrink-0 rounded-md px-3 py-2 text-xs ${entry.id === item.id ? 'bg-[#FCEBEC] font-semibold text-[#7F1116]' : 'text-muted-foreground hover:bg-[#F8FAFC]'}`}>{entry.label}</Link>)}</nav>
    {feedback && <div role="status" className="flex items-center gap-2 rounded-md border border-[#B9E6D1] bg-[#E9F7F1] px-4 py-2 text-sm text-[#168B68]"><CheckCircle2 className="size-4" />{feedback}</div>}
    <section className="grid gap-3 sm:grid-cols-3">{[['当前分类',categoryRecords.length],['可复用',categoryRecords.filter((record) => record.status === '已完成' || approvedIds.includes(record.id)).length],['已订阅',categoryRecords.filter((record) => subscribedIds.includes(record.id)).length]].map(([label,value]) => <div key={label} className="rounded-lg border border-line bg-white p-4"><span className="text-xs text-muted-foreground">{label}</span><strong className="mt-1 block text-2xl font-semibold">{value}</strong></div>)}</section>
    <section className="overflow-hidden rounded-lg border border-line bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4"><h2 className="text-base font-semibold">资产目录</h2><div className="flex h-9 items-center gap-2 rounded-md border border-line px-3"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索资产" placeholder="搜索资产、编号或课题" className="w-52 bg-transparent text-xs outline-none" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[13px]"><thead className="h-10 bg-[#F8FAFC] text-xs text-muted-foreground"><tr><th className="px-4 font-medium">资产名称 / 编号</th><th className="px-4 font-medium">版本</th><th className="px-4 font-medium">所属课题</th><th className="px-4 font-medium">来源</th><th className="px-4 font-medium">审核状态</th><th className="px-4 font-medium">操作</th></tr></thead><tbody>{rows.map((record) => <tr key={record.id} className="h-14 border-t border-line hover:bg-[#FFF7F7]"><td className="px-4"><button onClick={() => {setSelected(record);setFeedback('');}} className="font-medium hover:text-primary hover:underline">{record.name}</button><small className="block text-muted-foreground">{record.id}</small></td><td className="px-4">{versionFor(record)}</td><td className="max-w-48 truncate px-4 text-muted-foreground">{record.project}</td><td className="px-4 text-muted-foreground">{record.source}</td><td className="px-4"><span className={`rounded px-2 py-1 text-[11px] ${record.status === '已完成' || approvedIds.includes(record.id) ? 'bg-[#E9F7F1] text-[#168B68]' : 'bg-[#FFF4E5] text-[#B65E00]'}`}>{record.status === '已完成' || approvedIds.includes(record.id) ? '可复用' : '待审核'}</span></td><td className="px-4"><button onClick={() => {setSelected(record);setFeedback('');}} className="text-primary hover:underline">查看详情</button></td></tr>)}</tbody></table>{!rows.length && <p className="py-10 text-center text-sm text-muted-foreground">未找到匹配的资产，请调整搜索条件。</p>}</div></section>
    {selected && <div className="fixed inset-0 z-50 flex justify-end bg-[#101828]/35" onMouseDown={() => setSelected(null)}><aside onMouseDown={(event) => event.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"><div className="flex items-start justify-between border-b border-line p-5"><div><span className="text-xs text-muted-foreground">{selected.id} · {versionFor(selected)}</span><h2 className="mt-1 text-lg font-semibold">{selected.name}</h2></div><button onClick={() => setSelected(null)} aria-label="关闭资产详情"><X className="size-5" /></button></div><div className="flex-1 space-y-5 overflow-y-auto p-5"><p className="text-sm leading-6 text-muted-foreground">{selected.description}</p><dl className="grid grid-cols-[90px_1fr] gap-y-3 text-sm"><dt className="text-muted-foreground">所属课题</dt><dd>{selected.project}</dd><dt className="text-muted-foreground">负责人</dt><dd>{selected.owner}</dd><dt className="text-muted-foreground">来源系统</dt><dd>{selected.source}</dd><dt className="text-muted-foreground">更新时间</dt><dd>{selected.updatedAt}</dd><dt className="text-muted-foreground">授权范围</dt><dd>课题组内可见</dd></dl><div className="rounded-md border border-line bg-[#F8FAFC] p-3 text-xs leading-5 text-muted-foreground"><Database className="mb-2 size-4 text-primary" />复用将资产编号关联到目标课题，保留原始版本和来源，不会修改源资产。</div><NextActions sourceId={selected.id}/><div><label htmlFor="reuse-project" className="mb-2 block text-sm font-medium">复用到课题</label><select id="reuse-project" value={targetProject} onChange={(event) => setTargetProject(event.target.value)} className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm">{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>{feedback && <p role="status" className="text-sm text-[#168B68]">{feedback}</p>}</div><div className="flex flex-wrap gap-2 border-t border-line p-5"><button onClick={() => subscribe(selected)} className="h-9 flex-1 rounded-md border border-line text-sm">{subscribedIds.includes(selected.id) ? '取消订阅' : '订阅更新'}</button>{!selectedApproved && canApprove && <button onClick={() => approve(selected)} className="h-9 flex-1 rounded-md border border-primary text-sm text-primary">通过审核</button>}<button disabled={!selectedApproved} onClick={() => reuse(selected)} className="h-9 flex-1 rounded-md bg-primary text-sm text-white disabled:bg-[#98A2B3]">复用到课题</button></div>{!selectedApproved && !canApprove && <p className="px-5 pb-4 text-xs text-muted-foreground">资产需经负责人或管理角色审核后才能复用。</p>}</aside></div>}
  </div>;
}
