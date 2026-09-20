'use client';

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { AlertCircle, ArrowDownLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, FileText, Filter, Focus, GitCompareArrows, GitFork, ListPlus, Maximize2, Minus, Network, PanelLeftClose, PanelRightClose, Plus, RotateCcw, Route, Search, X } from 'lucide-react';
import type { Evidence, GraphEntity, GraphRelation, KnowledgeBase, KnowledgeDocument, KnowledgeEntryDraft, KnowledgeGraph } from './model';
import { findGraphPath, graphNeighborhood, isSymmetricGraphRelation, scopeKnowledgeGraph, uniqueEvidence, type GraphDirection } from './graph-utils';
import styles from './graph.module.css';

export interface KnowledgeGraphViewProps {
  knowledgeBase: KnowledgeBase;
  documents: KnowledgeDocument[];
  graph: KnowledgeGraph;
  onEvidence: (evidence: Evidence) => void;
  onAsk: (question: string, documentIds?: string[]) => void;
  onCreateTask: (title: string, evidence: Evidence[]) => void;
  onSaveEntry: (input: KnowledgeEntryDraft) => void;
}

type ViewMode = 'inspect' | 'path' | 'compare';
type Point = { x: number; y: number };
const palette = ['#B4232D', '#496E98', '#4C8373', '#927542', '#7A6498', '#607685', '#9F6759'];
const directionLabels: Record<GraphDirection, string> = { both: '全部方向', incoming: '上游关系', outgoing: '下游关系' };
const evidencePosition = (item: Evidence) => `${item.pageKind === 'logical' ? `逻辑页 ${item.page}` : `P${item.page}`} · 第 ${item.paragraph} 段`;

function graphPositions(entities: GraphEntity[], relations: GraphRelation[]): Map<string, Point> {
  const degree = new Map(entities.map(entity => [entity.id, 0]));
  for (const relation of relations) {
    degree.set(relation.sourceEntityId, (degree.get(relation.sourceEntityId) ?? 0) + 1);
    degree.set(relation.targetEntityId, (degree.get(relation.targetEntityId) ?? 0) + 1);
  }
  const sorted = [...entities].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0));
  const positions = new Map<string, Point>();
  if (!sorted.length) return positions;
  positions.set(sorted[0].id, { x: 400, y: 310 });
  const count = sorted.length - 1;
  sorted.slice(1).forEach((entity, index) => {
    const ring = count > 10 ? (index < 8 ? 0 : 1 + Math.floor((index - 8) / 16)) : 0;
    const ringStart = ring === 0 ? 0 : 8 + (ring - 1) * 16;
    const ringCount = count > 10 ? ring === 0 ? 8 : Math.min(16, count - ringStart) : count;
    const angle = count === 1 ? 0 : ((index - ringStart) / Math.max(ringCount, 1)) * Math.PI * 2 - Math.PI / 2 + (ring % 2 ? Math.PI / 16 : 0);
    const radiusX = count === 1 ? 220 : ring === 0 ? (count > 10 ? 175 : 250) : 320 + (ring - 1) * 110;
    const radiusY = count === 1 ? 0 : ring === 0 ? (count > 10 ? 140 : 215) : 255 + (ring - 1) * 100;
    positions.set(entity.id, { x: 400 + Math.cos(angle) * radiusX, y: 310 + Math.sin(angle) * radiusY });
  });
  return positions;
}

function activateOnKeyboard(event: KeyboardEvent<SVGGElement>, callback: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
}

function EvidenceList({ evidence, onEvidence }: { evidence: Evidence[]; onEvidence: (item: Evidence) => void }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? evidence : evidence.slice(0, 3);
  return <div className={styles.evidenceList}>
    {shown.map((item, index) => <button key={item.id} className={styles.evidence} onClick={() => onEvidence(item)} aria-label={`打开来源 ${item.documentTitle}，${item.version}，${evidencePosition(item)}`}>
      <span className={styles.evidenceTitle}><span className={styles.citationNumber}>{index + 1}</span><span>{item.documentTitle}</span><ChevronRight size={13} /></span>
      <span className={styles.quote}>“{item.quote}”</span>
      <span className={styles.evidenceMeta}>{item.version} · {evidencePosition(item)}</span>
    </button>)}
    {evidence.length > 3 && <button className={styles.textButton} onClick={() => setExpanded(value => !value)}>{expanded ? '收起来源' : `查看全部 ${evidence.length} 条来源`}<ChevronDown size={13} /></button>}
    {!evidence.length && <p className={styles.muted}>当前筛选下没有可用来源。</p>}
  </div>;
}

/** A key intentionally resets exploration when moving to a different library. */
export function KnowledgeGraphView(props: KnowledgeGraphViewProps) {
  return <KnowledgeGraphContent key={props.knowledgeBase.id} {...props} />;
}

