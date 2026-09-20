'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Download, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/research/workspace-kit';
import { EmptyState, ReadBadge, ReadPage, ReadPanel, ReadTabs, downloadText, useReadTask } from './ui';
import { taskRoute } from './types';
import { useReadStore } from './store';

type Patent = { id: string; title: string; year: number; region: string; applicant: string; classification: string; legal: string; route: string; abstract: string; claims: string[]; family: string[] };
const patents: Patent[] = [
  { id: 'DEMO-CN-001', title: '高温高压条件下岩石真三轴试验装置', year: 2025, region: '中国', applicant: '华北岩石研究院（示例）', classification: 'G01N 3/00', legal: '有效', route: '试验装备', abstract: '通过独立加载与分区温控，模拟深层储层的温压耦合边界条件，采集岩石破裂过程响应。', claims: ['一种具有三个独立加载方向的岩石力学试验装置，包含耐热压力腔与闭环温控模块。', '根据权利要求 1 所述的装置，其中声发射采集端口与加载端口相互隔离。'], family: ['DEMO-CN-001', 'DEMO-WO-001'] },
  { id: 'DEMO-CN-002', title: '页岩水力压裂裂缝扩展监测方法', year: 2024, region: '中国', applicant: '东源能源技术（示例）', classification: 'E21B 43/26', legal: '审中', route: '监测与反演', abstract: '联合压力信号和声发射观测，识别不同围压路径下的页岩裂缝起裂与扩展过程。', claims: ['一种页岩压裂裂缝监测方法，包含同步采集注入压力、流量和声发射数据。', '将多个传感器信号映射至裂缝扩展时序，输出裂缝事件定位结果。'], family: ['DEMO-CN-002'] },
  { id: 'DEMO-US-003', title: 'Thermal fracture simulation for shale reservoirs', year: 2023, region: '美国', applicant: 'GeoLab Research（示例）', classification: 'G06F 30/20', legal: '有效', route: '数值模拟', abstract: '基于温度相关损伤本构与离散裂缝网络，模拟页岩储层热力耦合裂缝扩展。', claims: ['A method combining a temperature-dependent damage model with a discrete fracture network.', 'The method further calibrates model parameters using laboratory stress–strain observations.'], family: ['DEMO-US-003', 'DEMO-EP-003', 'DEMO-WO-003'] },
  { id: 'DEMO-CN-004', title: '面向储层改造的多场耦合参数反演方法', year: 2026, region: '中国', applicant: '华北岩石研究院（示例）', classification: 'G06F 30/20', legal: '审中', route: '监测与反演', abstract: '融合温度、应变与流动数据，反演渗透率演化及应力敏感参数，用于储层改造方案对比。', claims: ['一种热、流、固多场耦合参数反演方法，通过时序观测构建反演目标函数。', '采用可辨识性分析筛选有效参数并输出参数范围。'], family: ['DEMO-CN-004', 'DEMO-WO-004'] },
  { id: 'DEMO-EP-005', title: 'Cyclic heating apparatus for rock permeability', year: 2022, region: '欧洲', applicant: 'GeoLab Research（示例）', classification: 'G01N 15/08', legal: '失效', route: '试验装备', abstract: '循环升降温条件下的岩石渗透率测试装置，用于观察热历史对微裂隙与渗透性的影响。', claims: ['An apparatus comprising a heating jacket, a pressure vessel and a fluid flow measurement circuit.', 'The apparatus records permeability over repeated heating and cooling cycles.'], family: ['DEMO-EP-005'] },
  { id: 'DEMO-CN-006', title: '复杂应力路径下页岩压裂工艺优化方法', year: 2025, region: '中国', applicant: '东源能源技术（示例）', classification: 'E21B 43/26', legal: '有效', route: '压裂工艺', abstract: '结合应力路径、注入速率和流体黏度，优化页岩储层压裂工艺参数及分段策略。', claims: ['一种页岩压裂工艺优化方法，根据储层应力差和岩石参数生成注入控制方案。', '根据实时注入压力变化更新阶段注入速率。'], family: ['DEMO-CN-006', 'DEMO-US-006'] },
];
const analysisTabs = ['技术地图', '技术路线趋势', '主要申请人', '权利要求', '技术空白候选'];
const plan = ['理解技术主题', '生成检索策略', '多轮专利检索', '技术路线聚类', '分析申请人与权利要求', '识别技术空白候选'];
type PatentConfig = { mode?: string; query?: string; region?: string; legal?: string; year?: string; applicant?: string; classification?: string; selected?: string[]; instruction?: string; candidateNote?: string };
function parseConfig(content?: string): PatentConfig { try { return JSON.parse(content || '{}'); } catch { return {}; } }

