'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Network, Plus, Quote, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/research/workspace-kit';
import { EmptyState, ReadBadge, ReadPage, ReadPanel, useReadTask } from './ui';
import { type Evidence, taskRoute } from './types';

type GraphNode = { id: string; label: string; kind: string; detail: string; evidenceIds: string[]; resourceIds: string[]; color: string };
type GraphEdge = { from: string; to: string; relation: string };
const colors: Record<string, string> = { 科研问题: '#b4232d', 文献: '#617e99', 专利: '#b9965c', 标准: '#a08cb4', 证据: '#68a086', 方法: '#8f9e62', 参数: '#b58b64', 模型: '#778da8', 实验: '#7ba5a0', 科研产物: '#ba747d', 研究笔记: '#9c899d' };

export function ReadGraph() {
  const { project, task } = useReadTask();
  return <GraphWorkspace key={`${project.id}-${task?.id || 'new'}`} />;
}

function GraphWorkspace() {
  const { task, project, resources, artifacts, evidence, notes, tasks, createTask, updateTask, addResource, addResources, addEvidence, addArtifact, addNote } = useReadTask();
  const router = useRouter();
  const [relation, setRelation] = useState('全部关系');
  const [depth, setDepth] = useState(2);
  const [selectedId, setSelectedId] = useState('root');
  const [source, setSource] = useState<Evidence | null>(null);
  const [question, setQuestion] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [target, setTarget] = useState('');
  const [sourceOpen, setSourceOpen] = useState(false);
  const contextEvidence = evidence.filter(e => e.projectId === project.id && e.taskId === task?.id);
  const contextArtifacts = artifacts.filter(a => a.projectId === project.id && a.taskId === task?.id && !a.type.endsWith('配置'));
  const contextResources = resources.filter(r => r.projectId === project.id && task?.resourceIds.includes(r.id));
  const contextNotes = notes.filter(n => n.projectId === project.id && n.taskId === task?.id && !n.sourceId.startsWith('graph-'));
  const nodes: GraphNode[] = [{ id: 'root', label: task?.title || project.name, kind: '科研问题', detail: task?.goal || '选择一个研究任务，建立围绕科研问题的证据关系。', evidenceIds: contextEvidence.map(e => e.id), resourceIds: task?.resourceIds || [], color: colors.科研问题 }];
  const edges: GraphEdge[] = [];
  contextResources.forEach(r => { nodes.push({ id: r.id, label: r.name, kind: r.kind, detail: `${r.kind} · ${r.status}`, evidenceIds: contextEvidence.filter(e => e.sourceId === r.id).map(e => e.id), resourceIds: [r.id], color: colors[r.kind] || colors.文献 }); edges.push({ from: 'root', to: r.id, relation: '资料引用' }); });
  contextArtifacts.forEach(a => {
    const kind = a.type.includes('方法') ? '方法' : a.type.includes('参数') ? '参数' : a.type.includes('模型') ? '模型' : a.type.includes('实验') ? '实验' : '科研产物';
    nodes.push({ id: a.id, label: a.title, kind, detail: a.content, evidenceIds: a.evidenceIds, resourceIds: contextEvidence.filter(e => a.evidenceIds.includes(e.id)).map(e => e.sourceId), color: colors[kind] }); edges.push({ from: 'root', to: a.id, relation: '研究产出' });
  });
  contextNotes.forEach(n => { nodes.push({ id: n.id, label: n.text.slice(0, 35), kind: '研究笔记', detail: n.text, evidenceIds: n.evidenceIds, resourceIds: [n.sourceId], color: colors.研究笔记 }); edges.push({ from: 'root', to: n.id, relation: '研究产出' }); });
  contextEvidence.forEach(e => {
    nodes.push({ id: e.id, label: e.location, kind: '证据', detail: e.excerpt, evidenceIds: [e.id], resourceIds: [e.sourceId], color: colors.证据 });
    edges.push({ from: nodes.some(n => n.id === e.sourceId) ? e.sourceId : 'root', to: e.id, relation: '证据支撑' });
    contextArtifacts.filter(a => a.evidenceIds.includes(e.id)).forEach(a => edges.push({ from: e.id, to: a.id, relation: '证据支撑' }));
  });
  const selected = nodes.find(n => n.id === selectedId) || nodes[0];
  const activeEvidence = contextEvidence.filter(e => selected.evidenceIds.includes(e.id));
  const firstHop = new Set(edges.filter(e => e.from === 'root').map(e => e.to));
  const relationEdges = edges.filter(e => relation === '全部关系' || e.relation === relation);
  const relevantIds = new Set(relationEdges.flatMap(e => [e.from, e.to]));
  const visibleNodes = nodes.filter(n => n.id === 'root' || ((depth === 2 || firstHop.has(n.id)) && (relation === '全部关系' || relevantIds.has(n.id))));
  const maxVisible = visibleNodes.slice(0, 28);
  const positions = new Map<string, { x: number; y: number }>([['root', { x: 430, y: 265 }]]);
  const inner = maxVisible.filter(n => n.id !== 'root' && n.kind !== '证据');
  const outer = maxVisible.filter(n => n.kind === '证据');
  inner.forEach((n, i) => { const angle = (Math.PI * 2 * i / inner.length) - Math.PI / 2; positions.set(n.id, { x: 430 + Math.cos(angle) * 210, y: 265 + Math.sin(angle) * 155 }); });
  outer.forEach((n, i) => { const angle = (Math.PI * 2 * i / outer.length) - Math.PI / 2 + 0.22; positions.set(n.id, { x: 430 + Math.cos(angle) * 345, y: 265 + Math.sin(angle) * 205 }); });
  const chatNotes = notes.filter(n => n.taskId === task?.id && n.projectId === project.id && n.sourceId === `graph-${selected.id}`).slice(0, 3);
  function ensureTask() {
    if (task) return task.id;
    const id = createTask(`${project.name} · 知识关系研究`, '科研思路探索', project.id);
    router.replace(`${taskRoute({ id, type: '科研思路探索', projectId: project.id }).replace('/read-space/agent', '/knowledge-graph')}`);
    return id;
  }
  function seed() {
    const taskId = ensureTask();
    const first = `${project.id}-graph-literature-1`;
    const second = `${project.id}-graph-literature-2`;
    const standard = `${project.id}-graph-standard-1`;
    const patent = `${project.id}-graph-patent-1`;
    [{ id: first, name: '高温高压条件下页岩裂缝扩展（示例文献）', kind: '文献' as const }, { id: second, name: '循环热历史与岩石渗透率演化（示例文献）', kind: '文献' as const }, { id: standard, name: 'DEMO-CN-A:2025 岩石试验方法（示例标准）', kind: '标准' as const }, { id: patent, name: 'DEMO-CN-001 真三轴试验装置（示例专利）', kind: '专利' as const }].forEach(r => addResource({ ...r, status: '示例资料 · 可查看证据', projectId: project.id }));
    addResources([first, second, standard, patent], taskId);
    const firstEvidence = addEvidence({ projectId: project.id, taskId, sourceId: first, source: '高温高压条件下页岩裂缝扩展（示例文献）', location: 'P5 · Section 2.3', page: 5, excerpt: '示例实验采用真三轴加载，控制温度为 150 °C、围压为 30 MPa，记录裂缝起裂与扩展过程。当前结果仅支持该试验条件下的比较。', confirmed: false, access: '演示原文' });
    const secondEvidence = addEvidence({ projectId: project.id, taskId, sourceId: second, source: '循环热历史与岩石渗透率演化（示例文献）', location: 'P8 · Figure 4', page: 8, excerpt: '示例观测显示，循环热历史会改变微裂隙分布与渗透率；该研究未同步改变三个主应力方向，跨研究比较需要控制边界条件。', confirmed: false, access: '演示原文' });
    const standardEvidence = addEvidence({ projectId: project.id, taskId, sourceId: standard, source: 'DEMO-CN-A:2025', location: '§ 5.1 · 温度条件', page: 5, excerpt: '示例标准温度范围为 25～150 °C，超出范围的试验需单独验证方法适用性。', confirmed: false, access: '演示原文' });
    const patentEvidence = addEvidence({ projectId: project.id, taskId, sourceId: patent, source: 'DEMO-CN-001', location: '权利要求 1', page: 1, excerpt: '示例权利要求描述三个独立方向加载与分区温控模块，用于观察温压耦合条件下岩石响应。', confirmed: false, access: '演示原文' });
    const specs = [
      { type: '研究方法卡', title: '真三轴温压耦合实验', content: '通过独立加载与温度控制，比较不同边界条件下裂缝扩展。应明确应力路径和样品方向。', evidenceIds: [firstEvidence, patentEvidence] },
      { type: '参数表', title: '温度 150 °C · 围压 30 MPa', content: '温度：150 °C；围压：30 MPa。来源 P5 · Section 2.3。当前为演示提取值，待人工确认。', evidenceIds: [firstEvidence, standardEvidence] },
      { type: '候选模型', title: '热力耦合损伤模型', content: '候选模型需结合温度相关损伤参数与裂缝扩展观测校准，当前证据不足以确定参数唯一性。', evidenceIds: [firstEvidence, secondEvidence] },
      { type: '实验方案候选', title: '循环热历史对照实验', content: '候选设计：固定围压，改变热循环次数；设置无循环对照组，并同步采集裂缝和渗流数据。', evidenceIds: [secondEvidence, standardEvidence] },
    ];
    specs.forEach(a => { if (!contextArtifacts.some(existing => existing.title === a.title)) addArtifact({ ...a, projectId: project.id, taskId, mode: 'AI', confirmed: false }); });
    if (!task) updateTask(taskId, { status: '等待确认' });
    toast.success('示例研究资料、证据和产物已加入当前任务');
  }
  function ask(text = question) {
    if (!text.trim()) return;
    const taskId = ensureTask();
    let answer = activeEvidence.length ? `围绕「${selected.label}」，当前可用 ${activeEvidence.length} 条证据：\n${activeEvidence.slice(0, 3).map((e, i) => `[${i + 1}] ${e.excerpt}\n来源：${e.source} · ${e.location}`).join('\n\n')}\n\n${/冲突|局限|反向|空白/.test(text) ? '这些证据的实验边界与研究对象可能不同。当前尚不能将条件差异直接归为观点冲突，应补充相同条件的对照证据。' : '上述材料支持梳理研究方法与参数边界；尚未人工确认的证据需要核对原文后再用于计算或实验。'}` : '当前节点尚无关联证据，不能形成有依据的研究结论。请添加来源资料、研读证据或导入示例关系，再继续分析。';
    if (/参数|条件/.test(text) && activeEvidence.length) answer += '\n建议在参数产物中保留单位、边界条件、来源位置与确认状态。';
    addNote({ projectId: project.id, taskId, sourceId: `graph-${selected.id}`, text: `问题：${text.trim()}\n\n${answer}`, author: 'AI', evidenceIds: activeEvidence.map(e => e.id) });
    setQuestion('');
  }
  function addToTask() {
    const targetId = target || createTask(`继续研究：${selected.label}`, '科研思路探索', project.id);
    addResources(selected.resourceIds, targetId);
    const evidenceIds = activeEvidence.map(e => addEvidence({ projectId: project.id, taskId: targetId, sourceId: e.sourceId, source: e.source, location: e.location, page: e.page, excerpt: e.excerpt, confirmed: e.confirmed, access: e.access }));
    if (selected.kind !== '文献' && selected.kind !== '专利' && selected.kind !== '标准') addArtifact({ projectId: project.id, taskId: targetId, type: `关联${selected.kind}`, title: selected.label, content: selected.detail, evidenceIds, mode: '混合', confirmed: false });
    setAddOpen(false);
    toast.success('所选节点与来源证据已加入研究任务');
  }
  const connected = edges.filter(e => e.from === selected.id || e.to === selected.id);

  return <ReadPage title="科研知识关系" description="围绕当前问题组织文献、标准、专利、方法、参数与科研结论，查看每个判断的证据。" actions={<><ReadBadge>{task?.title || '当前课题上下文'}</ReadBadge><button className="rs-outline-btn" onClick={seed}><Plus size={14} />添加示例研究关系</button></>}>
    {!task || nodes.length === 1 ? <ReadPanel><EmptyState title="从研究资料建立知识关系" description="任务中的资源、证据和产物会自动出现在这里。可以先加载示例关系，体验证据追溯、筛选与研究问答。"><button className="rs-primary-btn" onClick={seed}><Network size={15} />加载示例研究关系</button></EmptyState></ReadPanel>
    : <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px]"><ReadPanel title="当前任务知识关系" actions={<ReadBadge>{nodes.length} 个节点 · {edges.length} 条关系</ReadBadge>}><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs text-slate-500">关系<select className="research-input max-w-36" value={relation} onChange={e => setRelation(e.target.value)}>{['全部关系', '资料引用', '证据支撑', '研究产出'].map(r => <option key={r}>{r}</option>)}</select></label><div className="flex gap-1 rounded bg-slate-50 p-1">{[1, 2].map(value => <button key={value} className={`rounded px-3 py-1.5 text-xs ${depth === value ? 'bg-white font-medium text-[#b4232d] shadow-sm' : 'text-slate-500'}`} onClick={() => setDepth(value)} aria-pressed={depth === value}>展开{value === 1 ? '一' : '两'}跳</button>)}</div></div>
      <div className="overflow-hidden rounded-lg border border-slate-100 bg-[radial-gradient(#e8e9ec_1px,transparent_1px)] [background-size:18px_18px]"><svg viewBox="0 0 860 530" className="min-h-[350px] w-full" role="img" aria-label="当前科研任务知识关系图，节点可点击或键盘选择"><title>科研知识关系图</title>{relationEdges.filter(e => positions.has(e.from) && positions.has(e.to)).map((e, i) => { const a = positions.get(e.from)!; const b = positions.get(e.to)!; const highlight = e.from === selected.id || e.to === selected.id; return <line key={`${e.from}-${e.to}-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={highlight ? '#bd7179' : '#d8dce1'} strokeWidth={highlight ? 2 : 1} strokeDasharray={e.relation === '证据支撑' ? '4 4' : undefined} />; })}{maxVisible.map(n => { const position = positions.get(n.id)!; const radius = n.id === 'root' ? 48 : n.kind === '证据' ? 26 : 35; const label = n.label.length > 14 ? `${n.label.slice(0, 13)}…` : n.label; return <g key={n.id} role="button" tabIndex={0} aria-label={`${n.kind}：${n.label}`} onClick={() => setSelectedId(n.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(n.id); } }} className="cursor-pointer outline-none" transform={`translate(${position.x},${position.y})`}><title>{n.kind}：{n.label}</title><circle r={radius + 5} fill="white" stroke={selected.id === n.id ? n.color : 'transparent'} strokeWidth={2} /><circle r={radius} fill={n.id === 'root' ? n.color : `${n.color}20`} stroke={n.id === 'root' ? n.color : `${n.color}80`} /><text textAnchor="middle" y={n.id === 'root' ? -5 : 4} fill={n.id === 'root' ? 'white' : n.color} fontSize={n.id === 'root' ? 14 : 11} fontWeight={600}>{n.kind}</text>{n.id === 'root' && <text textAnchor="middle" y={16} fill="white" fontSize={10}>当前研究任务</text>}<text textAnchor="middle" y={radius + 23} fill="#58616f" fontSize={10}>{label}</text></g>; })}</svg></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">{[...new Set(nodes.map(n => n.kind))].map(kind => <span className="flex items-center gap-1.5" key={kind}><i className="size-2 rounded-full" style={{ background: colors[kind] || colors.文献 }} />{kind}</span>)}</div>{visibleNodes.length > 28 && <p className="rs-note mt-3">图中展示前 28 个节点；下方列表可选择全部 {visibleNodes.length} 个节点，证据与产物不会丢失。</p>}<div className="mt-5 border-t border-slate-100 pt-4"><label className="grid gap-2 text-xs text-slate-500">查找并选中节点<select className="research-input" value={selected.id} onChange={e => setSelectedId(e.target.value)}>{nodes.map(n => <option key={n.id} value={n.id}>{n.kind} · {n.label}</option>)}</select></label></div>
    </ReadPanel><div className="space-y-4"><ReadPanel title="节点信息" actions={<ReadBadge>{selected.kind}</ReadBadge>}><h3 className="mb-3 text-sm font-semibold leading-6">{selected.label}</h3><p className="max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-7 text-slate-600">{selected.detail}</p><div className="mt-4 flex gap-3 text-xs text-slate-500"><span>{connected.length} 条关联</span><span>{activeEvidence.length} 条证据</span></div><div className="mt-4 flex flex-wrap gap-2"><button className="rs-primary-btn" onClick={() => { setTarget(task?.id || ''); setAddOpen(true); }}><Plus size={13} />加入研究任务</button><button className="rs-outline-btn" onClick={() => setSourceOpen(true)}><FileText size={13} />查看来源</button></div></ReadPanel><ReadPanel title="来源证据">{activeEvidence.length ? <div className="space-y-3">{activeEvidence.map(e => <button key={e.id} className="w-full rounded-md border border-slate-200 p-3 text-left hover:border-[#b4232d]" onClick={() => setSource(e)}><span className="mb-2 flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-xs text-[#b4232d]"><Quote size={12} />{e.location}</span><ReadBadge tone={e.confirmed ? 'green' : 'amber'}>{e.confirmed ? '已确认' : '待确认'}</ReadBadge></span><span className="block text-xs leading-6 text-slate-500">{e.source}</span></button>)}</div> : <p className="text-xs leading-6 text-slate-500">当前节点没有直接关联的证据，可从文献研读或分析结果中补充。</p>}</ReadPanel></div>
    <ReadPanel title="围绕当前节点向 AI 提问" className="xl:col-span-2" actions={<ReadBadge>分析范围：{selected.kind}</ReadBadge>}><div className="mb-4 flex flex-wrap gap-2">{['这些证据支持什么结论？', '有哪些参数和试验条件？', '证据之间存在冲突或局限吗？'].map(q => <button className="rs-outline-btn" key={q} onClick={() => ask(q)}>{q}</button>)}</div>{chatNotes.map(n => <article key={n.id} className="mb-4 rounded-md bg-slate-50 p-4"><div className="mb-2 flex items-center gap-2"><ReadBadge>AI 模拟分析</ReadBadge><small className="text-xs text-slate-400">{new Date(n.updatedAt).toLocaleString('zh-CN')}</small></div><p className="whitespace-pre-wrap text-xs leading-7 text-slate-600">{n.text}</p><div className="mt-3 flex flex-wrap gap-2">{contextEvidence.filter(e => n.evidenceIds.includes(e.id)).map(e => <button className="rs-link-btn" key={e.id} onClick={() => setSource(e)}><Quote size={12} />{e.location}</button>)}</div></article>)}<form className="flex gap-2" onSubmit={e => { e.preventDefault(); ask(); }}><input className="research-input flex-1" aria-label="向知识关系助手提问" placeholder={`针对「${selected.label.slice(0, 20)}」提出问题…`} value={question} onChange={e => setQuestion(e.target.value)} /><button className="rs-primary-btn" type="submit" disabled={!question.trim()} aria-label="发送研究问题"><Send size={15} /></button></form></ReadPanel></div>}
    <Modal open={!!source} onClose={() => setSource(null)} title="证据与来源" description="保留来源、位置、获取时间与人工确认状态。">{source && <div className="space-y-4"><ReadBadge tone={source.confirmed ? 'green' : 'amber'}>{source.confirmed ? '人工已确认' : '待人工确认'}</ReadBadge><h3 className="font-medium">{source.source}</h3><p className="text-sm text-slate-500">{source.location} · P{source.page}</p><blockquote className="border-l-2 border-[#b4232d] bg-slate-50 p-4 text-sm leading-7">{source.excerpt}</blockquote><p className="text-xs text-slate-500">{source.access} · {new Date(source.acquiredAt).toLocaleString('zh-CN')}</p></div>}</Modal>
    <Modal open={sourceOpen} onClose={() => setSourceOpen(false)} title="节点来源与关联" description="以下内容来自当前任务中的资料、证据与科研产物。"><h3 className="text-sm font-semibold">{selected.label}</h3><p className="whitespace-pre-wrap text-xs leading-7 text-slate-600">{selected.detail}</p><div className="space-y-3">{selected.resourceIds.map(id => { const resource = resources.find(r => r.id === id && r.projectId === project.id); return <div key={id} className="flex items-start gap-2 rounded bg-slate-50 p-3 text-xs"><FileText size={14} /><span>{resource?.name || id}<small className="mt-1 block text-slate-400">{resource?.kind || '引用资料'} · {resource?.status || '当前任务引用'}</small></span></div>; })}{activeEvidence.map(e => <button key={e.id} className="rs-link-btn mr-3" onClick={() => { setSourceOpen(false); setSource(e); }}><Quote size={12} />{e.location}<ArrowRight size={12} /></button>)}</div></Modal>
    <Modal open={addOpen} onClose={() => setAddOpen(false)} title="加入研究任务" description="同时携带所选节点的来源与证据，保持课题上下文。"><h3 className="text-sm font-medium">{selected.label}</h3><label className="grid gap-2 text-xs text-slate-500">目标任务<select className="research-input" value={target} onChange={e => setTarget(e.target.value)}><option value="">新建科研思路探索任务</option>{tasks.filter(t => t.projectId === project.id).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><p className="text-xs text-slate-500">携带 {selected.resourceIds.length} 项来源资料与 {activeEvidence.length} 条证据。</p><button className="rs-primary-btn" onClick={addToTask}>确认加入</button></Modal>
  </ReadPage>;
}