function KnowledgeGraphContent({ knowledgeBase, documents, graph, onEvidence, onAsk, onCreateTask, onSaveEntry }: KnowledgeGraphViewProps) {
  const scoped = useMemo(() => scopeKnowledgeGraph(graph, knowledgeBase.id, documents), [graph, knowledgeBase.id, documents]);
  const coreEntity = useMemo(() => {
    const degrees = new Map<string, number>();
    for (const relation of scoped.relations) for (const id of [relation.sourceEntityId, relation.targetEntityId]) degrees.set(id, (degrees.get(id) ?? 0) + 1);
    return [...scoped.entities].sort((a, b) => (degrees.get(b.id) ?? 0) - (degrees.get(a.id) ?? 0))[0];
  }, [scoped]);
  const readyDocuments = useMemo(() => documents.filter(document => document.knowledgeBaseId === knowledgeBase.id && document.parseStatus === 'ready'), [documents, knowledgeBase.id]);
  const documentMap = useMemo(() => new Map(readyDocuments.map(document => [document.id, document])), [readyDocuments]);
  const entityTypes = useMemo(() => [...new Set(scoped.entities.map(entity => entity.type))], [scoped.entities]);
  const relationTypes = useMemo(() => [...new Set(scoped.relations.map(relation => relation.relationType))], [scoped.relations]);
  const tags = useMemo(() => [...new Set([...scoped.entities.flatMap(entity => entity.tags), ...readyDocuments.flatMap(document => document.tags)])], [scoped.entities, readyDocuments]);
  const [query, setQuery] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [relationType, setRelationType] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [tag, setTag] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(() => coreEntity ? [coreEntity.id] : []);
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('inspect');
  const [direction, setDirection] = useState<GraphDirection>('both');
  const [depth, setDepth] = useState<0 | 1 | 2>(() => scoped.entities.length > 18 || scoped.relations.length > 32 ? 1 : 0);
  const [showFilters, setShowFilters] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [report, setReport] = useState<KnowledgeEntryDraft | null>(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [mutationPending, setMutationPending] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; pan: Point } | null>(null);

  const filtered = useMemo(() => {
    const evidence = scoped.evidence.filter(item => {
      const document = documentMap.get(item.documentId);
      if (!document || (documentId && document.id !== documentId)) return false;
      const date = document.updatedAt.slice(0, 10);
      return (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo);
    });
    const allowedEvidence = new Set(evidence.map(item => item.id));
    let entities = scoped.entities.map(entity => ({ ...entity, evidenceIds: entity.evidenceIds.filter(id => allowedEvidence.has(id)) })).filter(entity => entity.evidenceIds.length && (!types.length || types.includes(entity.type)) && (!tag || entity.tags.includes(tag) || uniqueEvidence(entity.evidenceIds, evidence).some(item => documentMap.get(item.documentId)?.tags.includes(tag))));
    const entityIds = new Set(entities.map(entity => entity.id));
    let relations = scoped.relations.map(relation => ({ ...relation, evidenceIds: relation.evidenceIds.filter(id => allowedEvidence.has(id)) })).filter(relation => relation.evidenceIds.length && entityIds.has(relation.sourceEntityId) && entityIds.has(relation.targetEntityId) && (!relationType || relation.relationType === relationType));
    if (relationType) {
      const connected = new Set(relations.flatMap(relation => [relation.sourceEntityId, relation.targetEntityId]));
      entities = entities.filter(entity => connected.has(entity.id));
    }
    const term = query.trim().toLocaleLowerCase();
    const matches = entities.filter(entity => !term || `${entity.name} ${entity.description} ${entity.type} ${entity.tags.join(' ')}`.toLocaleLowerCase().includes(term));
    if (term) {
      const included = new Set(matches.flatMap(entity => [...graphNeighborhood(entity.id, relations, 1)]));
      entities = entities.filter(entity => included.has(entity.id));
      relations = relations.filter(relation => included.has(relation.sourceEntityId) && included.has(relation.targetEntityId));
    }
    return { entities, relations, evidence, matches };
  }, [scoped, documentMap, documentId, dateFrom, dateTo, types, tag, relationType, query]);

  const selection = selectedIds.map(id => filtered.entities.find(entity => entity.id === id)).filter((entity): entity is GraphEntity => Boolean(entity));
  const primary = selection[0];
  const selectedRelation = filtered.relations.find(relation => relation.id === selectedRelationId);
  const path = mode === 'path' && selection.length === 2 ? findGraphPath(selection[0].id, selection[1].id, filtered.relations, direction) : null;
  const neighborhood = depth && primary ? graphNeighborhood(primary.id, filtered.relations, depth, direction) : null;
  const visibleEntities = neighborhood && mode === 'inspect' ? filtered.entities.filter(entity => neighborhood.has(entity.id)) : filtered.entities;
  const visibleIds = new Set(visibleEntities.map(entity => entity.id));
  const visibleRelations = filtered.relations.filter(relation => visibleIds.has(relation.sourceEntityId) && visibleIds.has(relation.targetEntityId) && (depth !== 1 || mode !== 'inspect' || !primary || relation.sourceEntityId === primary.id || relation.targetEntityId === primary.id));
  const positions = graphPositions(visibleEntities, visibleRelations);
  const evidence = uniqueEvidence(selectedRelation ? selectedRelation.evidenceIds : selection.flatMap(entity => entity.evidenceIds), filtered.evidence);
  const commonNeighbors = selection.length === 2 ? [...graphNeighborhood(selection[0].id, filtered.relations, 1)].filter(id => id !== selection[0].id && id !== selection[1].id && graphNeighborhood(selection[1].id, filtered.relations, 1).has(id)).map(id => filtered.entities.find(entity => entity.id === id)!).filter(Boolean) : [];
  const sharedDocuments = selection.length === 2 ? [...new Set(uniqueEvidence(selection[0].evidenceIds, filtered.evidence).map(item => item.documentId))].filter(id => uniqueEvidence(selection[1].evidenceIds, filtered.evidence).some(item => item.documentId === id)) : [];
  const filterCount = types.length + [relationType, documentId, tag, dateFrom, dateTo].filter(Boolean).length;
  const colorFor = (entity: GraphEntity) => palette[Math.max(entityTypes.indexOf(entity.type), 0) % palette.length];
  const documentIds = [...new Set(evidence.map(item => item.documentId))];

  function resetFilters() {
    setQuery(''); setTypes([]); setRelationType(''); setDocumentId(''); setTag(''); setDateFrom(''); setDateTo(''); setDepth(0); setDirection('both'); setNotice('已清除全部筛选');
  }
  function selectEntity(entityId: string, additive = false) {
    if (mutationPending) return;
    setSelectedRelationId(null); setReport(null); setShowDetails(true);
    setSelectedIds(current => {
      if (mode === 'inspect' && !additive) return [entityId];
      if (current.includes(entityId)) return current.filter(id => id !== entityId);
      return current.length >= 2 ? [current[1], entityId] : [...current, entityId];
    });
    if (additive && mode === 'inspect') setMode('compare');
  }
  function switchMode(next: ViewMode) {
    if (mutationPending) return;
    setMode(next); setSelectedRelationId(null); setReport(null); setShowDetails(true); setDepth(0);
    if (next === 'inspect') setSelectedIds(current => current.slice(0, 1));
  }
  function resetCanvas() { setScale(1); setPan({ x: 0, y: 0 }); }
  function focusEntity(entityId: string) {
    selectEntity(entityId);
    const point = positions.get(entityId);
    if (point) setPan({ x: (400 - point.x) * scale, y: (310 - point.y) * scale });
  }
  function startPan(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || (event.target as Element).closest('[data-interactive="true"]')) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, pan };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  }
  function movePan(event: PointerEvent<SVGSVGElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(800 / bounds.width, 620 / bounds.height);
    setPan({ x: current.pan.x + (event.clientX - current.startX) * ratio, y: current.pan.y + (event.clientY - current.startY) * ratio });
  }
  function stopPan() { drag.current = null; setIsPanning(false); }
  async function ask() {
    if (!evidence.length || !knowledgeBase.qaEnabled) return;
    const question = selectedRelation ? `请基于来源解释“${filtered.entities.find(entity => entity.id === selectedRelation.sourceEntityId)?.name}”与“${filtered.entities.find(entity => entity.id === selectedRelation.targetEntityId)?.name}”之间的“${selectedRelation.relationType}”关系，并说明证据边界。` : selection.length === 2 ? `请基于来源对比“${selection[0].name}”与“${selection[1].name}”，列出相同点、差异及证据。` : `请基于来源解释“${primary?.name}”及其关联知识，引用原文证据。`;
    setActionError('');
    try { await onAsk(question, documentIds); }
    catch (error) { setActionError(error instanceof Error ? error.message : '无法打开问答，请重试。'); }
  }
  async function createTask() {
    if (!evidence.length || !knowledgeBase.canEdit || mutationPending) return;
    const title = selectedRelation ? `核验关系：${filtered.entities.find(entity => entity.id === selectedRelation.sourceEntityId)?.name} ${selectedRelation.relationType} ${filtered.entities.find(entity => entity.id === selectedRelation.targetEntityId)?.name}` : `研究${selection.map(entity => entity.name).join('与')}的关联证据`;
    setActionError(''); setMutationPending(true); setNotice('');
    try { await onCreateTask(title, evidence); setNotice('已交给任务创建流程，并附上来源证据'); }
    catch (error) { setActionError(error instanceof Error ? error.message : '任务创建失败，请重试。'); }
    finally { setMutationPending(false); }
  }
  async function saveReport() {
    if (!report || !knowledgeBase.canEdit || mutationPending) return;
    setActionError(''); setMutationPending(true); setNotice('');
    try { await onSaveEntry({ ...report, summary: report.body.slice(0, 180) }); setReport(null); setNotice('已保存到知识条目'); }
    catch (error) { setActionError(error instanceof Error ? error.message : '保存失败，草稿仍保留，请重试。'); }
    finally { setMutationPending(false); }
  }
  function prepareReport(type: '知识条目' | '图谱报告') {
    if (mutationPending) return;
    setActionError('');
    const chosenRelations = path ? filtered.relations.filter(relation => path.relationIds.includes(relation.id)) : selectedRelation ? [selectedRelation] : filtered.relations.filter(relation => selection.some(entity => entity.id === relation.sourceEntityId || entity.id === relation.targetEntityId));
    const chosenEntityIds = new Set([...selection.map(entity => entity.id), ...chosenRelations.flatMap(relation => [relation.sourceEntityId, relation.targetEntityId])]);
    const chosenEntities = filtered.entities.filter(entity => chosenEntityIds.has(entity.id));
    const reportEvidence = uniqueEvidence([...chosenEntities.flatMap(entity => entity.evidenceIds), ...chosenRelations.flatMap(relation => relation.evidenceIds)], filtered.evidence);
    if (!reportEvidence.length) return;
    const citation = (ids: string[]) => ids.map(id => reportEvidence.findIndex(item => item.id === id) + 1).filter(index => index > 0).map(index => `[${index}]`).join('');
    const body = [
      '本内容整理自当前知识库的可用来源。图谱中的关联不自动构成因果，未确认的抽取结果仍需核验。',
      ...chosenEntities.map(entity => `${entity.name}（${entity.type}）：${entity.description || '详见来源片段。'} ${citation(entity.evidenceIds)}`),
      chosenRelations.length ? '关联关系' : '',
      ...chosenRelations.map(relation => `${filtered.entities.find(entity => entity.id === relation.sourceEntityId)?.name} — ${relation.relationType} — ${filtered.entities.find(entity => entity.id === relation.targetEntityId)?.name}（${relation.confirmed ? '已确认' : '待核验'}）${citation(relation.evidenceIds)}`),
      mode === 'compare' && selection.length === 2 ? `共同关联实体：${commonNeighbors.map(entity => entity.name).join('、') || '当前图谱未发现'}；共同来源文档：${sharedDocuments.length} 篇。此处仅比较图谱连接与来源覆盖。` : '',
      '来源',
      ...reportEvidence.map((item, index) => `[${index + 1}] ${item.documentTitle}，${item.version}，${evidencePosition(item)}：“${item.quote}”`),
    ].filter(Boolean).join('\n\n');
    const title = `${selection.map(entity => entity.name).join('与') || '关联关系'}${type === '图谱报告' ? '：图谱关系报告' : '：关联知识'}`;
    setReport({ knowledgeBaseId: knowledgeBase.id, title, type, body, summary: body.slice(0, 180), tags: [...new Set(chosenEntities.flatMap(entity => entity.tags))], domain: knowledgeBase.domain[0] ?? '', sourceLabel: '知识图谱', documentIds: [...new Set(reportEvidence.map(item => item.documentId))], entityIds: [...chosenEntityIds], relatedProjectId: documentMap.get(reportEvidence[0].documentId)?.relatedProjectId ?? '', evidence: reportEvidence });
    setShowDetails(true);
  }

  if (!knowledgeBase.canRead) return <section className={styles.empty}><Network size={32} /><h3>无权查看此知识图谱</h3><p>请联系知识库管理员申请访问权限。</p></section>;

  return <section className={styles.graphView} aria-label={`${knowledgeBase.name}知识图谱`}>
    <div className={styles.topbar}>
      <div className={styles.titleGroup}><Network size={18} /><h2>知识图谱</h2><span className={styles.count}>{scoped.entities.length} 个实体 · {scoped.relations.length} 条关系</span></div>
      <div className={styles.topActions}>
        <button className={styles.toolbarButton} onClick={() => setShowFilters(value => !value)} aria-expanded={showFilters} aria-controls="knowledge-graph-filters"><Filter size={15} />筛选{filterCount > 0 && <span className={styles.filterBadge}>{filterCount}</span>}</button>
        <button className={styles.toolbarButton} onClick={() => setShowDetails(value => !value)} aria-expanded={showDetails} aria-controls="knowledge-graph-details"><BookOpen size={15} />详情</button>
        <button className={styles.toolbarButton} disabled={!evidence.length} onClick={() => prepareReport('图谱报告')}><FileText size={15} />生成报告</button>
      </div>
    </div>
    {actionError && <div className={styles.actionError} role="alert"><AlertCircle size={15} /><span>{actionError}</span><button aria-label="关闭操作错误提示" onClick={() => setActionError('')}><X size={14} /></button></div>}

    <div className={`${styles.workspace} ${!showFilters ? styles.withoutFilters : ''} ${!showDetails ? styles.withoutDetails : ''}`}>
      {showFilters && <aside id="knowledge-graph-filters" className={styles.filters} aria-label="图谱筛选">
        <div className={styles.panelHeading}><h3>探索知识</h3><button className={styles.iconButton} onClick={() => setShowFilters(false)} aria-label="收起筛选"><PanelLeftClose size={16} /></button></div>
        <label className={styles.search}><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索实体、关键词" aria-label="搜索图谱实体" onKeyDown={event => { if (event.key === 'Enter' && filtered.matches[0]) focusEntity(filtered.matches[0].id); }} />{query && <button aria-label="清空实体搜索" onClick={() => setQuery('')}><X size={12} /></button>}</label>
        {query.trim() && <div className={styles.searchResults}><span className={styles.fieldCaption}>找到 {filtered.matches.length} 个实体，保留其相邻关系</span>{filtered.matches.slice(0, 5).map(entity => <button key={entity.id} onClick={() => focusEntity(entity.id)}><span className={styles.typeDot} style={{ background: colorFor(entity) }} />{entity.name}<Focus size={12} /></button>)}</div>}
        <fieldset className={styles.typeGroup}><legend>实体类型</legend>{entityTypes.map(type => <label key={type} className={styles.checkRow}><input type="checkbox" checked={types.includes(type)} onChange={() => setTypes(current => current.includes(type) ? current.filter(value => value !== type) : [...current, type])} /><span className={styles.typeDot} style={{ background: palette[entityTypes.indexOf(type) % palette.length] }} /><span>{type}</span><span className={styles.typeCount}>{scoped.entities.filter(entity => entity.type === type).length}</span></label>)}</fieldset>
        <label className={styles.field}>关系类型<select value={relationType} onChange={event => setRelationType(event.target.value)}><option value="">全部关系</option>{relationTypes.map(type => <option key={type}>{type}</option>)}</select></label>
        <label className={styles.field}>来源文档<select value={documentId} onChange={event => setDocumentId(event.target.value)}><option value="">全部可用文档</option>{readyDocuments.map(document => <option key={document.id} value={document.id}>{document.title}</option>)}</select></label>
        <details className={styles.moreFilters}><summary>更多筛选<ChevronDown size={13} /></summary><label className={styles.field}>标签<select value={tag} onChange={event => setTag(event.target.value)}><option value="">全部标签</option>{tags.map(value => <option key={value}>{value}</option>)}</select></label><label className={styles.field}>文档更新时间，从<input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} /></label><label className={styles.field}>至<input type="date" value={dateTo} min={dateFrom || undefined} onChange={event => setDateTo(event.target.value)} /></label>{dateFrom && dateTo && dateFrom > dateTo && <p className={styles.validation}>结束日期不能早于开始日期。</p>}</details>
        <button className={styles.resetButton} onClick={resetFilters}><RotateCcw size={13} />重置筛选</button>
        <div className={styles.filterNote}><CircleHelp size={14} /><p>仅展示当前知识库中可追溯的实体与关系。虚线表示待核验的关系。</p></div>
      </aside>}

      <div className={styles.canvasPanel}>
        <div className={styles.canvasToolbar}>
          <div className={styles.modeTabs} role="group" aria-label="图谱探索方式">
            <button className={mode === 'inspect' ? styles.activeMode : ''} aria-pressed={mode === 'inspect'} onClick={() => switchMode('inspect')}><Network size={14} />探索</button>
            <button className={mode === 'path' ? styles.activeMode : ''} aria-pressed={mode === 'path'} onClick={() => switchMode('path')}><Route size={14} />找路径</button>
            <button className={mode === 'compare' ? styles.activeMode : ''} aria-pressed={mode === 'compare'} onClick={() => switchMode('compare')}><GitCompareArrows size={14} />对比</button>
          </div>
          <label className={styles.labelToggle}><input type="checkbox" checked={showLabels} onChange={event => setShowLabels(event.target.checked)} />关系名称</label>
        </div>
        {(mode !== 'inspect' || depth > 0) && <div className={styles.explorationBar}>
          <span>{mode === 'inspect' ? `以“${primary?.name ?? '选中实体'}”为中心 · ${depth} 层` : mode === 'path' ? '选择两个实体，查看最短关联路径' : '选择两个实体，对比来源与关联'}</span>
          <button className={styles.textButton} onClick={() => { setDepth(0); switchMode('inspect'); }}>{mode === 'inspect' ? '显示全部' : '退出'}<X size={12} /></button>
        </div>}
        <div className={`${styles.canvas} ${isPanning ? styles.panning : ''}`}>
          {visibleEntities.length ? <svg ref={svgRef} className={styles.svg} viewBox="0 0 800 620" preserveAspectRatio="xMidYMid meet" role="group" aria-label="交互知识图谱，使用 Tab 键选择实体和关系，按 Enter 查看详情。画布可拖动。" tabIndex={0} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={stopPan} onPointerCancel={stopPan} onKeyDown={event => {
            if (event.target !== event.currentTarget) return;
            const movement: Record<string, Point> = { ArrowLeft: { x: 35, y: 0 }, ArrowRight: { x: -35, y: 0 }, ArrowUp: { x: 0, y: 35 }, ArrowDown: { x: 0, y: -35 } };
            if (movement[event.key]) { event.preventDefault(); const delta = movement[event.key]; setPan(current => ({ x: current.x + delta.x, y: current.y + delta.y })); }
            if (event.key === 'Escape') resetCanvas();
          }}>
            <defs><marker id={`graph-arrow-${knowledgeBase.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9" fill="none" stroke="#9CA5B1" strokeWidth="1.5" /></marker><marker id={`graph-arrow-selected-${knowledgeBase.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9" fill="none" stroke="#B4232D" strokeWidth="1.5" /></marker></defs>
            <g transform={`translate(${400 + pan.x} ${310 + pan.y}) scale(${scale}) translate(-400 -310)`}>
              {visibleRelations.map(relation => {
                const source = positions.get(relation.sourceEntityId)!;
                const target = positions.get(relation.targetEntityId)!;
                const length = Math.hypot(target.x - source.x, target.y - source.y) || 1;
                const offsetX = (target.x - source.x) / length * 31;
                const offsetY = (target.y - source.y) / length * 31;
                const selected = selectedRelationId === relation.id || Boolean(path?.relationIds.includes(relation.id));
                const from = filtered.entities.find(entity => entity.id === relation.sourceEntityId)!;
                const to = filtered.entities.find(entity => entity.id === relation.targetEntityId)!;
                const select = () => { if (mutationPending) return; setSelectedRelationId(relation.id); setMode('inspect'); setSelectedIds([]); setDepth(0); setReport(null); setShowDetails(true); };
                return <g key={relation.id} className={`${styles.edge} ${selected ? styles.selectedEdge : ''} ${path && !path.relationIds.includes(relation.id) ? styles.dimmed : ''}`} data-interactive="true" role="button" tabIndex={0} aria-label={`${from.name}，${relation.relationType}，${to.name}，${relation.confirmed ? '已确认' : '待核验'}，查看关系证据`} aria-pressed={selectedRelationId === relation.id} onClick={select} onKeyDown={event => activateOnKeyboard(event, select)}>
                  <title>{from.name} {relation.relationType} {to.name}</title>
                  <line className={styles.edgeHit} x1={source.x + offsetX} y1={source.y + offsetY} x2={target.x - offsetX} y2={target.y - offsetY} />
                  <line className={styles.edgeLine} x1={source.x + offsetX} y1={source.y + offsetY} x2={target.x - offsetX} y2={target.y - offsetY} strokeDasharray={relation.confirmed ? undefined : '5 5'} markerEnd={isSymmetricGraphRelation(relation) ? undefined : `url(#graph-arrow-${selected ? 'selected-' : ''}${knowledgeBase.id})`} />
                  {showLabels && <g transform={`translate(${(source.x + target.x) / 2} ${(source.y + target.y) / 2})`}><rect className={styles.edgeLabelBg} x={-Math.max(30, relation.relationType.length * 6 + 9)} y="-11" width={Math.max(60, relation.relationType.length * 12 + 18)} height="22" rx="4" /><text className={styles.edgeLabel} textAnchor="middle" dominantBaseline="central">{relation.relationType}</text></g>}
                </g>;
              })}
              {visibleEntities.map(entity => {
                const point = positions.get(entity.id)!;
                const selected = selection.some(item => item.id === entity.id);
                const onPath = path?.entityIds.includes(entity.id);
                return <g key={entity.id} transform={`translate(${point.x} ${point.y})`} className={`${styles.node} ${selected ? styles.selectedNode : ''} ${path && !onPath ? styles.dimmed : ''}`} data-interactive="true" role="button" tabIndex={0} aria-label={`${entity.name}，${entity.type}，${entity.evidenceIds.length} 条来源，${selected ? '已选择' : '选择实体'}`} aria-pressed={selected} onClick={event => selectEntity(entity.id, event.shiftKey || event.ctrlKey || event.metaKey)} onKeyDown={event => activateOnKeyboard(event, () => selectEntity(entity.id, event.shiftKey))}>
                  <title>{entity.name} · {entity.type}</title>
                  <circle className={styles.nodeHalo} r="34" fill={colorFor(entity)} />
                  <circle className={styles.nodeCircle} r="25" fill="white" stroke={colorFor(entity)} strokeWidth={selected || onPath ? 2.5 : 1.5} />
                  <circle r="5" fill={colorFor(entity)} />
                  <path d="M -14 -9 L -5 -3 M 5 3 L 14 9 M 6 -4 L 12 -13" fill="none" stroke={colorFor(entity)} strokeWidth="1.4" />
                  <circle cx="-14" cy="-9" r="3" fill={colorFor(entity)} /><circle cx="14" cy="9" r="3" fill={colorFor(entity)} /><circle cx="12" cy="-13" r="3" fill={colorFor(entity)} />
                  {selected && selection.length > 1 && <g transform="translate(22 -22)"><circle r="9" fill="#B4232D" /><text fill="white" textAnchor="middle" dominantBaseline="central" fontSize="10">{selection.findIndex(item => item.id === entity.id) + 1}</text></g>}
                  <rect className={styles.nodeLabelBg} x={-Math.min(entity.name.length, 15) * 6 - 7} y="34" width={Math.min(entity.name.length, 15) * 12 + 14} height="25" rx="4" />
                  <text className={styles.nodeLabel} y="51" textAnchor="middle">{entity.name.length > 15 ? `${entity.name.slice(0, 14)}…` : entity.name}</text>
                  <text className={styles.nodeType} y="72" textAnchor="middle">{entity.type}</text>
                </g>;
              })}
            </g>
          </svg> : <div className={styles.emptyCanvas}><Network size={36} strokeWidth={1.3} /><h3>{scoped.entities.length ? '没有符合筛选条件的实体' : '还没有可用的知识图谱'}</h3><p>{scoped.entities.length ? '调整实体类型、来源或日期，继续探索。' : readyDocuments.length ? '文档完成图谱抽取后，带有来源的实体与关系会显示在这里。' : '先在文档中导入资料并完成解析。'}</p>{scoped.entities.length > 0 && <button className={styles.secondaryButton} onClick={resetFilters}><RotateCcw size={14} />清除筛选</button>}</div>}
          <div className={styles.canvasLegend}><span><i className={styles.solidLine} />已确认</span><span><i className={styles.dashedLine} />待核验</span></div>
          <div className={styles.zoomControls} role="group" aria-label="图谱画布控制"><button aria-label="缩小图谱" disabled={scale <= 0.5} onClick={() => setScale(value => Math.max(0.5, value - 0.15))}><Minus size={15} /></button><span aria-label={`缩放 ${Math.round(scale * 100)}%`}>{Math.round(scale * 100)}%</span><button aria-label="放大图谱" disabled={scale >= 2} onClick={() => setScale(value => Math.min(2, value + 0.15))}><Plus size={15} /></button><button aria-label="重置图谱视图" onClick={resetCanvas}><Maximize2 size={15} /></button></div>
        </div>
        <div className={styles.canvasFooter}><span>{visibleEntities.length} 个实体 · {visibleRelations.length} 条关系</span><span>拖动画布平移 · Shift 点击多选</span></div>
      </div>

      {showDetails && <aside id="knowledge-graph-details" className={styles.details} aria-label="图谱详情">
        <div className={styles.panelHeading}><h3>{report ? '内容预览' : selectedRelation ? '关系详情' : mode === 'compare' ? '实体对比' : mode === 'path' ? '关联路径' : '实体详情'}</h3><button className={styles.iconButton} onClick={() => setShowDetails(false)} aria-label="收起详情"><PanelRightClose size={16} /></button></div>
        {report ? <div className={styles.report}>
          <label className={styles.field}>标题<input value={report.title} disabled={mutationPending} onChange={event => setReport({ ...report, title: event.target.value })} /></label>
          <label className={styles.field}>内容<textarea rows={17} value={report.body} disabled={mutationPending} onChange={event => setReport({ ...report, body: event.target.value })} /></label>
          <p className={styles.fieldCaption}>附带 {report.evidence.length} 条可追溯来源。保存后可在知识条目中继续编辑。</p>
          {actionError && <p className={styles.validation} role="alert">{actionError} 草稿仍保留，可重试保存。</p>}
          <div className={styles.reportActions}><button className={styles.secondaryButton} disabled={mutationPending} onClick={() => setReport(null)}>返回详情</button><button className={styles.primaryButton} disabled={!knowledgeBase.canEdit || mutationPending || !report.title.trim() || !report.body.trim()} onClick={saveReport}><Check size={14} />{mutationPending ? '保存中…' : '保存条目'}</button></div>
          {!knowledgeBase.canEdit && <p className={styles.fieldCaption}>当前为只读权限，可查看报告内容。</p>}
        </div> : selectedRelation ? <>
          <div className={styles.relationSummary}><span className={styles.detailEyebrow}>关系 · {selectedRelation.confirmed ? '已确认' : '待核验'}</span><button onClick={() => selectEntity(selectedRelation.sourceEntityId)}>{filtered.entities.find(entity => entity.id === selectedRelation.sourceEntityId)?.name}</button><div className={styles.relationPill}>{isSymmetricGraphRelation(selectedRelation) ? <Minus size={14} /> : <ArrowDownLeft size={14} />}{selectedRelation.relationType}</div><button onClick={() => selectEntity(selectedRelation.targetEntityId)}>{filtered.entities.find(entity => entity.id === selectedRelation.targetEntityId)?.name}</button><p className={styles.relationCaution}>{isSymmetricGraphRelation(selectedRelation) ? '此关系表示概念在来源中共同出现，不构成因果或作用机制证据。共现关系按双向连接计算。' : '按来源中的关系描述展示；关联方向本身不构成因果证据。'}</p></div>
          <dl className={styles.metadata}><div><dt>抽取方式</dt><dd>{selectedRelation.extractionMethod}</dd></div><div><dt>抽取时间</dt><dd>{selectedRelation.extractedAt.slice(0, 10)}</dd></div><div><dt>来源覆盖</dt><dd>{documentIds.length} 篇文档 · {evidence.length} 条证据</dd></div></dl>
          <div className={styles.actionGrid}><button disabled={!knowledgeBase.qaEnabled} onClick={ask}><CircleHelp size={14} />询问关系</button><button disabled={!knowledgeBase.canEdit || mutationPending} onClick={createTask}><ListPlus size={14} />生成任务</button></div>
          <div className={styles.sectionHeading}><h4>关系来源</h4><span>{evidence.length}</span></div><EvidenceList key={selectedRelation.id} evidence={evidence} onEvidence={onEvidence} />
          <button className={styles.saveEntryButton} disabled={!knowledgeBase.canEdit || !evidence.length} onClick={() => prepareReport('知识条目')}><BookOpen size={14} />沉淀为知识条目</button>
        </> : mode !== 'inspect' ? <>
          <div className={styles.selectionSlots}>{[0, 1].map(index => <div key={index} className={styles.selectionSlot}><span>{mode === 'path' ? index === 0 ? '起点' : '终点' : `实体 ${index + 1}`}</span><strong>{selection[index]?.name ?? '在图中选择实体'}</strong>{selection[index] && <button className={styles.iconButton} aria-label={`移除已选实体 ${selection[index].name}`} onClick={() => setSelectedIds(current => current.filter(id => id !== selection[index].id))}><X size={13} /></button>}</div>)}</div>
          {mode === 'path' && <label className={styles.field}>沿关系方向<select value={direction} onChange={event => setDirection(event.target.value as GraphDirection)}><option value="both">不限方向</option><option value="outgoing">起点 → 终点</option><option value="incoming">终点 → 起点</option></select><span className={styles.fieldCaption}>共现关系不具有方向，按双向连接计算。</span></label>}
          {selection.length < 2 ? <div className={styles.detailHint}><GitFork size={25} /><p>继续选择一个实体，{mode === 'path' ? '查看两者之间的实际连接。' : '查看共同来源与关联差异。'}</p></div> : mode === 'path' ? <div className={styles.pathResult}>
            {path ? <><div className={styles.sectionHeading}><h4>最短关联路径</h4><span>{path.relationIds.length} 跳</span></div><ol className={styles.pathList}>{path.entityIds.map((id, index) => <li key={id}><button onClick={() => { setMode('inspect'); setSelectedIds([id]); setSelectedRelationId(null); }}><span className={styles.pathDot} />{filtered.entities.find(entity => entity.id === id)?.name}</button>{index < path.relationIds.length && <button className={styles.pathRelation} onClick={() => { setSelectedRelationId(path.relationIds[index]); setMode('inspect'); setSelectedIds([]); }}>{filtered.relations.find(relation => relation.id === path.relationIds[index])?.relationType}<ChevronRight size={12} /></button>}</li>)}</ol><p className={styles.fieldCaption}>路径只表示图谱连通性。沿途每条关系均可打开查看来源。</p><button className={styles.secondaryButton} onClick={() => prepareReport('图谱报告')}><FileText size={14} />整理路径报告</button></> : <div className={styles.detailHint}><Route size={26} /><h4>当前条件下没有连通路径</h4><p>可调整关系方向或清除筛选后重试。</p><button className={styles.textButton} onClick={resetFilters}>清除筛选</button></div>}
          </div> : <div className={styles.comparison}>
            <table><caption>实体基本信息对比</caption><thead><tr><th scope="col">维度</th>{selection.map(entity => <th scope="col" key={entity.id}>{entity.name}</th>)}</tr></thead><tbody><tr><th scope="row">类型</th>{selection.map(entity => <td key={entity.id}>{entity.type}</td>)}</tr><tr><th scope="row">来源</th>{selection.map(entity => <td key={entity.id}>{new Set(uniqueEvidence(entity.evidenceIds, filtered.evidence).map(item => item.documentId)).size} 篇</td>)}</tr><tr><th scope="row">关联</th>{selection.map(entity => <td key={entity.id}>{graphNeighborhood(entity.id, filtered.relations, 1).size - 1} 个实体</td>)}</tr><tr><th scope="row">状态</th>{selection.map(entity => <td key={entity.id}>{entity.confirmed ? '已确认' : '待核验'}</td>)}</tr></tbody></table>
            <div className={styles.sectionHeading}><h4>共同关联</h4><span>{commonNeighbors.length}</span></div><div className={styles.tagList}>{commonNeighbors.length ? commonNeighbors.map(entity => <button key={entity.id} onClick={() => { setMode('inspect'); setSelectedIds([entity.id]); }}>{entity.name}</button>) : <p className={styles.fieldCaption}>当前图谱未发现共同关联实体。</p>}</div>
            <div className={styles.sectionHeading}><h4>共同来源</h4><span>{sharedDocuments.length}</span></div>{sharedDocuments.length ? sharedDocuments.map(id => <button key={id} className={styles.sharedSource} onClick={() => { const item = evidence.find(value => value.documentId === id); if (item) onEvidence(item); }}><FileText size={13} />{documentMap.get(id)?.title}<ChevronRight size={12} /></button>) : <p className={styles.fieldCaption}>当前筛选下没有共同来源文档。</p>}
            <div className={styles.actionGrid}><button disabled={!knowledgeBase.qaEnabled} onClick={ask}><CircleHelp size={14} />询问差异</button><button onClick={() => prepareReport('图谱报告')}><FileText size={14} />对比报告</button></div>
          </div>}
        </> : primary ? <>
          <div className={styles.entitySummary}><span className={styles.detailEyebrow}><i className={styles.typeDot} style={{ background: colorFor(primary) }} />{primary.type}</span><h3>{primary.name}</h3><p>{primary.description || '查看关联关系与来源片段，了解此实体。'}</p><div className={styles.tagList}>{primary.tags.map(value => <button key={value} onClick={() => setTag(value)}>{value}</button>)}</div><span className={`${styles.status} ${primary.confirmed ? styles.confirmed : ''}`}>{primary.confirmed ? '已确认' : '抽取结果 · 待核验'}</span></div>
          <div className={styles.sectionHeading}><h4>展开关联</h4><button className={styles.textButton} onClick={() => { setDepth(0); setDirection('both'); }}>全部</button></div>
          <div className={styles.expandControls}><button aria-pressed={depth === 1} className={depth === 1 ? styles.selectedControl : ''} onClick={() => setDepth(1)}>1 层</button><button aria-pressed={depth === 2} className={depth === 2 ? styles.selectedControl : ''} onClick={() => setDepth(2)}>2 层</button><select aria-label="展开关联的方向" value={direction} onChange={event => { setDirection(event.target.value as GraphDirection); if (!depth) setDepth(1); }}>{Object.entries(directionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className={styles.actionGrid}><button disabled={!knowledgeBase.qaEnabled} onClick={ask}><CircleHelp size={14} />围绕实体提问</button><button disabled={!knowledgeBase.canEdit || mutationPending} onClick={createTask}><ListPlus size={14} />生成任务</button><button onClick={() => switchMode('path')}><Route size={14} />查找关联路径</button><button onClick={() => switchMode('compare')}><GitCompareArrows size={14} />加入对比</button></div>
          <div className={styles.sectionHeading}><h4>来源片段</h4><span>{evidence.length}</span></div><EvidenceList key={primary.id} evidence={evidence} onEvidence={onEvidence} />
          <button className={styles.saveEntryButton} disabled={!knowledgeBase.canEdit || !evidence.length} onClick={() => prepareReport('知识条目')}><BookOpen size={14} />沉淀为知识条目<ArrowUpRight size={13} /></button>
          {!knowledgeBase.qaEnabled && <p className={styles.fieldCaption}>此知识库尚未开启知识问答。</p>}
        </> : <div className={styles.detailHint}><Focus size={28} /><h4>选择实体或关系</h4><p>在图中点击，查看概念说明、关联方向与原文证据。</p><div className={styles.keyboardHint}><kbd>Tab</kbd><ArrowRight size={12} /><kbd>Enter</kbd><span>也可使用键盘探索</span></div></div>}
      </aside>}
    </div>
    <p className={styles.notice} role="status" aria-live="polite">{notice}</p>
  </section>;
}
