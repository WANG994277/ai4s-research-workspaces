'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, FileCheck2, Play, Quote } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/research/workspace-kit';
import { ReadBadge, ReadPage, ReadPanel, ReadTabs, downloadText, useReadTask } from './ui';
import { taskRoute, type Evidence } from './types';

const standardOptions = [
  { id: 'DEMO-CN-A', name: '岩石高温力学试验方法', number: 'DEMO-CN-A', version: '2025', region: '国内', scope: '岩石单轴与三轴力学试验', publisher: '科研标准示例库', temperature: '25～150 °C', pressure: '0～70 MPa', tolerance: '±2 °C', method: '单轴 / 常规三轴', size: 'Φ50 × 100 mm' },
  { id: 'DEMO-INT-B', name: '储层岩石热力耦合试验规程', number: 'DEMO-INT-B', version: '2024', region: '国际', scope: '储层岩石温压耦合试验', publisher: '科研标准示例库', temperature: '25～200 °C', pressure: '0～100 MPa', tolerance: '±3 °C', method: '常规三轴 / 真三轴', size: '100 × 100 × 100 mm' },
  { id: 'DEMO-CN-C', name: '深部岩石真三轴试验规程', number: 'DEMO-CN-C', version: '2023', region: '国内', scope: '深部岩石真三轴试验', publisher: '科研标准示例库', temperature: '25～180 °C', pressure: '0～90 MPa', tolerance: '±2 °C', method: '真三轴', size: '100 × 100 × 100 mm' },
];
const steps = ['识别标准基本信息', '解析目录及章节', '建立条款映射', '比较技术指标', '比较试验方法', '识别关键差异', '生成对标结论'];
const tabs = ['标准信息', '条款映射', '指标差异', '试验方法', '适用性建议'];
type ComparisonConfig = { left: string; right: string; note: string };
function parseConfig(content?: string): ComparisonConfig {
  try { return { left: standardOptions[0].id, right: standardOptions[1].id, note: '', ...JSON.parse(content || '{}') }; }
  catch { return { left: standardOptions[0].id, right: standardOptions[1].id, note: '' }; }
}

export function ReadStandards() {
  const context = useReadTask();
  return <StandardWorkspace key={`${context.project.id}-${context.task?.id || 'new'}`} />;
}

