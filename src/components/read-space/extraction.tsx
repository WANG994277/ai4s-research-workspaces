'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, CheckCircle2, Download, FileSpreadsheet, ImagePlus, Plus, ScanLine, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useLocalState } from '@/components/research/workspace-kit';
import { downloadText, ReadBadge, ReadPage, ReadPanel, ReadTabs, useReadTask } from './ui';
import { downloadWorkbook } from './extraction-export';
import type { Artifact } from './types';
import { findLiterature } from './literature';
import './extraction-writing.css';

type DataRow = { id: string; x: number; y: number; error: number };
type ExtractionData = { tab: string; source: string; sourceId: string; page: number; figure: string; xLabel: string; yLabel: string; xUnit: string; yUnit: string; rows: DataRow[]; confirmed: boolean; acquiredAt: string; method: string; history: string[]; caption: string; region: string; image: string; artifactId: string; headers: boolean; merged: boolean };
const demoRows: DataRow[] = [{ id: '1', x: 25, y: 210, error: 4.2 }, { id: '2', x: 100, y: 168, error: 5.1 }, { id: '3', x: 150, y: 132, error: 4.8 }, { id: '4', x: 200, y: 98, error: 6.2 }];
const initialData: ExtractionData = { tab: '曲线图', source: '高温高压条件下页岩裂缝扩展的真三轴实验研究', sourceId: 'demo-lit-1', page: 5, figure: 'Figure 6', xLabel: '温度', yLabel: '抗压强度', xUnit: '℃', yUnit: 'MPa', rows: demoRows, confirmed: false, acquiredAt: '', method: 'AI 辅助提取（模拟）', history: [], caption: '不同温度下页岩峰值抗压强度。图示数据用于流程演示。', region: '重点区域：温度 100–200 ℃ 区间，峰值强度随温度变化。', image: '', artifactId: '', headers: true, merged: true };

function DataChart({ data, selected, onSelect }: { data: ExtractionData; selected: string; onSelect: (id: string) => void }) {
  const maxX = Math.max(...data.rows.map(row => row.x), 1) * 1.1; const maxY = Math.max(...data.rows.map(row => row.y), 1) * 1.15;
  const sx = (x: number) => 48 + x / maxX * 250; const sy = (y: number) => 246 - y / maxY * 196;
  return <svg viewBox="0 0 330 290" role="img" aria-label={`${data.xLabel}与${data.yLabel}关系图，点击数据点关联表格`} className="ew-chart">
    {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="48" x2="307" y1={246 - i * 49} y2={246 - i * 49} stroke="#e8e9ec" strokeDasharray="3 3"/><text x="40" y={250 - i * 49} textAnchor="end" fontSize="9" fill="#858a93">{Math.round(maxY * i / 4)}</text><text x={48 + i * 62.5} y="261" textAnchor="middle" fontSize="9" fill="#858a93">{Math.round(maxX * i / 4)}</text></g>)}
    <path d="M48 45 V246 H308" fill="none" stroke="#9b9fa6"/>
    <polyline points={[...data.rows].sort((a, b) => a.x - b.x).map(row => `${sx(row.x)},${sy(row.y)}`).join(' ')} fill="none" stroke="#b4232d" strokeWidth="2"/>
    {data.rows.map(row => <g key={row.id} role="button" tabIndex={0} aria-label={`${data.xLabel} ${row.x} ${data.xUnit}，${data.yLabel} ${row.y} ${data.yUnit}`} onClick={() => onSelect(row.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(row.id); }} style={{ cursor: 'pointer' }}><line x1={sx(row.x)} x2={sx(row.x)} y1={sy(row.y + row.error)} y2={sy(row.y - row.error)} stroke="#b4232d"/><circle cx={sx(row.x)} cy={sy(row.y)} r={selected === row.id ? 6 : 4} fill={selected === row.id ? '#b4232d' : 'white'} stroke="#b4232d" strokeWidth="2"/></g>)}
    <text x="178" y="282" textAnchor="middle" fontSize="10" fill="#606771">{data.xLabel} ({data.xUnit})</text><text transform="translate(12,150) rotate(-90)" textAnchor="middle" fontSize="10" fill="#606771">{data.yLabel} ({data.yUnit})</text><text x="50" y="23" fontSize="11" fontWeight="600" fill="#424954">已校正数据 · {data.rows.length} 个点</text>
  </svg>;
}

