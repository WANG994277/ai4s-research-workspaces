'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Check, ChevronDown, Download, FlaskConical, GitCompareArrows, Info, Sparkles } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useComputeStore } from './store';
import type { ComputeTask } from './types';
import { taskScenario } from './scenarios';
import { Button, Empty, Modal, PageHeader, Panel, Status, Tabs, downloadFile } from './ui';
import styles from './tasks.module.css';

const PALETTE = ['#ce4c36', '#377e84', '#75629b', '#d09238'];
const REVIEW_STATES = ['计算结果已生成', '待人工分析', '已人工确认', '与实验一致', '与实验存在偏差', '需要进一步验证'];

export function resultSchema(task?: ComputeTask) {
  const scenario = task ? taskScenario(task) : undefined;
  const common = { next: scenario?.experiment || '领域实验', observation: scenario?.conclusion || '此演示未配置该领域的结果指标。', sensitive: scenario?.sensitive || ['主变量'] };
  if (scenario?.kind === 'material') return { ...common, domain: 'materials', primary: '热稳定性评分', unit: '分', secondary: '形成能', secondaryUnit: 'eV', third: '催化活性', thirdUnit: '%', curve: '热稳定性评分', param1: 'Ni 配比', param1Unit: '%', param2: '焙烧温度', param2Unit: '℃' };
  if (scenario?.kind === 'bio') return { ...common, domain: 'bio', primary: '相对产率', unit: '%', secondary: '代谢通量', secondaryUnit: 'mmol/gDW/h', third: '生长稳定性', thirdUnit: '%', curve: '累计相对产率', param1: '诱导浓度', param1Unit: 'mM', param2: '培养温度', param2Unit: '℃' };
  if (scenario?.kind === 'flow') return { ...common, domain: 'flow', primary: '驱替采收率', unit: '%', secondary: '压降', secondaryUnit: 'MPa', third: '残余油饱和度', thirdUnit: '%', curve: '累计采收率', param1: '温度', param1Unit: '℃', param2: '注入压力', param2Unit: 'MPa' };
  if (scenario?.kind === 'geo') return { ...common, domain: 'fracture', primary: '裂缝长度', unit: 'mm', secondary: '最大应力', secondaryUnit: 'MPa', third: '拟合一致性', thirdUnit: '%', curve: '裂缝扩展长度', param1: '温度', param1Unit: '℃', param2: '围压', param2Unit: 'MPa' };
  return { ...common, domain: 'generic', primary: '主要指标', unit: '', secondary: '辅助指标', secondaryUnit: '', third: '误差', thirdUnit: '%', curve: '计算结果', param1: '主变量', param1Unit: '', param2: '次变量', param2Unit: '' };
}

export function taskMetrics(task: ComputeTask) {
  const number = (key: string, fallback: number) => {
    const value = Number.parseFloat(task.parameters.find((p) => p.name.includes(key))?.value ?? '');
    return Number.isFinite(value) ? value : fallback;
  };
  const seed = Array.from(JSON.stringify({ parameters: task.parameters.map(({ name, value, unit }) => ({ name, value, unit })), tool: task.toolId, model: task.modelId })).reduce((total, char) => total + char.charCodeAt(0), 0) % 13;
  const domain = resultSchema(task).domain;
  const temperature = domain === 'materials' ? number('Ni', 30) : domain === 'bio' ? number('诱导浓度', .5) : number('温度', 120 + seed * 5);
  const pressure = domain === 'materials' ? number('焙烧温度', 550) : domain === 'bio' ? number('培养温度', 32) : domain === 'flow' ? number('注入压力', 20) : number('围压', 30);
  const elastic = number('弹性模量', 35);
  const length = +(domain === 'materials' ? Math.max(0, Math.min(100, 82 + temperature * .18 - Math.abs(pressure - 550) * .025 + seed * .08)) : domain === 'bio' ? Math.max(0, Math.min(100, 60 + temperature * 40 - Math.abs(pressure - 32) * 3)) : domain === 'flow' ? Math.min(100, 35 + temperature * .06 + pressure * .22) : 31 + temperature * .34 - pressure * .19 + seed * .7).toFixed(2);
  const stress = +(domain === 'materials' ? -.5 - temperature * .012 + (pressure - 550) * .0002 : domain === 'bio' ? Math.max(0, 8 + temperature * 12 - pressure * .02) : domain === 'flow' ? 1.8 + pressure * .08 : 24 + pressure * .92 + temperature * .044).toFixed(2);
  const error = +(2.1 + seed * .23).toFixed(2);
  const quality = +(domain === 'materials' ? Math.max(0, Math.min(100, 60 + temperature * .6 - Math.abs(pressure - 550) * .02)) : domain === 'bio' ? Math.max(0, 96 - Math.abs(pressure - 32) * 2 - temperature * .8) : domain === 'flow' ? 100 - length : 100 - error).toFixed(2);
  return { temperature, pressure, elastic, length, stress, quality, error, r2: +(1 - error / 100).toFixed(3), seed };
}

