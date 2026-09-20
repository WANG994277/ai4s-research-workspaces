'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, FileText, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Modal } from '@/components/research/workspace-kit';
import { projects } from '@/mock/research';
import { formatDate, textToSections, type Evidence, type KnowledgeBase, type KnowledgeDocument, type KnowledgeEntry, type KnowledgeEntryDraft } from './model';
import styles from './entries.module.css';
import common from './reader.module.css';

export interface KnowledgeEntriesProps {
  knowledgeBase: KnowledgeBase;
  entries: KnowledgeEntry[];
  documents: KnowledgeDocument[];
  initialEntryId?: string;
  initialEvidence?: Evidence;
  onSave: (draft: KnowledgeEntryDraft) => void;
  onUpdate: (id: string, patch: Partial<KnowledgeEntry>) => void;
  onDelete: (id: string) => void;
  onEvidence: (evidence: Evidence) => void;
  onBack: () => void;
}

const entryTypes = ['文献摘录', '研究结论', '科研方法', '实验记录', '术语定义', '参数说明', '研究笔记'];

function emptyDraft(base: KnowledgeBase): KnowledgeEntryDraft {
  return { knowledgeBaseId: base.id, title: '', type: '研究笔记', body: '', summary: '', tags: [], domain: base.domain[0] ?? '', sourceLabel: '人工整理', documentIds: [], entityIds: [], relatedProjectId: '', evidence: [] };
}
function entryDraft(entry: KnowledgeEntry): KnowledgeEntryDraft {
  return { knowledgeBaseId: entry.knowledgeBaseId, title: entry.title, type: entry.type, body: entry.body, summary: entry.summary, tags: entry.tags, domain: entry.domain, sourceLabel: entry.sourceLabel, documentIds: entry.documentIds, entityIds: entry.entityIds, relatedProjectId: entry.relatedProjectId, evidence: entry.evidence };
}
function commaList(value: string) { return [...new Set(value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean))]; }

function evidencePageLabel(evidence: Evidence, documents: KnowledgeDocument[]) {
  if (evidence.pageKind) return evidence.pageKind === 'logical' ? '逻辑页' : '原文页';
  const document = documents.find(item => item.id === evidence.documentId);
  if (!document) return '页码';
  const originalVersion = evidence.version === document.version ? document : document.versions.find(item => item.version === evidence.version);
  const pageKind = originalVersion?.pageKind ?? (['TXT', 'MD', 'MARKDOWN', 'CSV', 'URL'].includes(document.fileType.toUpperCase()) ? 'logical' : 'original');
  return pageKind === 'logical' ? '逻辑页' : '原文页';
}

type EntryVersion = Pick<KnowledgeEntry, 'version' | 'title' | 'body' | 'updatedAt'>;

function entryVersionView(entry: KnowledgeEntry, version: string): EntryVersion | undefined {
  return version === entry.version ? { version, title: entry.title, body: entry.body, updatedAt: entry.updatedAt }
    : entry.history?.find(item => item.version === version);
}

function entryCitationSection(entry: KnowledgeEntry, snapshot: EntryVersion | undefined, evidence?: Evidence) {
  if (!snapshot || !evidence || evidence.knowledgeBaseId !== entry.knowledgeBaseId
    || evidence.documentId !== `entry:${entry.id}` || evidence.version !== snapshot.version || !evidence.quote.trim()) return undefined;
  return textToSections(snapshot.body).find(section => section.id === evidence.sectionId && section.page === evidence.page
    && section.paragraph === evidence.paragraph && section.text.includes(evidence.quote));
}

