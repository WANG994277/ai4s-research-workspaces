'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Download, FileText, Highlighter, Plus, Quote, Sparkles, X } from 'lucide-react';
import { Modal, useLocalState } from '@/components/research/workspace-kit';
import { ReadPage, ReadPanel, ReadBadge, ReadTabs, EmptyState, downloadText, useReadTask } from './ui';
import { READ_ROUTES, draftFromTask, taskRoute, type Evidence } from './types';
import { getUploadedFile } from './resources';
import { LITERATURE, findLiterature, buildLiteratureArtifact, type Literature } from './literature';

const MARKS = ['关键结论', '实验参数', '研究方法', '证据', '局限', '待验证', '疑问'];
type Mark = { id: string; sourceId: string; page: number; paragraph: number; text: string; type: string };
type Answer = { question: string; text: string; evidenceIds: string[]; scope: string };
const QUICK_QUESTIONS = ['这篇论文讲了什么？', '研究问题是什么？', '使用了什么方法？', '实验条件是什么？', '主要结论是什么？', '有哪些局限？', '分析关键图表', '寻找冲突结论', '与当前课题比较'];

export function ReadReader() {
  const store = useReadTask();
  const { project, task } = store;
  const router = useRouter();
  const params = useSearchParams();
  const [documentId, setDocumentId] = useState(params.get('doc') ?? '');
  const [page, setPage] = useState(Math.max(1, Number(params.get('page')) || 1));
  const [zoom, setZoom] = useState(100);
  const [leftTab, setLeftTab] = useState('文献列表');
  const [rightTab, setRightTab] = useState('研读助手');
  const [scope, setScope] = useState('当前文献');
  const [selected, setSelectedState] = useState<string[]>([]);
  const [paragraph, setParagraph] = useState(0);
  const [highlight, setHighlight] = useState(false);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [note, setNote] = useState('');
  const [noteEdit, setNoteEdit] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [outputId, setOutputId] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [showOriginal, setShowOriginal] = useState(true);
  const [markMap, setMarkMap] = useLocalState<Record<string, Mark[]>>('ai4s-reader-marks-v1', {});
  const [answerMap, setAnswerMap] = useLocalState<Record<string, Answer[]>>('ai4s-reader-answers-v1', {});
  const [statusMap, setStatusMap] = useLocalState<Record<string, string>>('ai4s-reader-status-v1', {});
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [localTaskId, setLocalTaskId] = useState('');
  const taskId = task?.id || localTaskId;
  const localKey = `${project.id}:${taskId || 'preview'}`;
  const resourceIds = task ? task.resourceIds : extraIds.length ? extraIds : ['demo-lit-1', 'demo-lit-2', 'demo-lit-3'];
  const uploads = store.resources.filter(resource => resource.projectId === project.id && resourceIds.includes(resource.id) && resource.id.startsWith('upload-'));
  const uploadDocs: Literature[] = uploads.map(resource => ({ ...LITERATURE[0], id: resource.id, title: resource.name, english: '', authors: '用户上传', journal: '当前课题附件', doi: '未核验', source: '用户上传文件', status: statusMap[`${localKey}:${resource.id}`] || '待解析', pages: LITERATURE[0].pages.map(p => ({ ...p, text: [`模拟解析输出：${resource.name}。本段为交互演示生成，不代表上传文件的真实内容。`, ...p.text.slice(1)] })) }));
  const documents = [...LITERATURE.filter(item => resourceIds.includes(item.id)), ...uploadDocs];
  const linkedDoc = params.get('doc') ? findLiterature(params.get('doc')!) : undefined;
  if (linkedDoc && !documents.some(item => item.id === linkedDoc.id)) documents.push(linkedDoc);
  const current = documents.find(item => item.id === documentId) ?? documents[0];
  const status = current ? statusMap[`${localKey}:${current.id}`] || current.status : '';
  const isUpload = current?.id.startsWith('upload-');
  const currentId = current?.id;
  const upload = uploads.find(resource => resource.id === current?.id);
  const actualPage = current ? Math.min(page, Math.max(1, current.pages.length)) : 1;
  const currentPage = current?.pages.find(item => item.page === actualPage);
  const marks = markMap[localKey] ?? [];
  const answers = answerMap[localKey] ?? [];
  const taskNotes = store.notes.filter(item => item.projectId === project.id && item.taskId === taskId);
  const artifacts = store.artifacts.filter(item => item.projectId === project.id && item.taskId === taskId);
  const output = store.artifacts.find(item => item.id === outputId);
  const incomingSelection = (params.get('selected') ?? params.get('ids') ?? '').split(',').filter(Boolean);
  const validSelection = task?.projectId === project.id ? incomingSelection.filter(id => task.resourceIds.includes(id) && (Boolean(findLiterature(id)) || store.resources.some(resource => resource.id === id && resource.projectId === project.id))) : [];
  const selectionToken = JSON.stringify({ projectId: project.id, taskId: task?.id ?? '', ids: [...new Set(validSelection)] });
  useEffect(() => {
    const incoming = JSON.parse(selectionToken) as { ids: string[] };
    setSelectedState(incoming.ids);
    if (incoming.ids.length) setScope('已选文献');
  }, [selectionToken]);
  useEffect(() => {
    const doc = params.get('doc');
    if (doc) setDocumentId(doc);
    const target = Number(params.get('page'));
    if (target > 0) { setPage(target); setHighlight(true); setParagraph(0); }
  }, [params]);
  useEffect(() => {
    if (!isUpload || !currentId) { setUploadUrl(''); return; }
    let url = ''; let canceled = false;
    getUploadedFile(currentId).then(blob => { if (blob && !canceled) { url = URL.createObjectURL(blob); setUploadUrl(url); } }).catch(() => { if (!canceled) setNotice('原始文件暂时无法读取，可重新上传或继续使用模拟解析。'); });
    return () => { canceled = true; if (url) URL.revokeObjectURL(url); };
  }, [isUpload, currentId]);
  function ensureTask(ids = documents.map(item => item.id)) {
    const id = task?.id || localTaskId || store.createTask(`${project.name} · ${ids.length > 1 ? '文献集' : '文献'}研读`, ids.length > 1 ? '多文献研读' : '文献研读', project.id, ids);
    setLocalTaskId(id);
    const existingTask = store.tasks.find(item => item.id === id);
    if (!existingTask || (existingTask.type.includes('研读') && existingTask.status === '规划中')) {
      store.updateTask(id, { status: '执行中', plan: ['确认研读资料与范围', '阅读原文并标记证据', '比较方法与实验条件', '提取结构化产物', '人工核对与结束研读'].map((title, index) => ({ id: `${id}-reading-${index}`, title, done: index === 0 })) });
    }
    ids.forEach(resourceId => { const item = findLiterature(resourceId); if (item) store.addResource({ id: item.id, name: item.title, kind: item.type, status: item.status, projectId: project.id }); });
    store.addResources(ids, id);
    if (!task && !localTaskId) router.replace(`${READ_ROUTES.reader}?projectId=${project.id}&task=${id}${current ? `&doc=${current.id}&page=${actualPage}` : ''}${selected.length ? `&selected=${encodeURIComponent(selected.join(','))}` : ''}`);
    return id;
  }
  function setDocument(id: string, targetPage = 1, emphasize = false) { setDocumentId(id); setPage(targetPage); setParagraph(0); setHighlight(emphasize); setShowOriginal(!emphasize); }
  function setSelected(update: string[] | ((previous: string[]) => string[])) {
    const next = typeof update === 'function' ? update(selected) : update;
    setSelectedState(next);
    if (taskId) {
      const search = new URLSearchParams(params.toString());
      search.set('projectId', project.id); search.set('task', taskId);
      search.set('selected', next.join(','));
      if (current) { search.set('doc', current.id); search.set('page', String(actualPage)); }
      router.replace(`${READ_ROUTES.reader}?${search.toString()}`, { scroll: false });
    }
  }
  function evidenceFor(item: Literature, id: string, targetPage: number, excerpt?: string) {
    const available = item.status !== '仅摘要可用';
    return store.addEvidence({ projectId: project.id, taskId: id, sourceId: item.id, source: item.title, page: available ? targetPage : 1, location: available ? `P${targetPage} · ${item.pages.find(p => p.page === targetPage)?.section ?? '正文'}` : '摘要', excerpt: excerpt || item.conclusion, confirmed: false, access: item.id.startsWith('upload-') ? '用户上传' : available ? '演示原文' : '仅摘要' });
  }
  function createArtifact(kind: string, items?: Literature[]) {
    const range = items ?? (selected.length ? documents.filter(item => selected.includes(item.id)) : current ? [current] : []);
    if (!range.length) return;
    const id = ensureTask();
    const ids = range.map(item => evidenceFor(item, id, kind.includes('方法') || kind.includes('参数') ? 3 : 4));
    const artifactId = store.addArtifact({ projectId: project.id, taskId: id, type: kind, title: `${kind} · ${range.length} 篇`, content: buildLiteratureArtifact(kind, range, project.name), evidenceIds: ids, mode: 'AI', confirmed: false });
    range.filter(item => item.status !== '仅摘要可用').forEach(item => setStatusMap(prev => ({ ...prev, [`${project.id}:${id}:${item.id}`]: '已完成结构化提取' })));
    setOutputId(artifactId); setNotice('结构化产物已保存，并关联来源任务与证据。');
  }
  function ask(text = question) {
    if (!current || !text.trim()) return;
    const range = scope === '全部文献' ? documents : scope === '已选文献' ? documents.filter(item => selected.includes(item.id)) : [current];
    if (!range.length) { setNotice('当前没有已选文献，请先在左侧勾选文献。'); return; }
    const id = ensureTask();
    setBusy(true);
    const targetPage = text.includes('方法') || text.includes('条件') || text.includes('参数') ? 3 : text.includes('局限') || text.includes('空白') || text.includes('冲突') ? 6 : text.includes('图表') ? 5 : 4;
    window.setTimeout(() => {
      const evidenceIds = range.map(item => evidenceFor(item, id, scope === '当前段落' ? actualPage : targetPage, scope === '当前段落' ? currentPage?.text[paragraph] : undefined));
      const response = scope === '当前段落' ? `当前段落（P${actualPage}）：${currentPage?.text[paragraph] ?? current.abstract}\n\n理解提示：以上是该段落能直接支持的描述，不能据此推断未测试的条件。` : range.map(item => `${item.title}\n${item.status === '仅摘要可用' ? '根据当前可获取摘要，' : ''}${text.includes('方法') ? `采用${item.method}，需保持样品和加载路径一致。` : text.includes('条件') || text.includes('参数') ? `温度 ${item.temperature} ℃；压力 ${item.pressure} MPa。参数应用前须核对单位与边界。` : text.includes('局限') || text.includes('空白') ? item.limitation : text.includes('问题') ? `研究关注${item.keywords[0]}在耦合条件下的响应和影响因素。` : text.includes('图表') ? 'Figure 6 展示温度变化与响应曲线的联系。曲线为合成演示数据，可进入提取工作台校正。' : item.conclusion}`).join('\n\n') + (text.includes('冲突') || range.length > 1 ? '\n\n对比判断：不同文献的样品、温度窗口和加载路径不同。观察差异可能来自实验条件，尚不能判断因果冲突。建议补充相同条件下的反向证据。' : '') + (text.includes('课题') ? `\n\n当前课题：${project.name}。可借鉴方法设计，具体适用性需人工确认。` : '');
      const answer = { question: text, text: response, evidenceIds, scope };
      setAnswerMap(prev => ({ ...prev, [`${project.id}:${id}`]: [...(prev[`${project.id}:${id}`] ?? []), answer] }));
      store.addNote({ projectId: project.id, taskId: id, sourceId: current.id, text: `${text}\n${response}`, author: 'AI', evidenceIds });
      setQuestion(''); setBusy(false);
    }, 550);
  }
  function addMark(type: string) {
    if (!current) return;
    const id = ensureTask();
    const text = currentPage?.text[paragraph] ?? current.abstract;
    const key = `${project.id}:${id}`;
    if ((markMap[key] ?? []).some(item => item.sourceId === current.id && item.page === actualPage && item.paragraph === paragraph && item.type === type)) { setNotice('这个段落已有相同标记。'); return; }
    const newMark: Mark = { id: `mark-${Date.now()}`, sourceId: current.id, page: actualPage, paragraph, text, type };
    setMarkMap(prev => ({ ...prev, [key]: [...(prev[key] ?? []), newMark] }));
    evidenceFor(current, id, actualPage, text);
    setHighlight(true); setNotice(`已将当前段落标记为“${type}”，并保留来源位置。`);
  }
  function saveNote() {
    if (!current || !note.trim()) return;
    const id = ensureTask();
    if (noteEdit) store.updateNote(noteEdit, note);
    else store.addNote({ projectId: project.id, taskId: id, sourceId: current.id, text: note, author: '人工', evidenceIds: [evidenceFor(current, id, actualPage, currentPage?.text[paragraph])] });
    setNote(''); setNoteEdit(''); setNotice('人工笔记已保存；AI 生成内容不会覆盖人工笔记。');
  }
  function locate(evidence: Evidence) { setDocument(evidence.sourceId, evidence.page, true); setParagraph(0); }
  function parseCurrent() {
    if (!current) return;
    const id = ensureTask();
    const key = `${project.id}:${id}:${current.id}`;
    setStatusMap(prev => ({ ...prev, [key]: '解析中' }));
    setNotice('正在模拟解析目录、正文与图表…');
    window.setTimeout(() => { setStatusMap(prev => ({ ...prev, [key]: '可研读' })); setNotice('模拟解析已完成。请核对原始文件，演示提取结果不代表真实文件内容。'); setShowOriginal(false); }, 1000);
  }
  function handoff(target: 'compute' | 'experiment') {
    const id = ensureTask();
    const freshTask = store.tasks.find(item => item.id === id) ?? { ...task!, id, projectId: project.id, title: current?.title ?? '文献研读', goal: '验证文献中的参数和方法', hypothesis: '', resourceIds: documents.map(item => item.id) };
    const evidenceIds = current ? [evidenceFor(current, id, 3)] : [];
    const draft = store.createDraft(draftFromTask(freshTask, target, evidenceIds, current ? `温度：${current.temperature} ℃；压力：${current.pressure} MPa。模拟参数，使用前需人工核对。` : '待确认'));
    router.push(`${READ_ROUTES.handoff}?projectId=${project.id}&task=${id}&draft=${draft}&target=${target}`);
  }
  return <ReadPage title="科研文献研读" description={`${task?.title ?? '单篇与文献集研读'} · 原文、研究判断与证据保持关联`} actions={<><ReadBadge>模拟研读</ReadBadge>{task && <ReadBadge tone="green">{task.status}</ReadBadge>}<button className="research-button" onClick={() => { ensureTask(); setNotice('研读任务与上下文已保存到本机，可在研究任务中心恢复。'); }}>保存研读</button><Link className="research-button" href={`${READ_ROUTES.search}?projectId=${project.id}${taskId ? `&task=${taskId}` : ''}`}><Plus size={14}/>添加文献</Link></>}>
    {notice && <div role="status" className="mb-3 flex items-start justify-between gap-2 rounded-md bg-slate-100 px-4 py-2.5 text-xs text-slate-600"><span>{notice}</span><button aria-label="关闭提示" onClick={() => setNotice('')}><X size={14}/></button></div>}
    <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[190px_minmax(0,1fr)_280px] 2xl:grid-cols-[210px_minmax(0,1fr)_300px]">
      <ReadPanel title={`研究资料 · ${documents.length}`} actions={<button aria-label="加入示例文献" className="text-primary" onClick={() => setAddOpen(true)}><Plus size={15}/></button>}><ReadTabs items={['文献列表', '章节目录', '研究标记']} value={leftTab} onChange={setLeftTab}/>{leftTab === '文献列表' ? <div className="space-y-2"><p className="mb-3 text-[11px] leading-5 text-slate-400">勾选多篇文献可比较方法与实验条件。</p>{documents.map(item => <div key={item.id} className={`flex items-start gap-2 rounded-md border p-2.5 ${current?.id === item.id ? 'border-red-200 bg-red-50/40' : 'border-slate-100'}`}><input aria-label={`勾选${item.title}`} type="checkbox" className="mt-1" checked={selected.includes(item.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, item.id] : prev.filter(value => value !== item.id))}/><button onClick={() => setDocument(item.id)} className="min-w-0 text-left"><span className="line-clamp-3 text-xs font-medium leading-5">{item.title}</span><span className="mt-2 block text-[10px] text-slate-400">{item.authors} · {item.year}</span><span className="mt-1 block text-[10px] text-slate-500">{statusMap[`${localKey}:${item.id}`] || item.status}</span></button></div>)}{!documents.length && <EmptyState title="任务中还没有文献"><button className="research-button" onClick={() => setAddOpen(true)}>添加示例资料</button></EmptyState>}<button className="research-button w-full !text-xs" disabled={selected.length < 2} onClick={() => createArtifact('多文献方法对比', documents.filter(item => selected.includes(item.id)))}>比较已选 {selected.length} 篇</button></div> : leftTab === '章节目录' ? <div className="space-y-1">{current?.pages.map(item => <button key={item.page} className={`flex w-full gap-2 rounded p-2 text-left text-xs leading-6 ${actualPage === item.page ? 'bg-red-50 text-primary' : 'text-slate-500'}`} onClick={() => { setPage(item.page); setParagraph(0); setShowOriginal(false); }}><span className="shrink-0 text-[10px]">P{item.page}</span>{item.section}</button>)}{!current?.pages.length && <p className="text-xs text-slate-400">仅摘要可用，无全文目录。</p>}</div> : <div className="space-y-3">{marks.map(mark => <div className="rounded border border-slate-100 p-2" key={mark.id}><div className="mb-2 flex justify-between"><ReadBadge tone="amber">{mark.type}</ReadBadge><button aria-label="删除标记" className="text-slate-400" onClick={() => setMarkMap(prev => ({ ...prev, [localKey]: marks.filter(item => item.id !== mark.id) }))}><X size={12}/></button></div><button className="line-clamp-3 text-left text-xs leading-5 text-slate-600" onClick={() => { setDocument(mark.sourceId, mark.page, true); setParagraph(mark.paragraph); }}>{mark.text}</button><small className="text-slate-400">P{mark.page}</small></div>)}{!marks.length && <p className="py-5 text-center text-xs text-slate-400">点击正文段落，添加语义标记。</p>}</div>}</ReadPanel>
      <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100/70">
        {current ? <><div className="border-b bg-white px-4 py-3"><h2 className="truncate text-xs font-medium" title={current.title}>{current.title}</h2><div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><button className="rs-outline-btn !p-1.5" aria-label="上一页" disabled={actualPage <= 1 || status === '仅摘要可用'} onClick={() => { setPage(actualPage - 1); setParagraph(0); }}><ChevronLeft size={14}/></button><span>{actualPage} / {Math.max(1, current.pages.length)}</span><button className="rs-outline-btn !p-1.5" aria-label="下一页" disabled={actualPage >= current.pages.length || status === '仅摘要可用'} onClick={() => { setPage(actualPage + 1); setParagraph(0); }}><ChevronRight size={14}/></button><select className="ml-2 rounded border p-1" aria-label="正文缩放" value={zoom} onChange={e => setZoom(Number(e.target.value))}>{[80, 100, 125, 150].map(value => <option key={value} value={value}>{value}%</option>)}</select><ReadBadge tone={status.includes('异常') || status === '仅摘要可用' ? 'amber' : 'green'}>{status}</ReadBadge>{isUpload && <button className="ml-auto text-primary" onClick={() => setShowOriginal(value => !value)}>{showOriginal ? '查看解析内容' : '原始文件'}</button>}</div></div>
        <div className="border-b bg-white/70 px-4 py-2.5 text-[10px] leading-5 text-slate-500">{isUpload ? '来源：用户上传原始文件；模拟解析段落用于演示，须与文件人工核对。' : '来源：AI4S 本地合成演示文献 · 展示分章节演示正文，不是真实出版 PDF。'}</div>
        {(status === '待解析' || status === '解析中') && <div className="p-5"><EmptyState title={status === '解析中' ? '正在解析文献…' : '文献尚未解析'} description="模拟提取章节、正文、参数及图表；原文件保留在本机。"><button className="research-primary" disabled={status === '解析中'} onClick={parseCurrent}>开始模拟解析</button></EmptyState></div>}
        {status === '解析异常' && <div className="m-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-6"><strong>部分页面解析异常</strong><p>受影响：P4 · Table 2 单位列、P5 · Figure 6 曲线标签。建议人工核对。</p><button className="research-button mt-2 !text-xs" onClick={parseCurrent}>重新模拟解析</button></div>}
        {isUpload && showOriginal && uploadUrl && <div className="p-3">{upload?.mime?.includes('pdf') ? <iframe className="h-[600px] w-full rounded border bg-white" title={current.title} src={uploadUrl}/> : upload?.mime?.startsWith('image/') ? <a href={uploadUrl} target="_blank" rel="noreferrer" className="block rounded bg-white p-4 text-center text-sm text-primary"><Image alt={current.title} src={uploadUrl} width={800} height={1000} unoptimized className="mx-auto max-h-[600px] max-w-full object-contain"/>打开原始图像</a> : <a href={uploadUrl} download={current.title} className="research-button w-full"><Download size={14}/>下载原始文件</a>}</div>}
        {(!isUpload || !showOriginal) && status !== '待解析' && status !== '解析中' && <div className="max-h-[820px] overflow-auto p-4 md:p-6"><article className="mx-auto min-h-[610px] max-w-[760px] rounded-sm bg-white p-6 shadow-sm md:p-9" style={{ fontSize: `${12 * zoom / 100}px` }}><div className="mb-7 border-b border-slate-300 pb-3 text-center"><p className="text-[9px] uppercase tracking-[.16em] text-slate-400">AI4S RESEARCH READER / DEMONSTRATION</p><h3 className="mt-3 font-serif text-[1.45em] font-semibold leading-relaxed">{current.title}</h3><p className="mt-2 text-[.85em] text-slate-500">{current.authors} · {current.journal} · {current.year}</p></div><h4 className="mb-4 font-serif text-[1.2em] font-bold">{status === '仅摘要可用' ? '摘要 · Abstract' : currentPage?.section}</h4>{status === '仅摘要可用' ? <><div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-[.9em]">当前仅可访问题录和摘要。所有 AI 分析均基于摘要，不能核验全文方法、图表与参数。</div><button className={`text-left leading-[2.1] ${highlight ? 'bg-amber-100' : ''}`} onClick={() => { setParagraph(0); setHighlight(true); }}>{current.abstract}</button></> : currentPage?.text.map((text, index) => <button className={`mb-4 block w-full rounded px-1.5 py-1 text-left font-serif leading-[2.15] transition-colors hover:bg-amber-50 ${paragraph === index && highlight ? 'bg-amber-100 ring-1 ring-amber-200' : ''}`} key={index} onClick={() => { setParagraph(index); setHighlight(true); }}>{text}{marks.some(mark => mark.sourceId === current.id && mark.page === actualPage && mark.paragraph === index) && <span className="ml-1 inline-block align-middle text-primary"><Highlighter size={11}/></span>}</button>)}{status !== '仅摘要可用' && currentPage?.table && <div className="my-5 overflow-auto"><table className="w-full border-collapse text-[.85em]"><thead><tr>{currentPage.table.headers.map(header => <th key={header} className="border-y border-slate-500 p-2 text-left">{header}</th>)}</tr></thead><tbody>{currentPage.table.rows.map((row, index) => <tr key={index}>{row.map((cell, i) => <td className="border-b border-slate-200 p-2" key={i}>{cell}</td>)}</tr>)}</tbody></table></div>}{status !== '仅摘要可用' && currentPage?.figure && <div className="my-5"><svg viewBox="0 0 360 240" className="w-full" aria-label="模拟不同温度下的响应曲线"><path d="M45 20V200H330" stroke="#64748b" fill="none"/>{['#273449', '#b4232d', '#c79053', '#8b8f7b'].map((color, index) => <path key={color} d={`M45 200 C75 ${190 - index * 2}, 105 ${25 + index * 30}, 160 ${30 + index * 36} S255 ${95 + index * 20}, 320 ${140 + index * 13}`} stroke={color} strokeWidth="2" fill="none"/>)}<text x="175" y="227" fontSize="11" fill="#64748b">Strain (%)</text><text x="16" y="150" fontSize="10" fill="#64748b" transform="rotate(-90 16 150)">Response (demo)</text>{['25 ℃', '100 ℃', '150 ℃', '200 ℃'].map((label, index) => <text key={label} x="265" y={30 + index * 15} fontSize="9" fill={['#273449', '#b4232d', '#c79053', '#8b8f7b'][index]}>{label}</text>)}</svg><p className="text-[.85em] text-slate-500">Figure 6 · 合成响应曲线，用于图表提取演示。</p><button className="rs-link-btn mt-2" onClick={() => { const id = ensureTask(); router.push(`${READ_ROUTES.extraction}?projectId=${project.id}&task=${id}&doc=${current.id}&page=5`); }}>进入图表提取<ArrowRight size={12}/></button></div>}<div className="mt-12 border-t pt-3 text-center text-[.8em] text-slate-400">— {actualPage} —</div></article></div>}
        <div className="border-t bg-white p-3"><div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500"><Highlighter size={13}/>点击原文段落后添加研究标记 · 当前第 {paragraph + 1} 段</div><div className="flex flex-wrap gap-1.5">{MARKS.map(mark => <button disabled={status === '待解析' || status === '解析中'} className="rs-outline-btn !min-h-7 !px-2 !py-1 !text-[10px]" key={mark} onClick={() => addMark(mark)}>{mark}</button>)}</div></div></> : <EmptyState title="选择资料开始研读" description="添加资料后，原文、证据标记和研究产物会显示在这里。"><button className="research-primary" onClick={() => setAddOpen(true)}>添加文献</button></EmptyState>}
      </div>
      <ReadPanel title="AI 研读助手" actions={<Sparkles size={15} className="text-primary"/>}><ReadTabs items={['研读助手', '研究笔记']} value={rightTab} onChange={setRightTab}/>{rightTab === '研读助手' ? <><label className="mb-3 grid gap-2 text-xs text-slate-500">分析范围<select aria-label="分析范围" className="research-input !text-xs" value={scope} onChange={e => setScope(e.target.value)}>{['当前段落', '当前文献', '已选文献', '全部文献'].map(item => <option key={item}>{item}</option>)}</select></label><div className="grid grid-cols-2 gap-1.5">{QUICK_QUESTIONS.map(text => <button className="rounded border border-slate-200 bg-white px-2 py-2 text-left text-[11px] leading-5 hover:border-red-200 hover:text-primary disabled:opacity-40" disabled={!current || busy || status === '待解析' || status === '解析中'} key={text} onClick={() => ask(text)}>{text}</button>)}</div>{documents.length > 1 && <div className="mt-4 border-t pt-3"><p className="mb-2 text-[11px] font-medium">文献集分析</p><div className="flex flex-wrap gap-1.5">{['共同结论', '实验条件对比', '参数范围', '研究空白候选', '文献综述'].map(text => <button key={text} className="rs-outline-btn !text-[10px]" onClick={() => createArtifact(text, selected.length ? documents.filter(item => selected.includes(item.id)) : documents)}>{text}</button>)}</div></div>}<div className="my-4 max-h-[400px] space-y-4 overflow-y-auto">{answers.map((answer, index) => <div key={index} className="border-t pt-3"><p className="mb-2 text-xs font-medium">{answer.question}</p><ReadBadge>{answer.scope}</ReadBadge><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">{answer.text}</p><div className="mt-2 flex flex-wrap gap-1.5">{answer.evidenceIds.map(id => { const evidence = store.evidence.find(item => item.id === id); return evidence ? <button className="rs-evidence-link" key={id} onClick={() => locate(evidence)}><Quote size={10}/>{evidence.location}</button> : null; })}</div></div>)}{!answers.length && <div className="rounded bg-slate-50 px-3 py-4 text-xs leading-6 text-slate-400">从问题出发理解文献。回答保留页码与出处，点击证据可定位原文。</div>}</div><textarea aria-label="向研读助手提问" className="research-input min-h-20 resize-y !text-xs" placeholder="询问方法、比较结论，或查找证据…" value={question} onChange={e => setQuestion(e.target.value)}/><button className="research-primary mt-2 w-full" disabled={!question.trim() || !current || busy || status === '待解析' || status === '解析中'} onClick={() => ask()}>{busy ? '正在结合证据分析…' : '发送问题'}<ArrowRight size={13}/></button></> : <div><ReadBadge>人工与 AI 笔记分别保存</ReadBadge><textarea aria-label="人工研究笔记" className="research-input mt-3 min-h-28 resize-y !text-xs" placeholder="记录自己的科研判断，可引用当前原文段落…" value={note} onChange={e => setNote(e.target.value)}/><button className="research-primary mt-2 w-full" disabled={!note.trim() || !current} onClick={saveNote}>{noteEdit ? '保存修改' : '保存人工笔记'}</button><div className="mt-5 space-y-3">{taskNotes.map(item => <div key={item.id} className={`rounded border p-3 ${item.author === '人工' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}><div className="mb-2 flex justify-between"><ReadBadge tone={item.author === '人工' ? 'amber' : 'neutral'}>{item.author}笔记</ReadBadge>{item.author === '人工' && <button className="text-[11px] text-primary" onClick={() => { setNote(item.text); setNoteEdit(item.id); }}>编辑</button>}</div><p className="whitespace-pre-wrap text-xs leading-6 text-slate-600">{item.text}</p><div className="mt-2 flex flex-wrap gap-1">{item.evidenceIds.map(id => { const evidence = store.evidence.find(e => e.id === id); return evidence ? <button key={id} className="rs-evidence-link" onClick={() => locate(evidence)}>{evidence.location}</button> : null; })}</div></div>)}</div></div>}</ReadPanel>
    </div>
    <div className="mt-4"><ReadPanel title={`研究产物 · ${artifacts.length}`} actions={<div className="flex flex-wrap items-center gap-3"><span className="text-[11px] text-slate-400">关联当前课题与任务 · 支持回流研究</span>{task?.type.includes("研读") && <button className="rs-outline-btn" disabled={task.status === "已完成"} onClick={() => { store.updateTask(task.id, { status: "已完成", plan: task.plan.map(step => ({ ...step, done: true })) }); setNotice("研读任务已完成，资料、笔记和科研产物可从研究任务中心恢复。"); }}>{task.status === "已完成" ? "已完成研读" : "结束并完成研读"}</button>}</div>}><div className="flex flex-wrap gap-2">{['文献研读卡', '研究方法卡', '参数表', '证据矩阵'].map(kind => <button disabled={!current || status === '待解析' || status === '解析中'} className="research-button !text-xs" key={kind} onClick={() => createArtifact(kind)}><Plus size={12}/>{kind}</button>)}<button className="research-button !text-xs" disabled={!current} onClick={() => handoff('compute')}>用于计算</button><button className="research-button !text-xs" disabled={!current} onClick={() => handoff('experiment')}>用于实验方案</button><button className="research-button !text-xs" disabled={!documents.length} onClick={() => { if (task?.type === "科研思路探索") { router.push(taskRoute(task)); return; } const id = store.createTask(`${project.name} · 研读发现与研究空白`, '科研思路探索', project.id, documents.map(item => item.id)); const relevant = artifacts.filter(item => item.taskId === taskId); relevant.forEach(item => store.addArtifact({ ...item, taskId: id, title: `研读回流 · ${item.title}` })); router.push(taskRoute({ id, type: '科研思路探索', projectId: project.id })); }}>加入科研思路探索<ArrowRight size={12}/></button></div><div className="mt-4 grid gap-2 md:grid-cols-2 2xl:grid-cols-3">{artifacts.map(item => <button className="flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left hover:border-red-200" key={item.id} onClick={() => setOutputId(item.id)}><FileText size={20} className="shrink-0 text-primary"/><span className="min-w-0 flex-1"><strong className="block truncate text-xs font-medium">{item.title}</strong><small className="text-[10px] text-slate-400">v{item.version} · {item.mode} · {item.evidenceIds.length} 条证据 · {item.confirmed ? '已人工确认' : '待人工确认'}</small></span><ArrowRight size={13}/></button>)}</div>{!artifacts.length && <p className="mt-4 text-xs text-slate-400">将理解沉淀为结构化产物；聊天与 AI 笔记保留在右侧。</p>}</ReadPanel></div>
    <Modal title="添加研读资料" description="从本地示例资料中选择，或在检索工作台添加更多资料。" open={addOpen} onClose={() => setAddOpen(false)}><div className="space-y-2">{LITERATURE.filter(item => item.type === '文献').map(item => <button key={item.id} disabled={documents.some(doc => doc.id === item.id)} className="flex w-full items-center justify-between rounded border p-3 text-left text-xs disabled:bg-slate-50 disabled:text-slate-400" onClick={() => { const ids = [...resourceIds, item.id]; setExtraIds(ids); ensureTask(ids); setDocument(item.id); setAddOpen(false); setNotice('已添加到研读任务。'); }}><span>{item.title}<small className="mt-1 block text-slate-400">{item.year} · {item.status}</small></span><Plus size={14}/></button>)}</div></Modal>
    <Modal title={output?.title ?? '研究产物'} description="结构化产物保留证据来源，修改后保存为新版本。" open={!!output} onClose={() => setOutputId('')}>{output && <><textarea aria-label="编辑研究产物" className="research-input min-h-[330px] resize-y !text-xs !leading-7" value={output.content} onChange={e => store.updateArtifact(output.id, { content: e.target.value, mode: '混合', confirmed: false })}/><div className="flex flex-wrap gap-2">{output.evidenceIds.map(id => { const evidence = store.evidence.find(item => item.id === id); return evidence ? <button key={id} className="rs-evidence-link" onClick={() => { locate(evidence); setOutputId(''); }}><Quote size={11}/>{evidence.location}</button> : null; })}</div><div className="flex flex-wrap gap-2"><button className="research-primary" onClick={() => { store.updateArtifact(output.id, { confirmed: true }); output.evidenceIds.forEach(id => store.updateEvidence(id, { confirmed: true })); setNotice('产物与证据已标记为人工确认。'); }}>{output.confirmed ? '已人工确认' : '人工确认产物'}</button><button className="research-button" onClick={() => downloadText(`${output.title}.md`, output.content)}><Download size={14}/>导出</button><Link className="research-button" href={`${READ_ROUTES.search}?projectId=${project.id}&task=${taskId}`}>补充 / 反向证据检索</Link></div></>}</Modal>
  </ReadPage>;
}



