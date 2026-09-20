'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowUp, BookmarkPlus, BookOpen, Check, ChevronRight, CircleHelp, ExternalLink, FileText, Filter, LoaderCircle, MessageSquare, Search, SlidersHorizontal, X } from 'lucide-react';
import { chatModes, documentTypes, makeId, type ChatMode, type DocumentType, type Evidence, type KnowledgeBase, type KnowledgeChatMessage, type KnowledgeDocument, type KnowledgeEntry, type KnowledgeEntryDraft, type KnowledgeGraph } from './model';
import { buildGroundedAnswer, projectKnowledgeEntries, resolveQuestionContext, retrieveEvidence } from './retrieval';
import styles from './chat.module.css';

export interface KnowledgeChatProps {
  knowledgeBase: KnowledgeBase;
  documents: KnowledgeDocument[];
  entries?: KnowledgeEntry[];
  graph: KnowledgeGraph;
  messages: KnowledgeChatMessage[];
  onMessage: (message: KnowledgeChatMessage) => void;
  onEvidence: (evidence: Evidence) => void;
  onSaveEntry: (draft: KnowledgeEntryDraft) => void;
  initialQuestion?: string;
  initialDocumentIds?: string[];
  compact?: boolean;
  onExpand?: () => void;
}

const modeDescriptions: Record<ChatMode, string> = {
  问知识: '查找与问题相关的原文', 做总结: '按来源整理内容摘录', 做对比: '并列展示不同来源的陈述', 找证据: '定位支持问题的原文段落',
  找冲突: '整理待人工核对的陈述', 找关系: '展示有原文支持的图谱关系', 找空白: '整理材料覆盖与待核查内容', 生成综述: '按来源组织综述素材',
};
const retrievalTypes: DocumentType[] = [...documentTypes, '知识条目'];

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}

