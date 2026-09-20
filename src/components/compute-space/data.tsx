'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, Database, FileUp, GitBranch, Play, Plus } from 'lucide-react';
import { useComputeStore } from './store';
import { Button, Modal, PageHeader, Panel, Status, Tabs, downloadFile } from './ui';

const operators = [
  { name: '缺失值处理', choices: ['线性插值', '均值填充', '删除缺失行'], description: '识别空值并补全连续测量数据' },
  { name: '异常值处理', choices: ['3σ 检测并标记', 'IQR 截尾', '保留并标记'], description: '避免极端值干扰建模与科学分析' },
  { name: '数据去噪', choices: ['Savitzky–Golay', '移动平均', '中值滤波'], description: '保留趋势，降低仪器测量噪声' },
  { name: '单位统一', choices: ['SI 标准单位', '课题约定单位'], description: '温度、压力等字段统一量纲' },
  { name: '特征处理', choices: ['Z-score 标准化', 'Min-Max 归一化', '生成交互特征'], description: '形成可用于训练的特征空间' },
  { name: '重复记录', choices: ['按样本 ID 去重', '完全重复去重'], description: '检测并处理重复样本' },
];
const processingStorageKey = 'ai4s-compute-processing-v1';

export function DataWorkspace() {
  const store = useComputeStore();
  const router = useRouter();
  const upload = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState('');
  const dataset = store.datasets.find((item) => item.id === selectedId) ?? store.datasets[0];
  const [enabled, setEnabled] = useState([true, true, true, true, false, true]);
  const [methods, setMethods] = useState(operators.map((item) => item.choices[0]));
  const [customOperator, setCustomOperator] = useState('无');
  const [tab, setTab] = useState('数据预览');
  const [progress, setProgress] = useState(-1);
  const [finished, setFinished] = useState(false);
  const [newId, setNewId] = useState('');
  const [notice, setNotice] = useState('');
  const [save, setSave] = useState(false);
  const [outputName, setOutputName] = useState('');
  const [returnPlan, setReturnPlan] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importName, setImportName] = useState('实验仪器测量数据');
  const [source, setSource] = useState('实验设备数据');
  const [viewProcessed, setViewProcessed] = useState(true);
  const [processingHydrated, setProcessingHydrated] = useState(false);
  const importedRows = dataset?.headers && dataset.preview ? [dataset.headers, ...dataset.preview] : [];
  const shaleData = /页岩|真三轴/.test(`${dataset?.name} ${dataset?.source}`);
  const catalystData = /催化剂/.test(dataset?.name ?? '');
  const previewHeaders = dataset?.headers ?? (shaleData ? ['样本 ID', '温度 ℃', '围压 MPa', '弹性模量 GPa', '裂缝长度 mm'] : catalystData ? ['材料 ID', 'Ni 配比 %', 'Co 配比 %', '焙烧温度 ℃', '催化活性 %'] : Array.from({ length: Math.min(dataset?.columns ?? 5, 12) }, (_, i) => i === 0 ? '记录 ID' : `特征 ${i}`));
  const sourcePreview = dataset?.preview ?? Array.from({ length: 6 }, (_, i) => shaleData ? [`SH-${String(i + 1).padStart(3, '0')}`, `${25 + i * 25}`, `${10 + i * 5}`, i === 2 ? '缺失' : `${(25.2 + i * .8).toFixed(1)}`, i === 4 ? '126.8 ⚠' : `${(12.4 + i * 4.2).toFixed(1)}`] : catalystData ? [`CAT-${i + 1}`, `${20 + i * 5}`, `${10 + i * 2}`, `${400 + i * 50}`, `${72 + i * 3.8}`] : previewHeaders.map((_, j) => j === 0 ? `ROW-${i + 1}` : `${(12 + i * 2.3 + j * 3.4).toFixed(2)}`));
  const processedPreview = sourcePreview.map((row) => row.map((cell, column) => {
    if ((!cell.trim() || cell === '缺失') && enabled[0]) {
      const observed = sourcePreview.map((item) => Number(item[column])).filter((value, i) => sourcePreview[i][column]?.trim() && Number.isFinite(value));
      return observed.length ? (observed.reduce((a, b) => a + b, 0) / observed.length).toFixed(2) : '已填补';
    }
    if (cell.includes('⚠') && enabled[1]) return '29.20';
    return cell;
  }));
  const displayedPreview = finished && viewProcessed ? processedPreview : sourcePreview;
  const running = progress >= 0 && progress < 100;
  const flow = operators.filter((_, i) => enabled[i]).map((operator) => `${operator.name} · ${methods[operators.indexOf(operator)]}`).concat(customOperator === '无' ? [] : [`自定义算子 · ${customOperator}`]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(processingStorageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        if (typeof saved.selectedId === 'string') setSelectedId(saved.selectedId);
        if (Array.isArray(saved.enabled) && saved.enabled.length === operators.length && saved.enabled.every((value) => typeof value === 'boolean')) setEnabled(saved.enabled);
        if (Array.isArray(saved.methods) && saved.methods.length === operators.length && saved.methods.every((value, i) => typeof value === 'string' && operators[i].choices.includes(value))) setMethods(saved.methods);
        if (typeof saved.customOperator === 'string') setCustomOperator(saved.customOperator);
        const restoredProgress = typeof saved.progress === 'number' && Number.isFinite(saved.progress) ? Math.min(100, Math.max(-1, saved.progress)) : -1;
        setProgress(restoredProgress);
        setFinished(restoredProgress === 100 || saved.finished === true);
        if (typeof saved.newId === 'string') setNewId(saved.newId);
        if (typeof saved.outputName === 'string') setOutputName(saved.outputName);
        if (restoredProgress >= 0 && restoredProgress < 100) setNotice(`已恢复处理任务，将从 ${restoredProgress}% 继续运行。`);
        else if (restoredProgress === 100) setNotice(saved.newId ? '已恢复处理结果与输出版本，可继续回流计算方案。' : '已恢复完成的处理结果，请保存为新的数据版本。');
      }
    } catch { setNotice('本地处理记录无法读取，已恢复默认配置。'); }
    finally { setProcessingHydrated(true); }
  }, []);
  useEffect(() => {
    if (!processingHydrated) return;
    try { localStorage.setItem(processingStorageKey, JSON.stringify({ selectedId: selectedId || dataset?.id || '', progress, enabled, methods, customOperator, finished, newId, outputName })); }
    catch { setNotice('本地空间不足，处理状态暂未保存；可继续当前处理流程。'); }
  }, [processingHydrated, selectedId, dataset?.id, progress, enabled, methods, customOperator, finished, newId, outputName]);
  useEffect(() => {
    if (!running || !processingHydrated) return;
    const timer = setInterval(() => setProgress((value) => { const next = Math.min(100, value + 20); return next; }), 450);
    return () => clearInterval(timer);
  }, [running, processingHydrated]);
  useEffect(() => { if (progress === 100) setFinished(true); }, [progress]);

  function resetOutput() { setProgress(-1); setFinished(false); setNewId(''); }
  function saveVersion() {
    if (!dataset || !outputName.trim()) return;
    const id = store.addDataset({ name: outputName.trim(), version: Math.max(...store.datasets.filter((item) => item.name === outputName.trim()).map((item) => item.version), dataset.version) + 1, rows: Math.max(1, dataset.rows - (enabled[5] ? Math.round(dataset.rows * 0.008) : 0)), columns: dataset.columns + (enabled[4] && methods[4] === '生成交互特征' ? 2 : 0), quality: Math.min(99.8, dataset.quality + enabled.filter(Boolean).length * 1.7), source: `${dataset.name} V${dataset.version}`, parentId: dataset.id, flow, createdAt: new Date().toLocaleString('zh-CN'), creator: '张博士', usedBy: [], headers: previewHeaders, preview: processedPreview });
    setNewId(id); setSave(false); setNotice('新数据版本已保存，上游版本与处理流程已保留。现在可回流计算方案或进入模型训练。');
  }
  async function importFile(file?: File) {
    if (!file) return;
    const content = await file.text();
    const rows = content.trim().split(/\r?\n/).map((line) => line.split(file.name.endsWith('.tsv') ? '\t' : ','));
    if (rows.length < 2 || rows[0].length < 2) { setNotice('未识别到有效的表格，请上传至少 2 列且包含数据行的 CSV / TSV 文件。'); return; }
    const id = store.addDataset({ name: file.name.replace(/\.(csv|tsv)$/i, ''), version: 1, rows: rows.length - 1, columns: rows[0].length, quality: 89.6, source: `本地文件：${file.name}`, flow: ['本地文件导入'], createdAt: new Date().toLocaleString('zh-CN'), creator: '张博士', usedBy: [], headers: rows[0], preview: rows.slice(1, 7) });
    setSelectedId(id); resetOutput(); setNotice(`已导入 ${file.name}，${rows.length - 1} 行 × ${rows[0].length} 列，样本预览已随版本保存。`);
    if (upload.current) upload.current.value = '';
  }
  function attachToPlan() {
    if (!newId) return;
    const plan = store.plans.find((item) => item.id === returnPlan) ?? store.plans.find((item) => item.id === store.activePlanId);
    if (plan) { const targetId = ['已确认', '已创建任务'].includes(plan.status) ? store.newPlanVersion(plan.id) : plan.id; store.updatePlan(targetId, { datasetId: newId, status: '待确认' }); setNotice(`已回流至“${plan.title}”${targetId !== plan.id ? '的新方案版本' : ''}，需要重新确认新数据版本。`); }
    else { const id = store.createPlan(`使用 ${outputName} 分析科研数据`, { datasetId: newId }); router.push(`/compute-space/agent?plan=${id}`); }
  }

  return <div className="cp-stack" data-prd-id="REQ-DATA-001">
    <PageHeader eyebrow="专业工作台 / DATA PREPARATION" title="科研数据处理" description="绑定精确的数据版本，编排处理流程，让每一次清洗都可预览、可追溯。" actions={<><Button variant="secondary" onClick={() => upload.current?.click()}><FileUp size={15}/>导入 CSV / TSV</Button><Button variant="primary" disabled={!finished || !!newId} onClick={() => { setOutputName(dataset?.name ?? '科研数据'); setSave(true); }}>保存为新版本</Button></>} />
    <input ref={upload} type="file" accept=".csv,.tsv" className="hidden" onChange={(e) => importFile(e.target.files?.[0])}/>
    {notice && <div className="cp-note" role="status">{notice}</div>}
    <div className="grid gap-4 xl:grid-cols-[225px_minmax(260px,0.85fr)_minmax(360px,1.4fr)]">
      <div className="cp-stack"><Panel title="科研数据"><div className="cp-stack">{store.datasets.map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); resetOutput(); }} className={`rounded-md border p-3 text-left transition-colors ${dataset?.id === item.id ? 'border-[#bd6659] bg-[#fbf3f0]' : 'border-[#e8e5df] hover:bg-[#faf9f7]'}`} disabled={running}><div className="flex items-center justify-between gap-2 text-xs font-semibold"><span className="flex items-center gap-2"><Database size={13}/>{item.name}</span><span className="whitespace-nowrap text-[#a65447]">V{item.version}</span></div><p className="mt-2 text-[11px] text-[#868980]">{item.rows.toLocaleString()} 行 · {item.columns} 个特征</p></button>)}<Button variant="secondary" onClick={() => setImportOpen(true)}><Plus size={14}/>接入数据源</Button></div></Panel>{dataset && <Panel title="版本元数据"><dl className="space-y-3 text-xs"><div><dt className="cp-muted">来源</dt><dd className="mt-1">{dataset.source}</dd></div><div><dt className="cp-muted">创建</dt><dd className="mt-1">{dataset.creator} · {dataset.createdAt}</dd></div><div><dt className="cp-muted">上游版本</dt><dd className="mt-1">{dataset.parentId ?? '原始数据'}</dd></div><div><dt className="cp-muted">质量状态</dt><dd className="mt-1">{dataset.quality}% · {dataset.quality >= 95 ? '可用于计算' : '建议清洗'}</dd></div><div><dt className="cp-muted">下游引用</dt><dd className="mt-1">{store.tasks.filter((task) => task.datasetId === dataset.id).length} 个任务 · {store.plans.filter((plan) => plan.datasetId === dataset.id).length} 个方案</dd></div></dl></Panel>}</div>
      <Panel title="处理流程配置"><div className="cp-stack"><p className="cp-muted">算子按下列顺序执行，每次处理保留原始版本。</p>{operators.map((operator, i) => <div key={operator.name}><div className={`rounded-md border p-3 ${enabled[i] ? 'border-[#e0d8d0] bg-[#fdfcfa]' : 'border-[#eceae6] opacity-65'}`}><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={enabled[i]} disabled={running} onChange={(e) => { setEnabled(enabled.map((value, j) => i === j ? e.target.checked : value)); resetOutput(); }}/><span className="text-[#b26453]">{String(i + 1).padStart(2, '0')}</span>{operator.name}</label><p className="mb-2 mt-2 text-[11px] text-[#92948d]">{operator.description}</p><select aria-label={`${operator.name}方法`} className="cp-select" value={methods[i]} disabled={!enabled[i] || running} onChange={(e) => { setMethods(methods.map((value, j) => i === j ? e.target.value : value)); resetOutput(); }}>{operator.choices.map((choice) => <option key={choice}>{choice}</option>)}</select></div>{i < operators.length - 1 && <ArrowDown size={12} className="mx-auto my-1 text-[#b6b7ae]"/>}</div>)}<label className="cp-field">自定义算子<select className="cp-select" disabled={running} value={customOperator} onChange={(e) => { setCustomOperator(e.target.value); resetOutput(); }}>{['无', '岩石力学物理约束校验', '分子描述符生成', '测序质量过滤'].map((name) => <option key={name}>{name}</option>)}</select><span className="cp-muted">复用 AI 中台已注册算子</span></label><Button variant="primary" disabled={!processingHydrated || running || !dataset || !flow.length} onClick={() => { setSelectedId(dataset?.id ?? ''); setProgress(0); setFinished(false); setNewId(''); setNotice('处理任务已创建，正在按流程执行演示计算。'); }}><Play size={14}/>{running ? `正在处理 ${progress}%` : '创建处理任务'}</Button>{running && <div className="h-1.5 overflow-hidden rounded bg-[#eee9e3]"><div className="h-full bg-[#b64b3f] transition-all" style={{ width: `${progress}%` }}/></div>}</div></Panel>
      <div className="cp-stack"><Panel title="处理结果与质量"><div className="cp-kpis mb-4"><div className="cp-kpi"><span>完整率</span><strong>{finished && enabled[0] ? '99.8' : '94.2'}<small>%</small></strong></div><div className="cp-kpi"><span>异常记录</span><strong>{finished && enabled[1] ? '已标记' : '328'}</strong></div><div className="cp-kpi"><span>质量评分</span><strong>{dataset ? (finished ? Math.min(99.8, dataset.quality + enabled.filter(Boolean).length * 1.7).toFixed(1) : dataset.quality) : '—'}</strong></div></div><Tabs items={['数据预览', '可视化', '质量报告', '版本与血缘']} value={tab} onChange={setTab}/>
        {tab === '数据预览' && <><div className="mb-3 mt-3 flex justify-between text-xs"><span className="cp-muted">{dataset?.name} · 前 6 条记录</span><label className="flex items-center gap-2"><input type="checkbox" checked={viewProcessed} disabled={!finished} onChange={(e) => setViewProcessed(e.target.checked)}/>处理后</label></div><div className="cp-table-wrap"><table className="cp-table"><thead><tr>{previewHeaders.map((value, i) => <th key={`${value}-${i}`}>{value}</th>)}</tr></thead><tbody>{displayedPreview.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j} className={value.includes('缺失') || value.includes('⚠') ? 'text-[#ae4438]' : ''}>{value}</td>)}</tr>)}</tbody></table></div><p className="cp-muted mt-3">{importedRows.length ? '预览与当前数据版本关联并持久保存；处理阶段使用演示质量统计。' : '预置演示样本与当前数据集对应；缺失与异常记录在原始视图中标记。'}</p></>}
        {tab === '可视化' && <div className="py-5"><div className="mb-3 flex gap-4 text-xs"><span className="text-[#afb4af]">● 原始测量</span><span className="text-[#b64b3f]">● {finished ? '处理后曲线' : '参考趋势'}</span></div><svg viewBox="0 0 480 245" className="w-full" role="img" aria-label="数据处理前后曲线对比"><path d="M35 20V210H460" fill="none" stroke="#d7d8d2"/>{[50,100,150,200].map((y) => <line key={y} x1="35" x2="460" y1={y} y2={y} stroke="#efefeb"/>)}<polyline fill="none" stroke="#b9c3bd" strokeWidth="1.7" points={Array.from({ length: 50 }, (_, i) => `${35+i*8.5},${175-Math.sin(i/15)*100+Math.sin(i*2)*21}`).join(' ')}/><polyline fill="none" stroke="#b64b3f" strokeWidth="2" points={Array.from({ length: 50 }, (_, i) => `${35+i*8.5},${175-Math.sin(i/15)*100}`).join(' ')}/><text x="205" y="235" fontSize="10" fill="#888">采样时间（s）</text></svg><div className="cp-note">{finished ? '处理完成：噪声幅值下降，主趋势得到保留。请结合原始记录检查关键拐点。' : '运行处理任务后查看输出曲线与质量报告。'}</div></div>}
        {tab === '质量报告' && <div className="cp-stack pt-4">{[['缺失值', '724 个单元格', enabled[0] ? methods[0] : '保留'], ['异常值', '328 条记录', enabled[1] ? methods[1] : '保留'], ['单位', '3 个数值字段', enabled[3] ? methods[3] : '保持原单位'], ['重复记录', `${Math.round((dataset?.rows ?? 12000) * .008)} 条`, enabled[5] ? methods[5] : '保留']].map((item) => <div className="flex items-center justify-between border-b border-[#eceae6] pb-3 text-xs" key={item[0]}><span>{item[0]}<small className="ml-3 text-[#90948b]">{item[1]}</small></span><Status value={finished ? item[2] : '待处理'}/></div>)}<div className="cp-note">科学边界：数据插值不会自动视为真实观测值；异常值仅按配置标记或截尾。输出版本保留完整处理记录。</div></div>}
        {tab === '版本与血缘' && <div className="cp-stack pt-4">{store.datasets.filter((item) => item.name === dataset?.name || item.id === dataset?.parentId || item.parentId === dataset?.id).map((item) => <div key={item.id} className="rounded-md border border-[#e6e2da] p-3"><div className="flex items-center gap-2 text-sm font-semibold"><GitBranch size={15}/>{item.name} V{item.version}</div><p className="cp-muted mt-2">{item.flow.join(' → ')} · {item.creator}</p><div className="mt-2 flex justify-between text-xs"><span>{item.createdAt}</span><button className="cp-link" onClick={() => { setSelectedId(item.id); resetOutput(); }}>查看版本</button></div></div>)}</div>}
      </Panel><Panel title="运行记录"><div className="rounded-md bg-[#242a28] p-4 font-mono text-[11px] leading-6 text-[#c9d8cc]"><p>[INPUT] {dataset?.id ?? '待选择'} · V{dataset?.version ?? '—'}</p><p>[FLOW] 已配置 {flow.length} 个算子</p>{progress >= 0 && flow.slice(0, Math.max(1, Math.ceil(progress / 100 * flow.length))).map((item, i) => <p key={item}>[{progress === 100 ? 'DONE' : 'RUN'}] {String(i + 1).padStart(2, '0')} {item}</p>)}{finished && <p className="text-[#efc5a8]">[COMPLETE] 结果已生成，等待保存新版本。</p>}{newId && <p>[SAVED] {newId}</p>}</div></Panel>
      {newId && <Panel title="数据结果回流"><div className="cp-stack"><label className="cp-field">目标计算方案<select className="cp-select" value={returnPlan} onChange={(e) => setReturnPlan(e.target.value)}><option value="">{store.activePlanId ? '当前活跃计算方案' : '创建新的计算方案'}</option>{store.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} · V{plan.version}</option>)}</select></label><div className="cp-row"><Button variant="primary" onClick={attachToPlan}>回流计算方案</Button><Button variant="secondary" onClick={() => router.push(`/compute-space/models?dataset=${newId}`)}>用于模型训练</Button><Button variant="ghost" onClick={() => downloadFile(`处理报告-${newId}.json`, JSON.stringify(store.datasets.find((item) => item.id === newId), null, 2))}>导出处理报告</Button></div></div></Panel>}
      </div>
    </div>
    <Modal open={save} onClose={() => setSave(false)} title="生成新的数据版本" footer={<><Button variant="secondary" onClick={() => setSave(false)}>取消</Button><Button variant="primary" onClick={saveVersion} disabled={!outputName.trim()}>确认保存新版本</Button></>}><div className="cp-stack"><label className="cp-field">数据集名称<input className="cp-input" value={outputName} onChange={(e) => setOutputName(e.target.value)}/></label><p className="cp-note">基于 {dataset?.name} V{dataset?.version} 生成新版本，保留原始数据、上游版本和 {flow.length} 个算子的处理记录。</p></div></Modal>
    <Modal open={importOpen} onClose={() => setImportOpen(false)} title="接入科研数据源" footer={<><Button variant="secondary" onClick={() => setImportOpen(false)}>取消</Button><Button disabled={!importName.trim()} onClick={() => { const id = store.addDataset({ name: importName.trim(), version: 1, rows: 8640, columns: 8, quality: 91.4, source: `${source}（演示连接）`, flow: ['数据源接入'], createdAt: new Date().toLocaleString('zh-CN'), creator: '张博士', usedBy: [] }); setSelectedId(id); resetOutput(); setImportOpen(false); setNotice(`已接入 ${source} 的演示数据，共 8,640 条。`); }}>接入演示数据</Button></>}><div className="cp-stack"><label className="cp-field">数据来源<select className="cp-select" value={source} onChange={(e) => setSource(e.target.value)}>{['实验设备数据', '计算结果导入', '数据库连接', '云存储（OSS）', 'API 接口'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="cp-field">数据集名称<input className="cp-input" value={importName} onChange={(e) => setImportName(e.target.value)}/></label><p className="cp-note">演示模式使用内置数据源，接入后可完整演示清洗、版本管理与结果回流。</p></div></Modal>
  </div>;
}







