'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Box, CheckCircle2, GitBranch, Play, Rocket } from 'lucide-react';
import { useComputeStore } from './store';
import { Button, Modal, PageHeader, Panel, Status, Tabs, downloadFile } from './ui';
import type { ResearchModel } from './types';

const algorithms = ['XGBoost 回归', '随机森林', '物理信息神经网络（PINN）', '图神经网络', 'Transformer 微调'];
const tests = ['页岩独立测试集 V1 · 2,480 样本', '跨温区外推测试集 V1 · 640 样本', '实验回流验证集 V2 · 320 样本'];

export function ModelsWorkspace() {
  const store = useComputeStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedDataset = searchParams.get('dataset');
  const requestedTab = searchParams.get('view') === 'compare' ? '模型对比' : searchParams.get('tab');
  const appliedDataset = useRef<string | null>(null);
  const [tab, setTab] = useState('训练配置');
  const [datasetId, setDatasetId] = useState(store.datasets[0]?.id ?? '');
  const [name, setName] = useState('页岩裂缝长度预测模型');
  const [algorithm, setAlgorithm] = useState(algorithms[0]);
  const [modelType, setModelType] = useState('新建模型');
  const [baseModelId, setBaseModelId] = useState(store.models[0]?.id ?? '');
  const [target, setTarget] = useState('裂缝长度（mm）');
  const [features, setFeatures] = useState(['温度', '围压', '孔隙度', '弹性模量']);
  const [epochs, setEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState('0.05');
  const [seed, setSeed] = useState(42);
  const [resource, setResource] = useState('CPU 32 核 / 64 GB');
  const [testSet, setTestSet] = useState(tests[0]);
  const [scope, setScope] = useState('页岩，温度 25–250 ℃，围压 10–60 MPa；超出范围需要额外验证');
  const [errorLimit, setErrorLimit] = useState(0.3);
  const [physical, setPhysical] = useState(true);
  const [extrapolation, setExtrapolation] = useState(false);
  const [confirmation, setConfirmation] = useState<'train' | 'publish' | null>(null);
  const [activeId, setActiveId] = useState('');
  const [progress, setProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState(store.models.slice(0, 2).map((item) => item.id));
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState<ResearchModel | null>(null);
  const [publishId, setPublishId] = useState('');
  const [evaluatedIds, setEvaluatedIds] = useState<string[]>([]);
  const dataset = store.datasets.find((item) => item.id === datasetId);
  const active = store.models.find((item) => item.id === activeId);
  const running = active?.status === '训练中';
  const selected = store.models.filter((item) => selectedIds.includes(item.id));
  const evaluated = store.models.filter((item) => evaluatedIds.includes(item.id));
  useEffect(() => {
    if (!requestedDataset) { appliedDataset.current = null; return; }
    if (appliedDataset.current !== requestedDataset && store.datasets.some((item) => item.id === requestedDataset)) { setDatasetId(requestedDataset); appliedDataset.current = requestedDataset; }
  }, [requestedDataset, store.datasets]);
  useEffect(() => {
    if (requestedTab && ['训练配置', '训练任务', '模型与版本', '科学评价', '模型对比'].includes(requestedTab)) setTab(requestedTab);
  }, [requestedTab]);
  useEffect(() => {
    if (activeId) return;
    const pending = store.models.find((model) => model.status === '训练中');
    if (pending) { setActiveId(pending.id); setProgress(pending.trainingProgress ?? 0); }
  }, [activeId, store.models]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setProgress((value) => Math.min(100, value + 10)), 450);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (activeId && active?.status === '训练中' && active.trainingProgress !== progress) store.updateModel(activeId, { trainingProgress: progress });
  }, [activeId, active?.status, active?.trainingProgress, progress, store]);
  useEffect(() => {
    if (progress !== 100 || !activeId || active?.status !== '训练中') return;
    store.updateModel(activeId, { status: '已训练', r2: .932, rmse: .186, mae: .142, trainingProgress: 100 });
    setNotice('训练完成，已形成独立模型版本。选择固定测试集后执行科学评价。');
  }, [progress, activeId, active?.status, store]);

  function train() {
    const base = store.models.find((item) => item.id === baseModelId);
    const modelName = modelType === '微调已有模型' && base ? base.name : name.trim();
    const id = store.addModel({ name: modelName, version: Math.max(0, ...store.models.filter((item) => item.name === modelName).map((item) => item.version)) + 1, type: algorithm, datasetId, testSet, r2: 0, rmse: 0, mae: 0, status: '训练中', trainingProgress: 0, trainingStartedAt: new Date().toISOString(), parameters: JSON.stringify({ 训练轮数: epochs, 学习率: Number(learningRate), 随机种子: seed, 目标变量: target, 特征: features, 训练验证比例: '80 / 20，固定测试集隔离', 资源: resource, 模式: modelType, 基础模型: modelType === '微调已有模型' ? baseModelId : '无', 确认: `${new Date().toLocaleString('zh-CN')} 张博士确认训练` }, null, 2), scope, createdAt: new Date().toLocaleString('zh-CN') });
    setActiveId(id); setProgress(0); setConfirmation(null); setTab('训练任务'); setSelectedIds((ids) => [...ids, id]); setNotice('训练任务已提交至演示队列，输入数据版本、参数与资源配置已锁定。');
  }
  function evaluate() {
    const ready = selected.filter((item) => item.status !== '训练中');
    ready.forEach((model) => {
      const out = testSet === tests[1];
      const adjustment = (model.type.includes('PINN') ? 0 : .025) - Math.min(model.version, 4) * .006;
      let parameters: Record<string, unknown>;
      try { parameters = JSON.parse(model.parameters); } catch { parameters = { 训练参数: model.parameters }; }
      const evaluation = { 测试集: testSet, 误差阈值: errorLimit, 物理约束: physical ? '非负输出与量纲检查通过' : '未启用', 外推验证: out ? '已执行，需人工复核' : extrapolation ? '待完成' : '仅限声明适用范围', 适用范围: scope, 评价时间: new Date().toLocaleString('zh-CN'), 来源: '演示评价' };
      store.updateModel(model.id, { testSet, r2: Number((.956 - adjustment - (out ? .081 : 0)).toFixed(3)), rmse: Number((.156 + adjustment * 1.6 + (out ? .18 : 0)).toFixed(3)), mae: Number((.114 + adjustment + (out ? .12 : 0)).toFixed(3)), status: '已评价', scope, parameters: JSON.stringify({ ...parameters, 科学评价: evaluation }, null, 2) });
    });
    setEvaluatedIds(ready.map((item) => item.id));
    setNotice(`已使用同一固定测试集评价 ${ready.length} 个模型版本，评价报告包含误差、物理约束与适用范围。`);
  }
  function attachModelToPlan(model: ResearchModel) {
    const id = store.createPlan(`使用 ${model.name} V${model.version} 预测科研指标`, { modelId: model.id, datasetId: model.datasetId, method: model.type, risks: model.scope, evidence: [`模型评价：${model.testSet}；R²=${model.r2}；RMSE=${model.rmse}`] });
    router.push(`/compute-space/agent?plan=${id}`);
  }

  return <div className="cp-stack" data-prd-id="REQ-MODEL-001">
    <PageHeader eyebrow="专业工作台 / MODEL R&D" title="模型训练与评价" description="从数据版本到模型版本，以固定测试集和科学约束验证模型的适用边界。" actions={<Button variant="secondary" onClick={() => { setTab('训练配置'); setModelType('新建模型'); }}>新建训练方案</Button>}/>
    <Tabs items={['训练配置', '训练任务', '模型与版本', '科学评价', '模型对比']} value={tab} onChange={setTab}/>
    {notice && <div className="cp-note" role="status">{notice}</div>}
    {tab === '训练配置' && <div className="grid gap-4 xl:grid-cols-[245px_minmax(300px,1fr)_320px]"><Panel title="研究目标与数据"><div className="cp-stack"><label className="cp-field">训练模式<select className="cp-select" value={modelType} onChange={(e) => setModelType(e.target.value)}><option>新建模型</option><option>微调已有模型</option></select></label>{modelType === '新建模型' ? <label className="cp-field">模型名称<input className="cp-input" value={name} onChange={(e) => setName(e.target.value)}/></label> : <label className="cp-field">基础模型版本<select className="cp-select" value={baseModelId} onChange={(e) => setBaseModelId(e.target.value)}>{store.models.map((item) => <option value={item.id} key={item.id}>{item.name} V{item.version}</option>)}</select></label>}<label className="cp-field">训练数据版本<select className="cp-select" value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>{store.datasets.map((item) => <option value={item.id} key={item.id}>{item.name} V{item.version}</option>)}</select></label>{dataset && <div className="rounded-md bg-[#f6f5f1] p-3 text-xs leading-6"><p>{dataset.rows.toLocaleString()} 行 · {dataset.columns} 个特征</p><p>数据质量 {dataset.quality}%</p><p className="cp-muted">{dataset.source}</p><button className="cp-link mt-2" onClick={() => router.push('/compute-space/data')}>查看 / 处理数据 →</button></div>}<label className="cp-field">目标变量<select className="cp-select" value={target} onChange={(e) => setTarget(e.target.value)}>{['裂缝长度（mm）', '最大主应力（MPa）', '材料催化活性（%）', '目标产物产率（g/L）'].map((value) => <option key={value}>{value}</option>)}</select></label><div className="cp-field">输入特征<div className="flex flex-wrap gap-2">{['温度', '围压', '孔隙度', '弹性模量', '泊松比', '注入压力'].map((feature) => <label key={feature} className="flex items-center gap-1 rounded border border-[#e7e3dc] px-2 py-1.5 text-xs"><input type="checkbox" checked={features.includes(feature)} onChange={() => setFeatures(features.includes(feature) ? features.filter((value) => value !== feature) : [...features, feature])}/>{feature}</label>)}</div></div></div></Panel>
      <Panel title="训练方案"><div className="cp-stack"><label className="cp-field">算法 / 模型架构<select className="cp-select" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>{algorithms.map((value) => <option key={value}>{value}</option>)}</select></label><div className="cp-grid-2"><label className="cp-field">训练轮数 / Estimators<input type="number" min="10" max="2000" className="cp-input" value={epochs} onChange={(e) => setEpochs(Number(e.target.value))}/></label><label className="cp-field">学习率<input className="cp-input" type="number" min="0.00001" max="1" step="0.01" value={learningRate} onChange={(e) => setLearningRate(e.target.value)}/></label><label className="cp-field">随机种子<input className="cp-input" type="number" min="0" value={seed} onChange={(e) => setSeed(Number(e.target.value))}/></label><label className="cp-field">训练 / 验证划分<input className="cp-input" readOnly value="80% / 20% · 固定测试集隔离"/></label></div><label className="cp-field">固定测试集<select className="cp-select" value={testSet} onChange={(e) => setTestSet(e.target.value)}>{tests.map((value) => <option key={value}>{value}</option>)}</select></label><label className="cp-field">绑定资源<select className="cp-select" value={resource} onChange={(e) => setResource(e.target.value)}>{['CPU 32 核 / 64 GB', 'GPU A100 × 1 / 128 GB', 'GPU A100 × 4 / 256 GB'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="cp-field">科学适用范围<textarea rows={3} className="cp-input" value={scope} onChange={(e) => setScope(e.target.value)}/></label><div className="cp-note">训练将创建独立模型版本，固定测试集与训练数据隔离。演示预计运行约 5 秒。</div><Button variant="primary" disabled={running || !dataset || !features.length || !name.trim() || epochs < 10 || Number(learningRate) <= 0 || Number(learningRate) > 1} onClick={() => setConfirmation('train')}><Play size={14}/>确认训练配置</Button></div></Panel>
      <div className="cp-stack"><Panel title="科学评价基线"><div className="cp-stack text-xs leading-6"><CheckCircle2 size={24} className="text-[#8b9d8a]"/><b>让模型评价回到科学问题</b><p>通用精度指标用于比较预测能力；物理约束、适用范围和外推能力共同决定模型是否可以投入科研计算。</p><div className="border-t border-[#ebe7df] pt-3"><p>① R² / RMSE / MAE</p><p>② 非负输出与量纲一致性</p><p>③ 固定测试集误差分布</p><p>④ 跨温区外推验证</p></div></div></Panel><Panel title="最新模型"><div className="cp-stack">{store.models.slice(0, 3).map((model) => <button className="border-b border-[#eeeae4] pb-3 text-left text-xs" key={model.id} onClick={() => setDetail(model)}><span className="font-semibold">{model.name} V{model.version}</span><div className="mt-2 flex justify-between"><span className="cp-muted">{model.type}</span><Status value={model.status}/></div></button>)}</div></Panel></div></div>}
    {tab === '训练任务' && <div className="cp-stack">{active && <Panel title={`训练任务 · ${active.name} V${active.version}`} actions={<Status value={active.status}/>}><div className="cp-grid-3"><div className="cp-kpi"><span>训练进度</span><strong>{progress}%</strong></div><div className="cp-kpi"><span>绑定数据</span><strong className="!text-sm">{store.datasets.find((item) => item.id === active.datasetId)?.name}</strong></div><div className="cp-kpi"><span>当前阶段</span><strong className="!text-sm">{progress === 100 ? '模型版本已生成' : progress < 20 ? '数据与资源准备' : progress < 90 ? '迭代训练' : '保存模型产物'}</strong></div></div><div className="my-4 h-2 overflow-hidden rounded-full bg-[#ece8e1]"><div className="h-full bg-[#b64b3f] transition-all" style={{ width: `${progress}%` }}/></div><div className="cp-grid-2"><div className="rounded-md bg-[#242a28] p-4 font-mono text-xs leading-7 text-[#cedaca]">[INFO] 输入版本已锁定<br/>[INFO] 随机种子 {seed}，划分训练/验证集<br/>[RUN] epoch {Math.round(epochs * progress / 100)} / {epochs}<br/>[LOSS] {(0.64 * Math.exp(-progress / 27) + 0.012).toFixed(4)}<br/>{progress === 100 && '[DONE] 已形成可追溯模型版本，等待固定测试集评价'}</div><div><h3 className="mb-2 text-xs font-semibold">训练损失</h3><svg viewBox="0 0 400 150" className="w-full" role="img" aria-label="训练损失曲线"><path d="M15 10V135H385" stroke="#ddd" fill="none"/><polyline stroke="#b64b3f" strokeWidth="2" fill="none" points={Array.from({ length: Math.max(2, Math.floor(progress / 3)) }, (_, i) => `${15+i*11},${130-110*Math.exp(-i/7)}`).join(' ')}/></svg>{!running && <Button variant="primary" onClick={() => { setSelectedIds([active.id]); setTab('科学评价'); }}>进入科学评价</Button>}</div></div></Panel>}<Panel title="训练历史"><div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>模型 / 版本</th><th>算法</th><th>数据版本</th><th>状态</th><th>创建时间</th><th/></tr></thead><tbody>{store.models.map((model) => <tr key={model.id}><td>{model.name} V{model.version}</td><td>{model.type}</td><td>{store.datasets.find((item) => item.id === model.datasetId)?.name ?? model.datasetId}</td><td><Status value={model.status}/></td><td>{model.createdAt}</td><td><button className="cp-link" onClick={() => setDetail(model)}>训练配置</button></td></tr>)}</tbody></table></div></Panel></div>}
    {tab === '模型与版本' && <Panel title="科研模型库" actions={<span className="cp-muted">共 {store.models.length} 个版本</span>}><div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>模型名称</th><th>版本</th><th>类型</th><th>训练数据</th><th>R²</th><th>状态</th><th>操作</th></tr></thead><tbody>{store.models.map((model) => <tr key={model.id}><td><button className="cp-link" onClick={() => setDetail(model)}>{model.name}</button></td><td>V{model.version}</td><td>{model.type}</td><td>{store.datasets.find((item) => item.id === model.datasetId)?.name ?? model.datasetId}</td><td>{model.r2 || '—'}</td><td><Status value={model.status}/></td><td><div className="cp-row"><button className="cp-link" onClick={() => { setSelectedIds([model.id]); setTab('科学评价'); }}>评价</button><button className="cp-link" disabled={model.status !== '已发布'} onClick={() => attachModelToPlan(model)}>加入方案</button><button className="cp-link" onClick={() => { setBaseModelId(model.id); setModelType('微调已有模型'); setTab('训练配置'); }}>微调</button></div></td></tr>)}</tbody></table></div></Panel>}
    {(tab === '科学评价' || tab === '模型对比') && <div className="grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)]"><Panel title="评价配置"><div className="cp-stack"><label className="cp-field">固定测试集<select className="cp-select" value={testSet} onChange={(e) => { setTestSet(e.target.value); setEvaluatedIds([]); }}>{tests.map((value) => <option key={value}>{value}</option>)}</select></label><div className="cp-field">选择模型 / 版本{store.models.map((model) => <label key={model.id} className="mt-2 flex gap-2 text-xs leading-5"><input type="checkbox" disabled={model.status === '训练中'} checked={selectedIds.includes(model.id)} onChange={() => setSelectedIds(selectedIds.includes(model.id) ? selectedIds.filter((id) => id !== model.id) : [...selectedIds, model.id])}/><span>{model.name} <b>V{model.version}</b><br/><span className="cp-muted">{model.type} · {model.status}</span></span></label>)}</div><label className="cp-field">允许 RMSE 上限<input className="cp-input" type="number" min="0.01" step="0.05" value={errorLimit} onChange={(e) => setErrorLimit(Number(e.target.value))}/></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={physical} onChange={(e) => setPhysical(e.target.checked)}/>校验非负与量纲物理约束</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={extrapolation} onChange={(e) => setExtrapolation(e.target.checked)}/>要求跨温区外推验证</label><label className="cp-field">适用范围<textarea className="cp-input" rows={3} value={scope} onChange={(e) => setScope(e.target.value)}/></label><Button variant="primary" disabled={!selected.length || selected.every((item) => item.status === '训练中')} onClick={evaluate}><Activity size={14}/>运行固定测试集评价</Button></div></Panel><div className="cp-stack"><Panel title={tab === '模型对比' ? '模型 / 版本对比' : '评价报告 Artifact'} actions={<Button variant="secondary" disabled={!evaluated.length} onClick={() => downloadFile('模型科学评价报告.json', JSON.stringify({ 测试集: testSet, 误差阈值: errorLimit, 物理约束: physical, 外推验证要求: extrapolation, 模型: evaluated, 适用范围: scope, 结论: '演示评价结果，正式科研使用需人工复核' }, null, 2))}>导出评价报告</Button>}><div className="cp-table-wrap"><table className="cp-table"><thead><tr><th>模型</th><th>版本</th><th>测试集</th><th>R² ↑</th><th>RMSE ↓</th><th>MAE ↓</th><th>误差状态</th></tr></thead><tbody>{selected.map((model) => <tr key={model.id}><td>{model.name}</td><td>V{model.version}</td><td>{model.testSet.split(' · ')[0]}</td><td>{model.r2 || '—'}</td><td>{model.rmse || '—'}</td><td>{model.mae || '—'}</td><td><Status value={!evaluatedIds.includes(model.id) ? '待当前评价' : model.rmse <= errorLimit ? '通过' : '误差超限'}/></td></tr>)}</tbody></table></div>{!evaluated.length ? <p className="cp-note mt-4">选择模型并运行评价后，生成同一测试集下的可比指标、误差分析和科学约束结论。</p> : <div className="cp-grid-2 mt-5"><div><h3 className="mb-3 text-xs font-semibold">误差分析 · RMSE</h3>{evaluated.map((model) => <div className="mb-4 text-xs" key={model.id}><div className="mb-1 flex justify-between"><span>{model.name} V{model.version}</span><strong>{model.rmse}</strong></div><div className="h-2 rounded bg-[#eeeae3]"><div className={`h-full rounded ${model.rmse <= errorLimit ? 'bg-[#8b9d8a]' : 'bg-[#b64b3f]'}`} style={{ width: `${Math.min(100, model.rmse * 180)}%` }}/></div></div>)}<p className="cp-muted">高温区样本（200–250 ℃）误差较大，建议补充边界实验数据。</p></div><div className="cp-stack"><h3 className="text-xs font-semibold">科学约束检查</h3><div className="flex justify-between text-xs"><span>物理非负与量纲</span><Status value={physical ? '通过' : '未启用'}/></div><div className="flex justify-between text-xs"><span>外推能力</span><Status value={testSet === tests[1] ? '需要进一步验证' : extrapolation ? '待外推验证' : '限适用范围'}/></div><div className="cp-note">{scope}</div>{evaluated.map((model) => <Button key={model.id} variant="secondary" disabled={model.rmse > errorLimit || !physical || (extrapolation && testSet !== tests[1])} onClick={() => { setPublishId(model.id); setConfirmation('publish'); }}><Rocket size={13}/>发布 {model.name} V{model.version}</Button>)}</div></div>}</Panel><Panel title="评价解释与下一步"><div className="flex gap-3 text-xs leading-6"><Box className="shrink-0 text-[#b64b3f]" size={20}/><p>比较时应保持测试集、目标量纲和数据划分一致。训练集内的高精度不代表外推可靠性。若边界区误差超限，建议返回数据处理工作台补充实验样本，再创建新训练版本；模型发布将保留本次评价报告与适用范围。</p></div></Panel></div></div>}
    <Modal open={confirmation === 'train'} onClose={() => setConfirmation(null)} title="确认正式模型训练" footer={<><Button variant="secondary" onClick={() => setConfirmation(null)}>返回修改</Button><Button variant="primary" onClick={train}>确认并开始训练</Button></>}><div className="cp-stack"><p className="text-sm">{name} · {algorithm}</p><p className="cp-note">输入：{dataset?.name} V{dataset?.version}<br/>资源：{resource}<br/>训练轮数：{epochs}，随机种子：{seed}<br/>固定测试集：{testSet}</p><p className="cp-muted">确认后锁定训练配置并形成独立模型版本。当前运行使用演示数据与资源。</p></div></Modal>
    <Modal open={confirmation === 'publish'} onClose={() => setConfirmation(null)} title="确认发布模型版本" footer={<><Button variant="secondary" onClick={() => setConfirmation(null)}>取消</Button><Button variant="primary" onClick={() => { store.updateModel(publishId, { status: '已发布', scope }); setConfirmation(null); setNotice('模型版本已发布，可由科研计算助手引用。适用范围和评价结果已随版本保留。'); setTab('模型与版本'); }}>确认发布</Button></>}><div className="cp-stack"><p>{store.models.find((item) => item.id === publishId)?.name}</p><p className="cp-note">固定测试集：{testSet}<br/>适用范围：{scope}<br/>确认该模型评价报告已人工复核，并在声明范围内使用。</p></div></Modal>
    <Modal open={!!detail} onClose={() => setDetail(null)} title={`${detail?.name ?? '模型'} · V${detail?.version ?? ''}`} footer={<Button variant="secondary" onClick={() => setDetail(null)}>关闭</Button>}>{detail && <div className="cp-stack"><div className="cp-row"><GitBranch size={16}/><Status value={detail.status}/><span className="cp-muted">{detail.createdAt}</span></div><p className="text-xs">训练数据：{store.datasets.find((item) => item.id === detail.datasetId)?.name} / {detail.datasetId}</p><pre className="whitespace-pre-wrap break-words rounded bg-[#f5f4f0] p-4 text-xs leading-6">{detail.parameters}</pre><p className="cp-note">{detail.scope}</p></div>}</Modal>
  </div>;
}





