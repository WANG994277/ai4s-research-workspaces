'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, History, Sparkles, BookOpen, Star, Download, ArrowRight, Plus, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Modal, useLocalState } from '@/components/research/workspace-kit';
import { ReadPage, ReadPanel, ReadBadge, ReadTabs, EmptyState, downloadText, useReadTask } from './ui';
import { READ_ROUTES, taskRoute } from './types';
import { LITERATURE, type Literature, type QueryRow, SEARCH_FIELDS, matchesAdvanced, matchesTerm, parseExpression, buildLiteratureArtifact } from './literature';

type Filters = { year: string; category: string; author: string; institution: string; journal: string; language: string; country: string; keyword: string; source: string; open: boolean; status: string; issuer: string; ics: string; number: string; published: string; implemented: string };
const DEFAULT_FILTERS: Filters = { year: '', category: '', author: '', institution: '', journal: '', language: '', country: '', keyword: '', source: '', open: false, status: '', issuer: '', ics: '', number: '', published: '', implemented: '' };
type SearchRecord = { query: string; mode: string; type: string; field: string; rows: QueryRow[]; filters: Filters; time: string };
const firstRows: QueryRow[] = [{ field: '主题', operator: 'AND', value: '页岩' }, { field: '主题', operator: 'AND', value: '高温' }];
function strategyForQuery(value: string): QueryRow[] {
  const concepts = ['页岩', '高温', '高压', '裂缝', '真三轴', '催化剂', 'CO₂', '甲醇'].filter(term => value.includes(term));
  return (concepts.length ? concepts : [value.trim() || '页岩']).map(term => ({ field: '主题', operator: 'AND', value: term }));
}
function filtersForQuery(value: string): Filters {
  const year = value.match(/(20\d{2})\s*年?\s*(以后|以来|起)/)?.[1] ?? (value.includes('近5年') ? '2022' : '');
  return { ...DEFAULT_FILTERS, year };
}