export function resultConclusion(task: ComputeTask) {
  const schema = resultSchema(task);
  return schema.domain !== 'fracture' && /裂缝|页岩|真三轴/.test(task.conclusion) ? schema.observation : task.conclusion || schema.observation;
}

function GenericTaskAnalysis({ task }: { task: ComputeTask }) {
  const { updateTask, addAsset } = useComputeStore();
  const [review, setReview] = useState(task.review || '待人工分析');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  return <div className="cp-stack"><Panel title="领域结果待补充" actions={<Status value={task.review || '待人工分析'} />}><div className="cp-note"><Info size={17} />此演示未配置该领域的结果指标。计算配置、运行日志和来源引用已保存，尚未生成可用于科学评价的定量结论。</div><p className="cp-muted">当前计算：{task.type}；所属课题：{task.project}；任务：{task.id} · V{task.version}。</p><div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>输入参数</th><th>实际值</th><th>单位</th><th>来源</th></tr></thead><tbody>{task.parameters.map((parameter, index) => <tr key={`${parameter.name}-${index}`}><td>{parameter.name}</td><td>{parameter.value}</td><td>{parameter.unit}</td><td>{parameter.source}</td></tr>)}</tbody></table></div><div className="cp-row"><Link className="cp-link" href={`/compute-space/tasks/${task.id}?tab=结果`}>查看通用结果包 <ArrowRight size={14} /></Link><Link className="cp-link" href={`/compute-space/tasks/${task.id}?tab=版本与追溯`}>查看版本与来源</Link></div></Panel><Panel title="人工评价与适用边界"><label className="cp-field">评价状态<select className="cp-select" value={review} onChange={(event) => setReview(event.target.value)}><option>待人工分析</option><option>需要进一步验证</option></select></label><label className="cp-field">待补充的领域指标<textarea rows={3} className="cp-input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="填写本研究所需的指标、分析方法与验证依据…" /></label><div className="cp-row"><Button variant="primary" onClick={() => { updateTask(task.id, { review, conclusion: note || '此演示未配置该领域的结果指标，待补充分析。', logs: [...task.logs, `[INFO] 人工评价：${review}；${note || '领域指标待补充'}`] }); setMessage('人工评价已记录，未生成定量科研结论。'); }}>记录评价</Button><Button onClick={() => setOpen(true)}>保存配置与来源资产</Button></div>{message && <p role="status" className="cp-note">{message}</p>}</Panel><Modal open={open} onClose={() => setOpen(false)} title="保存任务配置资产" footer={<><Button onClick={() => setOpen(false)}>取消</Button><Button variant="primary" onClick={() => { addAsset(`待分析配置 · ${task.name} V${task.version} · ${task.id}`); setOpen(false); setMessage('配置、参数和来源已保存为待分析资产。'); }}>确认保存</Button></>}><p>保存「{task.name}」的输入参数、工具版本及来源引用。资产标记为「待人工分析」，不包含未配置的定量指标。</p></Modal></div>;
}

function exportAnalysis(tasks: ComputeTask[]) {
  const schema = resultSchema(tasks[0]);
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [['任务', '任务 ID', '版本', schema.param1 + ' / ' + schema.param1Unit, schema.param2 + ' / ' + schema.param2Unit, `${schema.primary} / ${schema.unit}`, `${schema.secondary} / ${schema.secondaryUnit}`, '误差 / %', '评价状态'], ...tasks.map((task) => {
    const metric = taskMetrics(task);
    return [task.name, task.id, task.version, metric.temperature, metric.pressure, metric.length, metric.stress, metric.error, task.review || '待人工分析'];
  })];
  downloadFile('计算结果对比.csv', '\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\n'), 'text/csv;charset=utf-8');
}

export function TaskAnalysis({ task }: { task?: ComputeTask }) {
  if (task && resultSchema(task).domain === 'generic') return task.status === '已完成' ? <GenericTaskAnalysis task={task} /> : <Empty title="计算完成后开始结果分析" description="可先查看运行日志与输入配置，等待计算结果生成。" />;
  return <FractureAnalysis task={task} />;
}