export function ReadPatents() {
  const { project, task } = useReadTask();
  return <PatentWorkspace key={`${project.id}-${task?.id || 'new'}`} />;
}

function PatentWorkspace() {
  const { project, task, artifacts, createTask, updateTask, addResource, addResources, addEvidence, addArtifact, updateArtifact } = useReadTask();
  const router = useRouter();
  const configArtifact = artifacts.find(a => a.projectId === project.id && a.taskId === task?.id && a.type === '专利分析配置');
  const config = parseConfig(configArtifact?.content);
  const [mode, setMode] = useState(config.mode || '专利分析 Agent');
  const [tab, setTab] = useState(analysisTabs[0]);
  const [query, setQuery] = useState(config.query || '');
  const [region, setRegion] = useState(config.region || '全部');
  const [legal, setLegal] = useState(config.legal || '全部');
  const [year, setYear] = useState(config.year || '全部');
  const [applicant, setApplicant] = useState(config.applicant || '全部');
  const [classification, setClassification] = useState(config.classification || '全部');
  const [selected, setSelected] = useState<string[]>(config.selected || []);
  const [detail, setDetail] = useState<Patent | null>(null);
  const [detailTab, setDetailTab] = useState('基本信息');
  const [instruction, setInstruction] = useState(config.instruction || '分析高温高压条件下页岩裂缝扩展相关专利，识别技术路线和潜在空白。');
  const [candidateNote, setCandidateNote] = useState(config.candidateNote || '');
  const ownedArtifacts = artifacts.filter(a => a.taskId === task?.id && a.projectId === project.id);
  const candidate = ownedArtifacts.find(a => a.type === '技术空白候选');
  const analyzed = ownedArtifacts.some(a => a.type === '专利技术地图');
  const filtered = patents.filter(p => (!query || `${p.title} ${p.abstract} ${p.id} ${p.applicant} ${p.classification}`.toLowerCase().includes(query.toLowerCase())) && (region === '全部' || p.region === region) && (legal === '全部' || p.legal === legal) && (year === '全部' || p.year >= Number(year)) && (applicant === '全部' || p.applicant === applicant) && (classification === '全部' || p.classification === classification));
  const counts = (key: 'route' | 'applicant' | 'year') => Object.entries(filtered.reduce<Record<string, number>>((result, p) => { result[String(p[key])] = (result[String(p[key])] || 0) + 1; return result; }, {})).sort((a, b) => key === 'year' ? Number(a[0]) - Number(b[0]) : b[1] - a[1]);
  function ensureTask() {
    if (task) return task.id;
    const id = createTask(instruction.trim() || '页岩高温高压相关专利分析', '专利分析', project.id);
    router.replace(taskRoute({ id, type: '专利分析', projectId: project.id }));
    return id;
  }
  function saveConfig(taskId: string, patch: PatentConfig = {}) {
    const content = JSON.stringify({ mode, query, region, legal, year, applicant, classification, selected, instruction, candidateNote, ...patch });
    const existing = useReadStore.getState().artifacts.find(a => a.projectId === project.id && a.taskId === taskId && a.type === '专利分析配置');
    if (existing) updateArtifact(existing.id, { content });
    else addArtifact({ taskId, projectId: project.id, type: '专利分析配置', title: '专利检索范围与研究策略', content, evidenceIds: [], mode: '人工', confirmed: true });
  }
  function collect(items: Patent[], taskId: string) {
    const evidenceIds = items.map(p => {
      const sourceId = `${project.id}-${p.id}`;
      addResource({ id: sourceId, name: `${p.title} · ${p.id}`, kind: '专利', status: '示例专利 · 待核验', projectId: project.id });
      return addEvidence({ taskId, projectId: project.id, sourceId, source: `${p.title}（${p.id}）`, location: `${p.id} · 摘要 / 权利要求 1`, page: 1, excerpt: `${p.abstract}\n权利要求 1：${p.claims[0]}\n法律状态为示例：${p.legal}，核验时点为本轮模拟获取时间。`, confirmed: false, access: '演示原文' });
    });
    addResources(items.map(p => `${project.id}-${p.id}`), taskId);
    return evidenceIds;
  }
  function saveAnalysis(type = tab) {
    if (!filtered.length) { toast.error('当前无匹配专利，请调整筛选条件'); return; }
    const taskId = ensureTask();
    saveConfig(taskId);
    const evidenceIds = collect(filtered, taskId);
    const artifactType = type === '技术地图' ? '专利技术地图' : type === '权利要求' ? '权利要求分析' : type;
    const existing = ownedArtifacts.find(a => a.type === artifactType);
    const content = type === '技术空白候选'
      ? `# 技术空白候选：循环热历史与真三轴应力路径耦合\n\n当前 ${filtered.length} 件示例专利中，试验装备与数值模拟分别覆盖部分能力，尚未由当前检索集确认完整联用方案。\n\n候选属性：证据有限，需继续检索与人工核验，不构成新颖性或法律判断。\n\n人工研究判断：${candidateNote || '待补充'}\n\n来源：${filtered.map(p => p.id).join('、')}`
      : `# ${artifactType}（模拟）\n\n研究目标：${instruction}\n当前筛选：${query || '全部主题'} / ${region} / ${legal} / ${year}\n\n${type === '主要申请人' ? counts('applicant').map(([name, count]) => `- ${name}：${count} 件`).join('\n') : type === '技术路线趋势' ? counts('year').map(([name, count]) => `- ${name}：${count} 件`).join('\n') : filtered.map(p => `## ${p.title}\n${p.id} · ${p.year} · ${p.applicant}\n技术路线：${p.route}\n摘要：${p.abstract}\n${type === '权利要求' ? p.claims.map((c, i) => `权利要求 ${i + 1}：${c}`).join('\n') : ''}`).join('\n\n')}\n\n数据范围：本地 6 件示例专利；数量依据当前筛选结果，不代表全网统计。`;
    if (existing) updateArtifact(existing.id, { content, evidenceIds });
    else addArtifact({ taskId, projectId: project.id, type: artifactType, title: `${artifactType} · 页岩温压耦合研究`, content, evidenceIds, mode: candidateNote ? '混合' : 'AI', confirmed: false });
    toast.success(`${artifactType}已保存到当前任务`);
    return taskId;
  }
  function run() {
    const taskId = saveAnalysis('技术地图');
    if (!taskId) return;
    updateTask(taskId, { ...(!task || task.type === '专利分析' ? { status: '等待确认' as const, plan: plan.map((title, i) => ({ id: `${taskId}-patent-${i}`, title, done: true })) } : {}), stream: [...(task?.stream || []), { id: `patent-run-${crypto.randomUUID()}`, kind: '执行节点', text: `已模拟执行主题理解、检索、技术聚类。当前检索集 ${filtered.length} 件专利，识别 ${counts('route').length} 条技术路线。分析结果等待人工核验。`, time: new Date().toISOString() }] });
    setTab('技术地图');
  }
  function verifyCandidate() {
    const taskId = saveAnalysis('技术空白候选');
    if (!taskId) return;
    const verificationSet = patents.filter(p => /耦合|heating/i.test(`${p.title} ${p.abstract}`));
    const evidenceIds = collect(verificationSet, taskId);
    addArtifact({ taskId, projectId: project.id, type: '技术空白检索验证', title: '候选验证：扩展耦合与循环热历史检索', content: `模拟补充检索式：(耦合 OR heating) AND (页岩 OR rock)\n发现 ${verificationSet.length} 件相邻技术示例：${verificationSet.map(p => p.id).join('、')}。\n这些相邻证据缩小候选空白范围，但当前仍无法确定不存在相关先前技术。技术空白保留“候选”状态，建议补充真实数据库与权利要求核验。`, evidenceIds, mode: 'AI', confirmed: false });
    updateTask(taskId, { ...(!task || task.type === '专利分析' ? { status: '等待确认' as const } : {}), stream: [...(task?.stream || []), { id: `verify-${crypto.randomUUID()}`, kind: '研究发现', text: `补充检索已完成：找到 ${verificationSet.length} 件相邻技术示例，技术空白仍为候选。`, time: new Date().toISOString() }] });
    setQuery('耦合'); setRegion('全部'); setLegal('全部'); setYear('全部'); setApplicant('全部'); setClassification('全部'); setMode('精确检索工作台');
    saveConfig(taskId, { query: '耦合', region: '全部', legal: '全部', year: '全部', applicant: '全部', classification: '全部', mode: '精确检索工作台' });
    toast.success('已扩展检索并保存验证记录，候选状态保持不变');
  }
  function viewDetail(p: Patent) { setDetail(p); setDetailTab('基本信息'); }
  const filterFields = [
    { label: '国家 / 地区', value: region, set: setRegion, options: ['全部', '中国', '美国', '欧洲'] },
    { label: '法律状态（示例）', value: legal, set: setLegal, options: ['全部', '有效', '审中', '失效'] },
    { label: '申请年份', value: year, set: setYear, options: ['全部', '2026', '2025', '2024', '2023', '2022'] },
    { label: '申请人', value: applicant, set: setApplicant, options: ['全部', ...new Set(patents.map(p => p.applicant))] },
    { label: 'IPC 分类号', value: classification, set: setClassification, options: ['全部', ...new Set(patents.map(p => p.classification))] },
  ];

  return <ReadPage title="全网专利分析" description="从技术问题出发，发现技术路线、竞争主体与值得继续验证的研究方向。" actions={<><ReadBadge tone="amber">{task?.status || '待开始'}</ReadBadge><button className="rs-outline-btn" onClick={() => downloadText('专利检索结果.csv', `公开号,标题,年份,申请人,分类号,法律状态（示例）\n${filtered.map(p => [p.id, p.title, p.year, p.applicant, p.classification, p.legal].join(',')).join('\n')}`, 'text/csv;charset=utf-8')}><Download size={14} />导出当前结果</button></>}>
    <div className="rs-note mb-4">模拟专利库 · 当前 6 件示例资料。法律状态、专利族与权利要求用于交互演示，分析范围以当前筛选集为准。</div>
    <ReadTabs items={['专利分析 Agent', '精确检索工作台']} value={mode} onChange={setMode} />
    {mode === '专利分析 Agent' ? <div className="grid items-start gap-4 xl:grid-cols-[250px_minmax(0,1fr)]"><div className="space-y-4"><ReadPanel title="任务目标与计划"><label className="grid gap-2 text-xs text-slate-500">技术问题<textarea className="research-input min-h-28" value={instruction} onChange={e => setInstruction(e.target.value)} /></label><div className="mt-4">{plan.map((title, i) => <div key={title} className={`rs-step ${analyzed ? 'done' : ''}`}><span className="rs-step-index">{analyzed ? <Check size={12} /> : i + 1}</span><span>{title}</span></div>)}</div><button className="rs-primary-btn mt-4 w-full" onClick={run}><Sparkles size={14} />{analyzed ? '重新分析专利' : '开始专利分析'}</button></ReadPanel><ReadPanel title="检索策略"><p className="text-xs leading-7 text-slate-600">核心概念：页岩、温压耦合、裂缝扩展<br />扩展词：shale / fracture / thermal<br />范围：示例专利库全部地区<br />检索后按装置、方法与模型聚类</p><button className="rs-link-btn mt-4" onClick={() => setMode('精确检索工作台')}>编辑筛选与检索范围<ArrowRight size={13} /></button></ReadPanel></div>
      <ReadPanel title="分析结果" actions={<><ReadBadge>{filtered.length} 件专利</ReadBadge><button className="rs-outline-btn" onClick={() => saveAnalysis()}>保存当前产物</button></>}><ReadTabs items={analysisTabs} value={tab} onChange={setTab} />
      {filtered.length === 0 ? <EmptyState title="当前筛选无结果" description="调整检索词、国家或法律状态后继续分析。"><button className="rs-outline-btn" onClick={() => setMode('精确检索工作台')}>调整筛选</button></EmptyState>
      : tab === '技术地图' ? <div><div className="mb-6 rounded-lg bg-[#f9eff0] p-5 text-center"><ReadBadge tone="red">核心技术主题</ReadBadge><h3 className="mt-2 font-semibold">页岩温压耦合与裂缝扩展</h3><p className="mt-1 text-xs text-slate-500">由当前 {filtered.length} 件示例专利形成的技术分类</p></div><div className="grid gap-3 md:grid-cols-2">{counts('route').map(([name, count], i) => <div key={name} className="rounded-lg border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><h4 className="font-medium"><span className="mr-2 text-xs text-slate-400">0{i + 1}</span>{name}</h4><ReadBadge>{count} 件</ReadBadge></div>{filtered.filter(p => p.route === name).map(p => <button key={p.id} className="mt-2 flex w-full items-start justify-between gap-3 border-t border-slate-100 pt-3 text-left text-xs leading-6 text-slate-600 hover:text-[#b4232d]" onClick={() => viewDetail(p)}>{p.title}<ArrowRight className="mt-1 shrink-0" size={12} /></button>)}</div>)}</div></div>
      : tab === '技术路线趋势' || tab === '主要申请人' ? <div className="space-y-6 py-4"><p className="text-xs text-slate-500">{tab === '技术路线趋势' ? '按申请年份观察当前检索集的技术分布' : '按申请人聚合当前检索集；点击名称查看其专利'}</p>{counts(tab === '主要申请人' ? 'applicant' : 'year').map(([name, count]) => <div key={name}><div className="mb-2 flex justify-between text-xs"><button className="text-left hover:text-[#b4232d]" onClick={() => { if (tab === '主要申请人') setApplicant(name); else setYear(name); setMode('精确检索工作台'); }}>{name}</button><span>{count} 件</span></div><div className="h-8 rounded bg-slate-50"><div className="flex h-8 items-center rounded bg-[#c66c73] px-3 text-xs text-white" style={{ width: `${Math.max(12, count / filtered.length * 100)}%` }}>{count}</div></div>{tab === '技术路线趋势' && <p className="mt-2 text-xs text-slate-400">{[...new Set(filtered.filter(p => String(p.year) === name).map(p => p.route))].join(' · ')}</p>}</div>)}</div>
      : tab === '权利要求' ? <div className="space-y-4">{filtered.map(p => <article key={p.id} className="rounded-md border border-slate-200 p-4"><button className="text-left text-sm font-semibold hover:text-[#b4232d]" onClick={() => viewDetail(p)}>{p.title}</button><p className="my-2 text-xs text-slate-400">{p.id} · {p.classification}</p><p className="text-xs leading-7 text-slate-600">核心技术特征：{p.claims[0]}</p><button className="rs-link-btn mt-3" onClick={() => { viewDetail(p); setDetailTab('权利要求'); }}>查看完整示例权利要求</button></article>)}</div>
      : <div className="space-y-4"><ReadBadge tone="amber">技术空白候选 · 证据有限</ReadBadge><h3 className="text-base font-semibold">循环热历史 × 真三轴应力路径 × 渗透率演化</h3><p className="text-sm leading-7 text-slate-600">当前检索集中，循环加热装置、真三轴加载和多场参数反演分别被部分专利覆盖；这些技术联用的系统方案仍需进一步验证。不能仅据当前结果断言该技术尚不存在。</p><div className="rs-note">验证路径：扩大同义词与专利族检索 → 核对独立权利要求 → 寻找相邻与反向证据 → 人工判断候选边界。</div><label className="grid gap-2 text-xs font-medium">人工研究判断<textarea className="research-input min-h-24" value={candidateNote} onChange={e => setCandidateNote(e.target.value)} placeholder="补充候选边界、反向证据与下一步验证计划" /></label><div className="flex flex-wrap gap-2"><button className="rs-primary-btn" onClick={verifyCandidate}><Search size={14} />继续检索验证</button><button className="rs-outline-btn" onClick={() => saveAnalysis('技术空白候选')}>保存候选</button></div>{candidate && <p className="text-xs text-slate-500">候选已保存 · V{candidate.version} · {new Date(candidate.updatedAt).toLocaleString('zh-CN')}</p>}{ownedArtifacts.filter(a => a.type === '技术空白检索验证').map(a => <article key={a.id} className="rounded-md border border-slate-200 p-4"><h4 className="text-sm font-medium">{a.title}</h4><p className="mt-2 whitespace-pre-wrap text-xs leading-7 text-slate-600">{a.content}</p></article>)}</div>}
      </ReadPanel></div>
    : <div className="space-y-4"><ReadPanel title="精确检索与筛选"><div className="relative mb-4"><Search className="absolute left-3 top-3 text-slate-400" size={16} /><input className="research-input pl-10" aria-label="专利关键词" placeholder="标题、摘要、申请人、公开号或分类号" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{filterFields.map(f => <label key={f.label} className="grid gap-2 text-xs text-slate-500">{f.label}<select className="research-input" value={f.value} onChange={e => f.set(e.target.value)}>{f.options.map(o => <option key={o} value={o}>{f.label === '申请年份' && o !== '全部' ? `${o} 年及以后` : o}</option>)}</select></label>)}</div><button className="rs-link-btn mt-4" onClick={() => { setQuery(''); setRegion('全部'); setLegal('全部'); setYear('全部'); setApplicant('全部'); setClassification('全部'); }}>重置全部筛选</button></ReadPanel><ReadPanel title={`专利结果 · ${filtered.length} 件`} actions={<><button className="rs-outline-btn" disabled={!selected.length} onClick={() => { collect(patents.filter(p => selected.includes(p.id)), ensureTask()); toast.success(`已加入 ${selected.length} 件专利到研究任务`); }}>加入当前任务（{selected.length}）</button><button className="rs-outline-btn" onClick={() => setMode('专利分析 Agent')}>分析当前结果<ArrowRight size={12} /></button></>}>
      <label className="mb-4 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={filtered.length > 0 && filtered.every(p => selected.includes(p.id))} onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...filtered.map(p => p.id)])] : selected.filter(id => !filtered.some(p => p.id === id)))} />全选当前结果</label><div className="divide-y divide-slate-100">{filtered.map(p => <article key={p.id} className="flex gap-3 py-5"><input className="mt-1.5 size-4 shrink-0" aria-label={`选择${p.title}`} type="checkbox" checked={selected.includes(p.id)} onChange={e => setSelected(e.target.checked ? [...selected, p.id] : selected.filter(id => id !== p.id))} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><button className="text-left text-sm font-semibold hover:text-[#b4232d]" onClick={() => viewDetail(p)}>{p.title}</button><ReadBadge tone={p.legal === '有效' ? 'green' : p.legal === '审中' ? 'amber' : 'neutral'}>{p.legal} · 示例</ReadBadge></div><p className="mt-2 text-xs text-slate-400">{p.id} · {p.applicant} · {p.year} · {p.classification}</p><p className="mt-3 text-xs leading-7 text-slate-600">{p.abstract}</p><div className="mt-3 flex gap-4"><button className="rs-link-btn" onClick={() => viewDetail(p)}>专利详情</button><button className="rs-link-btn" onClick={() => { viewDetail(p); setDetailTab('专利族'); }}>专利族（{p.family.length}）</button><button className="rs-link-btn" onClick={() => { viewDetail(p); setDetailTab('权利要求'); }}>权利要求</button></div></div></article>)}</div>{!filtered.length && <EmptyState title="没有匹配的专利" description="尝试减少筛选条件或扩展关键词。" />}</ReadPanel></div>}
    <Modal open={!!detail} onClose={() => setDetail(null)} title="专利详情" description="模拟专利资料，包含专利族、法律状态与权利要求。">{detail && <><h3 className="font-semibold">{detail.title}</h3><p className="text-xs text-slate-500">{detail.id} · 本地演示专利库</p><ReadTabs items={['基本信息', '专利族', '法律状态', '权利要求']} value={detailTab} onChange={setDetailTab} />{detailTab === '基本信息' ? <div className="space-y-4"><dl className="rs-data-list">{[['申请人', detail.applicant], ['申请年份', detail.year], ['国家 / 地区', detail.region], ['IPC 分类', detail.classification], ['技术路线', detail.route]].map(([k, v]) => <div key={k} className="grid grid-cols-[90px_1fr]"><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p className="text-sm leading-7">{detail.abstract}</p></div> : detailTab === '专利族' ? <ul className="space-y-3">{detail.family.map((id, i) => <li key={id} className="rounded bg-slate-50 p-3 text-sm">{id}<span className="ml-3 text-xs text-slate-500">{i ? '同族成员 · 示例关联' : '当前申请'}</span></li>)}</ul> : detailTab === '法律状态' ? <div className="space-y-4"><ReadBadge tone="amber">{detail.legal} · 示例记录</ReadBadge><p className="text-sm leading-7">申请：{detail.year} 年<br />最近模拟事件：{detail.legal === '有效' ? '授权登记' : detail.legal === '审中' ? '实质审查' : '权利终止'}<br />核验状态：待真实数据库核对</p><p className="rs-note">法律状态随时间变化，本页模拟记录不构成法律结论。</p></div> : <ol className="space-y-4">{detail.claims.map((claim, i) => <li key={claim} className="rounded bg-slate-50 p-4 text-sm leading-7"><strong>权利要求 {i + 1}</strong><p>{claim}</p></li>)}</ol>}<button className="rs-primary-btn mt-3" onClick={() => { collect([detail], ensureTask()); toast.success('专利及证据已加入当前研究任务'); }}>加入当前任务</button></>}</Modal>
  </ReadPage>;
}