function StandardWorkspace() {
  const { task, project, artifacts, evidence, createTask, updateTask, addResource, addResources, addEvidence, updateEvidence, addArtifact, updateArtifact } = useReadTask();
  const router = useRouter();
  const configArtifact = artifacts.find(a => a.taskId === task?.id && a.projectId === project.id && a.type === '标准对标配置');
  const config = parseConfig(configArtifact?.content);
  const [leftId, setLeftId] = useState(config.left);
  const [rightId, setRightId] = useState(config.right);
  const [tab, setTab] = useState(tabs[0]);
  const [note, setNote] = useState(config.note);
  const [filter, setFilter] = useState('全部');
  const [source, setSource] = useState<Evidence | null>(null);
  const left = standardOptions.find(s => s.id === leftId) || standardOptions[0];
  const right = standardOptions.find(s => s.id === rightId) || standardOptions[1];
  const pair = `${left.id}-${left.version}__${right.id}-${right.version}`;
  const rows = [
    { id: 'temperature', title: '温度范围', clauseA: '§ 5.1', clauseB: '§ 6.2', a: left.temperature, b: right.temperature, difference: left.temperature === right.temperature ? '试验覆盖范围一致' : '温度覆盖范围不同，需核验目标温度是否同时满足', kind: '指标' },
    { id: 'pressure', title: '围压范围', clauseA: '§ 5.2', clauseB: '§ 6.3', a: left.pressure, b: right.pressure, difference: left.pressure === right.pressure ? '围压覆盖范围一致' : '高围压边界不同，不能直接替代', kind: '指标' },
    { id: 'tolerance', title: '控温允许偏差', clauseA: '§ 5.3', clauseB: '§ 6.4', a: left.tolerance, b: right.tolerance, difference: left.tolerance === right.tolerance ? '控温要求一致' : '控温偏差不同，应采用更严格的设备校准要求', kind: '指标' },
    { id: 'method', title: '加载与试验方法', clauseA: '§ 7.1', clauseB: '§ 8.1', a: left.method, b: right.method, difference: left.method === right.method ? '加载方法一致' : '应力路径及边界条件不同，比较结果需说明差异', kind: '方法' },
    { id: 'size', title: '试样尺寸', clauseA: '§ 4.2', clauseB: '§ 4.3', a: left.size, b: right.size, difference: left.size === right.size ? '试样尺寸一致' : '试样形状与尺寸不同，需评估尺寸效应', kind: '方法' },
  ];
  const currentEvidence = evidence.filter(e => e.taskId === task?.id && e.projectId === project.id && e.sourceId.startsWith(`${project.id}-standard-${pair}-`));
  const confirmationCount = rows.filter(row => currentEvidence.filter(e => e.sourceId.endsWith(`-${row.id}`)).length === 2 && currentEvidence.filter(e => e.sourceId.endsWith(`-${row.id}`)).every(e => e.confirmed)).length;
  const result = artifacts.find(a => a.taskId === task?.id && a.projectId === project.id && a.type === '标准对标结果' && a.title.includes(pair));
  const started = currentEvidence.length > 0;

  function ensureTask() {
    if (task) return task.id;
    const id = createTask(`${left.name}与${right.name}对标`, '标准对标', project.id);
    router.replace(taskRoute({ id, type: '标准对标', projectId: project.id }));
    return id;
  }
  function saveConfig(taskId: string) {
    const content = JSON.stringify({ left: leftId, right: rightId, note });
    if (configArtifact) updateArtifact(configArtifact.id, { content });
    else addArtifact({ taskId, projectId: project.id, type: '标准对标配置', title: '标准选择与人工适用性说明', content, evidenceIds: [], mode: '人工', confirmed: true });
  }
  function run() {
    if (left.id === right.id) { toast.error('请选择两个不同的标准进行对标'); return; }
    const taskId = ensureTask();
    saveConfig(taskId);
    const resourceIds: string[] = [];
    rows.forEach(row => [left, right].forEach((standard, i) => {
      const sourceId = `${project.id}-standard-${pair}-${i}-${row.id}`;
      resourceIds.push(sourceId);
      addResource({ id: sourceId, projectId: project.id, kind: '标准', name: `${standard.number}:${standard.version} · ${row.title}`, status: '演示条款 · 待确认' });
      addEvidence({ taskId, projectId: project.id, sourceId, source: `${standard.name}（${standard.number}:${standard.version}）`, location: `${standard.number}:${standard.version} · ${i === 0 ? row.clauseA : row.clauseB}`, page: i === 0 ? 5 : 6, excerpt: `${row.title}：${i === 0 ? row.a : row.b}。该条款来自标准对标演示资料，用于体验人工核验流程。`, confirmed: false, access: '演示原文' });
    }));
    addResources(resourceIds, taskId);
    updateTask(taskId, { ...(!task || task.type === '标准对标' ? { status: '等待确认' as const, plan: steps.map((title, index) => ({ id: `${taskId}-standard-${index}`, title, done: index < 6 })) } : {}), stream: [...(task?.stream || []), { id: `standard-run-${crypto.randomUUID()}`, kind: '执行节点', text: `已模拟解析 ${left.number}:${left.version} 与 ${right.number}:${right.version}，建立 5 组条款映射。请核对来源并确认差异。`, time: new Date().toISOString() }] });
    setTab('条款映射');
    toast.success('标准对标已生成，等待逐项人工确认');
  }
  function confirmRow(id: string, confirmed: boolean) {
    currentEvidence.filter(e => e.sourceId.endsWith(`-${id}`)).forEach(e => updateEvidence(e.id, { confirmed }));
    if (result) updateArtifact(result.id, { confirmed: false });
    if (task?.type === '标准对标') updateTask(task.id, { status: '等待确认' });
  }
  function saveResult() {
    const taskId = ensureTask();
    saveConfig(taskId);
    const content = `# 标准对标结果（模拟）\n\n${left.number}:${left.version} 对照 ${right.number}:${right.version}\n\n${rows.map(r => `## ${r.title}\n- ${left.number}:${left.version} ${r.clauseA}：${r.a}\n- ${right.number}:${right.version} ${r.clauseB}：${r.b}\n- 差异：${r.difference}\n- 人工确认：${currentEvidence.filter(e => e.sourceId.endsWith(`-${r.id}`)).every(e => e.confirmed) && started ? '已确认' : '待确认'}`).join('\n\n')}\n\n## 适用性建议\n${note || '当前仅有示例条款，需结合目标温度、围压和设备能力确认适用范围。'}\n\n来源：本地演示标准库。人工确认仅代表对本轮示例比对的确认。`;
    if (result) updateArtifact(result.id, { content, evidenceIds: currentEvidence.map(e => e.id), confirmed: confirmationCount === rows.length });
    else addArtifact({ taskId, projectId: project.id, type: '标准对标结果', title: `${pair} · 标准对标结果`, content, evidenceIds: currentEvidence.map(e => e.id), mode: '混合', confirmed: confirmationCount === rows.length });
    if (confirmationCount === rows.length) updateTask(taskId, { ...(!task || task.type === '标准对标' ? { status: '已完成' as const, plan: steps.map((title, i) => ({ id: `${taskId}-standard-${i}`, title, done: true })) } : {}), confirmations: [...(task?.confirmations || []), `${new Date().toISOString()}：人工确认全部标准差异并保存适用性结论`] });
    toast.success(confirmationCount === rows.length ? '已保存全部确认的标准对标产物' : '已保存对标草稿，未确认项保留待确认状态');
  }
  const shown = rows.filter(r => (tab !== '指标差异' || r.kind === '指标') && (tab !== '试验方法' || r.kind === '方法') && (filter === '全部' || !currentEvidence.filter(e => e.sourceId.endsWith(`-${r.id}`)).every(e => e.confirmed) || !started));

  return <ReadPage title="国内外标准对标" description="从标准条款到适用性判断，保留每一项差异的证据与人工确认。" actions={<><ReadBadge tone={task?.status === '已完成' ? 'green' : 'amber'}>{task?.status || '待开始'}</ReadBadge><button className="rs-outline-btn" disabled={!result} onClick={() => result && downloadText('标准对标结果.md', result.content)}><Download size={14} />导出结果</button><button className="rs-primary-btn" disabled={!started} onClick={saveResult}><FileCheck2 size={14} />保存研究产物</button></>}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-4 py-3 text-xs text-slate-500"><span>模拟研究 · 采用示例标准与条款，完整体验对标与确认流程</span><span>{project.name}</span></div>
    <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <ReadPanel title="对标任务计划"><div className="mb-5 rounded-md bg-slate-50 p-3 text-xs leading-6 text-slate-600">{task?.goal || '围绕当前课题，识别技术指标、试验方法和适用边界差异。'}</div>{steps.map((title, i) => <div key={title} className={`rs-step ${started && (i < 6 || result?.confirmed) ? 'done' : ''}`}><span className="rs-step-index">{started && (i < 6 || result?.confirmed) ? <Check size={12} /> : i + 1}</span><span>{title}</span></div>)}<div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-3 text-xs text-slate-500">已确认 {confirmationCount} / {rows.length} 组差异</p><div className="h-1.5 overflow-hidden rounded bg-slate-100"><div className="h-full bg-[#b4232d] transition-all" style={{ width: `${confirmationCount / rows.length * 100}%` }} /></div></div><button className="rs-primary-btn mt-5 w-full" onClick={run}><Play size={13} />{started ? '重新执行对标' : '开始对标'}</button></ReadPanel>
      <div className="space-y-4"><ReadPanel title="选择对标标准"><div className="grid gap-4 md:grid-cols-2">{[{ label: '基准标准', value: leftId, change: setLeftId }, { label: '对照标准', value: rightId, change: setRightId }].map(item => <label key={item.label} className="grid gap-2 text-xs text-slate-500">{item.label}<select className="research-input" value={item.value} onChange={e => item.change(e.target.value)}>{standardOptions.map(s => <option key={s.id} value={s.id}>{s.number}:{s.version} · {s.name}</option>)}</select></label>)}</div>{leftId === rightId && <p role="alert" className="mt-3 text-xs text-red-700">基准标准与对照标准不能相同。</p>}</ReadPanel>
      <ReadPanel title="标准对标结果" actions={<ReadBadge tone={result?.confirmed ? 'green' : 'amber'}>{result?.confirmed ? `已确认 · V${result.version}` : started ? '等待人工确认' : '预览示例条款'}</ReadBadge>}><ReadTabs items={tabs} value={tab} onChange={setTab} />
        {tab === '标准信息' ? <div className="grid gap-4 md:grid-cols-2">{[left, right].map((s, i) => <article key={`${s.id}-${i}`} className="rounded-md border border-slate-200 p-4"><ReadBadge tone={i ? 'neutral' : 'red'}>{i ? '对照标准' : '基准标准'}</ReadBadge><h3 className="my-3 font-semibold">{s.name}</h3><dl className="rs-data-list">{[['标准编号', s.number], ['版本', s.version], ['体系', s.region], ['来源', s.publisher], ['适用领域', s.scope], ['确认状态', started ? `${confirmationCount} 组条款已确认` : '待执行对标']].map(([key, value]) => <div key={key} className="grid grid-cols-[80px_1fr] gap-3"><dt>{key}</dt><dd>{value}</dd></div>)}</dl></article>)}</div>
        : tab === '适用性建议' ? <div className="space-y-4"><div className="rounded-md border-l-2 border-[#b4232d] bg-slate-50 p-4"><h3 className="mb-2 text-sm font-semibold">面向当前研究方案的适用性</h3><p className="text-xs leading-7 text-slate-600">两套标准的温度、围压和加载方式需分别核对。建议先确认目标试验条件，再选择满足范围的条款；对超出适用边界的条件补充方法验证，不能依据标准编号直接判定等效。</p></div><label className="grid gap-2 text-xs font-medium">人工适用性说明<textarea className="research-input min-h-36" value={note} onChange={e => setNote(e.target.value)} placeholder="说明目标试验条件、采用标准、适用条款以及偏离标准时的验证方案…" /></label><button className="rs-outline-btn" onClick={() => { saveConfig(ensureTask()); toast.success('人工说明已保存到当前任务'); }}>保存人工说明</button><div className="rs-note">人工判断与 AI 模拟建议分别保留。保存研究产物时将包含标准编号、版本、条款来源和每项确认状态。</div></div>
        : <><div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">逐条核对原文后确认差异</p><select aria-label="条款确认筛选" className="research-input max-w-32" value={filter} onChange={e => setFilter(e.target.value)}><option>全部</option><option>待确认</option></select></div><div className="rs-table-wrap"><table className="rs-table"><thead><tr><th>对比项</th><th>{left.number}:{left.version}</th><th>{right.number}:{right.version}</th><th>差异判断</th><th>人工确认</th></tr></thead><tbody>{shown.map(row => { const ev = currentEvidence.filter(e => e.sourceId.endsWith(`-${row.id}`)); return <tr key={row.id}><td className="min-w-24 font-medium">{row.title}</td><td className="min-w-36">{row.a}<small className="mt-2 block text-slate-400">{row.clauseA}</small>{ev[0] && <button className="rs-link-btn mt-2" onClick={() => setSource(ev.find(e => e.sourceId.includes('-0-')) || ev[0])}><Quote size={12} />查看条款</button>}</td><td className="min-w-36">{row.b}<small className="mt-2 block text-slate-400">{row.clauseB}</small>{ev[1] && <button className="rs-link-btn mt-2" onClick={() => setSource(ev.find(e => e.sourceId.includes('-1-')) || ev[1])}><Quote size={12} />查看条款</button>}</td><td className="min-w-44 text-slate-600">{row.difference}</td><td><label className="flex items-center gap-2 whitespace-nowrap"><input type="checkbox" aria-label={`确认${row.title}差异`} disabled={!started} checked={ev.length === 2 && ev.every(e => e.confirmed)} onChange={e => confirmRow(row.id, e.target.checked)} />{ev.length === 2 && ev.every(e => e.confirmed) ? '已确认' : '待确认'}</label></td></tr>; })}</tbody></table></div>{shown.length === 0 && <p className="py-12 text-center text-sm text-slate-500">当前视图中的条款均已确认。</p>}</>}
      </ReadPanel></div>
    </div>
    <Modal open={!!source} onClose={() => setSource(null)} title="标准原文证据" description="示例标准来源与条款片段，可核对后返回差异表进行人工确认。">{source && <div className="space-y-4"><ReadBadge tone="amber">{source.confirmed ? '人工已确认' : '待人工确认'}</ReadBadge><h3 className="font-semibold">{source.source}</h3><p className="text-sm text-slate-500">{source.location} · P{source.page}</p><blockquote className="rounded-md border-l-2 border-[#b4232d] bg-slate-50 p-4 text-sm leading-7">{source.excerpt}</blockquote><p className="text-xs text-slate-500">来源权限：{source.access} · 获取时间：{new Date(source.acquiredAt).toLocaleString('zh-CN')}</p></div>}</Modal>
  </ReadPage>;
}
