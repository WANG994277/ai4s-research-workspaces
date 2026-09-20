'use client';

import { Fragment, useMemo, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AlertCircle, ArrowDownWideNarrow, ArrowUpWideNarrow, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, Clock3, FileText, FolderOpen, Info, LoaderCircle, MessageSquare, MoreHorizontal, Network, Plus, RotateCcw, Search, ShieldCheck, Star, Tag, Trash2, Upload, X } from 'lucide-react';
import { documentTypes, formatDate, graphStatusLabels, statusLabels, type KnowledgeBase, type KnowledgeDocument, type ParseStatus } from './model';
import styles from './documents.module.css';

export interface KnowledgeDocumentsProps {
  knowledgeBase: KnowledgeBase;
  documents: KnowledgeDocument[];
  onOpenDocument: (id: string) => void;
  onAsk: (question: string, documentIds?: string[]) => void;
  onGraph: (documentId: string) => void;
  onRetry: (documentId: string) => void;
  onDelete: (documentId: string) => void;
  onImport: () => void;
  onUpdateDocument: (id: string, patch: Partial<KnowledgeDocument>) => void;
}

const failedStates: ParseStatus[] = ['upload_failed', 'failed', 'index_failed', 'graph_failed'];
const busyStates: ParseStatus[] = ['uploading', 'parsing', 'indexing', 'graph_extracting'];