export function ReadSearch() {
  const store = useReadTask();
  const { task, project } = store;
  const router = useRouter();
  const params = useSearchParams();
  const incomingQuery = params.get('q')?.trim() ?? '';
  const [type, setType] = useState('文献');
  const [mode, setMode] = useState('AI 检索');
  const [query, setQuery] = useState(incomingQuery);
  const [field, setField] = useState('主题');
  const [rows, setRows] = useState<QueryRow[]>(firstRows);
  const [expression, setExpression] = useState('主题:页岩 AND 主题:高温 NOT 主题:催化剂');
  const [useExpression, setUseExpression] = useState(false);
  const [submitted, setSubmitted] = useState<{ query: string; mode: string; field: string; rows: QueryRow[] } | null>(() => incomingQuery ? { query: incomingQuery, mode: 'AI 检索', field: '主题', rows: strategyForQuery(incomingQuery) } : null);
  const [filters, setFilters] = useState<Filters>(() => filtersForQuery(incomingQuery));
  const [strategy, setStrategy] = useState<QueryRow[] | null>(() => incomingQuery ? strategyForQuery(incomingQuery) : null);
  const [sort, setSort] = useState('相关性');
  const [detail, setDetail] = useState<Literature | null>(null);
  const [detailTab, setDetailTab] = useState('摘要');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [output, setOutput] = useState<{ title: string; content: string } | null>(null);
  const [copilot, setCopilot] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyByProject, setHistory] = useLocalState<Record<string, SearchRecord[]>>('ai4s-search-history-v1', {});
  const [savedSelections, setSavedSelections] = useLocalState<Record<string, string[]>>('ai4s-search-selections-v1', {});
  const [favorites, setFavorites] = useLocalState<Record<string, string[]>>('ai4s-search-favorites-v1', {});
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  useEffect(() => {
    if (!incomingQuery) return;
    const incomingStrategy = strategyForQuery(incomingQuery);
    setQuery(incomingQuery); setMode('AI 检索'); setStrategy(incomingStrategy);
    setFilters(filtersForQuery(incomingQuery));
    setSubmitted({ query: incomingQuery, mode: 'AI 检索', field: '主题', rows: incomingStrategy });
    setNotice(incomingQuery.includes('反向') ? '已承接反向证据检索意图并生成策略，可调整关键词后确认检索。请结合不同边界条件核查相反结论。' : '已承接上一步的研究问题，生成检索策略并展示初步匹配结果。');
  }, [incomingQuery]);
  const selectionKey = `${project.id}:${task?.id ?? 'search'}`;
  const selected = savedSelections[selectionKey] ?? [];
  const selectedItems = LITERATURE.filter(item => selected.includes(item.id));
  const history = historyByProject[project.id] ?? [];
  const favoriteIds = favorites[project.id] ?? [];
  const setSelected = (ids: string[]) => setSavedSelections(prev => ({ ...prev, [selectionKey]: [...new Set(ids)] }));
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);
  const updateFilter = (key: keyof Filters, value: string | boolean) => setFilters(current => ({ ...current, [key]: value }));
  const ensureTask = (ids: string[] = []) => {
    const id = task?.id ?? store.createTask(`${query || project.name} · 文献研究`, '科研思路探索', project.id, ids);
    ids.forEach(resourceId => { const item = LITERATURE.find(value => value.id === resourceId); if (item) store.addResource({ id: item.id, name: item.title, kind: item.type, status: item.status, projectId: project.id }); });
    store.addResources(ids, id);
    if (!task) {
      router.replace(`${READ_ROUTES.search}?projectId=${project.id}&task=${id}`);
      setSavedSelections(prev => ({ ...prev, [`${project.id}:${id}`]: selected }));
    }
    return id;
  };
  const results = LITERATURE.filter(item => {
    if (item.type !== type || (onlyFavorites && !favoriteIds.includes(item.id))) return false;
    if (filters.year && item.year < Number(filters.year)) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.author && !item.authors.toLowerCase().includes(filters.author.toLowerCase())) return false;
    if (filters.institution && item.institution !== filters.institution) return false;
    if (filters.journal && item.journal !== filters.journal) return false;
    if (filters.language && item.language !== filters.language) return false;
    if (filters.country && item.country !== filters.country) return false;
    if (filters.keyword && !item.keywords.some(k => k.includes(filters.keyword))) return false;
    if (filters.source && item.source !== filters.source) return false;
    if (filters.open && !item.open) return false;
    if (filters.status && item.standardStatus !== filters.status) return false;
    if (filters.issuer && item.issuer !== filters.issuer) return false;
    if (filters.ics && item.ics !== filters.ics) return false;
    if (filters.number && !item.number?.toLowerCase().includes(filters.number.toLowerCase())) return false;
    if (filters.published && item.year < Number(filters.published.slice(0, 4))) return false;
    if (filters.implemented && (item.implementDate ?? '') < filters.implemented) return false;
    if (!submitted) return true;
    if (submitted.mode === '关键词检索') return submitted.query.trim().split(/\s+/).every(term => matchesTerm(item, submitted.field, term));
    return matchesAdvanced(item, submitted.rows);
  }).sort((a, b) => sort === '最新发表' ? b.year - a.year : sort === '被引次数' ? b.citations - a.citations : 0);
  const selectOptions = (key: keyof Filters, label: string, values: string[]) => <label className="grid gap-1.5 text-xs" key={key}><span className="text-slate-500">{label}</span><select className="research-input !min-h-8 !py-1.5 !text-xs" value={String(filters[key])} onChange={e => updateFilter(key, e.target.value)}><option value="">不限</option>{[...new Set(values)].filter(Boolean).map(value => <option key={value}>{value}</option>)}</select></label>;
  const baseItems = LITERATURE.filter(item => item.type === type);
  function submit(searchRows = rows, searchMode = mode, searchQuery = query, searchField = field, searchFilters = filters) {
    const resolvedRows = searchMode === '高级检索' && useExpression ? parseExpression(expression) : searchRows;
    setSubmitted({ query: searchQuery, mode: searchMode, field: searchField, rows: resolvedRows });
    setHistory(prev => ({ ...prev, [project.id]: [{ query: searchQuery || resolvedRows.map(row => `${row.operator} ${row.field}:${row.value}`).join(' '), mode: searchMode, type, field: searchField, rows: resolvedRows, filters: searchFilters, time: new Date().toISOString() }, ...(prev[project.id] ?? [])].slice(0, 16) }));
    setNotice('已检索本地演示资料库，筛选结果会随条件实时更新。');
    setStrategy(null);
  }
  function prepareSearch() {
    if (mode !== 'AI 检索') return submit();
    const generated = strategyForQuery(query);
    if (query.includes('近5年')) updateFilter('year', '2022');
    if (query.includes('2023')) updateFilter('year', '2023');
    setStrategy(generated);
  }
  function readItems(items: Literature[]) {
    if (!items.length) return;
    const ids = items.map(item => item.id);
    const id = task?.id ?? store.createTask(items.length > 1 ? `${items.length} 篇文献比较研读` : items[0].title, items.length > 1 ? '多文献研读' : '文献研读', project.id, ids);
    items.forEach(item => store.addResource({ id: item.id, name: item.title, kind: item.type, status: item.status, projectId: project.id }));
    store.setReadingIds(ids);
    store.addResources(ids, id);
    router.push(`${READ_ROUTES.reader}?task=${id}&projectId=${project.id}&doc=${ids[0]}&selected=${encodeURIComponent(ids.join(','))}`);
  }
  function generate(kind: string, items: Literature[] = selectedItems) {
    if (!items.length) { setNotice('请先选择至少一项资料。'); return; }
    const id = ensureTask(items.map(item => item.id));
    const evidenceIds = items.map(item => store.addEvidence({ projectId: project.id, taskId: id, sourceId: item.id, source: item.title, page: item.status === '仅摘要可用' ? 1 : 4, location: item.status === '仅摘要可用' ? '摘要' : 'P4 · Table 2', excerpt: item.conclusion, confirmed: false, access: item.status === '仅摘要可用' ? '仅摘要' : '演示原文' }));
    const content = buildLiteratureArtifact(kind, items, project.name);
    store.addArtifact({ projectId: project.id, taskId: id, type: kind, title: `${kind} · ${items.length} 项资料`, content, evidenceIds, mode: 'AI', confirmed: false });
    setOutput({ title: kind, content });
    setNotice(`${kind}已保存到当前任务的科研产物，保留来源证据。`);
  }
  function runCopilot(action?: string) {
    const text = action ?? copilot;
    if (!text.trim()) return;
    setBusy(true);
    window.setTimeout(() => {
      const year = text.match(/20\d{2}/)?.[0];
      if (text.includes('只看') || text.includes('筛选') || text.includes('以后')) {
        setFilters(current => ({ ...current, year: year ?? current.year, keyword: text.includes('真三轴') ? '真三轴' : text.includes('催化剂') ? '催化剂' : current.keyword }));
        setNotice(`助手已更新筛选：${year ? `${year} 年及以后；` : ''}${text.includes('真三轴') ? '关键词：真三轴；' : ''}您可以在左侧继续修改。`);
      } else {
        const scope = selectedItems.length ? selectedItems : results;
        generate(text.includes('参数') ? '参数表' : text.includes('比较') ? '研究方法对比' : text.includes('空白') ? '研究空白候选' : text.includes('重点') ? '重点阅读建议' : '研究趋势摘要', scope);
      }
      setCopilot(''); setBusy(false);
    }, 450);
  }
  return <ReadPage title="文献与标准检索" description="从检索到研究，将可靠的资料带入当前课题。" actions={<><ReadBadge>本地模拟资料库</ReadBadge><button className="research-button" onClick={() => setHistoryOpen(true)}><History size={14}/>检索历史</button>{task && <Link className="research-button" href={taskRoute(task)}>返回研究任务<ArrowRight size={14}/></Link>}</>}>
    <ReadPanel><div className="flex flex-wrap items-center justify-between gap-4"><ReadTabs items={['文献', '标准']} value={type} onChange={value => { setType(value); setFilters(DEFAULT_FILTERS); setSubmitted(null); }}/><ReadTabs items={['AI 检索', '关键词检索', '高级检索']} value={mode} onChange={value => { setMode(value); setStrategy(null); }}/></div>
      {mode !== '高级检索' ? <form onSubmit={e => { e.preventDefault(); prepareSearch(); }} className="flex gap-2">{mode === '关键词检索' && <select aria-label="检索字段" className="research-input !w-24 shrink-0" value={field} onChange={e => setField(e.target.value)}>{SEARCH_FIELDS.map(item => <option key={item}>{item}</option>)}</select>}<div className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input aria-label="检索内容" className="research-input !pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder={mode === 'AI 检索' ? '描述研究目标，例如：近5年页岩高温裂缝扩展的真三轴实验' : '输入关键词，多个词以空格分隔'}/></div><button className="research-primary" type="submit">{mode === 'AI 检索' ? '生成策略' : '检索'}<ArrowRight size={14}/></button></form> : <div className="space-y-3"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={useExpression} onChange={e => setUseExpression(e.target.checked)}/>专业检索式模式（字段:词 AND / OR / NOT，按从左到右计算）</label>{useExpression ? <input aria-label="专业检索式" className="research-input font-mono" value={expression} onChange={e => setExpression(e.target.value)}/> : rows.map((row, index) => <div className="flex gap-2" key={index}><select aria-label={`第${index + 1}行逻辑`} value={row.operator} disabled={!index} className="research-input !w-20" onChange={e => setRows(current => current.map((r, i) => i === index ? { ...r, operator: e.target.value as QueryRow['operator'] } : r))}><option>AND</option><option>OR</option><option>NOT</option></select><select aria-label={`第${index + 1}行字段`} className="research-input !w-24" value={row.field} onChange={e => setRows(current => current.map((r, i) => i === index ? { ...r, field: e.target.value } : r))}>{SEARCH_FIELDS.map(item => <option key={item}>{item}</option>)}</select><input aria-label={`第${index + 1}行检索词`} className="research-input" value={row.value} onChange={e => setRows(current => current.map((r, i) => i === index ? { ...r, value: e.target.value } : r))}/><button aria-label="删除检索条件" className="research-button" disabled={rows.length < 2} onClick={() => setRows(current => current.filter((_, i) => i !== index))}><X size={14}/></button></div>)}<div className="flex justify-between">{!useExpression && <button className="research-button" onClick={() => setRows(current => [...current, { field: '主题', value: '', operator: 'AND' }])}><Plus size={14}/>添加条件</button>}<button className="research-primary ml-auto" onClick={() => submit()}>执行检索</button></div></div>}
      {strategy && <div className="mt-4 rounded-lg border border-red-100 bg-red-50/40 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-medium"><Sparkles size={14}/>AI 检索策略 <ReadBadge>可编辑</ReadBadge></div><div className="flex flex-wrap gap-2">{strategy.map((row, i) => <input key={i} aria-label={`策略关键词 ${i + 1}`} className="research-input !w-32" value={row.value} onChange={e => setStrategy(current => current?.map((r, index) => i === index ? { ...r, value: e.target.value } : r) ?? null)}/>)}</div><p className="my-3 text-xs text-slate-500">时间：{filters.year || '不限'}　研究类型：实验与相关研究　扩展词：shale / fracture propagation / true triaxial</p><code className="block break-all text-xs">{strategy.map(row => `主题:"${row.value}"`).join(' AND ')}</code><button className="research-primary mt-3" onClick={() => submit(strategy)}>确认策略并开始检索</button></div>}
    </ReadPanel>
    {notice && <div role="status" className="my-3 flex items-start justify-between gap-3 rounded-md bg-slate-100 px-4 py-2.5 text-xs text-slate-600"><span>{notice}</span><button aria-label="关闭提示" onClick={() => setNotice('')}><X size={14}/></button></div>}
    <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[178px_minmax(0,1fr)_230px]">
      <ReadPanel title="筛选条件" actions={<button className="text-xs text-primary" onClick={() => { setFilters(DEFAULT_FILTERS); setOnlyFavorites(false); }}>重置</button>}><div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">{selectOptions('year', '发表年份起', ['2026', '2025', '2024', '2023', '2022', '2021'])}{selectOptions('category', type === '文献' ? '文献类型' : '标准类型', baseItems.map(item => item.category))}{type === '文献' ? <>{selectOptions('institution', '机构', baseItems.map(item => item.institution))}{selectOptions('journal', '期刊', baseItems.map(item => item.journal))}<label className="grid gap-1.5 text-xs"><span className="text-slate-500">作者</span><input className="research-input !text-xs" value={filters.author} onChange={e => updateFilter('author', e.target.value)} placeholder="作者姓名"/></label>{selectOptions('language', '语言', ['中文', '英文'])}<label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={filters.open} onChange={e => updateFilter('open', e.target.checked)}/>仅开放获取</label></> : <>{selectOptions('status', '标准状态', baseItems.map(item => item.standardStatus ?? ''))}{selectOptions('issuer', '发布机构', baseItems.map(item => item.issuer ?? ''))}{selectOptions('ics', 'ICS 分类', baseItems.map(item => item.ics ?? ''))}<label className="grid gap-1.5 text-xs">标准号<input className="research-input !text-xs" value={filters.number} onChange={e => updateFilter('number', e.target.value)}/></label><label className="grid gap-1.5 text-xs">发布日期起<input type="date" className="research-input !text-xs" value={filters.published} onChange={e => updateFilter('published', e.target.value)}/></label><label className="grid gap-1.5 text-xs">实施日期起<input type="date" className="research-input !text-xs" value={filters.implemented} onChange={e => updateFilter('implemented', e.target.value)}/></label></>}{selectOptions('country', '国家 / 地区', baseItems.map(item => item.country))}{selectOptions('source', '数据来源', ['本地演示资料库'])}{selectOptions('keyword', type === '标准' ? '适用领域' : '关键词 / 学科', baseItems.flatMap(item => item.keywords))}<label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={onlyFavorites} onChange={e => setOnlyFavorites(e.target.checked)}/>只看收藏</label></div></ReadPanel>
      <ReadPanel title={`检索结果 · ${results.length} 项`} actions={<select aria-label="结果排序" className="rounded border px-2 py-1 text-xs" value={sort} onChange={e => setSort(e.target.value)}>{['相关性', '最新发表', '被引次数'].map(item => <option key={item}>{item}</option>)}</select>}>
        <div className="-mx-4 -mt-4 mb-1 border-b bg-slate-50/70 px-4 py-3"><div className="mb-2 flex items-center justify-between text-xs text-slate-500"><label className="flex items-center gap-2"><input aria-label="全选当前结果" type="checkbox" checked={results.length > 0 && results.every(item => selected.includes(item.id))} onChange={e => setSelected(e.target.checked ? [...selected, ...results.map(item => item.id)] : selected.filter(id => !results.some(item => item.id === id)))}/>已选 {selected.length} 项</label><button onClick={() => setSelected([])} disabled={!selected.length}>清空选择</button></div><div className="flex flex-wrap gap-1.5"><button disabled={!selectedItems.length} className="rs-primary-btn" onClick={() => readItems(selectedItems)}><BookOpen size={13}/>加入研读</button><button disabled={!selectedItems.length} className="rs-outline-btn" onClick={() => setTaskOpen(true)}>加入科研任务</button>{['多文献对比', '批量摘要', '提取参数', '证据矩阵'].map(kind => <button disabled={!selectedItems.length} className="rs-outline-btn" key={kind} onClick={() => generate(kind)}>{kind}</button>)}<button className="rs-outline-btn" disabled={!selectedItems.length} onClick={() => downloadText('检索资料.csv', '标题,作者,年份,来源,全文状态\n' + selectedItems.map(item => [item.title, item.authors, item.year, item.source, item.status].map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv;charset=utf-8')}><Download size={12}/>导出</button></div></div>
        {!results.length && <EmptyState title="没有符合条件的资料" description="尝试扩大年份范围、减少关键词或重置筛选。"><button className="research-button" onClick={() => { setFilters(DEFAULT_FILTERS); setSubmitted(null); setOnlyFavorites(false); }}>显示全部资料</button></EmptyState>}
        {results.map(item => <article key={item.id} className="flex min-w-0 gap-3 border-b border-slate-100 py-5 last:border-0"><input type="checkbox" className="mt-1.5 shrink-0 self-start" aria-label={`选择${item.title}`} checked={selected.includes(item.id)} onChange={() => toggle(item.id)}/><div className="min-w-0 flex-1"><div className="mb-2 flex items-start gap-3"><button onClick={() => { setDetail(item); setDetailTab('摘要'); }} className="min-w-0 text-left text-sm font-semibold leading-6 hover:text-primary">{item.title}</button><button className="ml-auto shrink-0 text-slate-400" aria-label={favoriteIds.includes(item.id) ? '取消收藏' : '收藏文献'} onClick={() => setFavorites(prev => ({ ...prev, [project.id]: favoriteIds.includes(item.id) ? favoriteIds.filter(id => id !== item.id) : [...favoriteIds, item.id] }))}><Star size={15} className={favoriteIds.includes(item.id) ? 'fill-amber-400 text-amber-500' : ''}/></button></div><p className="text-[11px] leading-5 text-slate-500">{item.authors} · {item.institution}<br/>{item.journal} · {item.year}　{item.type === '文献' ? `被引 ${item.citations}（模拟）` : item.standardStatus}</p><p className="my-2 line-clamp-2 text-xs leading-6 text-slate-600">{item.abstract}</p><div className="flex flex-wrap items-center gap-2"><ReadBadge>{item.category}</ReadBadge><ReadBadge tone={item.open ? 'green' : 'amber'}>{item.status}</ReadBadge><button className="text-[11px] text-primary" onClick={() => setNotice(`“${item.title}”匹配主题词：${item.keywords.join('、')}。与当前课题的实际适用性需人工判断。`)}>主题相关 · 为什么相关</button></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-primary"><button onClick={() => generate('AI 摘要', [item])}>AI 摘要</button><button onClick={() => readItems([item])}>加入研读</button><button onClick={() => { ensureTask([item.id]); setNotice('资料已加入当前研究任务，可返回任务继续分析。'); }}>加入当前任务</button><button onClick={() => generate('研究方法卡', [item])}>提取方法</button><button onClick={() => generate('参数表', [item])}>提取参数</button><button onClick={() => { setDetail(item); setDetailTab('核心图表'); }}>核心图表</button></div></div></article>)}
        <p className="pt-4 text-center text-[11px] text-slate-400">已展示全部 {results.length} 项结果 · 题录、引用量及正文均为模拟资料</p>
      </ReadPanel>
      <ReadPanel title="Search Copilot" actions={<Sparkles size={15} className="text-primary"/>}><p className="mb-4 text-xs leading-6 text-slate-500">围绕检索结果提出研究问题。分析范围：{selectedItems.length ? `已选 ${selectedItems.length} 项` : `当前 ${results.length} 项结果`}。</p><div className="grid gap-2">{['总结研究趋势', '识别主要研究方向', '比较研究方法', '寻找研究空白', '提取实验参数', '推荐重点阅读'].map(action => <button key={action} className="research-button !justify-start !text-xs" disabled={busy || !results.length} onClick={() => runCopilot(action)}><Sparkles size={12}/>{action}</button>)}</div><div className="my-5 border-t pt-4"><p className="mb-2 text-xs font-medium">用自然语言调整检索</p><button className="mb-3 text-left text-xs leading-6 text-slate-500 hover:text-primary" onClick={() => { setCopilot('只看 2023 年以后使用真三轴实验的论文'); }}>“只看 2023 年以后使用真三轴实验的论文”</button><textarea aria-label="Search Copilot 指令" className="research-input min-h-24 resize-y" value={copilot} onChange={e => setCopilot(e.target.value)} placeholder="比较方法，或描述筛选条件…"/><button className="research-primary mt-2 w-full" disabled={busy || !copilot.trim()} onClick={() => runCopilot()}>{busy ? '正在分析…' : '发送'}<ArrowRight size={13}/></button></div><p className="rs-note">分析生成的结果保存在科研产物中。搜索助手可直接修改筛选条件，修改后的条件始终可见。</p></ReadPanel>
    </div>
    <Sheet open={!!detail} onOpenChange={open => !open && setDetail(null)}><SheetContent className="!w-[min(620px,100vw)] !max-w-none overflow-y-auto"><SheetHeader><SheetTitle>资料详情</SheetTitle><SheetDescription>演示题录与正文 · 来源可追溯</SheetDescription></SheetHeader>{detail && <div className="space-y-5 px-5 pb-8"><h2 className="text-lg font-semibold leading-8">{detail.title}</h2><div className="flex flex-wrap gap-2"><ReadBadge>{detail.category}</ReadBadge><ReadBadge tone="amber">{detail.status}</ReadBadge></div><dl className="grid grid-cols-[70px_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs leading-6">{[['作者', detail.authors], ['机构', detail.institution], ['来源', detail.journal], ['年份', detail.year], ['标识符', detail.number ?? detail.doi], ['数据来源', detail.source], ['全文权限', detail.open ? '演示正文可读取' : '当前仅可访问题录和摘要']].map(([label, value]) => <div className="contents" key={label}><dt className="text-slate-400">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl><ReadTabs items={['摘要', '研究方法', '实验条件', '核心图表', '关键结论']} value={detailTab} onChange={setDetailTab}/><p className="text-sm leading-7 text-slate-600">{detailTab === '摘要' ? detail.abstract : detailTab === '研究方法' ? `${detail.method}。${detail.limitation}` : detailTab === '实验条件' ? `温度 ${detail.temperature} ℃；压力 ${detail.pressure} MPa。${detail.open ? '详细参数见 P3。' : '根据当前摘要，详细边界条件需全文核验。'}` : detailTab === '关键结论' ? detail.conclusion : detail.open ? 'P4 · Table 2：实验响应参数表。P5 · Figure 6：温度对响应曲线的影响。' : '仅摘要可用，尚无法核对核心图表。'}</p><div className="flex flex-wrap gap-2"><button className="research-primary" onClick={() => readItems([detail])}><BookOpen size={14}/>打开研读</button><button className="research-button" onClick={() => { ensureTask([detail.id]); setNotice('已加入当前任务'); setDetail(null); }}>加入当前任务</button>{detail.type === '标准' && <button className="research-button" onClick={() => { const id = store.createTask(`标准对标：${detail.number}`, '标准对标', project.id, [detail.id]); router.push(taskRoute({ id, projectId: project.id, type: '标准对标' })); }}>创建标准对标任务</button>}</div></div>}</SheetContent></Sheet>
    <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="检索历史" description={`当前课题：${project.name}`}><div className="space-y-2">{!history.length && <EmptyState title="还没有检索记录"/>}{history.map((item, i) => <button key={item.time + i} className="flex w-full items-center gap-3 rounded-lg border p-3 text-left" onClick={() => { setQuery(item.query); setMode(item.mode); setType(item.type); setField(item.field); setRows(item.rows); setFilters(item.filters); setSubmitted({ query: item.query, mode: item.mode, field: item.field, rows: item.rows }); setHistoryOpen(false); }}><History size={15}/><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.query}</strong><small className="text-slate-400">{item.mode} · {new Date(item.time).toLocaleString('zh-CN')}</small></span><ArrowRight size={14}/></button>)}</div></Modal>
    <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="加入科研任务" description={`将 ${selectedItems.length} 项资料关联到 ${project.name}。`}><div className="space-y-2">{store.tasks.filter(item => item.projectId === project.id).map(item => <button className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm" key={item.id} onClick={() => { selectedItems.forEach(value => store.addResource({ id: value.id, name: value.title, kind: value.type, status: value.status, projectId: project.id })); store.addResources(selected, item.id); setNotice(`已加入任务：${item.title}`); setTaskOpen(false); }}><span>{item.title}<small className="block text-slate-400">{item.type} · {item.status}</small></span><Plus size={16}/></button>)}<button className="research-primary w-full" onClick={() => { const id = store.createTask(`${query || '检索资料'} · 证据研究`, '科研思路探索', project.id, selected); selectedItems.forEach(value => store.addResource({ id: value.id, name: value.title, kind: value.type, status: value.status, projectId: project.id })); router.push(taskRoute({ id, projectId: project.id, type: '科研思路探索' })); }}><Plus size={14}/>使用所选资料创建研究任务</button></div></Modal>
    <Modal open={!!output} onClose={() => setOutput(null)} title={output?.title ?? '科研产物'} description="已保存到当前任务。模拟内容需人工核验后使用。"><pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-xs leading-7">{output?.content}</pre><button className="research-button" onClick={() => output && downloadText(`${output.title}.md`, output.content)}><Download size={14}/>导出 Markdown</button></Modal>
  </ReadPage>;
}
