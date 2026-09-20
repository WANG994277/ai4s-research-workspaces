'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Box, Check, Code2, ExternalLink, FlaskConical, Play, Plus, Search, Settings2, ShieldCheck, Star } from 'lucide-react';
import { useComputeStore } from './store';
import { Button, Empty, Modal, PageHeader, Panel, Status, Tabs, downloadFile } from './ui';
import type { ScientificTool } from './types';

const domains = ['全部工具', '地球科学', '油气勘探开发', '炼油化工', '材料科学', '合成生物', '机理仿真', '数据分析', '通用科学计算', 'AI/机器学习'];
const unavailable = (tool: ScientificTool) => tool.status !== '已上架' || /过期|不可用|未配置|无授权/.test(tool.license);
const colorFor = (domain: string) => ({ 地球科学: '#a06b48', 材料科学: '#998457', 合成生物: '#6b906f', 数据分析: '#728699', 'AI/机器学习': '#857999' }[domain] ?? '#8d7a6d');

function ToolUse({ tool, onClose }: { tool: ScientificTool | null; onClose: () => void }) {
  const store = useComputeStore();
  const router = useRouter();
  const [mode, setMode] = useState('创建工具运行方案');
  const [planId, setPlanId] = useState(store.activePlanId);
  const [goal, setGoal] = useState('');
  if (!tool) return null;
  function useTool() {
    if (!tool || unavailable(tool)) return;
    if (mode === '加入已有计算方案' && planId) {
      store.updatePlan(planId, { toolId: tool.id, resources: tool.resource, status: '待确认' });
      store.addReference(`${tool.name} V${tool.version}`);
      router.push(`/compute-space/agent?plan=${planId}`);
    } else {
      const id = store.createPlan(goal.trim() || `使用 ${tool.name} 完成科研计算并评价结果`, { toolId: tool.id, title: `${tool.name} · 计算方案`, method: tool.description, resources: tool.resource, outputs: tool.outputs.split(/[、,，]/), risks: `软件许可：${tool.license}；最大运行时间 ${tool.timeout} 秒；创建任务前需确认参数与资源。`, evidence: [`工具：${tool.name} V${tool.version}`, `运行环境：${tool.environment}`] });
      router.push(`/compute-space/agent?plan=${id}`);
    }
    onClose();
  }
  return <Modal open={!!tool} onClose={onClose} title={`使用 ${tool.name}`} footer={<><Button variant="secondary" onClick={onClose}>取消</Button><Button variant="primary" disabled={unavailable(tool) || (mode === '加入已有计算方案' && !planId)} onClick={useTool}>继续配置计算方案<ArrowRight size={14}/></Button></>}><div className="cp-stack"><div className="cp-row"><Status value={tool.status}/><Status value={tool.license}/><span className="cp-muted">V{tool.version}</span></div><label className="cp-field">调用方式<select className="cp-select" value={mode} onChange={(e) => setMode(e.target.value)}><option>创建工具运行方案</option><option>加入已有计算方案</option><option>由科研计算助手规划</option></select></label>{mode === '加入已有计算方案' ? <label className="cp-field">计算方案<select className="cp-select" value={planId} onChange={(e) => setPlanId(e.target.value)}><option value="">选择方案</option>{store.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} V{plan.version}</option>)}</select></label> : <label className="cp-field">本次计算目标<textarea className="cp-input" rows={3} value={goal} placeholder={`使用 ${tool.name} 解决什么科研问题？`} onChange={(e) => setGoal(e.target.value)}/></label>}<p className="cp-note">输入：{tool.inputs}<br/>输出：{tool.outputs}<br/>资源：{tool.resource}<br/>先形成可编辑计算方案，再由你确认参数、资源与许可后创建正式任务。</p>{unavailable(tool) && <p className="cp-alert">当前工具未上架或许可证不可用，需在工具管理中完成调试与授权后再使用。</p>}</div></Modal>;
}

