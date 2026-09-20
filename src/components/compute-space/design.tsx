'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, FlaskConical, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useComputeStore } from './store';
import { Button, Modal, PageHeader, Panel, Status, Tabs, downloadFile } from './ui';
import { useResearchProject } from '@/components/research/workspace-kit';
import { createExperimentDraft } from './experiment-bridge';

const scenes = {
  地球科学: { goal: '筛选兼顾裂缝改造效果、稳定性与计算成本的温压参数组合', metric: '裂缝增益', unit: '%', plugin: '热–力耦合代理模型', params: ['温度', '围压', '注入压力'], units: ['℃', 'MPa', 'MPa'], ranges: ['25–250', '10–60', '20–80'], methods: ['有限元 + XFEM', '相场断裂模型', '离散单元法'] },
  材料科学: { goal: '设计高活性、低成本且满足热稳定性约束的催化材料候选组成', metric: '催化活性', unit: '%', plugin: '材料性能预测模型', params: ['Ni 配比', 'Co 配比', '焙烧温度'], units: ['%', '%', '℃'], ranges: ['10–60', '5–30', '400–800'], methods: ['图神经网络预测', '密度泛函理论', '贝叶斯优化'] },
  合成生物: { goal: '筛选高产率、低代谢负担且具备实验可行性的合成路径', metric: '相对产率', unit: '%', plugin: '代谢通量预测模型', params: ['诱导浓度', '培养温度', '培养时间'], units: ['mM', '℃', 'h'], ranges: ['0.1–1.0', '25–37', '12–72'], methods: ['代谢通量分析', '序列语言模型', '多目标进化优化'] },
};
type Scene = keyof typeof scenes;
type Candidate = { id: string; benefit: number; stability: number; cost: number; values: number[]; method: string };