function FractureAnalysis({ task }: { task?: ComputeTask }) {
  const selectedQuery = useSearchParams().get('tasks');
  const { tasks, updateTask, addAsset } = useComputeStore();
  const completed = tasks.filter((item) => item.status === '已完成' && resultSchema(item).domain !== 'generic');
  const [selectedIds, setSelectedIds] = useState<string[]>(() => task ? [task.id] : completed.filter((item) => item.project === completed[0]?.project && resultSchema(item).domain === resultSchema(completed[0]).domain).slice(0, 3).map((item) => item.id));
  const [showPicker, setShowPicker] = useState(false);
  const [chartTab, setChartTab] = useState('曲线对比');
  const [explanation, setExplanation] = useState(false);
  const [modal, setModal] = useState<'asset' | 'review' | null>(null);
  const [review, setReview] = useState(task?.review || '已人工确认');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [experiment, setExperiment] = useState('真三轴实验 · 实验批次 EXP-026');

  useEffect(() => {
    if (task) return;
    const queryIds = selectedQuery?.split(',').filter((id) => tasks.some((item) => item.id === id && item.status === '已完成' && resultSchema(item).domain !== 'generic'));
    const base = tasks.find((item) => item.id === queryIds?.[0]);
    if (queryIds?.length && base) setSelectedIds(queryIds.filter((id) => tasks.some((item) => item.id === id && item.project === base.project && resultSchema(item).domain === resultSchema(base).domain)).slice(0, 4));
  }, [task, tasks, selectedQuery]);

  const selected = useMemo(() => tasks.filter((item) => selectedIds.includes(item.id) && item.status === '已完成' && (task || resultSchema(item).domain !== 'generic')), [tasks, selectedIds, task]);
  const metrics = selected.map(taskMetrics);
  const schema = resultSchema(selected[0]);
  const curves = Array.from({ length: 11 }, (_, i) => {
    const row: Record<string, number> = { step: i * 10 };
    selected.forEach((item) => {
      const metric = taskMetrics(item);
      row[item.id] = +(metric.length * (1 - Math.exp(-i / 3.5)) / (1 - Math.exp(-10 / 3.5))).toFixed(2);
    });
    return row;
  });
  const sensitivity = [
    { name: schema.sensitive[0] || schema.param1, sensitivity: 42, unit: schema.param1Unit }, { name: schema.sensitive[1] || schema.param2, sensitivity: 31, unit: schema.param2Unit },
    { name: schema.sensitive[2] || '约束条件', sensitivity: 19, unit: '' }, { name: '其他参数', sensitivity: 8, unit: '' },
  ];
  const errors = selected.map((item, i) => ({ name: `方案 ${String.fromCharCode(65 + i)}`, error: taskMetrics(item).error, acceptable: 5 }));
  const experimental = Array.from({ length: 9 }, (_, i) => {
    const scale = experiment.includes('027') ? 1.08 : .98;
    return { step: i * 10, computed: +(metrics[0]?.length * i / 8 || 0).toFixed(2), measured: +((metrics[0]?.length || 0) * i / 8 * scale + Math.sin(i) * 1.3).toFixed(2) };
  });
  const recommended = [...selected].sort((a, b) => {
    const am = taskMetrics(a); const bm = taskMetrics(b);
    const factor = schema.domain === 'bio' ? .25 : -.25;
    return (bm.length + bm.stress * factor) - (am.length + am.stress * factor);
  })[0];
  const avg = (key: 'length' | 'stress' | 'error') => metrics.length ? (metrics.reduce((total, m) => total + m[key], 0) / metrics.length).toFixed(2) : '—';

  function toggleTask(id: string) {
    if (!selectedIds.includes(id) && selectedIds.length >= 4) { setMessage('最多同时对比 4 个任务，请先取消一个任务。'); return; }
    const candidate = tasks.find((item) => item.id === id);
    if (!selectedIds.includes(id) && selected.length && candidate && (candidate.project !== selected[0].project || resultSchema(candidate).domain !== schema.domain)) { setMessage('请比较同一课题和同类计算任务。切换研究类型前，请先取消当前选择。'); return; }
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setExplanation(false);
    setMessage('');
  }

  if (task && task.status !== '已完成') return <Empty title="计算完成后开始结果分析" description="任务完成后，可查看指标、分析参数影响，并与实验结果进行比较。" action={<Link className="cp-link" href={`/compute-space/tasks/${task.id}?tab=运行`}>查看运行状态 <ArrowRight size={15} /></Link>} />;
  if (task && resultSchema(task).domain === 'generic') return <GenericTaskAnalysis task={task} />;

  return <div className="cp-stack">
    {!task && <div className={styles.selectionBar}>
      <div><strong>选择计算结果</strong><span className="cp-muted">最多 4 个已完成任务，保留完整参数来源</span></div>
      <Button variant="secondary" onClick={() => setShowPicker(!showPicker)}><GitCompareArrows size={16} /> 已选择 {selected.length} 个任务 <ChevronDown size={14} /></Button>
    </div>}
    {showPicker && <Panel title="可对比的计算任务">
      <div className={styles.taskPicker}>{completed.map((item) => <label key={item.id} className={styles.pickTask}>
        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleTask(item.id)} />
        <span><strong>{item.name}</strong><small>{item.id} · V{item.version} · {item.project}</small></span><Status value={item.review || '待人工分析'} />
      </label>)}</div>
      {!completed.length && <Empty title="暂无已完成的任务" description="先在任务中心完成一次计算，再选择结果进行分析。" action={<Link href="/compute-space/tasks" className="cp-link">前往任务中心</Link>} />}
    </Panel>}
    {message && <div className="cp-note" role="status">{message}</div>}
    {!selected.length ? <Empty title="选择任务，开始对比" description="每个图表和结论都会关联计算任务、参数组合及版本。" action={<Button onClick={() => setShowPicker(true)}>选择计算任务</Button>} /> : <>
      <div className={styles.selectedChips}>{selected.map((item, i) => <span key={item.id} className={styles.taskChip}><i style={{ background: PALETTE[i] }} /><Link href={`/compute-space/tasks/${item.id}`}>{item.name}</Link><small>V{item.version}</small></span>)}</div>
      <div className={styles.metricGrid}>
        {[['平均' + schema.primary, avg('length'), schema.unit, '统一工况下的主要结果'], ['平均' + schema.secondary, avg('stress'), schema.secondaryUnit, '当前任务的次要评价指标'], ['平均相对误差', avg('error'), '%', '与参考解的相对偏差'], ['可比较方案', selected.length, '组', `来自 ${new Set(selected.map((item) => item.project)).size} 个研究课题`]].map(([label, value, unit, text]) => <div key={label} className={styles.metric}><span>{label}</span><strong>{value}<small>{unit}</small></strong><p>{text}</p></div>)}
      </div>
      <div className={styles.analysisLayout}>
        <Panel title="结果与参数影响" actions={<Button variant="ghost" onClick={() => exportAnalysis(selected)}><Download size={15} /> 导出数据</Button>}>
          <Tabs items={['曲线对比', '敏感性分析', '误差分析', '实验对比']} value={chartTab} onChange={setChartTab} />
          {chartTab === '曲线对比' && <><div className={styles.chartCaption}><span>{schema.curve} / {schema.unit}</span><span>模拟进度 / %</span></div><div className={styles.chart}><ResponsiveContainer width="100%" height={270}><LineChart data={curves} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}><CartesianGrid stroke="#eceeed" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="step" tickLine={false} axisLine={false} fontSize={11} /><YAxis tickLine={false} axisLine={false} fontSize={11} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />{selected.map((item, i) => <Line key={item.id} name={`方案 ${String.fromCharCode(65 + i)}`} dataKey={item.id} stroke={PALETTE[i]} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />)}</LineChart></ResponsiveContainer></div><p className={styles.chartNote}>统一以 0–100% 模拟进度对齐；鼠标悬停可查看对应步的结果。演示曲线由任务参数生成。</p></>}
          {chartTab === '敏感性分析' && <><div className={styles.chartCaption}>全局参数敏感度 / %</div><div className={styles.chart}><ResponsiveContainer width="100%" height={270}><BarChart data={sensitivity} layout="vertical" margin={{ left: 15, right: 30 }}><CartesianGrid stroke="#eceeed" horizontal={false} /><XAxis type="number" domain={[0, 50]} tickLine={false} axisLine={false} fontSize={11} /><YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={78} /><Tooltip /><Bar name="贡献率 / %" dataKey="sensitivity" fill="#ce4c36" radius={[0, 4, 4, 0]} barSize={23} /></BarChart></ResponsiveContainer></div><p className={styles.chartNote}>演示方法：在基准参数附近进行 ±10% 单因素扰动并归一化。适用范围：当前选中的 {selected.length} 个任务。</p></>}
          {chartTab === '误差分析' && <><div className={styles.chartCaption}>相对参考解误差 / % · 参考阈值 5%</div><div className={styles.chart}><ResponsiveContainer width="100%" height={270}><BarChart data={errors} margin={{ left: -15, right: 25 }}><CartesianGrid stroke="#eceeed" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} /><YAxis domain={[0, 8]} tickLine={false} axisLine={false} fontSize={11} /><Tooltip /><ReferenceLine y={5} stroke="#c37434" strokeDasharray="4 4" label={{ value: '5% 阈值', fontSize: 11 }} /><Bar dataKey="error" name="相对误差 / %" fill="#377e84" barSize={48} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><p className={styles.chartNote}>采用当前领域参考解计算相对误差。所有结果均需进行独立实验验证。</p></>}
          {chartTab === '实验对比' && <><label className="cp-field" style={{ margin: '18px 0' }}>实验数据<select className="cp-select" value={experiment} onChange={(event) => setExperiment(event.target.value)}><option value="真三轴实验 · 实验批次 EXP-026">{schema.next} · 实验批次 EXP-026</option><option>高温补充实验 · 实验批次 EXP-027</option></select></label><div className={styles.chart}><ResponsiveContainer width="100%" height={240}><LineChart data={experimental} margin={{ left: -15, right: 20 }}><CartesianGrid stroke="#eceeed" vertical={false} /><XAxis dataKey="step" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /><Line name={"计算结果 / " + schema.unit} dataKey="computed" stroke="#ce4c36" strokeWidth={2} dot={false} /><Line name={"实验观测 / " + schema.unit} dataKey="measured" stroke="#377e84" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div><p className={styles.chartNote}>比较对象：{selected[0].name}。实验批次为演示数据；更换批次可查看一致性差异。</p></>}
        </Panel>
        <div className="cp-stack">
          <Panel title="分析观察" actions={<Sparkles size={16} className={styles.accent} />}>
            <div className={styles.observation}><span>01</span><div><strong>{schema.sensitive[0]}是主要敏感输入</strong><p>当前扰动分析中，{schema.sensitive[0]}的相对贡献为 42%，{schema.sensitive[1]}次之，建议优先控制这两项变量。</p></div></div>
            <div className={styles.observation}><span>02</span><div><strong>{metrics.some((m) => m.error > 5) ? '发现超出误差阈值的结果' : '当前结果均在参考误差范围内'}</strong><p>相对误差为 {Math.min(...metrics.map((m) => m.error)).toFixed(2)}%–{Math.max(...metrics.map((m) => m.error)).toFixed(2)}%，参考阈值为 5%。</p></div></div>
            <div className={styles.observation}><span>03</span><div><strong>推荐候选需要实验验证</strong><p>按{schema.primary}与{schema.secondary}综合评分，推荐「{recommended?.name}」。该排序不代表最终科研结论。</p></div></div>
            <Button variant="secondary" onClick={() => setExplanation(!explanation)}><Sparkles size={15} />{explanation ? '收起 AI 解释' : '生成 AI 结果解释'}</Button>
          </Panel>
          <div className={styles.scienceNote}><Info size={18} /><div><strong>结果可信性</strong><p>计算结果与 AI 解释均需人工评价。演示数据仅用于验证产品流程。</p><Status value={selected.length === 1 ? selected[0].review || '待人工分析' : '待人工分析'} /></div></div>
        </div>
      </div>
      {explanation && <Panel title="AI 结果解释 · 待人工评价" actions={<Status value="需要进一步验证" />}><div className={styles.aiExplanation}><Sparkles size={20} /><div><p>在选中的 {selected.length} 组参数组合中，{schema.param1}范围为 <strong>{Math.min(...metrics.map((m) => m.temperature))}–{Math.max(...metrics.map((m) => m.temperature))} {schema.param1Unit}</strong>。{schema.observation}</p><p>这一观察仅覆盖当前模型、边界条件及参数区间，尚不能推断因果关系。建议增加{schema.param1}梯度，并通过{schema.next}检验计算观察。</p><div className="cp-row">{selected.map((item) => <Link key={item.id} className="cp-link" href={`/compute-space/tasks/${item.id}?tab=参数`}>来源：{item.id} · V{item.version}</Link>)}</div></div></div></Panel>}
      <Panel title="参数与结果对照" actions={<span className="cp-muted">统一单位 · 多值参数取首值为基准工况</span>}><div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>计算方案 / 来源</th><th>{schema.param1} {schema.param1Unit}</th><th>{schema.param2} {schema.param2Unit}</th><th>{schema.primary} {schema.unit}</th><th>{schema.secondary} {schema.secondaryUnit}</th><th>{schema.third} {schema.thirdUnit}</th><th>相对误差</th><th>评价状态</th></tr></thead><tbody>{selected.map((item, i) => { const m = taskMetrics(item); return <tr key={item.id}><td><div className={styles.tableTitle}><i style={{ background: PALETTE[i] }} /><Link href={`/compute-space/tasks/${item.id}`}>{item.name}</Link>{recommended?.id === item.id && selected.length > 1 && <span className={styles.recommended}>推荐候选</span>}</div><small className="cp-muted">{item.id} · V{item.version}</small></td><td>{m.temperature}</td><td>{m.pressure}</td><td><strong>{m.length}</strong></td><td>{m.stress}</td><td>{m.quality}</td><td>{m.error}%</td><td><Status value={item.review || '待人工分析'} /></td></tr>; })}</tbody></table></div></Panel>
      <div className={styles.resultActions}><div><strong>把计算结果推进到下一步</strong><p>记录人工评价，再保存科研资产或安排实验验证。</p></div><div className="cp-row"><Button variant="secondary" onClick={() => { setReview(selected[0]?.review || '已人工确认'); setModal('review'); }}><Check size={16} /> 人工评价</Button><Button variant="secondary" onClick={() => setModal('asset')}>保存科研资产</Button><Link className={styles.primaryLink} href={`/compute-space/handoff?task=${recommended?.id || selected[0].id}&direction=do`}><FlaskConical size={16} /> 生成实验方案 <ArrowRight size={15} /></Link></div></div>
    </>}
    <Modal open={modal === 'review'} onClose={() => setModal(null)} title="记录人工评价" footer={<><Button variant="secondary" onClick={() => setModal(null)}>取消</Button><Button onClick={() => { selected.forEach((item) => updateTask(item.id, { review, conclusion: note.trim() || item.conclusion, logs: [...item.logs, `[${new Date().toLocaleTimeString('zh-CN')}] [INFO] 人工评价：${review}；${note || '保留原始计算结论'}`] })); setMessage(`已为 ${selected.length} 个任务记录「${review}」。`); setModal(null); }}>确认评价</Button></>}>
      <p className="cp-muted">此次评价将关联选中的 {selected.length} 个任务和当前版本，并记录到任务追溯中。</p><label className="cp-field">评价状态<select className="cp-select" value={review} onChange={(event) => setReview(event.target.value)}>{REVIEW_STATES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="cp-field">人工评价与适用边界<textarea className="cp-input" rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录实验依据、适用区间与需要补充验证的内容…" /></label>
    </Modal>
    <Modal open={modal === 'asset'} onClose={() => setModal(null)} title="保存结果分析为科研资产" footer={<><Button variant="secondary" onClick={() => setModal(null)}>取消</Button><Button onClick={() => { addAsset(`结果分析 · ${selected.map((item) => `${item.name} V${item.version}`).join(' / ')}`); setModal(null); setMessage('结果分析已保存为科研资产，包含来源任务、参数组合及评价状态。'); }}>确认保存</Button></>}><p>将保存指标摘要、对比结果、参数与任务引用。当前评价状态会随资产一并保留。</p><div className="cp-note">未完成人工确认的结果以「待人工分析」状态保存。</div><ul className={styles.sourceList}>{selected.map((item) => <li key={item.id}>{item.name} <span>V{item.version} · {item.id}</span></li>)}</ul></Modal>
  </div>;
}

export function ResultAnalysis() {
  return <Suspense fallback={<div className="cp-note">正在加载结果分析…</div>}><ResultAnalysisContent /></Suspense>;
}

function ResultAnalysisContent() {
  const tasks = useComputeStore((state) => state.tasks);
  return <div data-prd-id="REQ-ANALYSIS-001"><PageHeader title="结果分析与评价" description="从计算结果到可验证的科学观察，让每一项结论都有据可循。" actions={<Link className={styles.secondaryLink} href="/compute-space/tasks">返回任务中心</Link>} />{tasks.some((task) => task.status === '已完成') ? <TaskAnalysis /> : <Empty title="等待第一组计算结果" description="先完成一个计算任务，再进行曲线对比、敏感性分析与实验评价。" action={<Link href="/compute-space/tasks" className={styles.primaryLink}>查看计算任务 <ArrowRight size={15} /></Link>} />}</div>;
}