export function KnowledgeEntries({ knowledgeBase, entries, documents, initialEntryId, initialEvidence, onSave, onUpdate, onDelete, onEvidence, onBack }: KnowledgeEntriesProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('全部类型');
  const [tag, setTag] = useState('全部标签');
  const requestedEntryId = initialEntryId ?? (initialEvidence?.documentId.startsWith('entry:') ? initialEvidence.documentId.slice(6) : undefined);
  const [selectedId, setSelectedId] = useState<string | null>(requestedEntryId ?? null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(initialEvidence?.version ?? null);
  const [activeEvidence, setActiveEvidence] = useState<Evidence | undefined>(initialEvidence);
  const citationRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<KnowledgeEntryDraft>(() => emptyDraft(knowledgeBase));
  const [tagText, setTagText] = useState('');
  const [entityText, setEntityText] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const scopedEntries = entries.filter(entry => entry.knowledgeBaseId === knowledgeBase.id);
  const scopedDocuments = documents.filter(document => document.knowledgeBaseId === knowledgeBase.id);
  const types = [...new Set([...entryTypes, ...scopedEntries.map(entry => entry.type)])];
  const tags = [...new Set(scopedEntries.flatMap(entry => entry.tags))];
  const filtered = useMemo(() => entries.filter(entry => entry.knowledgeBaseId === knowledgeBase.id && (type === '全部类型' || entry.type === type) && (tag === '全部标签' || entry.tags.includes(tag)) && `${entry.title}\n${entry.body}\n${entry.summary}\n${entry.tags.join(' ')}\n${entry.sourceLabel}\n${entry.domain}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [entries, knowledgeBase.id, type, tag, query]);
  const selected = selectedId !== null ? scopedEntries.find(entry => entry.id === selectedId) : filtered[0];
  const displayedVersion = selectedVersion ?? selected?.version ?? '';
  const snapshot = selected ? entryVersionView(selected, displayedVersion) : undefined;
  const historical = Boolean(selected && displayedVersion !== selected.version);
  const versions = selected ? [...(selected.history ?? []).filter(item => item.version !== selected.version).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)), { version: selected.version, title: selected.title, body: selected.body, updatedAt: selected.updatedAt }] : [];
  const bodySections = snapshot ? textToSections(snapshot.body) : [];
  const citedSection = selected ? entryCitationSection(selected, snapshot, activeEvidence) : undefined;
  const editing = scopedEntries.find(entry => entry.id === editingId);
  const sourceDocumentIds = new Set(draft.evidence.map(evidence => evidence.documentId));

  useEffect(() => {
    setSelectedId(requestedEntryId ?? null); setSelectedVersion(initialEvidence?.version ?? null); setActiveEvidence(initialEvidence);
    setQuery(''); setType('全部类型'); setTag('全部标签');
  }, [requestedEntryId, initialEvidence, knowledgeBase.id]);

  useEffect(() => {
    if (citedSection?.id) citationRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }, [selected?.id, displayedVersion, citedSection?.id, activeEvidence?.quote]);

  function selectEntry(id: string | null) {
    setSelectedId(id); setSelectedVersion(null); setActiveEvidence(undefined);
  }
  function selectVersion(version: string) {
    setSelectedVersion(version === selected?.version ? null : version); setActiveEvidence(undefined);
  }

  function startCreate() {
    setDraft(emptyDraft(knowledgeBase)); setTagText(''); setEntityText(''); setEditingId(null); setError(''); setFeedback(''); setModal('create');
  }
  function startEdit(entry: KnowledgeEntry) {
    if (!knowledgeBase.canEdit || historical || !snapshot) return;
    setDraft(entryDraft(entry)); setTagText(entry.tags.join('，')); setEntityText(entry.entityIds.join('，')); setEditingId(entry.id); setError(''); setFeedback(''); setModal('edit');
  }
  function saveDraft() {
    if (!knowledgeBase.canEdit) { setError('当前没有修改权限。草稿已保留。'); return; }
    if (modal === 'edit' && (historical || !snapshot)) { setError('历史版本只读，请返回当前条目后编辑。草稿已保留。'); return; }
    setError(''); setFeedback('');
    if (!draft.title.trim() || !draft.body.trim()) { setError('请填写条目标题和正文。'); return; }
    if (!draft.type.trim()) { setError('请选择知识类型。'); return; }
    const nextTags = commaList(tagText);
    if (nextTags.length > 15 || nextTags.some(item => item.length > 30)) { setError('最多添加 15 个标签，每个标签不超过 30 个字。'); return; }
    const value: KnowledgeEntryDraft = { ...draft, title: draft.title.trim(), body: draft.body.trim(), summary: draft.summary.trim(), sourceLabel: draft.sourceLabel.trim() || '人工整理', domain: draft.domain.trim(), tags: nextTags, entityIds: commaList(entityText), documentIds: [...new Set([...draft.documentIds, ...sourceDocumentIds])] };
    try {
      if (modal === 'edit' && editingId) {
        onUpdate(editingId, value); selectEntry(editingId); setFeedback('知识条目已更新，原始引用已保留。');
      } else { onSave(value); setQuery(''); setType('全部类型'); setTag('全部标签'); selectEntry(null); setFeedback('知识条目已创建。'); }
      setModal(null);
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : '保存失败，请重试。'} 草稿已保留。`);
    }
  }
  function deleteEntry() {
    if (!knowledgeBase.canEdit || !editingId) { setError('当前没有删除权限，或条目已不存在。'); return; }
    if (historical || !snapshot) { setError('历史版本只读，请返回当前条目后操作。'); return; }
    setError(''); setFeedback('');
    try {
      onDelete(editingId); if (selectedId === editingId) selectEntry(null); setModal(null); setFeedback('知识条目已删除。来源文献仍保留在知识库中。');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除未完成，请重试。');
    }
  }

  if (!knowledgeBase.canRead) return <div className={common.empty}><BookOpen size={32} /><h3>暂无阅读权限</h3><p>请联系知识库管理员申请权限。</p><div className={common.actions}><button className={common.button} onClick={onBack}>返回知识库</button></div></div>;

  return <section className={styles.page}>
    <header className={styles.header}><div><button className={styles.back} onClick={onBack}><ArrowLeft size={13} /> {knowledgeBase.name}</button><h1>知识条目</h1><p>将研究结论、方法与笔记沉淀为可复用知识，并保留来源依据。</p></div><button className={common.primary} disabled={!knowledgeBase.canEdit} onClick={startCreate}><Plus size={14} /> 新建知识条目</button></header>
    {!knowledgeBase.canEdit && <p className={common.notice}>当前为只读权限，可以查看条目及其文献依据。</p>}
    {feedback && <div className={common.status} role="status"><div className={common.actions}><span>{feedback}</span><button aria-label="关闭提示" onClick={() => setFeedback('')}><X size={12} /></button></div></div>}
    <div className={styles.toolbar}><label className={styles.search}><Search size={15} /><input aria-label="搜索知识条目" placeholder="搜索标题、正文、标签与来源" value={query} onChange={event => setQuery(event.target.value)} /></label><select className={common.select} aria-label="按知识类型筛选" value={type} onChange={event => setType(event.target.value)}><option>全部类型</option>{types.map(value => <option key={value}>{value}</option>)}</select><select className={common.select} aria-label="按标签筛选" value={tag} onChange={event => setTag(event.target.value)}><option>全部标签</option>{tags.map(value => <option key={value}>{value}</option>)}</select><span className={styles.count}>{filtered.length} / {scopedEntries.length} 个条目</span></div>
    <div className={styles.layout}>
      <div className={styles.listing}>{filtered.length ? filtered.map(entry => <button key={entry.id} className={`${styles.row} ${selected?.id === entry.id ? styles.rowSelected : ''}`} onClick={() => selectEntry(entry.id)} aria-pressed={selected?.id === entry.id}><div className={styles.rowTop}><h2>{entry.title}</h2><span className={`${common.tag} ${common.redTag}`}>{entry.type}</span></div><p className={styles.rowSummary}>{entry.summary || entry.body}</p><div className={`${common.actions} mb-3`}>{entry.tags.map(value => <span className={common.tag} key={value}>{value}</span>)}</div><div className={styles.rowMeta}><span><FileText size={11} />{entry.evidence.length} 条依据</span><span>{entry.version}</span><span><CalendarDays size={11} />{formatDate(entry.updatedAt)}</span><span>{entry.createdBy}</span></div></button>) : <div className={common.empty}><BookOpen size={32} /><h3>{scopedEntries.length ? '未找到匹配条目' : '还没有知识条目'}</h3><p>{scopedEntries.length ? '调整搜索词、知识类型或标签后重试。' : '在阅读文献时保存一段摘录，或创建你的研究笔记。'}</p><div className={common.actions}>{scopedEntries.length > 0 && <button className={common.button} onClick={() => { setQuery(''); setType('全部类型'); setTag('全部标签'); }}>清除筛选</button>}<button className={common.primary} disabled={!knowledgeBase.canEdit} onClick={startCreate}>新建知识条目</button></div></div>}</div>
      <aside className={styles.detail} aria-label="知识条目详情">{selected ? <>
        <div className={styles.detailHeader}><h2>条目详情</h2><div className={common.actions}>
          <button className={common.iconButton} title={historical ? '历史版本只读' : '编辑条目'} aria-label="编辑条目" disabled={!knowledgeBase.canEdit || historical || !snapshot} onClick={() => startEdit(selected)}><Pencil size={13} /></button>
          <button className={common.iconButton} title={historical ? '历史版本只读' : '删除条目'} aria-label="删除条目" disabled={!knowledgeBase.canEdit || historical || !snapshot} onClick={() => { setEditingId(selected.id); setError(''); setFeedback(''); setModal('delete'); }}><Trash2 size={13} /></button>
        </div></div>
        <label className={`${common.field} mb-4`}>阅读版本<select className={common.select} value={displayedVersion} onChange={event => selectVersion(event.target.value)}>
          {!snapshot && <option value={displayedVersion}>{displayedVersion}（不可用）</option>}
          {versions.map(item => <option key={item.version} value={item.version}>{item.version}{item.version === selected.version ? ' · 当前版本' : ` · ${formatDate(item.updatedAt)}`}</option>)}
        </select></label>
        {historical && <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">正在阅读 {displayedVersion}，历史版本只读。<button className={`${common.textButton} ml-2`} onClick={() => selectVersion(selected.version)}>返回当前条目 {selected.version}</button></div>}
        {!snapshot ? <p className={common.error} role="alert">未找到此条目的 {displayedVersion} 原始正文。未替换为当前版本。</p> : <>
          <h3 className={styles.detailTitle}>{snapshot.title}</h3><div className={common.actions}><span className={`${common.tag} ${common.redTag}`}>{selected.type}</span><span className={common.tag}>{snapshot.version}</span>{selected.domain && <span className={common.tag}>{selected.domain}</span>}<span className={common.tag}>未核验</span></div>
          {activeEvidence && !citedSection && <p className={`${common.error} mt-3`} role="alert">该引用的版本、段落或原文无法精确匹配。以下仅显示已保存的所选版本正文。</p>}
          {!historical && selected.summary && <div className={styles.detailBlock}><h4 className={styles.detailLabel}>摘要</h4><p className={styles.detailBody}>{selected.summary}</p></div>}
          <div className={styles.detailBlock}><h4 className={styles.detailLabel}>知识正文 · {snapshot.version}</h4>
            {bodySections.map(section => {
              const cited = citedSection?.id === section.id;
              const quote = cited ? activeEvidence?.quote : undefined;
              const start = quote ? section.text.indexOf(quote) : -1;
              return <div key={`${snapshot.version}:${section.id}`} ref={cited ? citationRef : undefined} className={`mb-3 scroll-mt-24 rounded border p-3 ${cited ? 'border-primary/30 bg-secondary/35' : 'border-slate-200 bg-white'}`} aria-label={`${section.title}，逻辑页 ${section.page}，段 ${section.paragraph}`}>
                <p className={`${styles.detailBody} mb-2`}>{start >= 0 && quote ? <>{section.text.slice(0, start)}<mark className="rounded bg-amber-200 px-0.5 text-inherit">{quote}</mark>{section.text.slice(start + quote.length)}</> : section.text}</p>
                <span className={common.muted}>逻辑页 {section.page} · 段 {section.paragraph}{cited ? ' · 引用已定位' : ''}</span>
              </div>;
            })}
            {!bodySections.length && <p className={common.muted}>此版本暂无正文。</p>}
          </div>
          <div className={styles.detailBlock}><h4 className={styles.detailLabel}>条目自身来源</h4><p className={styles.detailBody}>知识条目 {selected.id} · {snapshot.version}<br />人工整理，内容未核验。问答可引用此版本的正文与逻辑页。</p></div>
          <div className={styles.detailBlock}><h4 className={styles.detailLabel}>关联来源依据（独立保留）</h4>{selected.evidence.length ? selected.evidence.map((item, index) => <button key={`${item.id}:${index}`} className={styles.source} onClick={() => onEvidence(item)}><strong>{item.documentTitle}</strong><p>{item.version} · {item.section}<br />{evidencePageLabel(item, scopedDocuments)} {item.page} / 段 {item.paragraph}</p><blockquote>“{item.quote.slice(0, 160)}{item.quote.length > 160 ? '…' : ''}”</blockquote><p className={common.textButton}>查看原文依据</p></button>) : <p className={common.muted}>尚未关联外部原文。此条目自身正文可作为待核验来源，不代表已核实的研究结论。</p>}</div>
          <dl className={styles.definition}><dt>来源说明</dt><dd>{selected.sourceLabel || '人工整理'}</dd><dt>关联文献</dt><dd>{selected.documentIds.map(id => scopedDocuments.find(document => document.id === id)?.title ?? `文献 ${id}（不可用）`).join('、') || '未关联'}</dd><dt>关联实体</dt><dd>{selected.entityIds.join('、') || '未关联'}</dd><dt>关联课题</dt><dd>{projects.find(project => project.id === selected.relatedProjectId)?.name ?? (selected.relatedProjectId || '未关联')}</dd><dt>创建人</dt><dd>{selected.createdBy}</dd><dt>创建日期</dt><dd>{formatDate(selected.createdAt)}</dd><dt>版本日期</dt><dd>{formatDate(snapshot.updatedAt)}</dd><dt>条目版本</dt><dd>{snapshot.version}{historical ? ' · 历史只读' : ' · 当前版本'}</dd></dl>
        </>}
      </> : <div className={common.empty}>{selectedId !== null ? <><p role="alert">引用的知识条目不存在，或当前无访问权限。未选择其他条目替代。</p><button className={common.textButton} onClick={() => selectEntry(null)}>返回条目列表</button></> : '选择一个知识条目以查看内容与原文依据。'}</div>}</aside>
    </div>
    <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'edit' ? '编辑知识条目' : '新建知识条目'} description={modal === 'edit' ? `当前版本 ${editing?.version ?? ''}。修改内容后保留原始文献引用。` : '记录可复用的研究知识；原文依据可通过文献阅读器保存。'}>
      <form className={common.form} onSubmit={event => { event.preventDefault(); saveDraft(); }}>
        <label className={common.field}>条目标题<input autoFocus className={common.input} value={draft.title} maxLength={150} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="例如：Cu/ZnO 催化剂的结构与活性关系" /></label>
        <div className={common.formGrid}><label className={common.field}>知识类型<select className={common.select} value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })}>{types.map(value => <option key={value}>{value}</option>)}</select></label><label className={common.field}>专业领域<input className={common.input} value={draft.domain} onChange={event => setDraft({ ...draft, domain: event.target.value })} maxLength={80} /></label></div>
        <label className={common.field}>摘要<textarea className={common.textarea} rows={2} value={draft.summary} maxLength={500} onChange={event => setDraft({ ...draft, summary: event.target.value })} placeholder="用几句话概括条目的用途和适用范围" /></label>
        <label className={common.field}>正文<textarea className={common.textarea} rows={7} value={draft.body} onChange={event => setDraft({ ...draft, body: event.target.value })} placeholder="写下研究结论、方法说明或笔记…" /></label>
        <div className={common.formGrid}><label className={common.field}>标签（逗号分隔）<input className={common.input} value={tagText} onChange={event => setTagText(event.target.value)} /></label><label className={common.field}>来源说明<input className={common.input} value={draft.sourceLabel} onChange={event => setDraft({ ...draft, sourceLabel: event.target.value })} maxLength={200} /></label></div>
        <div className={common.field}><span>关联文献</span><div className={styles.documentChoices}>{scopedDocuments.length ? scopedDocuments.map(document => <label className={styles.documentChoice} key={document.id}><input type="checkbox" checked={draft.documentIds.includes(document.id) || sourceDocumentIds.has(document.id)} disabled={sourceDocumentIds.has(document.id)} onChange={event => setDraft({ ...draft, documentIds: event.target.checked ? [...draft.documentIds, document.id] : draft.documentIds.filter(id => id !== document.id) })} /><span>{document.title}{sourceDocumentIds.has(document.id) && '（引用来源）'}</span></label>) : <span className={common.muted}>当前知识库暂无文献</span>}</div></div>
        <label className={common.field}>关联实体标识（逗号分隔）<input className={common.input} value={entityText} onChange={event => setEntityText(event.target.value)} placeholder="可保留从文献继承的实体标识" /></label>
        <label className={common.field}>关联课题<select className={common.select} value={draft.relatedProjectId} onChange={event => setDraft({ ...draft, relatedProjectId: event.target.value })}><option value="">暂不关联</option>{draft.relatedProjectId && !projects.some(project => project.id === draft.relatedProjectId) && <option value={draft.relatedProjectId}>{draft.relatedProjectId}</option>}{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        {draft.evidence.length > 0 && <p className={common.notice}>已保留 {draft.evidence.length} 条原文引用及其文献版本；编辑知识正文不会修改引用原文。</p>}
        {error && <p className={common.error} role="alert">{error}</p>}
        <div className={common.formActions}><button type="button" className={common.button} onClick={() => setModal(null)}>取消</button><button className={common.primary} type="submit" disabled={!knowledgeBase.canEdit}>保存条目</button></div>
      </form>
    </Modal>
    <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="删除知识条目" description={`将删除“${editing?.title ?? ''}”。来源文献及其他条目不受影响。`}>{error && <p className={common.error} role="alert">{error}</p>}<div className={common.formActions}><button className={common.button} onClick={() => setModal(null)}>取消</button><button className={common.primary} disabled={!knowledgeBase.canEdit} onClick={deleteEntry}>确认删除</button></div></Modal>
  </section>;
}