export function DesignWorkspace() {
  const router = useRouter();
  const store = useComputeStore();
  const { project } = useResearchProject();
  const [scene, setScene] = useState<Scene>('地球科学');
  const config = scenes[scene];
  const [goal, setGoal] = useState(config.goal);
  const [count, setCount] = useState(12);
  const [minStability, setMinStability] = useState(80);
  const [maxCost, setMaxCost] = useState(80);
  const [weights, setWeights] = useState([50, 30, 20]);
  const [ranges, setRanges] = useState(config.ranges);
  const [plugin, setPlugin] = useState(config.plugin);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState('候选排序');
  const [detail, setDetail] = useState<Candidate | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState('');
  const [batch, setBatch] = useState(0);
  const [experimentUrl, setExperimentUrl] = useState('');
  const [handoffBusy, setHandoffBusy] = useState(false);
  const ranked = useMemo(() => candidates.map((item) => ({ ...item, pass: item.stability >= minStability && item.cost <= maxCost, score: Math.round((item.benefit * weights[0] + item.stability * weights[1] + (100 - item.cost) * weights[2]) / Math.max(1, weights.reduce((a, b) => a + b, 0))) })).sort((a, b) => Number(b.pass) - Number(a.pass) || b.score - a.score), [candidates, minStability, maxCost, weights]);
  const chosen = ranked.filter((item) => selected.includes(item.id));
  const pareto = ranked.filter((item) => item.pass && !ranked.some((other) => other.pass && other.benefit >= item.benefit && other.cost <= item.cost && (other.benefit > item.benefit || other.cost < item.cost)));

  function generate() {
    if (!goal.trim()) { setNotice('请填写研究目标后生成候选。'); return; }
    const bounds = ranges.map((range) => range.split(/[–—~-]/).map(Number));
    if (bounds.some((range) => range.length !== 2 || !range.every(Number.isFinite) || range[0] >= range[1])) { setNotice('参数范围请使用“最小值–最大值”，且最小值小于最大值。'); return; }
    const items = Array.from({ length: count }, (_, i) => ({ id: `${['G', 'M', 'B'][Object.keys(scenes).indexOf(scene)]}${String(i + 1).padStart(3, '0')}`, benefit: 64 + ((i * 13 + batch * 3) % 34), stability: 72 + ((i * 11 + 13) % 28), cost: 26 + ((i * 17 + 9) % 67), values: bounds.map(([min, max], j) => Number((min + (max - min) * (((i * 7 + j * 3 + batch) % count) / Math.max(count - 1, 1))).toFixed(2))), method: config.methods[i % 3] }));
    setCandidates(items); setSelected([]); setBatch(batch + 1); setNotice(`候选方案集 V${batch + 1} 已生成，共 ${count} 组。调整约束与权重可实时重新排序。`);
  }
  function createPlan(candidate: Candidate) {
    const id = store.createPlan(goal, { title: `${scene} · 候选 ${candidate.id}`, project: project.name, projectId: project.id, hypothesis: `通过优化 ${config.params.join('、')} 提升 ${config.metric}，同时满足稳定性约束。`, toolId: scene === '地球科学' ? 'comsol' : scene === '材料科学' ? 'lammps' : 'cobra', modelId: '', method: candidate.method, parameters: candidate.values.map((value, index) => ({ name: config.params[index], value: String(value), unit: config.units[index], source: `候选方案集 V${batch} / ${candidate.id}` })), outputs: [config.metric, '稳定性', '资源成本'], risks: `稳定性 ≥ ${minStability}%；资源成本 ≤ ${maxCost}；需通过正式计算和实验验证。`, evidence: [`${plugin}，候选方案集 V${batch}`, `目标权重 ${weights.join('/')}`] });
    router.push(`/compute-space/agent?plan=${id}`);
  }
  async function handoff() {
    if (handoffBusy) return;
    setHandoffBusy(true);
    try {
      const existing = JSON.parse(localStorage.getItem('ai4s-plans-v2') || '[]');
      if (!Array.isArray(existing)) throw new Error('实验方案记录格式异常，请先导出候选集后重试。');
      const id = `EXP-CAND-${Date.now()}`;
      const content = JSON.stringify({ 研究目标: goal, 科学假设: '候选参数可以在满足稳定性约束的前提下提升目标性能', 来源: `候选方案集 V${batch}`, 推荐候选: chosen, 参数名称: config.params, 方法: plugin, 风险与约束: `稳定性 ≥ ${minStability}%，计算结果需要实验验证`, 确认人: '张博士' }, null, 2);
      localStorage.setItem('ai4s-plans-v2', JSON.stringify([{ id, projectId: project.id, name: `${scene}候选方案实验验证`, template: `${scene}候选验证`, version: 1, status: '草稿', parameters: chosen.map((candidate) => `${candidate.id}: ${candidate.values.map((value, i) => `${config.params[i]} ${value} ${config.units[i]}`).join('；')}`).join('\n'), steps: `研究目标：${goal}\n方法：${plugin}\n来源：候选方案集 V${batch}\n实验步骤：准备样本 → 按候选参数分组 → 采集目标指标 → 与预测对照\n风险：需验证稳定性、误差与科学适用范围。`, history: [`${new Date().toLocaleString('zh-CN')} 张博士确认候选实验交接`], signatures: [] }, ...existing]));
      const experimentPlanId = await createExperimentDraft({ title: `${scene}候选方案实验验证`, goal, hypothesis: '候选参数可以在满足稳定性约束的前提下提升目标性能', method: plugin, parameters: chosen.flatMap((candidate) => candidate.values.map((value, i) => ({ name: `${candidate.id} · ${config.params[i]}`, value: String(value), unit: config.units[i], source: `候选方案集 V${batch} / ${candidate.id} / ${candidate.method}` }))), steps: ['准备当前课题实验样本并校验仪器', `按 ${chosen.map((candidate) => candidate.id).join('、')} 的候选参数分组`, `采集 ${config.metric}、稳定性和成本指标`, '将实验结果与候选预测对照，记录偏差和失效样本'], risks: `稳定性 ≥ ${minStability}%；成本 ≤ ${maxCost}；演示预测结果需验证误差与科学适用范围。`, evidence: [`候选方案集 V${batch}，场景：${scene}`, `专业插件：${plugin}；目标权重：${weights.join(' / ')}`, `参数范围：${config.params.map((name, i) => `${name} ${ranges[i]} ${config.units[i]}`).join('；')}`, ...chosen.map((candidate) => `${candidate.id}：${config.metric} ${candidate.benefit}%，稳定性 ${candidate.stability}%，成本 ${candidate.cost}，综合分 ${candidate.score}`)], projectId: project.id, project: project.name, sourceId: id, template: `${scene}候选验证` });
      store.addHandoff({ direction: '算 → 做', taskId: `候选方案集 V${batch}`, title: `${scene}候选方案实验验证`, content, confirmed: true });
      setExperimentUrl(`/do-space/plans/${encodeURIComponent(experimentPlanId)}?projectId=${encodeURIComponent(project.id)}`); setConfirm(false); setNotice(`已确认 ${chosen.length} 个候选，实验方案草稿与交接包已保存。`);
    } catch (error) { setNotice(error instanceof Error ? error.message : '保存交接包失败，请导出候选方案集后重试。'); setConfirm(false); } finally { setHandoffBusy(false); }
  }

  return <div className="cp-stack" data-prd-id="REQ-DESIGN-001">
    <PageHeader eyebrow="专业工作台 / DESIGN & SCREENING" title="智能设计与筛选" description="定义目标，探索候选空间，以可解释的多目标评价确定下一步。" actions={<Button variant="secondary" onClick={() => downloadFile(`候选方案集-V${batch}.json`, JSON.stringify({ scene, goal, ranges, weights, constraints: { minStability, maxCost }, candidates: ranked }, null, 2))} disabled={!candidates.length}>导出候选集</Button>} />
    <div className="flex flex-wrap items-center gap-3 border-y border-[#e9e6e2] bg-white px-4 py-3 text-xs text-[#6e716f]">{['01 目标与约束', '02 候选空间', '03 多目标评价', '04 计算 / 实验验证'].map((step, i) => <span key={step} className="flex items-center gap-3"><span className={i < (candidates.length ? 3 : 1) ? 'font-semibold text-[#ae4438]' : ''}>{step}</span>{i < 3 && <ArrowRight size={12}/>}</span>)}</div>
    {notice && <div className="cp-note" role="status">{notice}</div>}
    {experimentUrl && <div><Button variant="primary" onClick={() => router.push(experimentUrl)}>打开做空间实验方案<ArrowRight size={14}/></Button></div>}
    <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_240px]">
      <Panel title="条件配置" actions={<SlidersHorizontal size={16}/>}><div className="cp-stack">
        <label className="cp-field">专业场景<select className="cp-select" value={scene} onChange={(event) => { const value = event.target.value as Scene; setScene(value); setGoal(scenes[value].goal); setRanges(scenes[value].ranges); setPlugin(scenes[value].plugin); setCandidates([]); setSelected([]); }}>{Object.keys(scenes).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="cp-field">研究目标<textarea className="cp-input" rows={3} value={goal} onChange={(event) => setGoal(event.target.value)}/></label>
        <label className="cp-field">专业插件 / 模型<select className="cp-select" value={plugin} onChange={(event) => setPlugin(event.target.value)}><option>{config.plugin}</option>{config.methods.map((method) => <option key={method}>{method}</option>)}</select></label>
        <div className="border-t border-[#ece9e5] pt-3"><h3 className="mb-3 text-xs font-semibold">候选参数空间</h3>{config.params.map((name, i) => <label key={name} className="cp-field mb-2">{name}（{config.units[i]}）<input className="cp-input" value={ranges[i]} onChange={(event) => setRanges(ranges.map((item, j) => j === i ? event.target.value : item))}/></label>)}</div>
        <div className="cp-grid-2"><label className="cp-field">稳定性下限 %<input className="cp-input" type="number" min="0" max="100" value={minStability} onChange={(e) => setMinStability(Number(e.target.value))}/></label><label className="cp-field">成本上限<input className="cp-input" type="number" min="0" max="100" value={maxCost} onChange={(e) => setMaxCost(Number(e.target.value))}/></label></div>
        <div className="border-t border-[#ece9e5] pt-3"><h3 className="mb-3 text-xs font-semibold">指标权重 <span className="font-normal text-[#8b8d89]">自动归一化</span></h3>{[config.metric, '稳定性', '低成本'].map((label, index) => <label className="cp-field mb-2" key={label}><span className="flex justify-between">{label}<b>{weights[index]}</b></span><input aria-label={`${label}权重`} className="w-full accent-[#b64b3f]" type="range" min="0" max="100" value={weights[index]} onChange={(e) => setWeights(weights.map((value, i) => index === i ? Number(e.target.value) : value))}/></label>)}</div>
        <label className="cp-field">候选规模<select className="cp-select" value={count} onChange={(e) => setCount(Number(e.target.value))}>{[6, 12, 24].map((n) => <option value={n} key={n}>{n} 组参数组合</option>)}</select></label>
        <Button variant="primary" onClick={generate}><Sparkles size={14}/>生成 / 重新筛选</Button>
      </div></Panel>
      <div className="cp-stack min-w-0">
        <div className="cp-kpis"><div className="cp-kpi"><span>候选总数</span><strong>{candidates.length || '—'}</strong></div><div className="cp-kpi"><span>约束满足</span><strong>{ranked.filter((item) => item.pass).length}</strong></div><div className="cp-kpi"><span>帕累托最优</span><strong>{pareto.length}</strong></div></div>
        <Panel title={`候选方案空间${batch ? ` · V${batch}` : ''}`} actions={<span className="cp-muted">演示预测 · 待验证</span>}>
          <Tabs items={['候选排序', '帕累托前沿', '方案对比']} value={tab} onChange={setTab}/>
          {!candidates.length ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center"><div className="rounded-full bg-[#f7efec] p-4 text-[#b64b3f]"><FlaskConical size={24}/></div><h3 className="text-sm font-semibold">从一个清晰的目标开始</h3><p className="max-w-xs text-xs leading-6 text-[#8a8c87]">设置左侧参数范围和指标权重，生成可追溯的候选方案集。</p><Button variant="secondary" onClick={generate}>使用当前配置生成候选</Button></div> : tab === '候选排序' ? <><div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>对比</th><th>候选</th><th>{config.metric}</th><th>稳定性</th><th>成本</th><th>综合分</th><th>状态</th><th/></tr></thead><tbody>{ranked.map((item, index) => <tr key={item.id}><td><input aria-label={`选择候选 ${item.id}`} type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected(selected.includes(item.id) ? selected.filter((id) => id !== item.id) : [...selected, item.id])}/></td><td><b>{item.id}</b>{index === 0 && item.pass && <span className="ml-2 text-[#ae4438]">优选</span>}</td><td>{item.benefit}%</td><td>{item.stability}%</td><td>{item.cost}</td><td><b>{item.score}</b></td><td><Status value={item.pass ? '满足约束' : '淘汰'}/></td><td><button className="cp-link" onClick={() => setDetail(item)}>参数与依据</button></td></tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap justify-between gap-2"><span className="cp-muted">已选 {selected.length} 个候选 · 勾选后比较参数与评价指标</span><Button variant="secondary" disabled={selected.length < 2} onClick={() => setTab('方案对比')}>对比所选方案</Button></div></> : tab === '帕累托前沿' ? <div className="py-4"><p className="cp-muted mb-4">横轴为成本（越低越好），纵轴为{config.metric}（越高越好）。红色为非支配解。</p><svg viewBox="0 0 500 280" role="img" aria-label="候选性能与成本帕累托散点图" className="w-full"><path d="M40 20V240H475" stroke="#ddd8d2" fill="none"/>{[20,40,60,80,100].map((n) => <g key={n}><line x1={40} x2={475} y1={240-n*2.1} y2={240-n*2.1} stroke="#eee"/><text x={15} y={244-n*2.1} fontSize={10} fill="#888">{n}</text><text x={40+n*4.2} y={259} fontSize={10} fill="#888">{n}</text></g>)}{ranked.map((item) => <g key={item.id} onClick={() => setDetail(item)} className="cursor-pointer"><circle cx={40+item.cost*4.2} cy={240-item.benefit*2.1} r={pareto.some((p) => p.id === item.id) ? 6 : 4} fill={pareto.some((p) => p.id === item.id) ? '#b64b3f' : item.pass ? '#8caaa0' : '#d5d1cb'}/><text x={49+item.cost*4.2} y={243-item.benefit*2.1} fontSize={9} fill="#686965">{item.id}</text></g>)}</svg><div className="cp-note">非支配候选：{pareto.map((item) => item.id).join('、') || '无符合约束的候选，请调整约束条件'}。建议对这些候选开展高精度计算。</div></div> : <div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>评价项</th>{chosen.map((item) => <th key={item.id}>{item.id}</th>)}</tr></thead><tbody>{config.params.map((name, i) => <tr key={name}><td>{name}</td>{chosen.map((item) => <td key={item.id}>{item.values[i]} {config.units[i]}</td>)}</tr>)}{['方法', config.metric, '稳定性', '成本', '综合分'].map((name, i) => <tr key={name}><td>{name}</td>{chosen.map((item) => <td key={item.id}>{[item.method, `${item.benefit}%`, `${item.stability}%`, item.cost, item.score][i]}</td>)}</tr>)}<tr><td>下一步</td>{chosen.map((item) => <td key={item.id}><Button variant="secondary" onClick={() => createPlan(item)} disabled={!item.pass}>生成计算方案</Button></td>)}</tr></tbody></table>{!chosen.length && <p className="cp-note mt-4">请在候选排序中选择至少两个方案。</p>}</div>}
        </Panel>
      </div>
      <div className="cp-stack"><Panel title="科研计算助手" actions={<Sparkles size={15} className="text-[#ae4438]"/>}><div className="cp-stack text-xs leading-6"><p>同时考虑<b>{config.metric}、稳定性和成本</b>。综合分按当前权重归一化计算，硬约束优先于评分。</p><div className="border-l-2 border-[#bd6959] pl-3"><b>约束建议</b><p className="cp-muted">稳定性低于 {minStability}% 的候选不宜直接进入正式计算。可先调整参数区间或补充依据。</p></div>{ranked.length > 0 && <><b>筛选结论</b><p>{ranked.filter((item) => item.pass).length} 个候选满足约束。{ranked[0]?.pass ? `候选 ${ranked[0].id} 综合分最高，建议优先验证。` : '当前没有候选满足约束，建议扩大参数空间。'}</p><Button variant="primary" disabled={!ranked[0]?.pass} onClick={() => createPlan(ranked[0])}>优选候选 → 计算方案</Button></>}<p className="cp-muted">依据：当前场景插件 + 参数边界。预测仅用于候选筛选，不能替代科学验证。</p></div></Panel><Panel title="进入实验验证"><p className="mb-4 text-xs leading-6 text-[#777c75]">勾选符合约束的候选，携带目标、方法、关键参数与来源生成实验交接包。</p><Button variant="secondary" disabled={!chosen.length || chosen.some((item) => !item.pass)} onClick={() => setConfirm(true)}><FlaskConical size={14}/>生成实验方案</Button></Panel></div>
    </div>
    <Modal open={!!detail} onClose={() => setDetail(null)} title={`候选 ${detail?.id} · 参数与依据`} footer={<><Button variant="secondary" onClick={() => setDetail(null)}>关闭</Button><Button disabled={!!detail && (detail.stability < minStability || detail.cost > maxCost)} onClick={() => detail && createPlan(detail)}>生成计算方案</Button></>}>
      {detail && <div className="cp-stack"><p>{detail.method}</p>{config.params.map((name, i) => <div className="flex justify-between border-b border-[#eee] pb-3 text-sm" key={name}><span>{name}</span><strong>{detail.values[i]} {config.units[i]}</strong></div>)}<p className="cp-note">来源：{plugin}；参数由用户指定范围内均匀探索生成。候选集 V{batch}，权重 {weights.join(' / ')}。模型预测待高精度计算复核。</p><div className="cp-row"><Check size={16}/><span className="cp-muted">保留候选、参数来源和筛选条件进入计算方案</span></div></div>}
    </Modal>
    <Modal open={confirm} onClose={() => setConfirm(false)} title="确认生成实验验证方案" footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>继续检查</Button><Button variant="primary" disabled={handoffBusy} onClick={handoff}>{handoffBusy ? '正在生成实验草稿…' : '确认并生成交接包'}</Button></>}><div className="cp-stack"><p>将 {chosen.map((item) => item.id).join('、')} 传递至实验方案设计与生成 Agent。</p><p className="cp-note">交接内容包含研究目标、候选参数、评价指标、方法和来源。当前为演示预测，实验执行前仍需完成安全条件与科学合理性审核。</p></div></Modal>
  </div>;
}