export function ToolsWorkspace() {
  const store = useComputeStore();
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('全部工具');
  const [type, setType] = useState('全部类型');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [favorites, setFavorites] = useState(false);
  const [use, setUse] = useState<ScientificTool | null>(null);
  const tools = store.tools.filter((tool) => tool.status === '已上架' && (domain === '全部工具' || tool.domain === domain) && (type === '全部类型' || tool.type === type) && (!onlyAvailable || !unavailable(tool)) && (!favorites || tool.favorite) && `${tool.name} ${tool.domain} ${tool.description} ${tool.inputs} ${tool.outputs}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="cp-stack" data-prd-id="REQ-TOOL-001"><PageHeader eyebrow="专业工作台 / SCIENTIFIC TOOLS" title="科研工具" description="为科研问题选择合适的方法与软件，统一查看版本、运行环境和许可条件。" actions={<Link className="cp-button" href="/compute-space/tools/manage"><Settings2 size={15}/>工具接入与管理</Link>}/>
    <div className="grid gap-5 rounded-lg border border-[#e3ded5] bg-[#faf8f4] p-6 md:grid-cols-[minmax(0,1fr)_auto]"><div><div className="mb-2 text-[11px] tracking-widest text-[#967a68]">FROM SCIENTIFIC QUESTION TO COMPUTATION</div><h2 className="!text-xl">专业科学工具，与研究上下文相连</h2><p className="mt-3 max-w-2xl text-xs leading-6 text-[#85857b]">从有限元到分子动力学，从数据分析到科学机器学习。让每一次工具调用都关联输入、参数、版本与可追溯结果。</p></div><div className="flex items-center gap-5 border-l border-[#e2dbd0] pl-5 text-xs"><div><strong className="block text-2xl font-medium text-[#746457]">{store.tools.filter((tool) => tool.status === '已上架').length}</strong><span className="cp-muted">已接入工具</span></div><div><strong className="block text-2xl font-medium text-[#746457]">{new Set(store.tools.map((tool) => tool.domain)).size}</strong><span className="cp-muted">专业领域</span></div></div></div>
    <div className="flex flex-wrap items-center gap-3"><label className="relative min-w-64 flex-1"><Search className="absolute left-3 top-2.5 text-[#8a928a]" size={16}/><input aria-label="搜索科研工具" className="cp-input !pl-9" placeholder="搜索工具名称、能力、输入或输出…" value={query} onChange={(e) => setQuery(e.target.value)}/></label><select aria-label="工具类型" className="cp-select !w-auto" value={type} onChange={(e) => setType(e.target.value)}><option>全部类型</option>{Array.from(new Set(store.tools.map((tool) => tool.type))).map((value) => <option key={value}>{value}</option>)}</select><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)}/>仅可用</label><Button variant={favorites ? 'primary' : 'secondary'} onClick={() => setFavorites(!favorites)}><Star size={14}/>我的收藏</Button></div>
    <div className="flex flex-wrap gap-2 border-b border-[#e8e5de] pb-4">{domains.map((value) => <button key={value} onClick={() => setDomain(value)} className={`rounded px-3 py-2 text-xs ${domain === value ? 'bg-[#f7ebe7] font-semibold text-[#ad4c3d]' : 'text-[#7d837a] hover:bg-[#f5f4ef]'}`}>{value}</button>)}</div>
    <div className="flex justify-between text-xs"><span className="cp-muted">找到 {tools.length} 个科学工具</span><span className="cp-muted">工具的可用性取决于发布状态与许可证</span></div>
    {tools.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{tools.map((tool) => <article key={tool.id} className="flex flex-col rounded-lg border border-[#e4e1d9] bg-white p-5"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#f3f1ed]" style={{ color: colorFor(tool.domain) }}><Box size={22}/></div><div className="min-w-0 flex-1"><Link className="text-sm font-semibold hover:text-[#ae4438]" href={`/compute-space/tools/${tool.id}`}>{tool.name}</Link><p className="mt-1 text-[11px] text-[#97998e]">{tool.type} · {tool.domain} · {tool.version}</p></div><button aria-label={`${tool.favorite ? '取消收藏' : '收藏'} ${tool.name}`} onClick={() => store.updateTool(tool.id, { favorite: !tool.favorite })} className="text-[#bc9270]"><Star size={16} fill={tool.favorite ? 'currentColor' : 'none'}/></button></div><p className="my-4 flex-1 text-xs leading-6 text-[#737b73]">{tool.description}</p><dl className="space-y-2 border-y border-[#eeebe5] py-3 text-[11px]"><div className="flex gap-3"><dt className="w-7 shrink-0 text-[#9ca195]">输入</dt><dd className="text-[#69736b]">{tool.inputs}</dd></div><div className="flex gap-3"><dt className="w-7 shrink-0 text-[#9ca195]">输出</dt><dd className="text-[#69736b]">{tool.outputs}</dd></div></dl><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Status value={tool.license}/><div className="cp-row"><Link className="cp-link text-xs" href={`/compute-space/tools/${tool.id}`}>详情</Link><Button variant="secondary" disabled={unavailable(tool)} onClick={() => setUse(tool)}>使用工具<ArrowRight size={13}/></Button></div></div></article>)}</div> : <Empty title="没有匹配的工具" description="调整关键词或领域筛选，查看其他已接入工具。" action={<Button onClick={() => { setQuery(''); setDomain('全部工具'); setType('全部类型'); setOnlyAvailable(false); setFavorites(false); }}>清除筛选</Button>}/>}
    <ToolUse tool={use} onClose={() => setUse(null)}/>
  </div>;
}

export function ToolDetail({ id }: { id: string }) {
  const store = useComputeStore();
  const tool = store.tools.find((item) => item.id === id);
  const [tab, setTab] = useState('概览');
  const [use, setUse] = useState(false);
  if (!tool) return <Empty title="未找到该工具" action={<Link className="cp-button" href="/compute-space/tools">返回科研工具</Link>}/>;
  const calls = store.tasks.filter((task) => task.toolId === tool.id);
  return <div className="cp-stack" data-prd-id="REQ-TOOL-002"><Link className="cp-link flex items-center gap-2 text-xs" href="/compute-space/tools"><ArrowLeft size={14}/>科研工具</Link><PageHeader eyebrow={`${tool.domain} / ${tool.type}`} title={tool.name} description={tool.description} actions={<><Button variant="secondary" onClick={() => store.updateTool(tool.id, { favorite: !tool.favorite })}><Star size={14} fill={tool.favorite ? 'currentColor' : 'none'}/>{tool.favorite ? '已收藏' : '收藏'}</Button><Button variant="primary" disabled={unavailable(tool)} onClick={() => setUse(true)}>使用 / 加入计算方案<ArrowRight size={14}/></Button></>}/><div className="cp-row"><Status value={tool.status}/><Status value={tool.license}/><span className="cp-badge">版本 {tool.version}</span><span className="cp-badge">{tool.environment}</span></div><Tabs items={['概览', '输入输出', '参数', '版本', '运行环境', '许可证', '使用说明', '调用记录']} value={tab} onChange={setTab}/>
    {tab === '概览' && <div className="cp-grid-2"><Panel title="适用科研场景"><div className="cp-stack text-sm leading-7"><FlaskConical className="text-[#ae4438]" size={24}/><p>{tool.description}</p><p className="cp-muted">该工具可关联科研计算方案，由科研计算助手生成参数建议。正式调用前需确认数据版本、运行资源和软件许可。</p><div className="cp-grid-2"><div className="cp-kpi"><span>领域</span><strong className="!text-base">{tool.domain}</strong></div><div className="cp-kpi"><span>接入方式</span><strong className="!text-base">{tool.invocation}</strong></div></div></div></Panel><Panel title="能力与科研上下文"><dl className="cp-stack text-xs"><div><dt className="cp-muted">输入对象</dt><dd className="mt-2">{tool.inputs}</dd></div><div><dt className="cp-muted">生成产物</dt><dd className="mt-2">{tool.outputs}</dd></div><div><dt className="cp-muted">推荐资源</dt><dd className="mt-2">{tool.resource}</dd></div><div className="cp-note">调用结果保留工具版本、环境、参数与任务日志，支持复现及下一轮方案优化。</div></dl></Panel></div>}
    {tab === '输入输出' && <div className="cp-grid-2"><Panel title="输入约定"><pre className="whitespace-pre-wrap break-words rounded bg-[#f7f6f2] p-4 text-xs leading-7">{tool.inputs}</pre><p className="cp-muted mt-4">所有输入必须绑定数据集版本或带来源记录的文件。缺失字段会阻止提交。</p></Panel><Panel title="输出产物"><pre className="whitespace-pre-wrap break-words rounded bg-[#f7f6f2] p-4 text-xs leading-7">{tool.outputs}</pre><p className="cp-muted mt-4">结果以结构化 Artifact 回传，关联来源计算方案与任务。</p></Panel></div>}
    {tab === '参数' && <Panel title="参数 Schema" actions={<Button onClick={() => downloadFile(`${tool.id}-schema.json`, tool.schema, 'application/json')}>下载 Schema</Button>}><pre className="overflow-x-auto rounded bg-[#f7f6f2] p-5 text-xs leading-7">{(() => { try { return JSON.stringify(JSON.parse(tool.schema), null, 2); } catch { return tool.schema; } })()}</pre><div className="cp-note mt-4">参数范围代表工具接口约束，实际科研参数应结合来源证据和适用条件人工确认。</div></Panel>}
    {tab === '版本' && <Panel title="软件版本与发布"><div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>版本</th><th>运行环境</th><th>调试</th><th>状态</th></tr></thead><tbody>{store.tools.filter((item) => item.name === tool.name).map((item) => <tr key={item.id}><td>{item.version}</td><td>{item.environment}</td><td><Status value={item.tested ? '测试通过' : '待测试'}/></td><td><Status value={item.status}/></td></tr>)}</tbody></table></div><p className="cp-note mt-4">已有任务保留调用时的软件版本；新版本通过独立调试与发布流程接入。</p></Panel>}
    {tab === '运行环境' && <Panel title="环境与资源要求"><dl className="cp-stack text-sm">{[['运行环境', tool.environment], ['接入方式', tool.invocation], ['资源需求', tool.resource], ['超时限制', `${tool.timeout} 秒`], ['运行隔离', '任务级容器 / 独立工作目录']].map(([label, value]) => <div className="flex justify-between gap-6 border-b border-[#eee9e2] pb-3" key={label}><dt className="cp-muted">{label}</dt><dd>{value}</dd></div>)}</dl></Panel>}
    {tab === '许可证' && <Panel title="软件许可与授权"><div className="cp-stack"><ShieldCheck size={28} className="text-[#8ba08a]"/><Status value={tool.license}/><p className="text-sm">{unavailable(tool) ? '当前许可或发布状态不满足运行要求。请联系工具管理员更新授权。' : '当前课题可使用该工具，任务创建时将再次检查可用性。'}</p><p className="cp-note">商业软件调用必须人工确认许可证席位与成本。开源工具仍需遵守相应许可证的使用与分发条件。</p><Link className="cp-link text-xs" href="/compute-space/tools/manage">前往工具接入与管理 →</Link></div></Panel>}
    {tab === '使用说明' && <Panel title="从科研问题到工具运行"><div className="cp-stack">{[['01', '准备输入', `准备 ${tool.inputs}，建议先在数据处理工作台完成质量检查。`], ['02', '生成计算方案', '选择直接运行或加入已有方案，记录目标、方法和输出指标。'], ['03', '确认参数与资源', `根据 Schema 配置参数，确认 ${tool.resource} 及 ${tool.license}。`], ['04', '创建任务并检查结果', `在任务详情查看日志与运行状态，完成后分析 ${tool.outputs}。`]].map(([n, title, content]) => <div className="flex gap-4 border-b border-[#eee9e2] pb-4" key={n}><span className="text-xl text-[#b7a99a]">{n}</span><div><h3>{title}</h3><p className="cp-muted mt-2">{content}</p></div></div>)}<Button variant="primary" disabled={unavailable(tool)} onClick={() => setUse(true)}><Play size={14}/>开始使用</Button></div></Panel>}
    {tab === '调用记录' && <Panel title="可追溯调用记录">{calls.length ? <div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>任务</th><th>版本</th><th>调用时间</th><th>状态</th><th/></tr></thead><tbody>{calls.map((task) => <tr key={task.id}><td>{task.name}</td><td>{task.toolVersion}</td><td>{task.createdAt}</td><td><Status value={task.status}/></td><td><Link className="cp-link" href={`/compute-space/tasks/${task.id}`}>查看任务<ExternalLink size={11} className="ml-1 inline"/></Link></td></tr>)}</tbody></table></div> : <Empty title="该工具还没有调用记录" description="通过计算方案创建任务后，调用记录将自动关联到这里。"/>}</Panel>}
    <ToolUse tool={use ? tool : null} onClose={() => setUse(false)}/>
  </div>;
}

const schemaTemplate = JSON.stringify({ type: 'object', properties: { temperature: { type: 'number', minimum: 25, maximum: 250 }, pressure: { type: 'number', minimum: 10, maximum: 60 } }, required: ['temperature', 'pressure'] }, null, 2);
const initialForm = { name: '', type: 'Web API', domain: '地球科学', description: '', inputs: '{"type":"object","required":["dataset_id"]}', outputs: '{"type":"object","properties":{"result_url":{"type":"string"}}}', schema: schemaTemplate, invocation: 'POST /api/tools/run', environment: 'Python 3.11 / Linux', dependencies: 'numpy==1.26, scipy==1.12', version: '1.0.0', license: '开源 · Apache-2.0', permission: '当前课题成员', timeout: 3600, resource: 'CPU 8 核 / 16 GB', callback: 'Artifact 结果回传', sample: '{"temperature":150,"pressure":30}' };
type ToolForm = typeof initialForm;

export function ToolManagement() {
  const store = useComputeStore();
  const [editor, setEditor] = useState(false);
  const [form, setForm] = useState<ToolForm>(initialForm);
  const [editingId, setEditingId] = useState('');
  const [stage, setStage] = useState('基础信息');
  const [tested, setTested] = useState(false);
  const [testLog, setTestLog] = useState('');
  const [notice, setNotice] = useState('');
  const [release, setRelease] = useState<ScientificTool | null>(null);
  const [statusFilter, setStatusFilter] = useState('全部状态');
  const [query, setQuery] = useState('');
  function update<K extends keyof ToolForm>(key: K, value: ToolForm[K]) { setForm((state) => ({ ...state, [key]: value })); setTested(false); setTestLog('配置已变更，请重新运行调试测试。'); }
  function openEditor(tool?: ScientificTool) {
    setEditingId(tool?.id ?? ''); setStage('基础信息'); setTestLog('');
    let schema = tool?.schema ?? schemaTemplate;
    let metadata: Partial<ToolForm> = {};
    try { const value = JSON.parse(schema); metadata = value._integration ?? {}; delete value._integration; schema = JSON.stringify(value, null, 2); } catch { /* Existing textual schema remains editable. */ }
    setForm(tool ? { ...initialForm, ...tool, ...metadata, schema } : { ...initialForm }); setTested(tool?.tested ?? false); setEditor(true);
  }
  function testSchema() {
    try {
      const schema = JSON.parse(form.schema);
      const input = JSON.parse(form.sample);
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error('参数 Schema 必须是 JSON 对象');
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('调试参数必须是 JSON 对象');
      for (const field of ['inputs', 'outputs'] as const) { if (form[field].trim().startsWith('{')) JSON.parse(form[field]); }
      const properties: Record<string, { type?: string; minimum?: number; maximum?: number }> = schema.properties ?? Object.fromEntries(Object.entries(schema).filter(([key]) => !['type', 'required', 'description'].includes(key)));
      const required: string[] = schema.required ?? Object.keys(properties);
      for (const key of required) if (!(key in input)) throw new Error(`缺少必填参数：${key}`);
      for (const [key, spec] of Object.entries(properties)) {
        if (!(key in input)) continue;
        if (spec.type === 'number' && typeof input[key] !== 'number') throw new Error(`${key} 必须是数值`);
        if (spec.type === 'string' && typeof input[key] !== 'string') throw new Error(`${key} 必须是字符串`);
        if (spec.minimum !== undefined && input[key] < spec.minimum) throw new Error(`${key} 低于最小值 ${spec.minimum}`);
        if (spec.maximum !== undefined && input[key] > spec.maximum) throw new Error(`${key} 高于最大值 ${spec.maximum}`);
      }
      if (!form.name.trim() || !form.environment.trim() || !form.invocation.trim() || !form.description.trim()) throw new Error('请补齐工具名称、描述、调用方式与运行环境');
      if (form.timeout <= 0) throw new Error('超时时间必须大于 0');
      setTested(true); setTestLog(`[PASS] 参数 Schema JSON 解析通过\n[PASS] ${required.length} 个必填参数与范围检查通过\n[PASS] 输入 / 输出格式有效\n[PASS] 运行环境、资源与超时配置完整\n[MOCK] 接口联调成功 · 返回 Artifact 结果包\n说明：本次为本地演示调试，不访问外部接口。`);
    } catch (error) { setTested(false); setTestLog(`[FAIL] ${error instanceof Error ? error.message : 'Schema 校验失败'}\n请修正后重新测试，测试通过前无法发布。`); }
  }
  function saveTool() {
    if (!form.name.trim()) { setNotice('请填写工具名称。'); return; }
    let schema: object;
    try { const parsed = JSON.parse(form.schema); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); schema = parsed; } catch { setTestLog('[FAIL] 参数 Schema 不是有效 JSON 对象，无法保存。'); setStage('调试测试'); return; }
    const value: Omit<ScientificTool, 'id'> = { name: form.name.trim(), type: form.type, domain: form.domain, description: form.description, inputs: form.inputs, outputs: form.outputs, schema: JSON.stringify({ ...schema, _integration: { dependencies: form.dependencies, permission: form.permission, callback: form.callback, sample: form.sample } }, null, 2), invocation: form.invocation, environment: form.environment, version: form.version, license: form.license, timeout: form.timeout, resource: form.resource, tested, status: tested ? '待发布' : '草稿', favorite: store.tools.find((tool) => tool.id === editingId)?.favorite ?? false };
    const id = editingId || store.addTool(value);
    if (editingId) store.updateTool(editingId, value);
    setEditor(false); setNotice(`${form.name} 已保存为${tested ? '待发布版本' : '草稿'}。${tested ? '请检查许可证后确认发布。' : '完成调试测试后可发布。'}`);
    if (tested) setRelease({ ...value, id });
  }
  const visible = store.tools.filter((tool) => (statusFilter === '全部状态' || tool.status === statusFilter) && `${tool.name} ${tool.domain}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="cp-stack" data-prd-id="REQ-MANAGE-001"><PageHeader eyebrow="建设与管理 / TOOL MANAGEMENT" title="工具接入与发布" description="配置统一的输入输出与参数协议，完成调试与许可检查后发布到科研工具。" actions={<><Link className="cp-button" href="/compute-space/tools"><ArrowLeft size={14}/>返回科研工具</Link><Button variant="primary" onClick={() => openEditor()}><Plus size={15}/>新建工具接入</Button></>}/>
    {notice && <div className="cp-note" role="status">{notice}</div>}
    <div className="cp-kpis"><div className="cp-kpi"><span>已接入工具</span><strong>{store.tools.length}</strong></div><div className="cp-kpi"><span>已上架</span><strong>{store.tools.filter((tool) => tool.status === '已上架').length}</strong></div><div className="cp-kpi"><span>待调试 / 发布</span><strong>{store.tools.filter((tool) => ['草稿', '待发布'].includes(tool.status)).length}</strong></div><div className="cp-kpi"><span>许可证异常</span><strong>{store.tools.filter((tool) => /过期|不可用|未配置|无授权/.test(tool.license)).length}</strong></div></div>
    <Panel title="接入工具清单" actions={<><input aria-label="搜索管理工具" className="cp-input !w-44" placeholder="搜索工具…" value={query} onChange={(e) => setQuery(e.target.value)}/><select aria-label="工具发布状态" className="cp-select !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>{['全部状态', '草稿', '待发布', '已上架', '已下架'].map((value) => <option key={value}>{value}</option>)}</select></>}><div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>工具</th><th>接入对象</th><th>领域</th><th>版本</th><th>调试</th><th>许可证</th><th>状态</th><th>操作</th></tr></thead><tbody>{visible.map((tool) => <tr key={tool.id}><td><Link className="cp-link" href={`/compute-space/tools/${tool.id}`}>{tool.name}</Link></td><td>{tool.type}</td><td>{tool.domain}</td><td>{tool.version}</td><td><Status value={tool.tested ? '通过' : '待测试'}/></td><td><Status value={tool.license}/></td><td><Status value={tool.status}/></td><td><div className="cp-row"><button className="cp-link" onClick={() => openEditor(tool)}>配置</button><button className="cp-link" onClick={() => { openEditor(tool); setEditingId(''); setForm((current) => ({ ...current, version: `${tool.version}.1` })); setTested(false); }}>新版本</button><button className="cp-link" onClick={() => setRelease(tool)}>{tool.status === '已上架' ? '下架' : '发布 / 上架'}</button></div></td></tr>)}</tbody></table></div>{!visible.length && <Empty title="没有匹配的工具"/>}</Panel>
    <div className="cp-grid-3">{[[Code2, '标准化接入', 'CLI、Web API、Python、容器、HPC、专业仿真、模型服务与内部算法统一管理。'], [ShieldCheck, '许可与权限', '调用前校验发布状态与许可，项目权限和许可证条件随工具版本保存。'], [BookOpen, '完整运行追溯', '工具版本、参数 Schema、依赖、资源与结果回传协议共同构成执行契约。']].map(([Icon, title, description]) => { const Symbol = Icon as typeof Code2; return <div className="flex gap-3 border-t border-[#e8e4de] pt-4" key={String(title)}><Symbol size={20} className="shrink-0 text-[#9b8572]"/><div><h3>{String(title)}</h3><p className="cp-muted mt-2">{String(description)}</p></div></div>; })}</div>
    <Modal open={editor} onClose={() => setEditor(false)} title={editingId ? '编辑工具接入配置' : '新建工具接入'} footer={<><Button variant="secondary" onClick={() => setEditor(false)}>取消</Button><Button variant="primary" onClick={saveTool}>{tested ? '保存并检查发布' : '保存草稿'}</Button></>}><Tabs items={['基础信息', '接口与 Schema', '环境与许可', '调试测试']} value={stage} onChange={setStage}/>
      {stage === '基础信息' && <div className="cp-stack"><label className="cp-field">工具名称 *<input className="cp-input" value={form.name} onChange={(e) => update('name', e.target.value)}/></label><div className="cp-grid-2"><label className="cp-field">接入对象<select className="cp-select" value={form.type} onChange={(e) => update('type', e.target.value)}>{['CLI 软件', 'Web API', 'Python 包', '容器化工具', 'HPC 软件', '专业仿真软件', '模型推理服务', '内部算法服务'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="cp-field">所属领域<select className="cp-select" value={form.domain} onChange={(e) => update('domain', e.target.value)}>{domains.slice(1).map((value) => <option key={value}>{value}</option>)}</select></label></div><label className="cp-field">描述与适用场景 *<textarea className="cp-input" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)}/></label><label className="cp-field">软件版本<input className="cp-input" value={form.version} onChange={(e) => update('version', e.target.value)}/></label><Button variant="secondary" onClick={() => setStage('接口与 Schema')}>下一步：接口与 Schema<ArrowRight size={14}/></Button></div>}
      {stage === '接口与 Schema' && <div className="cp-stack"><label className="cp-field">调用方式 / 接口封装<input className="cp-input" value={form.invocation} onChange={(e) => update('invocation', e.target.value)} placeholder="POST /api/tools/run 或 CLI 命令"/></label><label className="cp-field">输入 Schema / 模板<textarea className="cp-input font-mono" rows={3} value={form.inputs} onChange={(e) => update('inputs', e.target.value)}/></label><label className="cp-field">输出 Schema / 模板<textarea className="cp-input font-mono" rows={3} value={form.outputs} onChange={(e) => update('outputs', e.target.value)}/></label><label className="cp-field">参数 Schema<textarea className="cp-input font-mono" rows={8} value={form.schema} onChange={(e) => update('schema', e.target.value)}/></label><label className="cp-field">结果回传方式<select className="cp-select" value={form.callback} onChange={(e) => update('callback', e.target.value)}><option>Artifact 结果回传</option><option>对象存储路径 + 元数据</option><option>同步 JSON 响应</option><option>异步回调</option></select></label><Button onClick={() => setStage('环境与许可')}>下一步：环境与许可<ArrowRight size={14}/></Button></div>}
      {stage === '环境与许可' && <div className="cp-stack"><label className="cp-field">运行环境<input className="cp-input" value={form.environment} onChange={(e) => update('environment', e.target.value)}/></label><label className="cp-field">依赖 / 镜像<textarea className="cp-input" rows={2} value={form.dependencies} onChange={(e) => update('dependencies', e.target.value)}/></label><label className="cp-field">软件许可证<select className="cp-select" value={form.license} onChange={(e) => update('license', e.target.value)}>{Array.from(new Set([form.license, '开源 · Apache-2.0', '开源 · GPL', '商业授权 · 可用 1 席', '许可证已过期', '未配置授权'])).map((value) => <option key={value}>{value}</option>)}</select></label><label className="cp-field">使用权限<select className="cp-select" value={form.permission} onChange={(e) => update('permission', e.target.value)}><option>当前课题成员</option><option>机构内科研人员</option><option>指定计算管理员</option></select></label><div className="cp-grid-2"><label className="cp-field">超时（秒）<input type="number" min="1" className="cp-input" value={form.timeout} onChange={(e) => update('timeout', Number(e.target.value))}/></label><label className="cp-field">资源要求<input className="cp-input" value={form.resource} onChange={(e) => update('resource', e.target.value)}/></label></div><Button onClick={() => setStage('调试测试')}>下一步：调试测试<ArrowRight size={14}/></Button></div>}
      {stage === '调试测试' && <div className="cp-stack"><label className="cp-field">调试参数 JSON<textarea className="cp-input font-mono" rows={5} value={form.sample} onChange={(e) => update('sample', e.target.value)}/></label><Button variant="primary" onClick={testSchema}><Play size={14}/>运行 Schema 与接口测试</Button><pre className="min-h-40 whitespace-pre-wrap rounded bg-[#252b28] p-4 font-mono text-xs leading-7 text-[#c9d6c5]">{testLog || '等待调试。测试会验证 JSON、必填参数、类型与范围，并模拟接口回传。'}</pre>{tested && <div className="cp-row text-xs text-[#5a8866]"><Check size={16}/>测试通过，保存后可进入发布确认。</div>}</div>}
    </Modal>
    <Modal open={!!release} onClose={() => setRelease(null)} title={release?.status === '已上架' ? '确认下架工具' : '确认发布工具版本'} footer={<><Button variant="secondary" onClick={() => setRelease(null)}>取消</Button><Button variant={release?.status === '已上架' ? 'danger' : 'primary'} disabled={!!release && release.status !== '已上架' && (!release.tested || /过期|不可用|未配置|无授权/.test(release.license))} onClick={() => { if (!release) return; const status = release.status === '已上架' ? '已下架' : '已上架'; store.updateTool(release.id, { status }); setNotice(`${release.name} ${release.version} ${status}，科研工具广场已同步更新。`); setRelease(null); }}>{release?.status === '已上架' ? '确认下架' : '确认发布并上架'}</Button></>}><div className="cp-stack"><p>{release?.name} · {release?.version}</p><div className="cp-row"><Status value={release?.tested ? '测试通过' : '待测试'}/><Status value={release?.license ?? ''}/></div><p className="cp-note">{release?.status === '已上架' ? '下架后不能创建新的调用任务。已有任务的工具版本与运行记录继续保留。' : '发布将使该版本可被科研人员发现和调用。请确认参数契约、依赖环境、权限与许可证符合当前课题要求。'}</p>{release && !release.tested && <p className="cp-alert">该版本尚未通过调试，请先打开配置完成测试。</p>}{release && /过期|不可用|未配置|无授权/.test(release.license) && <p className="cp-alert">许可证不可用。更新有效授权后才能发布。</p>}</div></Modal>
  </div>;
}