export function KnowledgeChat({ knowledgeBase, documents, entries, graph, messages, onMessage, onEvidence, onSaveEntry, initialQuestion = '', initialDocumentIds, compact = false, onExpand }: KnowledgeChatProps) {
  const id = useId();
  const [question, setQuestion] = useState(initialQuestion);
  const [mode, setMode] = useState<ChatMode>('问知识');
  const [selectedDocuments, setSelectedDocuments] = useState<string[] | undefined>(initialDocumentIds);
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(!compact);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [documentSearch, setDocumentSearch] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const initialScopeKey = initialDocumentIds?.join('|');
  const baseDocuments = useMemo(() => [...documents, ...projectKnowledgeEntries(entries ?? [])]
    .filter(document => document.knowledgeBaseId === knowledgeBase.id), [documents, entries, knowledgeBase.id]);
  const allTags = useMemo(() => [...new Set(baseDocuments.flatMap(document => document.tags))].sort(), [baseDocuments]);
  const retrievalScope = useMemo(() => ({ knowledgeBaseId: knowledgeBase.id, documents, entries, graph, documentIds: selectedDocuments,
    documentTypes: selectedTypes, tags: selectedTags, fromDate, toDate }), [knowledgeBase.id, documents, entries, graph, selectedDocuments, selectedTypes, selectedTags, fromDate, toDate]);
  const scope = useMemo(() => retrieveEvidence({ ...retrievalScope, query: '' }), [retrievalScope]);
  const invalidDates = Boolean(fromDate && toDate && fromDate > toDate);
  const baseMessages = messages.filter(message => message.knowledgeBaseId === knowledgeBase.id);
  const visibleMessages = compact
    ? baseMessages.filter(message => message.documentIds?.length && message.documentIds.every(documentId => scope.eligibleDocumentIds.includes(documentId))) : baseMessages;
  const latestQuestion = visibleMessages.filter(message => message.role === 'user')
    .reduce<string | undefined>((context, message) => resolveQuestionContext(message.content, context), undefined);
  const scopeName = selectedDocuments === undefined ? '全部资料' : selectedDocuments.length === 1
    ? baseDocuments.find(document => document.id === selectedDocuments[0])?.title ?? '已选择 1 项资料' : `已选择 ${selectedDocuments.length} 项资料`;
  const topic = baseDocuments.find(document => scope.eligibleDocumentIds.includes(document.id))?.tags[0];
  const quickQuestions = [
    { label: '提炼主要内容', question: '总结当前范围的主要内容', mode: '做总结' as ChatMode },
    { label: topic ? `查找「${topic}」证据` : '查找关键原文', question: topic ? `关于${topic}有哪些原文证据？` : '总结当前文档的核心观点并列出原文', mode: '找证据' as ChatMode },
    { label: '梳理关联关系', question: topic ? `${topic}有哪些关系？` : '总结当前范围的图谱关系', mode: '找关系' as ChatMode },
  ];

  useEffect(() => { setSelectedDocuments(initialScopeKey === undefined ? undefined : initialScopeKey ? initialScopeKey.split('|') : []); }, [initialScopeKey, knowledgeBase.id]);
  useEffect(() => { setQuestion(initialQuestion); }, [initialQuestion]);
  useEffect(() => {
    if (visibleMessages.length && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [visibleMessages.length, pending]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const resetFilters = () => {
    setSelectedDocuments(initialDocumentIds); setSelectedTypes([]); setSelectedTags([]); setFromDate(''); setToDate(''); setDocumentSearch(''); setNotice('筛选条件已重置。');
  };

  const submit = async (text = question, selectedMode = mode) => {
    const trimmed = text.trim();
    if (!trimmed || busy.current || !knowledgeBase.qaEnabled || !knowledgeBase.canRead || invalidDates || !scope.eligibleDocumentIds.length) return;
    busy.current = true; setPending(true); setQuestion(''); setNotice(''); setActionError('');
    const scopeIds = [...scope.eligibleDocumentIds];
    const requestScope = retrievalScope;
    const previousQuestion = latestQuestion;
    let phase = '保存问题';
    try {
      onMessage({ id: makeId('question'), knowledgeBaseId: knowledgeBase.id, role: 'user', content: trimmed,
        mode: selectedMode, citations: [], createdAt: new Date().toISOString(), documentIds: scopeIds });
      phase = '检索原文';
      // Yield once so the actual local retrieval operation has a visible pending state.
      await new Promise<void>(resolve => window.setTimeout(resolve, 0));
      if (!mounted.current) return;
      const result = retrieveEvidence({ ...requestScope, query: resolveQuestionContext(trimmed, previousQuestion) });
      phase = '保存回答';
      onMessage({ id: makeId('answer'), knowledgeBaseId: knowledgeBase.id, role: 'assistant', content: buildGroundedAnswer(selectedMode, result),
        mode: selectedMode, citations: result.evidence, createdAt: new Date().toISOString(), documentIds: scopeIds, channels: result.channels });
    } catch (reason) {
      setQuestion(trimmed); setActionError(`${phase}失败。${reason instanceof Error ? reason.message : '请稍后重试。'} 问题已保留，可重试。`);
    } finally {
      busy.current = false;
      if (mounted.current) { setPending(false); textarea.current?.focus(); }
    }
  };

  const saveEntry = (key: string, title: string, content: string, citations: Evidence[]) => {
    if (!citations.length || saved.has(key) || !knowledgeBase.canEdit) return;
    const documentIds = [...new Set(citations.map(citation => citation.documentId))];
    const related = baseDocuments.filter(document => documentIds.includes(document.id));
    setNotice(''); setActionError('');
    try {
      onSaveEntry({ knowledgeBaseId: knowledgeBase.id, title: title.slice(0, 100), type: '证据摘录', body: content,
        summary: citations[0].quote.slice(0, 180), tags: [...new Set(related.flatMap(document => document.tags))].slice(0, 8), domain: knowledgeBase.domain[0] ?? '未分类',
        sourceLabel: '知识库本地证据检索', documentIds, entityIds: [], relatedProjectId: related[0]?.relatedProjectId ?? '', evidence: citations });
      setSaved(previous => new Set(previous).add(key)); setNotice('已保存为知识条目，可在知识条目中查看与编辑。');
    } catch (reason) {
      setActionError(`保存知识条目失败。${reason instanceof Error ? reason.message : '请稍后重试。'} 回答和原文已保留，可再次保存。`);
    }
  };

  const citationPosition = (citation: Evidence) => {
    const document = baseDocuments.find(item => item.id === citation.documentId);
    const sourceKind = document?.version === citation.version ? document.pageKind
      : document?.versions.find(version => version.version === citation.version)?.pageKind;
    const pageKind = sourceKind ?? citation.pageKind ?? (document && ['TXT', 'MD', 'MARKDOWN', 'CSV', 'URL'].includes(document.fileType.toUpperCase()) ? 'logical' : 'original');
    return `${pageKind === 'logical' ? `逻辑页 ${citation.page}` : `第 ${citation.page} 页`} · 段落 ${citation.paragraph}`;
  };

  if (!knowledgeBase.canRead) return <section className={styles.disabled}><BookOpen size={28} /><h3>暂无知识库访问权限</h3><p>请联系知识库管理员申请访问。</p></section>;
  if (!knowledgeBase.qaEnabled) return <section className={styles.disabled}><MessageSquare size={28} /><h3>知识问答尚未启用</h3><p>管理员可在知识库设置中启用问答，文档浏览和原文查看仍可使用。</p></section>;

  return <section className={`${styles.chat} ${compact ? styles.compact : ''}`} aria-label={compact ? '文档知识助手' : '知识问答'}>
    <header className={styles.header}>
      <div><h2><MessageSquare size={compact ? 18 : 23} />{compact ? '知识助手' : '知识问答'}</h2><p>{compact ? '围绕文档提问，每条证据可回溯' : `基于「${knowledgeBase.name}」查找、整理与沉淀知识`}</p></div>
      {compact && onExpand && <button type="button" className={styles.iconButton} onClick={onExpand} title="展开完整问答页面" aria-label="展开完整问答页面"><ExternalLink size={17} /></button>}
      {!compact && <span className={styles.localBadge}><span />本地证据检索</span>}
    </header>

    <div className={styles.workbench}>
      {showFilters && <aside className={styles.filters} aria-label="检索范围筛选">
        <div className={styles.filterHeading}><h3><SlidersHorizontal size={16} />检索范围</h3><button type="button" className={styles.textButton} onClick={resetFilters} disabled={pending}>重置</button><button type="button" className={styles.iconButton} onClick={() => setShowFilters(false)} aria-label="收起筛选"><X size={16} /></button></div>
        <fieldset disabled={pending} className={styles.fieldset}>
          <legend>资料范围</legend>
          <label className={styles.choice}><input type="radio" name={`${id}-document-scope`} checked={selectedDocuments === undefined} onChange={() => setSelectedDocuments(undefined)} />全部文档与条目<span>{baseDocuments.length}</span></label>
          <label className={styles.choice}><input type="radio" name={`${id}-document-scope`} checked={selectedDocuments !== undefined} onChange={() => setSelectedDocuments(initialDocumentIds ?? [])} />指定文档或条目</label>
          {selectedDocuments !== undefined && <div className={styles.documentSelection}>
            <label className={styles.searchBox}><Search size={14} /><input aria-label="搜索范围内资料" value={documentSearch} onChange={event => setDocumentSearch(event.target.value)} placeholder="搜索文档或知识条目" /></label>
            <div className={styles.documentList}>{baseDocuments.filter(document => document.title.toLowerCase().includes(documentSearch.toLowerCase())).map(document => <label key={document.id} className={styles.documentChoice}>
              <input type="checkbox" checked={selectedDocuments.includes(document.id)} disabled={document.parseStatus !== 'ready'} onChange={() => setSelectedDocuments(previous => toggleValue(previous ?? [], document.id))} />
              <span title={document.title}>{document.title}<small>{document.documentType}{document.parseStatus !== 'ready' ? ' · 暂不可检索' : ''}</small></span>
            </label>)}</div>
            {!selectedDocuments.length && <p className={styles.filterHint}>请选择至少一项可用资料。</p>}
          </div>}
        </fieldset>
        <fieldset disabled={pending} className={styles.fieldset}><legend>资料类型 <span>可多选</span></legend><div className={styles.chips}>{retrievalTypes.map(type => <button type="button" key={type} className={`${styles.chip} ${selectedTypes.includes(type) ? styles.selectedChip : ''}`} aria-pressed={selectedTypes.includes(type)} onClick={() => setSelectedTypes(previous => toggleValue(previous, type))}>{type}</button>)}</div></fieldset>
        <fieldset disabled={pending} className={styles.fieldset}><legend>标签 <span>匹配任一所选标签</span></legend><div className={styles.chips}>{allTags.length ? allTags.map(tag => <button type="button" key={tag} className={`${styles.chip} ${selectedTags.includes(tag) ? styles.selectedChip : ''}`} aria-pressed={selectedTags.includes(tag)} onClick={() => setSelectedTags(previous => toggleValue(previous, tag))}>{tag}</button>) : <span className={styles.filterHint}>此知识库暂无标签</span>}</div></fieldset>
        <fieldset disabled={pending} className={styles.fieldset}><legend>资料更新时间</legend><label className={styles.dateLabel} htmlFor={`${id}-from`}>开始日期</label><input className={styles.dateInput} id={`${id}-from`} type="date" value={fromDate} max={toDate || undefined} onChange={event => setFromDate(event.target.value)} /><label className={styles.dateLabel} htmlFor={`${id}-to`}>结束日期</label><input className={styles.dateInput} id={`${id}-to`} type="date" value={toDate} min={fromDate || undefined} onChange={event => setToDate(event.target.value)} />{invalidDates && <p className={styles.error}>结束日期不能早于开始日期。</p>}</fieldset>
        <div className={styles.scopeNote}><CircleHelp size={15} /><p>筛选共同生效。已解析文档与有正文的知识条目可检索；条目内容需人工核验。追问沿用当前范围。</p></div>
      </aside>}

      <div className={styles.conversation}>
        <div className={styles.scopeBar}><button type="button" className={styles.scopeToggle} onClick={() => setShowFilters(value => !value)} aria-expanded={showFilters}><Filter size={14} /><span title={scopeName}>{scopeName}</span><ChevronRight className={showFilters ? styles.rotated : ''} size={14} /></button><span className={styles.scopeCount}>{scope.eligibleDocumentIds.length} 项可检索</span>{(selectedTypes.length > 0 || selectedTags.length > 0 || fromDate || toDate) && <span className={styles.filteredDot} title="已应用类型、标签或日期筛选">已筛选</span>}</div>
        <div className={styles.modePicker} role="group" aria-label="问答模式">{chatModes.map(item => <button type="button" key={item} className={mode === item ? styles.activeMode : ''} onClick={() => setMode(item)} title={modeDescriptions[item]} aria-pressed={mode === item} disabled={pending}>{item}</button>)}</div>
        <div ref={transcript} className={styles.transcript} role="log" aria-label="问答记录" aria-live="polite" aria-busy={pending}>
          {!visibleMessages.length && <div className={styles.empty}>
            <div className={styles.emptyIcon}><BookOpen size={27} strokeWidth={1.6} /></div><h3>{scope.eligibleDocumentIds.length ? (compact ? '从当前资料开始探索' : '让问题找到它的依据') : '当前范围暂无可检索资料'}</h3>
            <p>{scope.eligibleDocumentIds.length ? '输入具体主题，查找相关段落与有来源的知识关系。每条引用都能回到原文。' : baseDocuments.length ? '文档可能仍在解析、条目没有正文，或资料未满足筛选条件。请调整范围后重试。' : '先添加文档或创建有正文的知识条目，即可开始问答。'}</p>
            {scope.eligibleDocumentIds.length > 0 && <div className={styles.quickQuestions}>{quickQuestions.map(item => <button type="button" key={item.label} onClick={() => { setMode(item.mode); void submit(item.question, item.mode); }}><span>{item.label}</span><ChevronRight size={15} /></button>)}</div>}
            <span className={styles.emptyDisclaimer}>本地证据检索 · 尚未连接生成模型</span>
          </div>}
          {visibleMessages.map((message, messageIndex) => <article key={message.id} className={message.role === 'user' ? styles.userMessage : styles.assistantMessage}>
            {message.role === 'assistant' && <div className={styles.assistantHeading}><div className={styles.assistantMark}><BookOpen size={15} /></div><strong>知识助手</strong><span>{message.mode}</span></div>}
            <div className={styles.messageBody}>{message.content.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            {message.role === 'assistant' && <>
              <div className={styles.answerMeta}><span>本地证据检索</span><span>尚未连接生成模型</span>{message.channels?.length ? <span>命中：{message.channels.join('、')}</span> : null}</div>
              {message.citations.length > 0 && <div className={styles.citations}><div className={styles.citationHeading}><strong>原文依据 <span>{message.citations.length}</span></strong><small>点击定位到原文</small></div>{message.citations.map((citation, index) => <details key={`${message.id}-${citation.id}`} className={styles.citation}>
                <summary><span className={styles.citationNumber}>{index + 1}</span><span className={styles.citationTitle}>{citation.documentTitle}<small>{citation.version} · {citationPosition(citation)}</small></span><ChevronRight size={14} /></summary>
                <blockquote>{citation.quote}</blockquote><div className={styles.citationActions}><button type="button" onClick={() => onEvidence(citation)}><FileText size={13} />{citation.documentId.startsWith('entry:') ? '查看条目原文' : '查看原文'}</button>{knowledgeBase.canEdit && <button type="button" disabled={saved.has(`${message.id}-${citation.id}`)} onClick={() => saveEntry(`${message.id}-${citation.id}`, `${citation.documentTitle} · ${citation.section}`, citation.quote, [citation])}>{saved.has(`${message.id}-${citation.id}`) ? <Check size={13} /> : <BookmarkPlus size={13} />}{saved.has(`${message.id}-${citation.id}`) ? '已保存' : '保存摘录'}</button>}</div>
              </details>)}</div>}
              <div className={styles.messageFooter}><span>检索范围：{message.documentIds?.length ?? 0} 项资料</span>{message.citations.length > 0 && knowledgeBase.canEdit && <button type="button" disabled={saved.has(message.id)} onClick={() => saveEntry(message.id, `${message.mode} · ${visibleMessages.slice(0, messageIndex).reverse().find(item => item.role === 'user')?.content ?? knowledgeBase.name}`, message.content, message.citations)}>{saved.has(message.id) ? <Check size={14} /> : <BookmarkPlus size={14} />}{saved.has(message.id) ? '已保存知识条目' : '保存为知识条目'}</button>}</div>
            </>}
          </article>)}
          {pending && <div className={styles.pending} role="status"><LoaderCircle size={16} />正在当前范围内检索原文…</div>}
        </div>
        <div className={styles.composerArea}>
          {actionError && <p className={styles.error} role="alert">{actionError}</p>}
          {notice && <p className={styles.notice} role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="关闭提示"><X size={13} /></button></p>}
          {!scope.eligibleDocumentIds.length && visibleMessages.length > 0 && <p className={styles.error}>当前范围没有可检索资料，请调整筛选条件。</p>}
          <form className={styles.composer} onSubmit={event => { event.preventDefault(); void submit(); }}>
            <label className={styles.srOnly} htmlFor={`${id}-question`}>向知识库提问</label><textarea ref={textarea} id={`${id}-question`} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }} placeholder={scope.eligibleDocumentIds.length ? `输入问题，${modeDescriptions[mode]}…` : '请先选择可检索的资料'} rows={compact ? 3 : 2} maxLength={4000} disabled={pending || !scope.eligibleDocumentIds.length} />
            <div className={styles.composerFooter}><span><span className={styles.modeLabel}>{mode}</span>{compact ? '' : 'Enter 发送 · Shift + Enter 换行'}</span><button type="submit" className={styles.sendButton} disabled={!question.trim() || pending || !scope.eligibleDocumentIds.length || invalidDates} aria-label="发送问题" aria-busy={pending}>{pending ? <LoaderCircle size={17} /> : <ArrowUp size={18} />}</button></div>
          </form>
          <p className={styles.composerHint}>答案为原文整理。对比、冲突和研究空白需人工判断。</p>
        </div>
      </div>
    </div>
  </section>;
}