export function ReadExtraction() {
  const { project, task, createTask, href } = useReadTask();
  const params = useSearchParams(); const router = useRouter(); const pendingScope = useRef('');
  const taskId = task?.id; const queryTaskId = params.get('task'); const doc = params.get('doc'); const page = params.get('page');
  useEffect(() => {
    const canonicalHref = (id: string) => { const query = new URLSearchParams(); query.set('task', id); if (doc) query.set('doc', doc); if (page) query.set('page', page); return href(`/literature-search/data-extract?${query.toString()}`); };
    if (taskId) { pendingScope.current = ''; if (queryTaskId !== taskId) router.replace(canonicalHref(taskId)); return; }
    const scope = `${project.id}:${queryTaskId || ''}`;
    if (pendingScope.current === scope) return;
    pendingScope.current = scope;
    const id = createTask(`${project.name} · 图表提取`, '图表提取', project.id, doc ? [doc] : []);
    router.replace(canonicalHref(id));
  }, [taskId, queryTaskId, doc, page, project.id, project.name, createTask, href, router]);
  return taskId ? <ExtractionWorkspace key={`${project.id}-${taskId}-${doc || 'default'}-${page || 'default'}`} /> : <div className="rs-empty" role="status">正在建立图表提取任务上下文…</div>;
}
function ExtractionWorkspace() {
  const ctx = useReadTask(); const router = useRouter(); const params = useSearchParams();
  const initialArtifact = ctx.artifacts.find(artifact => {
    if (artifact.projectId !== ctx.project.id || artifact.taskId !== ctx.task?.id || artifact.type !== '图表数据') return false;
    try { const saved = JSON.parse(artifact.content); return (!params.get('doc') || saved.sourceId === params.get('doc')) && (!params.get('page') || saved.page === Number(params.get('page'))); } catch { return false; }
  });
  let restored = initialData; if (initialArtifact) { try { const parsed = JSON.parse(initialArtifact.content); if (Array.isArray(parsed.rows)) restored = { ...initialData, ...parsed, artifactId: initialArtifact.id }; } catch { /* Older artifacts remain available from the task. */ } }
  const sourceDoc = findLiterature(params.get('doc') || restored.sourceId);
  const [data, setData] = useLocalState<ExtractionData>(`ai4s-extraction-${ctx.project.id}-${ctx.task!.id}-${params.get('doc') || 'default'}-${params.get('page') || 'default'}`, { ...restored, sourceId: params.get('doc') || restored.sourceId, source: sourceDoc?.title || restored.source, page: Number(params.get('page')) || restored.page });
  const [selected, setSelected] = useState('1'); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const [resultTab, setResultTab] = useState('数据表');
  const update = (patch: Partial<ExtractionData>, reason?: string) => setData(previous => ({ ...previous, ...patch, confirmed: false, method: reason ? 'AI 辅助 + 人工修正（模拟）' : previous.method, history: reason ? [...previous.history.slice(-29), `${new Date().toLocaleString('zh-CN')} · ${reason}`] : previous.history }));
  const correct = (id: string, field: 'x' | 'y' | 'error', value: string) => { const numeric = Number(value); if (!Number.isFinite(numeric)) return; update({ rows: data.rows.map(row => row.id === id ? { ...row, [field]: numeric } : row) }, `校正数据点 ${data.rows.findIndex(row => row.id === id) + 1} 的 ${field === 'x' ? data.xLabel : field === 'y' ? data.yLabel : '误差'} 为 ${numeric}`); };
  const runExtraction = () => { setBusy(true); setNotice('正在识别图表区域、坐标与单位…'); setTimeout(() => { setData(previous => ({ ...previous, rows: previous.rows.length ? previous.rows : demoRows, acquiredAt: new Date().toISOString(), confirmed: false, method: 'AI 辅助提取（模拟）', history: [...previous.history, `${new Date().toLocaleString('zh-CN')} · 完成${previous.tab}识别模拟，已保留人工输入的数据`] })); setBusy(false); setNotice(data.tab === '图像 / 示意图' ? '已生成图注与重点区域说明，请核对后加入证据。' : '已识别字段、单位和数据点；请检查坐标、误差与数值后确认。'); }, 700); };
  const saveData = (destination: 'data' | 'task' = 'task') => {
    const taskId = ctx.task!.id;
    const acquiredAt = data.acquiredAt || new Date().toISOString();
    const evidenceId = ctx.addEvidence({ projectId: ctx.project.id, taskId, sourceId: data.sourceId, source: data.source, location: `P${data.page} · ${data.figure}`, page: data.page, excerpt: `${data.caption}\n${data.tab === '图像 / 示意图' ? data.region : data.rows.map(row => `${data.xLabel} ${row.x}${data.xUnit}，${data.yLabel} ${row.y}${data.yUnit}`).join('；')}`, confirmed: data.confirmed, access: data.image ? '用户上传' : '演示原文' });
    ctx.updateEvidence(evidenceId, { confirmed: data.confirmed });
    const payload: Omit<Artifact, 'id' | 'version' | 'updatedAt'> = { projectId: ctx.project.id, taskId, type: data.tab === '图像 / 示意图' ? '图像证据' : '图表数据', title: `${data.figure} · ${data.tab === '图像 / 示意图' ? '图像说明' : `${data.yLabel}数据`}`, content: JSON.stringify({ ...data, image: '', imageAttached: Boolean(data.image), acquiredAt, evidenceIds: [evidenceId] }), evidenceIds: [evidenceId], mode: data.history.length ? '混合' : 'AI', confirmed: data.confirmed };
    const exists = ctx.artifacts.find(a => a.id === data.artifactId && a.projectId === ctx.project.id && a.taskId === taskId && a.type === payload.type);
    const id = exists ? (ctx.updateArtifact(exists.id, payload), exists.id) : ctx.addArtifact(payload);
    ctx.addResources([data.sourceId], taskId);
    if (destination === 'data') { ctx.addResource({ id: `DATA-${id}`, name: `${data.figure} · ${data.yLabel}数据`, kind: '文件', status: data.confirmed ? '已人工确认' : '待人工确认', projectId: ctx.project.id, mime: 'application/json' }); ctx.addResources([`DATA-${id}`], taskId); }
    setData(previous => ({ ...previous, artifactId: id, acquiredAt })); setNotice(destination === 'data' ? '科研数据已保存，已关联当前课题和来源证据。' : '图表产物已加入研究任务，校正记录与来源一并保留。');
    return { taskId, id, evidenceId, acquiredAt };
  };
  const handoff = () => { if (data.tab === '图像 / 示意图') { setNotice('图像说明可加入研究证据；请切换到表格或曲线图，确认数值数据后用于科研计算。'); return; } if (!data.rows.length) { setNotice('请先添加数据点或运行模拟识别。'); return; } const saved = saveData('data'); const draftId = ctx.createDraft({ projectId: ctx.project.id, taskId: saved.taskId, target: 'compute', title: `${data.yLabel} · 计算验证`, goal: `分析${data.xLabel}对${data.yLabel}的影响`, hypothesis: '在当前数据范围内探索参数相关关系，尚需进一步验证', parameters: `${data.xLabel}（${data.xUnit}）；${data.yLabel}（${data.yUnit}）；误差（${data.yUnit}）`, evidenceIds: [saved.evidenceId], method: '参数拟合与敏感性分析', model: '待人工选择', data: JSON.stringify({ rows: data.rows, source: data.source, page: data.page, figure: data.figure, method: data.method, acquiredAt: saved.acquiredAt, confirmed: data.confirmed, history: data.history }), constraints: '演示数据；进入计算前核验来源、单位、误差与适用范围', standardRequirements: '' }); router.push(ctx.href(`/read-space/handoff?draft=${draftId}`)); };
  const rows = [[`${data.xLabel} (${data.xUnit})`, `${data.yLabel} (${data.yUnit})`, `误差 (${data.yUnit})`], ...data.rows.map(row => [row.x, row.y, row.error])];
  const provenance = [['字段', '内容'], ['来源文献', data.source], ['页码', String(data.page)], ['图表编号', data.figure], ['提取时间', data.acquiredAt || '人工录入，尚未运行识别'], ['提取方式', data.method], ['人工确认', data.confirmed ? '已确认' : '待确认'], ['图注', data.caption], ['校正记录', data.history.join('\n')], ['数据说明', '前端模拟数据，用于交互体验']];
  const upload = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) { setNotice('请上传 PNG、JPG 或 WebP 图表图片。'); return; } if (file.size > 2 * 1024 * 1024) { setNotice('为便于本地保存，请选择不超过 2 MB 的图表图片。'); return; } const reader = new FileReader(); reader.onload = () => { update({ image: String(reader.result), source: file.name, sourceId: `UPLOAD-${file.name}` }, '替换来源图片'); setNotice('已载入图片；可模拟识别，或直接人工录入并校正数据。'); }; reader.readAsDataURL(file); };

  return <ReadPage title="文献图表提取" description="从图表到可计算的数据，每一次校正都保留来源。" actions={<><ReadBadge>模拟工作台</ReadBadge><button className="rs-outline-btn" onClick={() => { downloadWorkbook(`${data.figure}-科研数据.xlsx`, [{ name: '提取数据', rows }, { name: '来源与校正记录', rows: provenance }]); setNotice('已导出 Excel 工作簿，包含提取数据与来源记录。'); }}><Download size={14}/>导出 Excel</button></>}>
    <div className="ew-sourcebar"><FileSpreadsheet size={17}/><strong>{data.source}</strong><span>P{data.page} · {data.figure}</span><ReadBadge tone={data.confirmed ? 'success' : 'warning'}>{data.confirmed ? '已人工确认' : '待人工核对'}</ReadBadge></div>
    <ReadTabs items={['表格', '曲线图', '图像 / 示意图']} value={data.tab} onChange={tab => update({ tab, figure: tab === '表格' ? 'Table 2' : 'Figure 6', page: tab === '表格' ? 4 : 5 })}/>
    <div className="ew-extraction-grid">
      <ReadPanel title="原始图表" actions={<label className="rs-link-btn"><ImagePlus size={13}/>替换图片<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/></label>}>
        <div className="ew-paper"><div className="ew-paper-masthead">RESEARCH FIGURE <span>原文示例</span></div>{data.image ? <Image src={data.image} width={800} height={600} unoptimized className="ew-upload" alt="用户上传的来源图表"/> : data.tab === '表格' ? <div className="rs-table-wrap"><table className="ew-original-table"><caption>Table 2. Mechanical properties</caption><thead><tr><th>Temperature (℃)</th><th>Strength (MPa)</th><th>SD</th></tr></thead><tbody>{demoRows.map(row => <tr key={row.id}><td>{row.x}</td><td>{row.y}</td><td>{row.error}</td></tr>)}</tbody></table></div> : data.tab === '图像 / 示意图' ? <svg viewBox="0 0 310 270" role="img" aria-label="岩样裂缝示意图"><defs><pattern id="rock" width="13" height="13" patternUnits="userSpaceOnUse"><rect width="13" height="13" fill="#f3eee7"/><circle cx="4" cy="6" r="1" fill="#c2b6a5"/></pattern></defs><rect x="56" y="43" width="195" height="170" rx="4" fill="url(#rock)" stroke="#b9aa99"/><path d="M139 45 L153 91 L132 132 L163 172 L147 212 M132 132 L88 156 M153 91 L206 75" stroke="#b4232d" strokeWidth="3" fill="none"/><path d="M160 14 V34 M160 243 V222" stroke="#686f77" strokeWidth="2"/><text x="168" y="28" fontSize="10" fill="#68717d">加载方向</text><text x="63" y="257" fontSize="10" fill="#68717d">裂缝路径示意 · 非真实实验图像</text></svg> : <DataChart data={{ ...initialData, rows: demoRows }} selected="" onSelect={() => setNotice('左栏保留原始示例；请在提取结果中选择或校正数据点。')}/>}
          <p className="ew-caption"><strong>{data.figure}.</strong> {data.caption}</p><span className="ew-page-number">— {data.page} —</span>
        </div>
        <div className="ew-form"><label>来源文献<input className="research-input" value={data.source} onChange={e => update({ source: e.target.value }, '修改来源文献')}/></label><div className="ew-two-fields"><label>页码<input className="research-input" type="number" min="1" value={data.page} onChange={e => update({ page: Math.max(1, Number(e.target.value)) }, '修正来源页码')}/></label><label>图表编号<input className="research-input" value={data.figure} onChange={e => update({ figure: e.target.value }, '修改图表编号')}/></label></div></div>
      </ReadPanel>
      <ReadPanel title="提取结果" actions={<ReadBadge>{data.tab === '图像 / 示意图' ? '图像说明' : `${data.rows.length} 个数据点`}</ReadBadge>}>
        {data.tab === '图像 / 示意图' ? <div className="ew-form"><label>图注识别<textarea className="research-input" rows={4} value={data.caption} onChange={e => update({ caption: e.target.value }, '修正图注')}/></label><label>关键区域说明<textarea className="research-input" rows={5} value={data.region} onChange={e => update({ region: e.target.value }, '补充重点区域说明')}/></label><div className="rs-note">模拟理解：红色路径表示示意裂缝；仅凭示意图不能推断真实破坏机理，应结合实验条件与原文说明。</div><button className="rs-outline-btn" onClick={() => saveData()}>将图像说明加入证据</button></div> : <><ReadTabs items={['数据表', '数据图']} value={resultTab} onChange={setResultTab}/>{resultTab === '数据图' ? <DataChart data={data} selected={selected} onSelect={id => { setSelected(id); setResultTab('数据表'); }}/>:<div className="rs-table-wrap"><table className="ew-edit-table"><thead><tr><th>#</th><th>{data.xLabel}<small>{data.xUnit}</small></th><th>{data.yLabel}<small>{data.yUnit}</small></th><th>误差<small>± {data.yUnit}</small></th><th><span className="sr-only">删除</span></th></tr></thead><tbody>{data.rows.map((row, index) => <tr key={row.id} className={selected === row.id ? 'selected' : ''} onClick={() => setSelected(row.id)}><td>{index + 1}</td>{(['x', 'y', 'error'] as const).map(field => <td key={field}><input aria-label={`第 ${index + 1} 行${field === 'x' ? data.xLabel : field === 'y' ? data.yLabel : '误差'}`} type="number" step="any" value={row[field]} onChange={e => correct(row.id, field, e.target.value)}/></td>)}<td><button aria-label={`删除第 ${index + 1} 行`} onClick={() => update({ rows: data.rows.filter(item => item.id !== row.id) }, `删除数据点 ${index + 1}`)}><Trash2 size={12}/></button></td></tr>)}</tbody></table></div>}
        <button className="rs-link-btn ew-add-row" onClick={() => update({ rows: [...data.rows, { id: `row-${Date.now()}`, x: 0, y: 0, error: 0 }] }, '新增人工数据点')}><Plus size={13}/>添加数据点</button><div className="rs-note">点击表格或图形中的数据点可联动定位。编辑数值后，图形同步更新。</div>
        <div className="ew-mini-chart"><DataChart data={data} selected={selected} onSelect={id => { setSelected(id); setResultTab('数据表'); }}/></div></>}
      </ReadPanel>
      <ReadPanel title="AI 辅助与人工校正" actions={<SlidersHorizontal size={14} className="text-muted-foreground"/>}>
        <div className="ew-form"><button className="rs-primary-btn" onClick={runExtraction} disabled={busy}><ScanLine size={14}/>{busy ? '正在识别…' : '模拟智能识别'}</button>
          {data.tab !== '图像 / 示意图' && <><div className="ew-two-fields"><label>X 轴 / 字段<input className="research-input" value={data.xLabel} onChange={e => update({ xLabel: e.target.value }, '修正 X 轴含义')}/></label><label>单位<input className="research-input" value={data.xUnit} onChange={e => update({ xUnit: e.target.value }, '修正 X 轴单位')}/></label></div><div className="ew-two-fields"><label>Y 轴 / 字段<input className="research-input" value={data.yLabel} onChange={e => update({ yLabel: e.target.value }, '修正 Y 轴含义')}/></label><label>单位<input className="research-input" value={data.yUnit} onChange={e => update({ yUnit: e.target.value }, '修正 Y 轴单位')}/></label></div>{data.tab === '表格' && <><label className="ew-check"><input type="checkbox" checked={data.headers} onChange={e => update({ headers: e.target.checked })}/>首行作为表头</label><label className="ew-check"><input type="checkbox" checked={data.merged} onChange={e => update({ merged: e.target.checked })}/>展开合并单元格并继承表头</label></>}</>}
          <div className="ew-quality"><h3>校验提示</h3><p>{!data.xUnit || !data.yUnit ? '存在未填写的单位，请补全后确认。' : data.rows.some(row => row.error < 0 || row.x < 0 || row.y < 0) ? '存在负值，请核对数据是否符合物理含义。' : '单位已填写；请核对原文中的数值精度、误差定义与适用范围。'}</p></div>
          <label className="ew-check"><input type="checkbox" checked={data.confirmed} onChange={e => setData(previous => ({ ...previous, confirmed: e.target.checked, history: [...previous.history, `${new Date().toLocaleString('zh-CN')} · ${e.target.checked ? '人工确认提取结果' : '撤回人工确认'}`] }))}/><span>我已核对来源、坐标、单位和数值</span></label>
          <button className="rs-outline-btn" onClick={() => saveData()}><Check size={14}/>保存校正结果</button>
          <dl className="ew-provenance"><dt>提取方式</dt><dd>{data.method}</dd><dt>提取时间</dt><dd>{data.acquiredAt ? new Date(data.acquiredAt).toLocaleString('zh-CN') : '尚未运行识别'}</dd><dt>来源状态</dt><dd>{data.image ? '用户上传图片' : '演示文献与图表'}</dd></dl>
          <details className="ew-history"><summary>人工校正记录（{data.history.length}）</summary>{data.history.length ? data.history.slice().reverse().map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>修改数据、来源或单位后自动记录。</p>}</details>
        </div>
      </ReadPanel>
    </div>
    {notice && <div className="ew-status" role="status"><CheckCircle2 size={15}/>{notice}</div>}
    <footer className="ew-bottom-bar"><span>来源与校正记录随数据一起流转</span><div className="rs-actions"><button className="rs-outline-btn" onClick={() => { const quote = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`; downloadText(`${data.figure}-数据.csv`, [...rows, [], ...provenance].map(row => row.map(quote).join(',')).join('\r\n'), 'text/csv;charset=utf-8'); setNotice('已导出 CSV，文件末尾包含来源与校正记录。'); }}><Download size={13}/>CSV</button><button className="rs-outline-btn" onClick={() => saveData('data')}>加入科研数据</button><button className="rs-outline-btn" onClick={() => saveData('task')}>加入研究任务</button><button className="rs-primary-btn" onClick={handoff}>用于科研计算<ArrowRight size={14}/></button></div></footer>
  </ReadPage>;
}
