'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Check, FileText, FolderOpen, Info, Link2, LoaderCircle, Pencil, Plus, Search, Tag, Trash2, UploadCloud, X } from 'lucide-react';
import { Modal } from '@/components/research/workspace-kit';
import { documentTypes, makeId, tagCategories, type DocumentType, type KnowledgeBase, type KnowledgeDocument, type KnowledgeTag, type Visibility } from './model';
import { supportedExtensions, textExtensions, validateFile } from './files';
import styles from './dialogs.module.css';

const listValue = (value: string) => [...new Set(value.split(/[,，;；\n]/).map(item => item.trim()).filter(Boolean))];
const messageOf = (error: unknown) => error instanceof Error ? error.message : '操作未完成，请重试。';
const validUrl = (value: string) => { try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; } };
const bytes = (value: number) => value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / (1024 * 1024)).toFixed(1)} MB`;

export interface BaseDialogProps {
  open: boolean;
  base?: KnowledgeBase;
  onClose: () => void;
  onSave: (value: Pick<KnowledgeBase, 'name' | 'description' | 'cover' | 'domain' | 'tags' | 'visibility' | 'autoGraph' | 'qaEnabled' | 'allowedMembers'>) => void;
}

export function BaseDialog({ open, base, onClose, onSave }: BaseDialogProps) {
  const id = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('');
  const [domain, setDomain] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [members, setMembers] = useState('');
  const [autoGraph, setAutoGraph] = useState(true);
  const [qaEnabled, setQaEnabled] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    setName(base?.name ?? ''); setDescription(base?.description ?? ''); setCover(base?.cover ?? '');
    setDomain(base?.domain.join('，') ?? ''); setTags(base?.tags.join('，') ?? ''); setVisibility(base?.visibility ?? 'private');
    setMembers(base?.allowedMembers?.join('，') ?? ''); setAutoGraph(base?.autoGraph ?? true); setQaEnabled(base?.qaEnabled ?? true); setError('');
  }, [open, base]);
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setError('请填写知识库名称。'); return; }
    if (cover.trim() && !validUrl(cover.trim())) { setError('封面链接需为有效的 http 或 https 地址。'); return; }
    if (visibility === 'shared' && !listValue(members).length) { setError('请至少填写一位指定成员。'); return; }
    try {
      onSave({ name: name.trim(), description: description.trim(), cover: cover.trim() || undefined, domain: listValue(domain), tags: listValue(tags), visibility,
        allowedMembers: visibility === 'shared' ? listValue(members) : undefined, autoGraph, qaEnabled });
      onClose();
    } catch (reason) { setError(messageOf(reason)); }
  };
  return <Modal open={open} onClose={onClose} title={base ? '编辑知识库' : '新建知识库'} description="为一个研究主题建立资料、知识关系与原文证据的共同空间。">
    <form className={styles.dialog} onSubmit={save}>
      <label className={styles.field} htmlFor={`${id}-name`}><span>知识库名称 <b>*</b></span><input id={`${id}-name`} value={name} onChange={event => setName(event.target.value)} placeholder="例如：固态电池界面研究" required maxLength={60} autoFocus /><small>{name.length}/60</small></label>
      <label className={styles.field} htmlFor={`${id}-description`}><span>知识库描述</span><textarea id={`${id}-description`} value={description} onChange={event => setDescription(event.target.value)} placeholder="描述研究主题、资料范围与使用目的" rows={3} maxLength={600} /></label>
      <div className={styles.fieldGrid}><label className={styles.field} htmlFor={`${id}-domain`}><span>专业领域</span><input id={`${id}-domain`} value={domain} onChange={event => setDomain(event.target.value)} placeholder="材料科学，电化学" /><small>多个领域以逗号分隔</small></label><label className={styles.field} htmlFor={`${id}-tags`}><span>知识库标签</span><input id={`${id}-tags`} value={tags} onChange={event => setTags(event.target.value)} placeholder="固态电池，界面工程" /><small>多个标签以逗号分隔</small></label></div>
      <label className={styles.field} htmlFor={`${id}-cover`}><span>封面链接 <em>可选</em></span><input id={`${id}-cover`} type="url" value={cover} onChange={event => setCover(event.target.value)} placeholder="https://example.com/cover.png" /></label>
      <fieldset className={styles.fieldset}><legend>可见范围</legend><div className={styles.visibility}>{([
        ['private', '私有', '仅本人可访问'], ['team', '团队', '向团队成员开放'], ['shared', '指定范围', '向指定成员开放'],
      ] as const).map(([value, label, hint]) => <label key={value} className={visibility === value ? styles.selectedVisibility : ''}><input type="radio" name={`${id}-visibility`} value={value} checked={visibility === value} onChange={() => setVisibility(value)} /><span>{label}<small>{hint}</small></span></label>)}</div></fieldset>
      {visibility === 'shared' && <label className={styles.field} htmlFor={`${id}-members`}><span>指定成员 <b>*</b></span><input id={`${id}-members`} value={members} onChange={event => setMembers(event.target.value)} placeholder="成员姓名或成员 ID，以逗号分隔" required /><small>本地原型记录访问范围；成员信息由你填写。</small></label>}
      <div className={styles.settings}><label><span>自动构建知识图谱<small>文档解析完成后，提取有来源的知识关系</small></span><input type="checkbox" role="switch" checked={autoGraph} onChange={event => setAutoGraph(event.target.checked)} /></label><label><span>启用知识问答<small>允许检索与整理本知识库的原文证据</small></span><input type="checkbox" role="switch" checked={qaEnabled} onChange={event => setQaEnabled(event.target.checked)} /></label></div>
      {error && <p className={styles.error} role="alert"><AlertCircle size={16} />{error}</p>}
      <div className={styles.footer}><button type="button" className={styles.secondary} onClick={onClose}>取消</button><button className={styles.primary} type="submit">{base ? '保存修改' : '创建知识库'}</button></div>
    </form>
  </Modal>;
}

type ImportSource = '本地上传' | '科研资产' | '课题空间' | '文献检索' | '标准专利' | '网页链接';
const importSources: ImportSource[] = ['本地上传', '科研资产', '课题空间', '文献检索', '标准专利', '网页链接'];
const acceptFiles = [...supportedExtensions].map(extension => `.${extension}`).join(',');
const fileKey = (file: File) => `${file.webkitRelativePath || file.name}:${file.size}:${file.lastModified}`;

export interface ImportDialogProps {
  open: boolean;
  knowledgeBase: KnowledgeBase;
  referenceDocuments: KnowledgeDocument[];
  onClose: () => void;
  onFiles: (files: File[], type: DocumentType, tags: string[]) => Promise<void>;
  onReference: (document: KnowledgeDocument, sourceType: string) => void;
  onUrl: (url: string, title: string, type: DocumentType, text: string) => void;
}

export function ImportDialog({ open, knowledgeBase, referenceDocuments, onClose, onFiles, onReference, onUrl }: ImportDialogProps) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const processing = useRef(false);
  const [source, setSource] = useState<ImportSource>('本地上传');
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState<DocumentType>('论文');
  const [tags, setTags] = useState('');
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  useEffect(() => {
    if (!open) return;
    setFiles([]); setSource('本地上传'); setSelected([]); setImported(new Set()); setError(''); setSuccess(''); setProgress(''); setSearch('');
    setTags(''); setType('论文'); setUrl(''); setTitle(''); setText('');
  }, [open, knowledgeBase.id]);

  const addFiles = (incoming: File[]) => {
    if (processing.current) return;
    const valid: File[] = [];
    const rejected: string[] = [];
    for (const file of incoming) {
      try { validateFile(file); valid.push(file); }
      catch (reason) { rejected.push(messageOf(reason)); }
    }
    setFiles(previous => [...new Map([...previous, ...valid].map(file => [fileKey(file), file])).values()]);
    setError(rejected.length ? `${rejected.length} 个文件未加入队列：${rejected.slice(0, 4).join('；')}${rejected.length > 4 ? '…' : ''}` : '');
    setSuccess('');
  };
  const existingIds = new Set(referenceDocuments.filter(document => document.knowledgeBaseId === knowledgeBase.id).flatMap(document => [document.id, document.sourceId].filter((value): value is string => Boolean(value))));
  const catalog = referenceDocuments.filter(document => {
    if (search.trim() && !`${document.title} ${document.tags.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (source === '文献检索') return document.documentType === '论文';
    if (source === '标准专利') return ['标准', '专利'].includes(document.documentType);
    if (source === '课题空间') return Boolean(document.relatedProjectId);
    return ['报告', '实验资料', '技术文档', '笔记'].includes(document.documentType) || document.sourceType.includes('资产');
  });
  const local = source === '本地上传';
  const web = source === '网页链接';
  const close = () => { if (!processing.current) onClose(); };

  const upload = async () => {
    if (!files.length || processing.current || !knowledgeBase.canEdit) return;
    processing.current = true; setPending(true); setError(''); setSuccess('');
    let completed = 0;
    const failed: string[] = [];
    // Persist separately so retrying failed files cannot duplicate already successful files.
    for (const [index, file] of files.entries()) {
      setProgress(`正在导入 ${index + 1}/${files.length}：${file.name}`);
      try {
        await onFiles([file], type, listValue(tags));
        completed += 1;
        setFiles(previous => previous.filter(item => fileKey(item) !== fileKey(file)));
      } catch (reason) { failed.push(`${file.name}：${messageOf(reason)}`); }
    }
    setProgress(''); setPending(false); processing.current = false;
    if (completed) setSuccess(`成功导入 ${completed} 份文件。TXT、MD、CSV 可在本地解析；其他格式已保存原件，需连接解析服务或补录正文。`);
    if (failed.length) setError(`${failed.length} 份文件导入失败，可重试剩余文件。${failed.join('；')}`);
  };
  const importReferences = () => {
    if (!knowledgeBase.canEdit) return;
    let completed = 0;
    const errors: string[] = [];
    for (const documentId of selected) {
      const document = referenceDocuments.find(item => item.id === documentId);
      if (!document || existingIds.has(documentId) || imported.has(documentId)) continue;
      try {
        onReference(document, source); completed += 1;
        setImported(previous => new Set(previous).add(documentId)); setSelected(previous => previous.filter(item => item !== documentId));
      } catch (reason) { errors.push(`${document.title}：${messageOf(reason)}`); }
    }
    setSuccess(completed ? `成功导入 ${completed} 份示例引用，保留原文段落和来源信息。` : '');
    setError(errors.join('；'));
  };
  const importUrl = (event: React.FormEvent) => {
    event.preventDefault();
    if (!knowledgeBase.canEdit) return;
    setSuccess('');
    if (!validUrl(url.trim())) { setError('请填写有效的 http 或 https 网页地址。'); return; }
    if (!title.trim()) { setError('请填写引用标题。'); return; }
    try {
      onUrl(url.trim(), title.trim(), type, text.trim());
      setSuccess(text.trim() ? '已保存 1 份链接引用及你提供的正文。' : '已保存 1 份链接引用，补录正文后可参与知识检索。');
      setError(''); setUrl(''); setTitle(''); setText('');
    } catch (reason) { setError(messageOf(reason)); }
  };

  return <Modal open={open} onClose={close} title="导入知识资料" description={`导入到「${knowledgeBase.name}」，保留原件、来源和可追溯的原文内容。`}>
    <div className={styles.dialog} aria-busy={pending}>
      {!knowledgeBase.canEdit && <div className={styles.info}><Info size={16} /><p>当前知识库为只读状态，你可以浏览导入方式，但不能添加资料。</p></div>}
      <div className={styles.sourceTabs} role="group" aria-label="导入来源">{importSources.map(item => <button key={item} type="button" className={source === item ? styles.activeSource : ''} aria-pressed={source === item} disabled={pending} onClick={() => { setSource(item); setSelected([]); setError(''); setSuccess(''); }}>{item}</button>)}</div>
      {local ? <>
        <div className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`} onDragOver={event => { event.preventDefault(); if (!pending) setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); if (knowledgeBase.canEdit) addFiles(Array.from(event.dataTransfer.files)); }}>
          <UploadCloud size={33} strokeWidth={1.6} /><h3>拖入文件，建立你的知识资料</h3><p>支持批量选择文件，也可选择整个文件夹</p>
          <div className={styles.uploadButtons}><button className={styles.primary} type="button" onClick={() => fileInput.current?.click()} disabled={pending || !knowledgeBase.canEdit}><Plus size={15} />选择文件</button><button className={styles.secondary} type="button" onClick={() => folderInput.current?.click()} disabled={pending || !knowledgeBase.canEdit}><FolderOpen size={15} />选择文件夹</button></div>
          <input className={styles.hiddenInput} ref={fileInput} type="file" accept={acceptFiles} multiple aria-label="选择本地文件" onChange={event => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} disabled={pending || !knowledgeBase.canEdit} />
          <input className={styles.hiddenInput} ref={element => { folderInput.current = element; if (element) { element.setAttribute('webkitdirectory', ''); element.setAttribute('directory', ''); } }} type="file" multiple aria-label="选择本地文件夹" onChange={event => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} disabled={pending || !knowledgeBase.canEdit} />
          <small>PDF、Word、PPT、Excel、TXT、Markdown、CSV、图片 · 单个文件不超过 25 MB</small>
        </div>
        {files.length > 0 && <section className={styles.fileQueue} aria-label="待导入文件"><div className={styles.queueHeading}><strong>待导入 {files.length} 份</strong><span>{bytes(files.reduce((sum, file) => sum + file.size, 0))}</span><button type="button" onClick={() => setFiles([])} disabled={pending}>清空</button></div><div className={styles.queueList}>{files.map(file => <div className={styles.fileRow} key={fileKey(file)}><FileText size={16} /><span title={file.webkitRelativePath || file.name}>{file.webkitRelativePath || file.name}<small>{bytes(file.size)} · {textExtensions.has(file.name.split('.').pop()?.toLowerCase() ?? '') ? '可本地解析' : '保存原件，等待解析'}</small></span><button type="button" className={styles.iconButton} disabled={pending} aria-label={`移除 ${file.name}`} onClick={() => setFiles(previous => previous.filter(item => fileKey(item) !== fileKey(file)))}><X size={15} /></button></div>)}</div></section>}
        <div className={styles.fieldGrid}><label className={styles.field} htmlFor={`${id}-file-type`}><span>文档类型</span><select id={`${id}-file-type`} value={type} onChange={event => setType(event.target.value as DocumentType)} disabled={pending}>{documentTypes.map(item => <option key={item}>{item}</option>)}</select></label><label className={styles.field} htmlFor={`${id}-file-tags`}><span>批量添加标签</span><input id={`${id}-file-tags`} value={tags} onChange={event => setTags(event.target.value)} placeholder="多个标签以逗号分隔" disabled={pending} /></label></div>
        <div className={styles.info}><Info size={16} /><p>TXT / MD / CSV 可直接解析为文本。PDF、Office 和图片先保存原件，等待解析服务或补录正文；未解析内容不会用于问答。</p></div>
      </> : web ? <form id={`${id}-url-form`} className={styles.urlForm} onSubmit={importUrl}>
        <div className={styles.info}><Link2 size={16} /><p>仅保存链接和你提供的正文，当前不会自动访问或抓取网页。请粘贴你希望纳入知识库的原文。</p></div>
        <label className={styles.field} htmlFor={`${id}-url`}><span>网页地址 <b>*</b></span><input id={`${id}-url`} type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://…" required /></label>
        <div className={styles.fieldGrid}><label className={styles.field} htmlFor={`${id}-url-title`}><span>引用标题 <b>*</b></span><input id={`${id}-url-title`} value={title} onChange={event => setTitle(event.target.value)} placeholder="填写文章或资料标题" required /></label><label className={styles.field} htmlFor={`${id}-url-type`}><span>文档类型</span><select id={`${id}-url-type`} value={type} onChange={event => setType(event.target.value as DocumentType)}>{documentTypes.map(item => <option key={item}>{item}</option>)}</select></label></div>
        <label className={styles.field} htmlFor={`${id}-url-text`}><span>原文正文 <em>可选</em></span><textarea id={`${id}-url-text`} value={text} onChange={event => setText(event.target.value)} placeholder="粘贴真实原文，以空行分隔段落。留空则只登记链接，暂不参与检索。" rows={6} /></label>
      </form> : <>
        <div className={styles.catalogHeading}><span className={styles.exampleBadge}>示例引用目录</span><span>{source}</span></div>
        <div className={styles.info}><Info size={16} /><p>下方为原型内已有的示例资料，未连接外部{source}服务。导入会复制选中资料的真实段落与来源信息。</p></div>
        <label className={styles.search}><Search size={16} /><input aria-label="搜索示例资料" placeholder="按标题或标签搜索" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <div className={styles.referenceList}>{catalog.length ? catalog.map(document => {
          const exists = existingIds.has(document.id) || imported.has(document.id);
          return <label key={document.id} className={`${styles.reference} ${exists ? styles.existingReference : ''}`}><input type="checkbox" checked={selected.includes(document.id)} disabled={exists || !knowledgeBase.canEdit} onChange={() => setSelected(previous => previous.includes(document.id) ? previous.filter(value => value !== document.id) : [...previous, document.id])} /><FileText size={17} /><span><strong>{document.title}</strong><small>{document.documentType} · {document.author || '未标注作者'} · {document.sections.length} 个原文段落</small><em>{document.tags.join(' / ') || '暂无标签'}</em></span>{exists && <b><Check size={12} />已在本库</b>}</label>;
        }) : <div className={styles.empty}><Search size={24} /><p>没有匹配的示例资料</p><small>尝试调整关键词，或选择其他来源。</small></div>}</div>
      </>}
      {pending && <p className={styles.progress} role="status"><LoaderCircle size={16} />{progress}</p>}
      {error && <p className={styles.error} role="alert"><AlertCircle size={16} />{error}</p>}
      {success && <p className={styles.success} role="status"><Check size={16} />{success}</p>}
      <div className={styles.footer}><span className={styles.footerNote}>{pending ? '导入过程中请保持此窗口打开' : '资料保存在当前浏览器的本地原型中'}</span><button type="button" className={styles.secondary} onClick={close} disabled={pending}>{success ? '完成' : '取消'}</button>{local ? <button type="button" className={styles.primary} onClick={() => void upload()} disabled={pending || !files.length || !knowledgeBase.canEdit}>{pending ? <LoaderCircle size={15} /> : <UploadCloud size={15} />}{pending ? '正在导入' : `导入${files.length ? ` ${files.length} 份文件` : '文件'}`}</button> : web ? <button type="submit" className={styles.primary} form={`${id}-url-form`} disabled={!knowledgeBase.canEdit || !url.trim() || !title.trim()}>保存链接引用</button> : <button type="button" className={styles.primary} onClick={importReferences} disabled={!selected.length || !knowledgeBase.canEdit}>导入 {selected.length} 份引用</button>}</div>
    </div>
  </Modal>;
}

export interface TagsDialogProps {
  open: boolean;
  tags: KnowledgeTag[];
  documents: KnowledgeDocument[];
  canEdit: boolean;
  onClose: () => void;
  onSave: (tag: KnowledgeTag) => void;
  onMerge: (sourceId: string, targetId: string) => void;
  onDelete: (id: string) => void;
}

export function TagsDialog({ open, tags, documents, canEdit, onClose, onSave, onMerge, onDelete }: TagsDialogProps) {
  const id = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(tagCategories[0]);
  const [aliases, setAliases] = useState('');
  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const normalizedNames = useMemo(() => new Set(tags.flatMap(tag => [tag.name, ...tag.aliases]).map(value => value.toLowerCase())), [tags]);
  const suggestions = [...new Set(documents.flatMap(document => document.tags))].filter(value => !normalizedNames.has(value.toLowerCase())).slice(0, 8);
  const countFor = (tag: KnowledgeTag) => documents.filter(document => document.tags.some(value => value === tag.name || tag.aliases.includes(value))).length;
  const filtered = tags.filter(tag => (!categoryFilter || tag.category === categoryFilter) && (!search.trim() || `${tag.name} ${tag.aliases.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase())));
  const resetEditor = () => { setEditing(null); setName(''); setCategory(tagCategories[0]); setAliases(''); };
  useEffect(() => {
    if (!open) return;
    setSearch(''); setCategoryFilter(''); setEditing(null); setName(''); setCategory(tagCategories[0]); setAliases('');
    setMergeSource(null); setMergeTarget(''); setDeleting(null); setError(''); setNotice('');
  }, [open]);
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;
    setNotice('');
    if (!name.trim()) { setError('请填写标签名称。'); return; }
    const otherNames = new Set(tags.filter(tag => tag.id !== editing).flatMap(tag => [tag.name, ...tag.aliases]).map(value => value.toLowerCase()));
    if (otherNames.has(name.trim().toLowerCase())) { setError('该名称已用于其他标签或别名，可使用合并功能统一标签。'); return; }
    const desiredAliases = [...new Map(listValue(aliases).filter(value => value.toLowerCase() !== name.trim().toLowerCase()).map(value => [value.toLowerCase(), value])).values()];
    const conflictingAlias = desiredAliases.find(value => otherNames.has(value.toLowerCase()));
    if (conflictingAlias) { setError(`别名「${conflictingAlias}」已用于其他标签，请调整别名或合并标签。`); return; }
    try {
      onSave({ id: editing ?? makeId('tag'), name: name.trim(), category, aliases: desiredAliases });
      setNotice(editing ? '标签修改已保存。' : '标签已创建。'); setError(''); resetEditor();
    } catch (reason) { setError(messageOf(reason)); }
  };
  const merge = () => {
    if (!canEdit || !mergeSource || !mergeTarget || mergeSource === mergeTarget) return;
    setNotice('');
    try { onMerge(mergeSource, mergeTarget); setMergeSource(null); setMergeTarget(''); setError(''); setNotice('标签已合并，相关文档标记已同步。'); if (editing === mergeSource) resetEditor(); }
    catch (reason) { setError(messageOf(reason)); }
  };
  const remove = () => {
    if (!canEdit || !deleting) return;
    setNotice('');
    try { onDelete(deleting); setDeleting(null); setError(''); setNotice('标签已删除，文档内容不受影响。'); if (editing === deleting) resetEditor(); }
    catch (reason) { setError(messageOf(reason)); }
  };
  const sourceTag = tags.find(tag => tag.id === mergeSource);
  const deleteTag = tags.find(tag => tag.id === deleting);

  return <Modal open={open} onClose={onClose} title="标签管理" description="统一管理所有可编辑知识库的标签。改名、合并和删除会同步这些知识库的文档与知识条目标记；只读知识库不受影响。">
    <div className={styles.dialog}>
      {!canEdit && <div className={styles.info}><Info size={16} /><p>当前为只读模式，可查看标签及资料使用情况。</p></div>}
      <div className={styles.tagFilters}><label className={styles.search}><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索标签或别名" aria-label="搜索标签或别名" /></label><select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} aria-label="按标签分类筛选"><option value="">全部分类</option>{tagCategories.map(item => <option key={item}>{item}</option>)}</select></div>
      <div className={styles.tagList}><div className={styles.tagListHeading}><span>标签 / 分类 / 别名</span><span>文档数</span></div>{filtered.length ? filtered.map(tag => <div className={styles.tagRow} key={tag.id}><Tag size={15} /><div><strong>{tag.name}<span>{tag.category}</span></strong><small>{tag.aliases.length ? `别名：${tag.aliases.join('、')}` : '暂无别名'}</small></div><span className={styles.tagCount} title="当前资料范围的使用文档数">{countFor(tag)}</span>{canEdit && <div className={styles.tagActions}><button type="button" className={styles.iconButton} title={`编辑 ${tag.name}`} aria-label={`编辑 ${tag.name}`} onClick={() => { setEditing(tag.id); setName(tag.name); setCategory(tag.category); setAliases(tag.aliases.join('，')); setError(''); setMergeSource(null); setDeleting(null); nameInput.current?.focus(); }}><Pencil size={14} /></button><button type="button" className={styles.mergeButton} onClick={() => { setMergeSource(tag.id); setMergeTarget(''); setDeleting(null); setError(''); }} disabled={tags.length < 2}>合并</button><button type="button" className={styles.iconButton} title={`删除 ${tag.name}`} aria-label={`删除 ${tag.name}`} onClick={() => { setDeleting(tag.id); setMergeSource(null); setError(''); }}><Trash2 size={14} /></button></div>}</div>) : <div className={styles.empty}><Tag size={23} /><p>暂无匹配标签</p><small>{canEdit ? '在下方新建标签，或调整筛选条件。' : '请调整关键词或分类。'}</small></div>}</div>
      <p className={styles.listFootnote}>{tags.length} 个已登记标签，文档数为全部可编辑知识库中的合计使用数。知识库和知识条目上的同名标记会一并同步。</p>
      {canEdit && sourceTag && <div className={styles.confirmPanel}><h4>合并「{sourceTag.name}」</h4><p>将来源标签归并到目标标签，并同步文档关联。请确认目标标签。</p><label className={styles.field} htmlFor={`${id}-merge-target`}><span>合并到</span><select id={`${id}-merge-target`} value={mergeTarget} onChange={event => setMergeTarget(event.target.value)}><option value="">选择目标标签</option>{tags.filter(tag => tag.id !== sourceTag.id).map(tag => <option key={tag.id} value={tag.id}>{tag.name}（{tag.category}）</option>)}</select></label><div className={styles.confirmActions}><button type="button" className={styles.secondary} onClick={() => setMergeSource(null)}>取消合并</button><button type="button" className={styles.primary} onClick={merge} disabled={!mergeTarget}><ArrowRight size={14} />确认合并</button></div></div>}
      {canEdit && deleteTag && <div className={styles.confirmPanel}><h4>删除「{deleteTag.name}」？</h4><p>当前资料范围有 {countFor(deleteTag)} 份文档使用此标签。删除标签会移除对应标记，文档内容将保留。</p><div className={styles.confirmActions}><button type="button" className={styles.secondary} onClick={() => setDeleting(null)}>保留标签</button><button type="button" className={styles.danger} onClick={remove}><Trash2 size={14} />确认删除标签</button></div></div>}
      {canEdit && <form className={styles.tagEditor} onSubmit={save}><div className={styles.editorHeading}><h3>{editing ? '编辑标签' : '新建标签'}</h3>{editing && <button type="button" onClick={resetEditor}>取消编辑</button>}</div><div className={styles.fieldGrid}><label className={styles.field} htmlFor={`${id}-tag-name`}><span>标签名称 <b>*</b></span><input id={`${id}-tag-name`} ref={nameInput} value={name} onChange={event => setName(event.target.value)} required maxLength={40} placeholder="例如：密度泛函理论" /></label><label className={styles.field} htmlFor={`${id}-tag-category`}><span>分类</span><select id={`${id}-tag-category`} value={category} onChange={event => setCategory(event.target.value)}>{tagCategories.map(item => <option key={item}>{item}</option>)}</select></label></div><label className={styles.field} htmlFor={`${id}-tag-aliases`}><span>别名</span><input id={`${id}-tag-aliases`} value={aliases} onChange={event => setAliases(event.target.value)} placeholder="例如：DFT，以逗号分隔多个别名" /></label><div className={styles.editorFooter}><span>统一同一概念的不同写法</span><button type="submit" className={styles.primary}>{editing ? <Check size={14} /> : <Plus size={14} />}{editing ? '保存修改' : '创建标签'}</button></div></form>}
      {canEdit && suggestions.length > 0 && <div className={styles.suggestions}><p>资料中尚未登记的标签</p><div>{suggestions.map(value => <button type="button" key={value} onClick={() => { resetEditor(); setName(value); nameInput.current?.focus(); }}><Plus size={12} />{value}</button>)}</div></div>}
      {error && <p className={styles.error} role="alert"><AlertCircle size={16} />{error}</p>}{notice && <p className={styles.success} role="status"><Check size={16} />{notice}</p>}
      <div className={styles.footer}><button type="button" className={styles.secondary} onClick={onClose}>完成</button></div>
    </div>
  </Modal>;
}
