'use client';

/* eslint-disable @next/next/no-img-element -- Uploaded originals are local Blob URLs and must not pass through the image optimizer. */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronRight, Copy, Download, FileText, GitBranch, Highlighter, List, MessageSquare, Plus, Search, Star, Tag, X } from 'lucide-react';
import { Modal } from '@/components/research/workspace-kit';
import { getFileBlob } from './files';
import { evidenceForSection, formatDate, graphStatusLabels, makeId, statusLabels, type DocumentNote, type DocumentSection, type Evidence, type KnowledgeBase, type KnowledgeDocument, type KnowledgeEntryDraft, type KnowledgeGraph } from './model';
import styles from './reader.module.css';

export interface KnowledgeDocumentReaderProps {
  knowledgeBase: KnowledgeBase;
  document: KnowledgeDocument;
  graph: KnowledgeGraph;
  notes: DocumentNote[];
  evidence?: Evidence;
  onBack: () => void;
  onAsk: (question: string, documentIds?: string[]) => void;
  onUpdateDocument: (id: string, patch: Partial<KnowledgeDocument>) => void;
  onAddNote: (note: DocumentNote) => void;
  onSaveEntry: (input: KnowledgeEntryDraft) => void;
  onCreateTask: (title: string, evidence: Evidence[]) => void | Promise<void>;
  onReplaceText: (documentId: string, text: string, changeNote: string) => void;
}

const analysisKinds = [
  ['摘要', /摘要|abstract|概述|研究背景/i],
  ['核心结论', /结论|conclusion|主要发现|核心发现/i],
  ['方法', /方法|method|制备|模拟|建模/i],
  ['实验条件', /条件|condition|实验设置|反应温度|实验设计/i],
  ['参数', /参数|parameter|压力|流量|k\s*点|温度|℃|MPa/i],
  ['结果', /结果|result|性能|转化率|选择性/i],
  ['局限', /局限|不足|limitation|不确定|尚未|待验证/i],
] as const;

function citationText(evidence: Evidence) {
  const pageLabel = evidence.pageKind === 'logical' ? '逻辑页' : '原文页';
  return `${evidence.documentTitle}，${evidence.version}，${evidence.section}，${pageLabel} ${evidence.page} / 段 ${evidence.paragraph}\n“${evidence.quote}”\n引用标识：${evidence.id}`;
}

function originalFormatPageKind(fileType: string): 'logical' | 'original' {
  return ['TXT', 'MD', 'MARKDOWN', 'CSV', 'URL'].includes(fileType.toUpperCase()) ? 'logical' : 'original';
}

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = globalThis.document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function highlightedText(text: string, quote?: string, search?: string): ReactNode {
  const target = quote && text.includes(quote) ? quote : search?.trim();
  if (!target) return text;
  const index = text.toLocaleLowerCase().indexOf(target.toLocaleLowerCase());
  if (index < 0) return text;
  return <>{text.slice(0, index)}<mark>{text.slice(index, index + target.length)}</mark>{text.slice(index + target.length)}</>;
}