function formatSize(size?: number) {
  if (size === undefined) return '未记录大小';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function parseTagInput(value: string) { return [...new Set(value.split(/[,，;；\n]/).map(tag => tag.trim()).filter(Boolean))]; }

function ParseBadge({ document }: { document: KnowledgeDocument }) {
  const failed = failedStates.includes(document.parseStatus);
  const busy = busyStates.includes(document.parseStatus);
  const Icon = document.parseStatus === 'ready' ? CheckCircle2 : failed ? AlertCircle : busy ? LoaderCircle : Clock3;
  return <span className={`${styles.status} ${document.parseStatus === 'ready' ? styles.statusReady : failed ? styles.statusFailed : busy ? styles.statusBusy : styles.statusPending}`}><Icon size={11} className={busy ? styles.spinning : undefined} />{statusLabels[document.parseStatus]}</span>;
}

export function KnowledgeDocuments(props: KnowledgeDocumentsProps) {
  return <KnowledgeDocumentsContent key={props.knowledgeBase.id} {...props} />;
}

function KnowledgeDocumentsContent({ knowledgeBase, documents, onOpenDocument, onAsk, onGraph, onRetry, onDelete, onImport, onUpdateDocument }: KnowledgeDocumentsProps) {
  const scopedDocuments = useMemo(() => documents.filter(document => document.knowledgeBaseId === knowledgeBase.id), [documents, knowledgeBase.id]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTagsId, setEditTagsId] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState('');
  const [actionError, setActionError] = useState('');
  const [mutationPending, setMutationPending] = useState(false);
  const tags = useMemo(() => [...new Set(scopedDocuments.flatMap(document => document.tags))].sort((a, b) => a.localeCompare(b, 'zh-CN')), [scopedDocuments]);
  const sources = useMemo(() => [...new Set(scopedDocuments.map(document => document.sourceType))], [scopedDocuments]);
  const statuses = [...new Set(scopedDocuments.map(document => document.parseStatus))];
  const readyCount = scopedDocuments.filter(document => document.parseStatus === 'ready').length;
  const failedCount = scopedDocuments.filter(document => failedStates.includes(document.parseStatus)).length;
  const pendingCount = scopedDocuments.length - readyCount - failedCount;
  const demoCount = scopedDocuments.filter(document => document.isDemo).length;
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return scopedDocuments.filter(document => {
      const searchable = [document.title, document.fileName, document.author, document.sourceType, document.sourceUrl, document.relatedProjectId, document.documentType, ...document.tags, ...document.sections.map(section => `${section.title} ${section.text}`)].filter(Boolean).join(' ').toLocaleLowerCase();
      return (!term || searchable.includes(term)) && (!typeFilter || document.documentType === typeFilter) && (!tagFilter || document.tags.includes(tagFilter)) && (!sourceFilter || document.sourceType === sourceFilter) && (!statusFilter || (statusFilter === '__failed' ? failedStates.includes(document.parseStatus) : document.parseStatus === statusFilter)) && (!favoritesOnly || document.favorite);
    }).sort((a, b) => sortDirection === 'desc' ? b.updatedAt.localeCompare(a.updatedAt) : a.updatedAt.localeCompare(b.updatedAt));
  }, [scopedDocuments, query, typeFilter, tagFilter, sourceFilter, statusFilter, favoritesOnly, sortDirection]);
  const selectable = filtered.filter(document => document.parseStatus === 'ready');
  const selected = selectable.filter(document => selectedIds.includes(document.id));
  const allSelected = selectable.length > 0 && selectable.every(document => selectedIds.includes(document.id));
  const deletingDocument = scopedDocuments.find(document => document.id === deleteId);
  const editingDocument = scopedDocuments.find(document => document.id === editTagsId);
  const draftTags = parseTagInput(tagDraft);
  const tagError = draftTags.length > 12 ? '每篇文档最多设置 12 个标签。' : draftTags.some(tag => tag.length > 30) ? '单个标签最多 30 个字符。' : '';
  const hasFilters = Boolean(query || typeFilter || tagFilter || sourceFilter || statusFilter || favoritesOnly);

  function resetFilters() { setQuery(''); setTypeFilter(''); setTagFilter(''); setSourceFilter(''); setStatusFilter(''); setFavoritesOnly(false); }
  function toggleExpanded(id: string) { setExpandedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); }
  function askDocument(document: KnowledgeDocument) {
    if (!knowledgeBase.qaEnabled || document.parseStatus !== 'ready') return;
    onAsk(`请总结《${document.title}》的主要内容、关键结论和证据，并标明来源。`, [document.id]);
  }
  function openTagEditor(document: KnowledgeDocument) {
    if (!knowledgeBase.canEdit || mutationPending) return;
    setActionError(''); setTagDraft(document.tags.join('，')); setEditTagsId(document.id);
  }
  async function runMutation(action: () => void) {
    if (mutationPending) return false;
    setMutationPending(true); setActionError('');
    try { await action(); return true; }
    catch (error) { setActionError(error instanceof Error ? error.message : '操作未保存，请重试。'); return false; }
    finally { setMutationPending(false); }
  }
  function toggleFavorite(document: KnowledgeDocument) { if (knowledgeBase.canEdit) void runMutation(() => onUpdateDocument(document.id, { favorite: !document.favorite })); }
  function retryDocument(document: KnowledgeDocument) { if (knowledgeBase.canEdit && !busyStates.includes(document.parseStatus)) void runMutation(() => onRetry(document.id)); }

  if (!knowledgeBase.canRead) return <section className={styles.empty}><ShieldCheck size={31} /><h3>无权查看此知识库的文档</h3><p>请联系知识库管理员申请访问权限。</p></section>;

  return <section className={styles.documents} aria-label={`${knowledgeBase.name}文档列表`}>
    <div className={styles.scopeBar}><div className={styles.scopeTitle}><FolderOpen size={17} /><h2>文档资料</h2><span>{scopedDocuments.length}</span></div><div className={styles.scopeStatus}><span><i className={styles.readyDot} />{readyCount} 篇可用</span>{pendingCount > 0 && <span><i className={styles.pendingDot} />{pendingCount} 篇处理中 / 待解析</span>}{failedCount > 0 && <button onClick={() => setStatusFilter('__failed')}><i className={styles.failedDot} />{failedCount} 篇需处理</button>}</div></div>
    <div className={styles.localNotice}><Info size={13} /><span>本地原型{demoCount ? ` · 含 ${demoCount} 篇演示资料，引用仅用于流程演示` : ' · 仅已完成解析的正文参与问答和检索'}</span>{!knowledgeBase.canEdit && <span className={styles.readOnly}>只读</span>}</div>
    {actionError && <div className={styles.actionError} role="alert"><AlertCircle size={15} /><span>{actionError}</span><button aria-label="关闭操作错误提示" onClick={() => setActionError('')}><X size={14} /></button></div>}
    <div className={styles.controls}>
      <div className={styles.searchRow}><label className={styles.search}><Search size={16} /><input aria-label="搜索知识库文档" placeholder="搜索标题、正文、标签、作者或来源" value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="清空文档搜索" onClick={() => setQuery('')}><X size={13} /></button>}</label><button className={styles.importButton} onClick={onImport} disabled={!knowledgeBase.canEdit}><Upload size={14} />导入文档</button></div>
      <div className={styles.filterRow}>
        <label><span className={styles.visuallyHidden}>筛选文档类型</span><select aria-label="文档类型" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="">全部类型</option>{documentTypes.map(type => <option key={type}>{type}</option>)}</select></label>
        <label><span className={styles.visuallyHidden}>筛选文档标签</span><select aria-label="文档标签" value={tagFilter} onChange={event => setTagFilter(event.target.value)}><option value="">全部标签</option>{tags.map(tag => <option key={tag}>{tag}</option>)}</select></label>
        <label><span className={styles.visuallyHidden}>筛选文档来源</span><select aria-label="文档来源" value={sourceFilter} onChange={event => setSourceFilter(event.target.value)}><option value="">全部来源</option>{sources.map(source => <option key={source}>{source}</option>)}</select></label>
        <label><span className={styles.visuallyHidden}>筛选解析状态</span><select aria-label="解析状态" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">全部状态</option>{failedCount > 0 && <option value="__failed">全部失败状态</option>}{statuses.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
        <button className={`${styles.favoriteFilter} ${favoritesOnly ? styles.favoriteFilterActive : ''}`} onClick={() => setFavoritesOnly(value => !value)} aria-pressed={favoritesOnly}><Star size={13} fill={favoritesOnly ? 'currentColor' : 'none'} />已收藏</button>
      </div>
    </div>

    <div className={styles.resultsBar}><div className={styles.resultsText}>{hasFilters ? `找到 ${filtered.length} 篇文档` : `全部 ${filtered.length} 篇文档`}{hasFilters && <button onClick={resetFilters}><RotateCcw size={11} />重置</button>}</div><button className={styles.sortButton} onClick={() => setSortDirection(value => value === 'desc' ? 'asc' : 'desc')} aria-label={`按更新时间${sortDirection === 'desc' ? '从新到旧' : '从旧到新'}排序，点击切换`}>
      {sortDirection === 'desc' ? <ArrowDownWideNarrow size={13} /> : <ArrowUpWideNarrow size={13} />}更新时间{sortDirection === 'desc' ? '从新到旧' : '从旧到新'}
    </button></div>

    {selected.length > 0 && <div className={styles.bulkBar}><span>已选 {selected.length} 篇可用文档</span><button disabled={!knowledgeBase.qaEnabled} onClick={() => onAsk(`请结合所选的 ${selected.length} 篇文档，梳理共同主题、主要结论及差异，并引用原文。`, selected.map(document => document.id))}><MessageSquare size={13} />基于所选文档提问</button><button className={styles.clearSelection} onClick={() => setSelectedIds([])}>取消选择</button></div>}

    {!scopedDocuments.length ? <div className={styles.empty}><div className={styles.emptyIcon}><BookOpen size={31} strokeWidth={1.4} /></div><h3>从第一份资料开始积累知识</h3><p>导入论文、报告或实验记录，将资料整理为可检索、可追溯的研究知识。</p><button className={styles.importButton} disabled={!knowledgeBase.canEdit} onClick={onImport}><Plus size={15} />导入第一篇文档</button>{!knowledgeBase.canEdit && <span className={styles.emptyHint}>当前权限仅可查看，请联系管理员添加资料。</span>}</div> : !filtered.length ? <div className={styles.empty}><Search size={31} strokeWidth={1.5} /><h3>没有找到符合条件的文档</h3><p>尝试其他关键词，或清除类型、来源和解析状态筛选。</p><button className={styles.secondaryButton} onClick={resetFilters}><RotateCcw size={14} />清除筛选</button></div> : <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="文档列表，可横向滚动查看完整列">
      <table className={styles.table}><caption className={styles.visuallyHidden}>当前知识库文档、来源、版本、解析状态和可执行操作</caption><thead><tr>
        <th className={styles.selectColumn} scope="col"><input type="checkbox" aria-label="选择当前列表中全部可用文档" checked={allSelected} ref={input => { if (input) input.indeterminate = selected.length > 0 && !allSelected; }} disabled={!selectable.length || !knowledgeBase.qaEnabled} onChange={() => setSelectedIds(current => allSelected ? current.filter(id => !selectable.some(document => document.id === id)) : [...new Set([...current, ...selectable.map(document => document.id)])])} /></th>
        <th scope="col" className={styles.nameColumn}>文档名称</th><th scope="col" className={styles.sourceColumn}>来源 / 关联课题</th><th scope="col" className={styles.statusColumn}>处理状态</th><th scope="col" className={styles.timeColumn}>更新时间</th><th scope="col" className={styles.actionsColumn}>操作</th>
      </tr></thead><tbody>{filtered.map(document => {
        const expanded = expandedIds.includes(document.id);
        const failed = failedStates.includes(document.parseStatus);
        const busy = busyStates.includes(document.parseStatus);
        const canAsk = document.parseStatus === 'ready' && knowledgeBase.qaEnabled;
        const canGraph = document.parseStatus === 'ready' && document.graphStatus === 'ready';
        const isSelected = selected.some(value => value.id === document.id);
        const format = (document.fileType || '文档').replace(/^\./, '').toUpperCase();
        const pendingBinary = document.parseStatus === 'pending' && !document.sections.length && !['TXT', 'MD', 'CSV', 'JSON', 'HTML', 'TEXT'].includes(format);
        const retryLabel = document.parseStatus === 'upload_failed' ? '重新上传' : failed || document.parseStatus === 'pending' ? '重试解析' : '重新解析';
        return <Fragment key={document.id}><tr className={`${styles.documentRow} ${isSelected ? styles.selectedRow : ''} ${expanded ? styles.expandedRow : ''}`}>
          <td className={styles.selectCell}><input type="checkbox" aria-label={`选择文档 ${document.title}`} checked={isSelected} disabled={!canAsk} onChange={() => setSelectedIds(current => current.includes(document.id) ? current.filter(id => id !== document.id) : [...current, document.id])} /></td>
          <td className={styles.documentCell}><div className={styles.documentHeading}><span className={`${styles.fileIcon} ${format === 'PDF' ? styles.pdfIcon : ''}`}><FileText size={18} /><small>{format.slice(0, 5)}</small></span><div className={styles.documentInfo}><div className={styles.titleLine}><button className={styles.documentTitle} onClick={() => onOpenDocument(document.id)}>{document.title}</button><button className={`${styles.starButton} ${document.favorite ? styles.starred : ''}`} aria-label={`${document.favorite ? '取消收藏' : '收藏'}文档 ${document.title}`} aria-pressed={document.favorite} disabled={!knowledgeBase.canEdit || mutationPending} onClick={() => toggleFavorite(document)}><Star size={13} fill={document.favorite ? 'currentColor' : 'none'} /></button></div><span className={styles.documentMeta}>{document.documentType}<i />{document.version}<i />{document.author || '作者未填写'}{document.isDemo && <em>演示</em>}</span></div></div><div className={styles.documentTags}>{document.tags.slice(0, 2).map(tag => <button key={tag} onClick={() => setTagFilter(tag)}>{tag}</button>)}{document.tags.length > 2 && <button className={styles.extraTags} onClick={() => toggleExpanded(document.id)} aria-label={`展开全部 ${document.tags.length} 个标签`}>+{document.tags.length - 2}</button>}{!document.tags.length && <span className={styles.noTags}>暂无标签</span>}</div></td>
          <td><span className={styles.sourceName}>{document.sourceType}</span><span className={styles.projectName} title={document.relatedProjectId || '未关联课题'}>{document.relatedProjectId || '未关联课题'}</span></td>
          <td><ParseBadge document={document} /><span className={`${styles.graphStatus} ${document.graphStatus === 'failed' ? styles.graphFailed : ''}`}><Network size={10} />图谱{graphStatusLabels[document.graphStatus]}</span>{failed && <button className={styles.errorLink} onClick={() => { if (!expanded) toggleExpanded(document.id); }}>查看失败原因</button>}{pendingBinary && <span className={styles.pendingService}>等待格式解析服务</span>}</td>
          <td><time className={styles.updateTime} dateTime={document.updatedAt}>{formatDate(document.updatedAt)}</time><button className={styles.expandButton} onClick={() => toggleExpanded(document.id)} aria-expanded={expanded} aria-controls={`document-details-${document.id}`}>{expanded ? '收起详情' : '文档详情'}{expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}</button></td>
          <td><div className={styles.rowActions}><button onClick={() => onOpenDocument(document.id)}>查看</button><button disabled={!canAsk} title={!knowledgeBase.qaEnabled ? '知识库尚未开启问答' : document.parseStatus !== 'ready' ? '完成解析后可问答' : '基于此文档提问'} onClick={() => askDocument(document)}>问答</button><button disabled={!canGraph} title={canGraph ? '查看此文档知识图谱' : '完成解析与图谱抽取后可查看'} onClick={() => { if (canGraph) onGraph(document.id); }}>图谱</button><DropdownMenu.Root><DropdownMenu.Trigger asChild><button className={styles.moreButton} aria-label={`更多文档操作：${document.title}`}><MoreHorizontal size={17} /></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className={styles.menu} sideOffset={5} align="end"><DropdownMenu.Item className={styles.menuItem} onSelect={() => toggleExpanded(document.id)}><Info size={14} />{expanded ? '收起文档详情' : '查看文档详情'}</DropdownMenu.Item><DropdownMenu.Item className={styles.menuItem} disabled={!knowledgeBase.canEdit || mutationPending} onSelect={() => toggleFavorite(document)}><Star size={14} />{document.favorite ? '取消收藏' : '收藏文档'}</DropdownMenu.Item><DropdownMenu.Item className={styles.menuItem} disabled={!knowledgeBase.canEdit || mutationPending} onSelect={() => openTagEditor(document)}><Tag size={14} />编辑标签</DropdownMenu.Item><DropdownMenu.Item className={styles.menuItem} disabled={!knowledgeBase.canEdit || busy || mutationPending} onSelect={() => retryDocument(document)}><RotateCcw size={14} />{retryLabel}</DropdownMenu.Item><DropdownMenu.Separator className={styles.menuSeparator} /><DropdownMenu.Item className={`${styles.menuItem} ${styles.dangerItem}`} disabled={!knowledgeBase.canEdit || mutationPending} onSelect={() => { setActionError(''); setDeleteId(document.id); }}><Trash2 size={14} />删除文档</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root></div></td>
        </tr>{expanded && <tr className={styles.detailRow}><td colSpan={6}><div className={styles.expandedDetails} id={`document-details-${document.id}`}>
          <dl className={styles.detailFields}><div><dt>原始文件</dt><dd>{document.fileName || '未记录原始文件名'}<span>{formatSize(document.fileSize)}</span></dd></div><div><dt>文档类型</dt><dd>{document.documentType} · {format}</dd></div><div><dt>作者</dt><dd>{document.author || '未填写'}</dd></div><div><dt>来源</dt><dd>{document.sourceType}{document.sourceId && <span>来源编号：{document.sourceId}</span>}{document.sourceUrl && <span className={styles.sourceUrl}>{document.sourceUrl}</span>}</dd></div><div><dt>关联课题</dt><dd>{document.relatedProjectId || '未关联课题'}</dd></div><div><dt>版本</dt><dd>{document.version} · {new Set([document.version, ...document.versions.map(version => version.version)]).size} 个已保存版本</dd></div><div><dt>创建时间</dt><dd>{formatDate(document.createdAt)}</dd></div><div><dt>更新时间</dt><dd>{formatDate(document.updatedAt)}</dd></div><div><dt>正文片段</dt><dd>{document.sections.length} 段{document.parseStatus !== 'ready' && <span>当前未参与知识问答</span>}</dd></div></dl>
          <div className={styles.detailTags}><span>标签</span><div>{document.tags.map(tag => <button key={tag} onClick={() => setTagFilter(tag)}>{tag}</button>)}{!document.tags.length && <small>暂无标签</small>}</div><button className={styles.editTags} disabled={!knowledgeBase.canEdit} onClick={() => openTagEditor(document)}><Tag size={12} />编辑</button></div>
          {(failed || document.error || pendingBinary || document.parseStatus === 'pending') && <div className={`${styles.processingNote} ${failed ? styles.failureNote : ''}`}><AlertCircle size={15} /><div><strong>{failed ? statusLabels[document.parseStatus] : pendingBinary ? '等待格式解析服务' : '文档尚未完成解析'}</strong><p>{document.error || (pendingBinary ? `${document.fileId ? '原始文件已保留。' : ''}此格式尚未接入解析服务，可在阅读器补充可检索正文；补充正文会保留原始文件。` : '完成正文解析与索引后，可基于此文档提问和查找证据。')}</p></div>{knowledgeBase.canEdit && !busy && <button disabled={mutationPending} onClick={() => retryDocument(document)}><RotateCcw size={12} />{retryLabel}</button>}</div>}
          {document.isDemo && <p className={styles.demoNote}><Info size={12} />演示资料：正文为用于验证检索与引用流程的样例片段，不代表完整出版原文。</p>}
        </div></td></tr>}</Fragment>;
      })}</tbody></table>
    </div>}
    {filtered.length > 0 && <div className={styles.listFooter}><span>显示 {filtered.length} / {scopedDocuments.length} 篇文档</span><span><CheckCircle2 size={11} />仅可用正文参与问答</span></div>}

    <AlertDialog.Root open={Boolean(deletingDocument)} onOpenChange={open => { if (!open && !mutationPending) setDeleteId(null); }}><AlertDialog.Portal><AlertDialog.Overlay className={styles.modalOverlay} /><AlertDialog.Content className={styles.modal}><div className={styles.deleteIcon}><Trash2 size={20} /></div><AlertDialog.Title className={styles.modalTitle}>删除这篇文档？</AlertDialog.Title><AlertDialog.Description className={styles.modalDescription}>将从当前知识库移除《{deletingDocument?.title}》及其检索入口。已有引用可能失效，请确认资料已另行保存。</AlertDialog.Description>{actionError && <p className={styles.modalError} role="alert">{actionError}</p>}<div className={styles.modalActions}><AlertDialog.Cancel className={styles.secondaryButton} disabled={mutationPending}>保留文档</AlertDialog.Cancel><AlertDialog.Action className={styles.dangerButton} disabled={!knowledgeBase.canEdit || mutationPending} onClick={async event => { event.preventDefault(); if (knowledgeBase.canEdit && deletingDocument && await runMutation(() => onDelete(deletingDocument.id))) setDeleteId(null); }}>{mutationPending ? '正在删除…' : '删除文档'}</AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>

    <Dialog.Root open={Boolean(editingDocument)} onOpenChange={open => { if (!open && !mutationPending) setEditTagsId(null); }}><Dialog.Portal><Dialog.Overlay className={styles.modalOverlay} /><Dialog.Content className={styles.modal}><Dialog.Title className={styles.modalTitle}>编辑文档标签</Dialog.Title><Dialog.Description className={styles.modalDescription}>为《{editingDocument?.title}》添加标签，便于筛选和知识检索。</Dialog.Description><Dialog.Close className={styles.modalClose} disabled={mutationPending} aria-label="关闭标签编辑"><X size={17} /></Dialog.Close><form onSubmit={async event => { event.preventDefault(); if (editingDocument && knowledgeBase.canEdit && !tagError && await runMutation(() => onUpdateDocument(editingDocument.id, { tags: draftTags }))) setEditTagsId(null); }}><label className={styles.tagInputLabel}>文档标签<input autoFocus value={tagDraft} maxLength={600} disabled={!knowledgeBase.canEdit || mutationPending} onChange={event => setTagDraft(event.target.value)} placeholder="输入标签，用逗号分隔" aria-describedby="document-tag-help" aria-invalid={Boolean(tagError)} /></label><p id="document-tag-help" className={styles.tagHelp}>{tagError || '最多 12 个标签，单个标签不超过 30 个字符。清空后保存可移除全部标签。'}</p>{actionError && <p className={styles.modalError} role="alert">{actionError} 标签草稿仍保留。</p>}<div className={styles.tagPreview}>{draftTags.map(tag => <span key={tag}>{tag}<button type="button" aria-label={`移除标签 ${tag}`} disabled={!knowledgeBase.canEdit || mutationPending} onClick={() => setTagDraft(draftTags.filter(value => value !== tag).join('，'))}><X size={11} /></button></span>)}</div>{tags.filter(tag => !draftTags.includes(tag)).length > 0 && <div className={styles.suggestedTags}><span>已有标签</span><div>{tags.filter(tag => !draftTags.includes(tag)).slice(0, 10).map(tag => <button type="button" key={tag} disabled={!knowledgeBase.canEdit || mutationPending || draftTags.length >= 12} onClick={() => setTagDraft([...draftTags, tag].join('，'))}><Plus size={11} />{tag}</button>)}</div></div>}<div className={styles.modalActions}><Dialog.Close className={styles.secondaryButton} type="button" disabled={mutationPending}>取消</Dialog.Close><button className={styles.importButton} type="submit" disabled={!knowledgeBase.canEdit || mutationPending || Boolean(tagError)}><Check size={14} />{mutationPending ? '保存中…' : '保存标签'}</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