export function KnowledgeDocumentReader({ knowledgeBase, document, graph, notes, evidence, onBack, onAsk, onUpdateDocument, onAddNote, onSaveEntry, onCreateTask, onReplaceText }: KnowledgeDocumentReaderProps) {
  const [version, setVersion] = useState(evidence?.version ?? document.version);
  const [sectionId, setSectionId] = useState(evidence?.sectionId ?? document.sections[0]?.id ?? '');
  const [activeQuote, setActiveQuote] = useState(evidence?.quote ?? '');
  const [view, setView] = useState<'text' | 'original'>('text');
  const [sideTab, setSideTab] = useState<'analysis' | 'notes'>('analysis');
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'tags' | 'note' | 'entry' | 'task' | 'replace' | 'compare' | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [fileState, setFileState] = useState<{ key: string; url?: string; mime?: string; error?: string }>({ key: '' });
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const versions = useMemo(() => [...document.versions.filter(item => item.version !== document.version).sort((left, right) => left.updatedAt.localeCompare(right.updatedAt)), { version: document.version, updatedAt: document.updatedAt, updatedBy: document.author, changeNote: '当前版本', sections: document.sections, fileId: document.fileId, pageKind: document.pageKind }], [document]);
  const versionRecord = versions.find(item => item.version === version);
  // Legacy history inherits the original file format, never the current text-index page kind.
  const pageKind = versionRecord?.pageKind ?? originalFormatPageKind(document.fileType);
  const pageLabel = pageKind === 'logical' ? '逻辑页' : '原文页';
  const sections = versionRecord?.sections ?? [];
  const selectedSection = sections.find(section => section.id === sectionId);
  const sourceEvidence = selectedSection ? { ...evidenceForSection(document, selectedSection, version), pageKind, quote: activeQuote && selectedSection.text.includes(activeQuote) ? activeQuote : selectedSection.text } : undefined;
  const historical = version !== document.version;
  const selectedFileId = versionRecord?.fileId;
  const fileKey = `${document.id}@${version}:${selectedFileId ?? ''}`;
  const selectedNotes = notes.filter(note => note.documentId === document.id && note.version === version);
  const graphEvidence = graph.evidence.filter(item => item.documentId === document.id && item.version === version);
  const graphEvidenceIds = new Set(graphEvidence.map(item => item.id));
  const graphEntities = graph.entities.filter(entity => entity.evidenceIds.some(id => graphEvidenceIds.has(id)));
  const analysis = analysisKinds.map(([title, matcher]) => {
    const section = sections.find(item => matcher.test(item.title)) ?? sections.find(item => matcher.test(item.text));
    const sentence = section?.text.split(/(?<=[。！？\n])/).find(part => matcher.test(part))?.trim();
    return { title, section, excerpt: section ? (sentence ?? section.text).slice(0, 220) : '' };
  });
  const keywords = document.tags.filter(tag => sections.some(section => section.text.toLocaleLowerCase().includes(tag.toLocaleLowerCase())));
  const matchCount = query.trim() ? sections.filter(section => `${section.title}\n${section.text}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).length : 0;

  useEffect(() => {
    if (evidence?.documentId === document.id) {
      setVersion(evidence.version); setSectionId(evidence.sectionId); setActiveQuote(evidence.quote);
    } else {
      setVersion(document.version); setSectionId(document.sections[0]?.id ?? ''); setActiveQuote('');
    }
    setView('text');
  }, [evidence, document.id, document.version, document.sections]);

  useEffect(() => {
    if (view !== 'text') return;
    const node = sectionRefs.current.get(`${version}:${sectionId}`);
    node?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }, [sectionId, version, view, activeQuote]);

  useEffect(() => {
    if (view !== 'original' || !selectedFileId || !knowledgeBase.canRead) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    setFileState({ key: '' });
    getFileBlob(selectedFileId).then((blob: Blob | undefined) => {
      if (cancelled) return;
      if (!blob) { setFileState({ key: fileKey, error: '此版本的原文件不在本机存储中。可以阅读已保存的正文，或重新导入文件。' }); return; }
      objectUrl = URL.createObjectURL(blob);
      setFileState({ key: fileKey, url: objectUrl, mime: blob.type });
    }).catch(() => { if (!cancelled) setFileState({ key: fileKey, error: '无法读取原文件，请重试或下载后查看。' }); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [view, selectedFileId, fileKey, knowledgeBase.canRead]);

  function chooseSection(section: DocumentSection, quote = '') {
    setSectionId(section.id); setActiveQuote(quote); setView('text');
  }
  function chooseVersion(nextVersion: string) {
    const next = versions.find(item => item.version === nextVersion);
    setVersion(nextVersion); setSectionId(next?.sections[0]?.id ?? ''); setActiveQuote(''); setView('text'); setQuery('');
  }
  function openModal(next: NonNullable<typeof modal>) {
    setActionError(''); setFeedback('');
    setError(''); setDraftTitle(next === 'entry' ? `${document.title} · ${selectedSection?.title ?? '知识摘录'}` : next === 'task' ? `研读与验证：${document.title}` : '');
    setDraftText(next === 'tags' ? document.tags.join('，') : next === 'replace' ? document.sections.map(section => section.text).join('\n\n') : next === 'entry' ? sourceEvidence?.quote ?? '' : '');
    setChangeNote(''); setModal(next);
  }
  async function copyCitation() {
    if (!sourceEvidence) return;
    try { await navigator.clipboard.writeText(citationText(sourceEvidence)); setFeedback('已复制引用，含版本和段落定位。'); }
    catch { setFeedback('浏览器未允许访问剪贴板，请使用“下载引用”。'); }
  }
  async function downloadOriginal() {
    if (!selectedFileId) { setFeedback('当前版本未保存原文件。'); return; }
    try {
      const blob = await getFileBlob(selectedFileId);
      if (!blob) { setFeedback('本机找不到当前版本的原文件，请重新导入。'); return; }
      const url = URL.createObjectURL(blob);
      const anchor = globalThis.document.createElement('a');
      anchor.href = url; anchor.download = document.fileName ?? `${document.title}.${document.fileType.toLowerCase()}`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setFeedback('原文件下载失败，请重试。'); }
  }
  function exportNotes() {
    const content = selectedNotes.map(note => {
      const originalSection = sections.find(section => section.id === note.sectionId);
      const citation = originalSection ? citationText({ ...evidenceForSection(document, originalSection, note.version), pageKind }) : `原始引用不可用：${document.id}@${note.version}:${note.sectionId}`;
      return `${note.text}\n\n${citation}\n批注日期：${note.createdAt}`;
    }).join('\n\n────────────\n\n');
    downloadText(`${document.title}-${version}-批注.txt`, content);
  }
  async function saveModal() {
    if (savingRef.current) return;
    if (!knowledgeBase.canEdit) { setError('当前没有修改权限。草稿已保留。'); return; }
    setError(''); setFeedback('');
    savingRef.current = true; setSaving(true);
    try {
    if (modal === 'tags') {
      const tags = [...new Set(draftText.split(/[,，\n]/).map(tag => tag.trim()).filter(Boolean))];
      if (tags.length > 15 || tags.some(tag => tag.length > 30)) { setError('最多添加 15 个标签，每个标签不超过 30 个字。'); return; }
      onUpdateDocument(document.id, { tags }); setFeedback('标签已更新。');
    } else if (modal === 'note') {
      if (!sourceEvidence || !draftText.trim()) { setError('请选择原文段落并填写批注。'); return; }
      onAddNote({ id: makeId('note'), documentId: document.id, knowledgeBaseId: knowledgeBase.id, version, sectionId: sourceEvidence.sectionId, text: draftText.trim(), createdAt: new Date().toISOString() });
      setSideTab('notes'); setFeedback('批注已保存，并固定到所选版本和段落。');
    } else if (modal === 'entry') {
      if (!sourceEvidence || !draftTitle.trim() || !draftText.trim()) { setError('请填写知识条目标题和正文，并选择原文依据。'); return; }
      onSaveEntry({ knowledgeBaseId: knowledgeBase.id, title: draftTitle.trim(), type: '文献摘录', body: draftText.trim(), summary: draftText.trim().slice(0, 180), tags: document.tags, domain: knowledgeBase.domain[0] ?? '', sourceLabel: `${document.title} / ${version}`, documentIds: [document.id], entityIds: graphEntities.map(entity => entity.id), relatedProjectId: document.relatedProjectId, evidence: [sourceEvidence] });
      setFeedback('已保存为知识条目，保留原始版本的引用。');
    } else if (modal === 'task') {
      if (!sourceEvidence || !draftTitle.trim()) { setError('请填写任务名称并选择原文依据。'); return; }
      await onCreateTask(draftTitle.trim(), [sourceEvidence]); setFeedback('研究任务已创建，已关联此处的原文依据。');
    } else if (modal === 'replace') {
      if (!draftText.trim() || !changeNote.trim()) { setError('请填写可检索正文与版本说明。'); return; }
      onReplaceText(document.id, draftText.trim(), changeNote.trim());
      setFeedback('正文已保存为新版本；历史引用仍指向原版本。');
    }
      setModal(null);
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : '保存失败，请重试。'} 草稿已保留。`);
    } finally {
      savingRef.current = false; setSaving(false);
    }
  }
  function updateDocument(patch: Partial<KnowledgeDocument>, success: string) {
    setActionError(''); setFeedback('');
    if (!knowledgeBase.canEdit) { setActionError('当前没有修改此文献的权限。'); return; }
    try {
      onUpdateDocument(document.id, patch);
      setFeedback(success);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : '操作未保存，请重试。');
    }
  }
  const versionIndex = versions.findIndex(item => item.version === version);
  const previousVersion = versions[versionIndex - 1];
  const evidenceVersion = evidence ? versions.find(item => item.version === evidence.version) : undefined;
  const validIncomingEvidence = !evidence || evidence.documentId !== document.id || evidenceVersion?.sections.some(section => section.id === evidence.sectionId && section.page === evidence.page && section.paragraph === evidence.paragraph && section.text.includes(evidence.quote));

  if (!knowledgeBase.canRead) return <div className={styles.empty}><BookOpen size={32} /><h3>暂无阅读权限</h3><p>请联系知识库管理员申请权限。</p><div className={styles.actions}><button className={styles.button} onClick={onBack}>返回知识库</button></div></div>;

  return <div className={styles.workspace}>
    <header className={styles.header}>
      <div className={styles.heading}>
        <div className={styles.breadcrumb}><button onClick={onBack} className={styles.actions}><ArrowLeft size={13} /> {knowledgeBase.name}</button><ChevronRight size={12} /><span>文献研读</span></div>
        <h1 className={styles.title}>{document.title}</h1>
        <div className={styles.metadata}><span className={styles.tag}>{document.documentType}</span><span>{document.author || '作者未提供'}</span><span>{document.fileType.toUpperCase()}</span><span>{version} {historical && '（历史版本）'}</span><span>{statusLabels[document.parseStatus]}</span></div>
      </div>
      <div className={styles.actions}>
        <button className={`${styles.iconButton} ${document.favorite ? styles.activeFavorite : ''}`} title={document.favorite ? '取消收藏' : '收藏文献'} aria-label={document.favorite ? '取消收藏文献' : '收藏文献'} disabled={!knowledgeBase.canEdit} onClick={() => updateDocument({ favorite: !document.favorite }, document.favorite ? '已取消收藏。' : '文献已收藏。')}><Star size={15} fill={document.favorite ? 'currentColor' : 'none'} /></button>
        <button className={styles.button} disabled={!selectedFileId} onClick={downloadOriginal}><Download size={14} /> 下载原件</button>
        <button className={styles.primary} disabled={!document.sections.length || !knowledgeBase.qaEnabled} onClick={() => onAsk(`请基于《${document.title}》当前可检索版本 ${document.version} 总结主要结论，并提供原文依据。`, [document.id])}><MessageSquare size={14} /> {historical ? '向当前版本提问' : '向文献提问'}</button>
      </div>
    </header>
    {actionError && <div className={`${styles.notice} ${styles.noticeError}`} role="alert">{actionError}</div>}
    {!knowledgeBase.canEdit && <div className={styles.notice}>当前为只读权限，可以阅读、复制和下载已授权资料。</div>}
    {document.isDemo && <div className={styles.notice}>演示摘录：此处仅包含用于原型演示的章节内容，不代表原始文献全文。{pageKind === 'logical' ? '本版本按逻辑页定位。' : '页码为演示资料中保存的原文页码标记。'}</div>}
    {(!versionRecord || !validIncomingEvidence) && <div className={`${styles.notice} ${styles.noticeError}`}>该引用的原始版本或段落无法完整定位。不会自动替换为其他版本。<button className={styles.textButton} onClick={() => chooseVersion(document.version)}>查看当前版本</button></div>}
    {historical && <div className={styles.notice}>正在阅读 {version}，此处新增的引用和批注将保留该版本。<button className={styles.textButton} onClick={() => chooseVersion(document.version)}>返回当前版本 {document.version}</button></div>}
    {feedback && <div className={styles.status} role="status"><div className={styles.actions}><Check size={13} /><span>{feedback}</span><button aria-label="关闭提示" onClick={() => setFeedback('')}><X size={13} /></button></div></div>}
    <div className={styles.readerGrid}>
      <aside className={`${styles.outline} ${outlineOpen ? styles.outlineOpen : ''}`} aria-label="文献目录">
        <h2 className={styles.sideHeading}><span>文献目录</span><List size={14} /></h2>
        <label className={styles.field}><span>阅读版本</span><select className={styles.select} value={version} onChange={event => chooseVersion(event.target.value)}>{!versionRecord && <option value={version}>{version}（不可用）</option>}{versions.map(item => <option key={item.version} value={item.version}>{item.version}{item.version === document.version ? ' · 当前版本' : ` · ${formatDate(item.updatedAt)}`}</option>)}</select></label>
        <nav className={styles.outlineList}>{sections.map((section, index) => <button key={section.id} className={`${styles.outlineItem} ${sectionId === section.id ? styles.outlineItemActive : ''}`} onClick={() => chooseSection(section)}><small>{String(index + 1).padStart(2, '0')}</small><span>{section.title}</span></button>)}</nav>
        {!sections.length && <p className={styles.muted}>正文就绪后会生成章节目录。</p>}
        <button className={styles.textButton} disabled={!previousVersion} onClick={() => openModal('compare')}><GitBranch size={12} /> 与上一版本比较</button>
        <div className={styles.sideSection}><h3 className={styles.sideHeading}><span>文献标签</span><button className={styles.textButton} disabled={!knowledgeBase.canEdit} onClick={() => openModal('tags')} aria-label="编辑文献标签"><Tag size={13} /></button></h3><div className={styles.actions}>{document.tags.map(tag => <span className={styles.tag} key={tag}>{tag}</span>)}</div>{!document.tags.length && <p className={styles.muted}>尚未添加标签</p>}</div>
        <div className={styles.sideSection}><h3 className={styles.sideHeading}>来源信息</h3><p className={styles.muted}>{document.sourceType}<br />{document.fileName || '未附原文件'}<br />更新于 {formatDate(versionRecord?.updatedAt ?? document.updatedAt)}</p>{document.sourceUrl && /^https?:\/\//i.test(document.sourceUrl) && <a className={styles.textButton} href={document.sourceUrl} target="_blank" rel="noreferrer">打开来源链接</a>}</div>
        <div className={styles.sideSection}><h3 className={styles.sideHeading}>知识图谱</h3><p className={styles.muted}>{graphStatusLabels[document.graphStatus]} · {graphEntities.length} 个关联实体</p><div className={styles.actions}>{graphEntities.slice(0, 6).map(entity => <span className={styles.tag} key={entity.id}>{entity.name}</span>)}</div><button className={styles.textButton} disabled={!knowledgeBase.canEdit || !document.sections.length || document.graphStatus === 'ready'} onClick={() => updateDocument({ graphStatus: 'ready' }, '文献已加入图谱范围；关联依据来自已保存正文。')}><Plus size={12} /> 加入知识图谱</button></div>
      </aside>
      <main className={styles.source}>
        <div className={styles.sourceToolbar}>
          <div className={styles.actions}><button className={`${styles.iconButton} ${styles.outlineToggle}`} onClick={() => setOutlineOpen(!outlineOpen)} aria-expanded={outlineOpen} aria-label="展开文献目录"><List size={14} /></button><div className={styles.segmented}><button className={view === 'text' ? styles.selected : ''} onClick={() => setView('text')}>可检索正文</button><button className={view === 'original' ? styles.selected : ''} onClick={() => setView('original')}>原件预览</button></div></div>
          <label className={styles.search}><Search size={14} /><input aria-label="检索文献正文" placeholder="在正文中查找" value={query} onChange={event => { setQuery(event.target.value); const match = sections.find(section => section.text.toLocaleLowerCase().includes(event.target.value.toLocaleLowerCase())); if (match && event.target.value.trim()) chooseSection(match); }} />{query && <span className={styles.muted}>{matchCount}</span>}</label>
        </div>
        <div className={styles.paperArea}>
          {view === 'original' && selectedFileId && pageKind === 'logical' && <p className={`${styles.muted} mb-3`}>以下为保存的原文件。正文采用逻辑页，未与原文件页码建立对应关系。</p>}
          {view === 'text' && sections.length > 0 && <article className={styles.paper}>
            <h2 className={styles.paperTitle}>{document.title}</h2><div className={styles.paperMeta}>{document.author || '作者未提供'}<br />{version} · {sections.length} 个正文段落 · {document.isDemo ? '演示摘录' : '已保存正文'}<br />{pageKind === 'logical' ? '逻辑页仅用于正文定位，不等同于原文件页码' : '原文页码按此版本保存的章节标记展示'}</div>
            {sections.map(section => <section key={`${version}:${section.id}`} ref={node => { const key = `${version}:${section.id}`; if (node) sectionRefs.current.set(key, node); else sectionRefs.current.delete(key); }} className={`${styles.section} ${section.id === sectionId ? styles.sectionActive : ''}`} onClick={() => { setSectionId(section.id); if (section.id !== sectionId) setActiveQuote(''); }} aria-label={`${section.title}，${pageLabel} ${section.page}，段 ${section.paragraph}`}>
              <h3>{section.title}</h3><p>{highlightedText(section.text, section.id === sectionId ? activeQuote : '', query)}</p><div className={styles.sectionMeta}><span>{pageLabel} {section.page} · 段 {section.paragraph}</span><button onClick={() => { chooseSection(section); setSideTab('analysis'); }}><Highlighter size={11} className="inline mr-1" />引用此段</button></div>
            </section>)}
          </article>}
          {view === 'text' && !sections.length && <div className={styles.empty}><FileText size={36} /><h3>等待可检索正文</h3><p>{document.error || '当前文件尚未提供可检索正文。原件可下载；录入正文后即可引用、批注和提问。'}</p><div className={styles.actions}><button className={styles.primary} disabled={!knowledgeBase.canEdit} onClick={() => openModal('replace')}><Plus size={14} /> 添加可检索正文</button>{selectedFileId && <button className={styles.button} onClick={() => setView('original')}>查看原件</button>}</div></div>}
          {view === 'original' && (!selectedFileId ? <div className={styles.empty}><FileText size={36} /><h3>此版本未附原件</h3><p>{document.isDemo ? '这份演示资料只提供标注过的章节摘录。' : '可以切换至可检索正文，或重新导入完整文件。'}</p><div className={styles.actions}><button className={styles.button} onClick={() => setView('text')}>返回正文</button></div></div> : fileState.key !== fileKey ? <div className={styles.empty}>正在读取原文件…</div> : fileState.error ? <div className={styles.empty}><p>{fileState.error}</p></div> : fileState.url && (fileState.mime === 'application/pdf' || document.fileType.toLowerCase() === 'pdf') ? <iframe className={styles.original} src={`${fileState.url}${pageKind === 'original' && selectedSection ? `#page=${selectedSection.page}` : ''}`} title={`${document.title} ${version} 原始 PDF`} /> : fileState.url && fileState.mime?.startsWith('image/') ? <div><p className={`${styles.muted} mb-3`}>原始图片 · {version}</p><img className={styles.originalImage} src={fileState.url} alt={`${document.title} 原件`} /></div> : <div className={styles.empty}><FileText size={36} /><h3>此格式请下载查看</h3><p>保留上传文件的原始内容。</p><div className={styles.actions}><button className={styles.button} onClick={downloadOriginal}><Download size={14} /> 下载原件</button></div></div>)}
        </div>
        {sections.length > 0 && <div className={styles.sourceToolbar}><span className={styles.muted}>正文版本 {version} · 引用与批注独立保留</span><button className={styles.textButton} disabled={!knowledgeBase.canEdit} onClick={() => openModal('replace')}>编辑正文并新建版本</button></div>}
      </main>
      <aside className={styles.analysis} aria-label="阅读辅助">
        <div className={styles.tabs}><button className={sideTab === 'analysis' ? styles.tabActive : ''} onClick={() => setSideTab('analysis')}>阅读要点</button><button className={sideTab === 'notes' ? styles.tabActive : ''} onClick={() => setSideTab('notes')}>我的批注 {selectedNotes.length > 0 && selectedNotes.length}</button></div>
        {sideTab === 'notes' && selectedNotes.length > 0 && <button className={`${styles.textButton} mb-4`} onClick={exportNotes}><Download size={12} /> 导出此版本的批注与引用</button>}
        {sourceEvidence && <div className={styles.citation}><span className={styles.citationLabel}><Highlighter size={12} /> 当前依据 · {version}</span><div className={styles.quote}>{sourceEvidence.quote.slice(0, 170)}{sourceEvidence.quote.length > 170 && '…'}</div><span className={styles.muted}>{sourceEvidence.section} · {pageLabel} {sourceEvidence.page} / 段 {sourceEvidence.paragraph}</span><div className={styles.actions}><button className={styles.iconButton} title="复制引用" aria-label="复制引用" onClick={copyCitation}><Copy size={13} /></button><button className={styles.iconButton} title="下载引用" aria-label="下载引用" onClick={() => downloadText(`${document.title}-${version}-引用.txt`, citationText(sourceEvidence))}><Download size={13} /></button><button className={styles.button} disabled={!knowledgeBase.canEdit} onClick={() => openModal('note')}>添加批注</button></div><div className={styles.actions}><button className={styles.textButton} disabled={!knowledgeBase.canEdit} onClick={() => openModal('entry')}>存为知识条目</button><span className={styles.muted}>/</span><button className={styles.textButton} disabled={!knowledgeBase.canEdit} onClick={() => openModal('task')}>创建研究任务</button></div></div>}
        {sideTab === 'analysis' ? <><p className={styles.analysisIntro}>按章节与关键词展示原文摘录，未生成额外结论。缺失信息保持为空。</p>{analysis.map(item => <div className={styles.insight} key={item.title}><h3>{item.title}</h3>{item.section ? <><p>{item.excerpt}{item.section.text.length > item.excerpt.length && '…'}</p><button className={styles.textButton} onClick={() => chooseSection(item.section!, item.excerpt)}>查看依据 <ChevronRight size={11} /></button></> : <p className={styles.muted}>正文中暂未识别到明确内容</p>}</div>)}<div className={styles.insight}><h3>关键词</h3><div className={styles.actions}>{keywords.map(keyword => <button key={keyword} className={`${styles.tag} ${styles.redTag}`} onClick={() => { const source = sections.find(section => section.text.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())); if (source) chooseSection(source, keyword); }}>{keyword}</button>)}</div>{!keywords.length && <p>暂无与正文匹配的文献标签</p>}</div></> : <><p className={styles.analysisIntro}>仅显示 {version} 的批注；点击段落可回到原文。</p>{selectedNotes.length ? selectedNotes.map(note => <div key={note.id} className={styles.note}><button className={styles.textButton} onClick={() => { const section = sections.find(item => item.id === note.sectionId); if (section) chooseSection(section); }}>{sections.find(item => item.id === note.sectionId)?.title ?? '原段落已不可用'} <ChevronRight size={11} /></button><p>{note.text}</p><span className={styles.muted}>{formatDate(note.createdAt)} · {note.version}</span></div>) : <p className={styles.muted}>选择一段正文，记录你的发现和疑问。</p>}<button className={styles.button} disabled={!sourceEvidence || !knowledgeBase.canEdit} onClick={() => openModal('note')}><Plus size={13} /> 添加批注</button></>}
      </aside>
    </div>
    <Modal open={modal !== null} onClose={() => { if (!savingRef.current) setModal(null); }} title={modal === 'tags' ? '编辑文献标签' : modal === 'note' ? '添加段落批注' : modal === 'entry' ? '保存为知识条目' : modal === 'task' ? '创建研究任务' : modal === 'compare' ? '正文版本比较' : '保存新的正文版本'} description={modal === 'compare' ? '并排查看相邻版本正文，引用仍固定在原始版本。' : modal === 'replace' ? '保存后创建新版本，并保留旧正文、引用和批注。' : sourceEvidence && modal !== 'tags' ? `依据：${sourceEvidence.section}，${version}，${pageLabel} ${sourceEvidence.page} / 段 ${sourceEvidence.paragraph}` : '标签用于文献筛选和主题归类。'}>
      {modal === 'compare' ? <div className={styles.compareGrid}>{[previousVersion, versionRecord].map((item, index) => <div className={styles.comparePane} key={index}><h3>{item?.version ?? '无上一版本'}{index === 1 && ' · 正在阅读'}</h3><p className={styles.muted}>{item?.changeNote}</p><p>{item?.sections.map(section => `${section.title}\n${section.text}`).join('\n\n') ?? '此版本之前没有保存的正文。'}</p></div>)}</div> : <form className={styles.form} aria-busy={saving} onSubmit={event => { event.preventDefault(); saveModal(); }}>
        {(modal === 'entry' || modal === 'task') && <label className={styles.field}>{modal === 'task' ? '任务名称' : '条目标题'}<input disabled={saving} className={styles.input} value={draftTitle} onChange={event => setDraftTitle(event.target.value)} maxLength={150} autoFocus /></label>}
        {modal !== 'task' && <label className={styles.field}>{modal === 'tags' ? '标签（逗号分隔）' : modal === 'note' ? '批注内容' : modal === 'replace' ? '可检索正文' : '条目内容'}<textarea disabled={saving} className={styles.textarea} rows={modal === 'replace' ? 14 : modal === 'entry' ? 7 : 4} value={draftText} onChange={event => setDraftText(event.target.value)} autoFocus={modal !== 'entry'} placeholder={modal === 'note' ? '记录你的理解、疑问或待验证的问题…' : modal === 'tags' ? '例如：催化剂，机理研究' : undefined} /></label>}
        {modal === 'replace' && <label className={styles.field}>版本说明<input disabled={saving} className={styles.input} value={changeNote} onChange={event => setChangeNote(event.target.value)} placeholder="例如：补充方法章节并修正单位" maxLength={150} /></label>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.formActions}><button type="button" disabled={saving} className={styles.button} onClick={() => setModal(null)}>取消</button><button type="submit" className={styles.primary} disabled={!knowledgeBase.canEdit || saving}>{saving ? '正在保存…' : modal === 'replace' ? '保存为新版本' : modal === 'task' ? '创建任务' : '保存'}</button></div>
      </form>}
    </Modal>
  </div>;
}
