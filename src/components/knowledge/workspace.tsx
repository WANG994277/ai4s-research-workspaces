'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, BookOpenCheck, ChevronDown, ChevronRight, FileText, FolderOpen, LibraryBig, LockKeyhole, MessageSquare, MoreHorizontal, Network, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus, Search, ShieldCheck, Star, Tags, Upload, X } from 'lucide-react';
import { Modal, useResearchProject } from '@/components/research/workspace-kit';
import { useKnowledge } from './store';
import { buildKnowledgeGraph } from './seed';
import { evidenceForSection, formatDate, textToSections, visibilityLabels, type Evidence, type KnowledgeBase, type KnowledgeEntryDraft } from './model';
import { KnowledgeDocuments } from './documents';
import { KnowledgeGraphView } from './graph';
import { KnowledgeChat } from './chat';
import { KnowledgeDocumentReader } from './reader';
import { KnowledgeEntries } from './entries';
import { BaseDialog, ImportDialog, TagsDialog } from './dialogs';
import styles from './knowledge.module.css';

const coreTabs = [{ key: 'documents', label: '文档', icon: FileText }, { key: 'graph', label: '知识图谱', icon: Network }, { key: 'chat', label: '知识问答', icon: MessageSquare }] as const;
const groups = [{ name: '我的知识库', visibility: 'private' }, { name: '团队知识库', visibility: 'team' }, { name: '共享给我', visibility: 'shared' }, { name: '收藏的知识库', visibility: 'favorite' }];

export function KnowledgeWorkspace({ segments }: { segments: string[] }) {
  const store = useKnowledge();
  const { data, ready } = store;
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const { project } = useResearchProject();
  const kbId = segments[0] ?? data.bases.find(b => b.canRead)?.id ?? '';
  const knowledgeBase = data.bases.find(b => b.id === kbId);
  const view = segments[1] ?? 'documents';
  const documentId = view === 'documents' ? segments[2] : undefined;
  const [directoryVisible, setDirectoryVisible] = useState(true);
  const [directoryModal, setDirectoryModal] = useState(false);
  const [assistantVisible, setAssistantVisible] = useState(true);
  const [librarySearch, setLibrarySearch] = useState('');
  const [openGroups, setOpenGroups] = useState(['我的知识库', '团队知识库']);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [retryUploadId, setRetryUploadId] = useState('');
  const [retryFile, setRetryFile] = useState<File>();
  const [retryError, setRetryError] = useState('');
  const [retrySaving, setRetrySaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeLink, setNoticeLink] = useState<{ href: string; label: string }>();
  const documents = useMemo(() => data.documents.filter(d => d.knowledgeBaseId === kbId), [data.documents, kbId]);
  const graph = useMemo(() => buildKnowledgeGraph(data.documents, kbId), [data.documents, kbId]);
  const messages = data.messages.filter(m => m.knowledgeBaseId === kbId);
  const currentDocument = documents.find(d => d.id === documentId);
  const entries = data.entries.filter(e => e.knowledgeBaseId === kbId);
  const root = `/knowledge/${encodeURIComponent(kbId)}`;
  const isDocumentList = view === 'documents' && !documentId;
  const showDirectory = isDocumentList && directoryVisible;
  const validRoute = segments.length <= (documentId ? 3 : 2) && ['documents', 'graph', 'chat', 'entries'].includes(view);

  useEffect(() => {
    if (ready && knowledgeBase && segments.length < 2) router.replace(`${root}/documents`);
  }, [ready, knowledgeBase, segments.length, router, root]);
  useEffect(() => { setNotice(''); setNoticeLink(undefined); }, [kbId]);
  useEffect(() => {
    const open = () => { if (isDocumentList) setAssistantVisible(true); else router.push(`${root}/chat`); };
    window.addEventListener('petrolab:open-assistant', open);
    return () => window.removeEventListener('petrolab:open-assistant', open);
  }, [isDocumentList, root, router]);

  function notify(message: string, link?: { href: string; label: string }) { setNotice(message); setNoticeLink(link); }
  function run(action: () => void, message?: string) { try { action(); if (message) notify(message); } catch (error) { notify(error instanceof Error ? error.message : '操作未完成，请重试。'); } }
  function navigateBase(base: KnowledgeBase) { router.push(`/knowledge/${encodeURIComponent(base.id)}/documents`); setDirectoryModal(false); }
  function ask(question: string, documentIds?: string[]) {
    const search = new URLSearchParams({ q: question }); if (documentIds) search.set('docs', documentIds.join(','));
    router.push(`${root}/chat?${search}`);
  }
  function openEvidence(evidence: Evidence) {
    if (evidence.documentId.startsWith('entry:')) {
      const id = evidence.documentId.slice(6);
      const entry = data.entries.find(e => e.id === id && e.knowledgeBaseId === kbId);
      const original = entry?.version === evidence.version ? entry : entry?.history?.find(v => v.version === evidence.version);
      if (!original || !textToSections(original.body).some(s => s.id === evidence.sectionId && s.text.includes(evidence.quote))) { notify('该知识条目的来源版本暂不可用，请重新核验。'); return; }
      router.push(`${root}/entries?${new URLSearchParams({ entry: id, version: evidence.version, section: evidence.sectionId })}`);
      return;
    }
    const sourceBase = data.bases.find(b => b.id === evidence.knowledgeBaseId);
    const document = data.documents.find(d => d.id === evidence.documentId && d.knowledgeBaseId === evidence.knowledgeBaseId);
    if (!sourceBase?.canRead || !document) { notify('来源文档已删除或当前无访问权限，未跳转到其他资料。'); return; }
    const version = evidence.version === document.version ? document : document.versions.find(v => v.version === evidence.version);
    if (!version?.sections.some(s => s.id === evidence.sectionId && s.text.includes(evidence.quote))) { notify('此引用的原始版本或段落暂不可用，请重新核验来源。'); return; }
    const back = documentId ? params.get('from') ?? `${root}/documents` : `${pathname}${params.size ? `?${params}` : ''}`;
    const search = new URLSearchParams({ version: evidence.version, section: evidence.sectionId, from: back });
    router.push(`/knowledge/${encodeURIComponent(evidence.knowledgeBaseId)}/documents/${encodeURIComponent(evidence.documentId)}?${search}`);
  }
  function saveEntry(draft: KnowledgeEntryDraft) {
    store.addEntry(draft); notify('已保存为知识条目，引用与来源版本一并保留。', { href: `${root}/entries`, label: '查看知识条目' });
  }
  async function createTask(title: string, evidence: Evidence[]) {
    const id = await store.createResearchTask(kbId, title, evidence, project.id);
    notify('已将所选证据加入科研思路探索任务草稿。', { href: `/read-space/agent?task=${encodeURIComponent(id)}&projectId=${encodeURIComponent(project.id)}`, label: '打开科研任务' });
  }
  function backFromReader() {
    const from = params.get('from');
    router.push(from?.startsWith(`${root}/`) && !from.startsWith('//') ? from : `${root}/documents`);
  }
  const citedEvidence = useMemo(() => {
    if (!currentDocument || !params.get('section')) return undefined;
    const version = params.get('version') ?? currentDocument.version;
    const content = version === currentDocument.version ? currentDocument.sections : currentDocument.versions.find(v => v.version === version)?.sections ?? [];
    const section = content.find(s => s.id === params.get('section'));
    return section ? evidenceForSection(currentDocument, section, version) : undefined;
  }, [currentDocument, params]);
  const citedEntryEvidence = useMemo((): Evidence | undefined => {
    const entry = entries.find(e => e.id === params.get('entry'));
    if (!entry || (!params.has('section') && !params.has('version'))) return undefined;
    const version = params.get('version') ?? entry.version;
    const source = version === entry.version ? entry : entry.history?.find(v => v.version === version);
    const section = source ? params.has('section') ? textToSections(source.body).find(s => s.id === params.get('section')) : textToSections(source.body)[0] : undefined;
    if (!section || !source) return undefined;
    return { id: `entry:${entry.id}@${version}:${section.id}`, knowledgeBaseId: kbId, documentId: `entry:${entry.id}`, documentTitle: source.title, version, sectionId: section.id, page: section.page, paragraph: section.paragraph, quote: section.text, section: section.title, pageKind: 'logical' };
  }, [entries, params, kbId]);

  const directory = <div className={styles.directoryInner}>
    <div className={styles.directoryHeading}><LibraryBig size={17} /><strong>知识库目录</strong><button title="新建知识库" aria-label="在目录新建知识库" onClick={() => setCreateOpen(true)}><Plus size={16} /></button></div>
    <label className={styles.directorySearch}><Search size={15} /><input value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} placeholder="搜索知识库" aria-label="搜索知识库" /></label>
    <div className={styles.directoryGroups}>{groups.map(group => {
      const bases = data.bases.filter(b => (group.visibility === 'favorite' ? b.favorite : b.visibility === group.visibility) && `${b.name} ${b.description} ${b.tags.join(' ')}`.toLowerCase().includes(librarySearch.toLowerCase()));
      const expanded = librarySearch.trim() || openGroups.includes(group.name);
      return <section key={group.name}><button className={styles.groupHeading} aria-expanded={!!expanded} onClick={() => setOpenGroups(old => old.includes(group.name) ? old.filter(g => g !== group.name) : [...old, group.name])}>
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}<span>{group.name}</span><small>{bases.length}</small>
      </button>{expanded && <div className={styles.baseList}>{bases.length ? bases.map(base => <button key={base.id} className={`${styles.baseButton} ${base.id === kbId ? styles.selectedBase : ''}`} aria-current={base.id === kbId ? 'page' : undefined} onClick={() => navigateBase(base)}>
        {base.canRead ? <BookOpen size={15} /> : <LockKeyhole size={15} />}<span><strong>{base.name}</strong><small>{visibilityLabels[base.visibility]}<i />{base.canRead ? `${data.documents.filter(d => d.knowledgeBaseId === base.id).length} 份文档` : '访问受限'}</small></span>
      </button>) : <p className={styles.directoryEmpty}>{librarySearch ? '没有匹配的知识库' : '暂无知识库'}</p>}</div>}</section>;
    })}</div>
    <div className={styles.directoryFooter}><ShieldCheck size={16} /><span>资料与处理记录保存在本机<br /><small>示例文献已单独标注</small></span></div>
  </div>;

  if (!ready) return <div className={styles.loading} role="status"><LibraryBig size={26} /><p>正在载入知识库与本地资料…</p><div /><div /><div /></div>;

  return <div className={styles.workspace}>
    <header className={styles.pageHeader}><div><h1><LibraryBig size={23} />知识库</h1><p>沉淀科研知识资产，支持检索、问答、复用与共享</p></div><div className={styles.headerActions}>
      <button className={styles.secondary} onClick={() => setDirectoryModal(true)}><FolderOpen size={15} />选择知识库</button>
      <button className={styles.secondary} disabled={!knowledgeBase?.canEdit || !knowledgeBase.canRead} onClick={() => setImportOpen(true)}><Upload size={15} />导入知识</button>
      <button className={styles.primary} onClick={() => setCreateOpen(true)}><Plus size={15} />新建知识库</button>
    </div></header>

    {store.storageError && <div className={styles.errorBanner} role="alert">{store.storageError}</div>}
    {notice && <div className={styles.notice} role="status"><span>{notice}</span>{noticeLink && <Link href={noticeLink.href}>{noticeLink.label}<ChevronRight size={14} /></Link>}<button aria-label="关闭提示" onClick={() => setNotice('')}><X size={15} /></button></div>}

    {!knowledgeBase || !validRoute || (documentId && !currentDocument) ? <div className={styles.emptyState}><FileText size={32} /><h2>{documentId ? '未找到此文档' : '未找到此知识库或页面'}</h2><p>内容可能已删除，或链接不完整。请选择知识库后继续。</p><button className={styles.primary} onClick={() => router.push('/knowledge')}>返回知识库</button></div>
    : !knowledgeBase.canRead ? <div className={styles.emptyState}><LockKeyhole size={34} /><h2>暂无当前知识库的访问权限</h2><p>请联系知识库管理员 {knowledgeBase.createdBy} 申请访问。</p><button className={styles.secondary} onClick={() => setDirectoryModal(true)}>选择其他知识库</button></div>
    : currentDocument && params.has('section') && !citedEvidence ? <div className={styles.emptyState}><FileText size={32} /><h2>引用版本或段落不可用</h2><p>此链接未能定位原始证据，未自动替换为当前正文。</p><button className={styles.secondary} onClick={() => router.push(`${root}/documents/${currentDocument.id}`)}>查看当前文档</button></div>
    : view === 'entries' && params.has('entry') && (params.has('version') || params.has('section')) && !citedEntryEvidence ? <div className={styles.emptyState}><BookOpen size={32} /><h2>知识条目的引用版本不可用</h2><p>未找到所请求的历史正文或段落，未自动替换为当前内容。</p><button className={styles.secondary} onClick={() => router.push(`${root}/entries?entry=${encodeURIComponent(params.get('entry') ?? '')}`)}>查看当前条目</button></div>
    : currentDocument ? <KnowledgeDocumentReader key={`${currentDocument.id}:${params.get('version') ?? ''}:${params.get('section') ?? ''}`} knowledgeBase={knowledgeBase} document={currentDocument} graph={graph} notes={data.notes.filter(n => n.knowledgeBaseId === kbId)} evidence={citedEvidence} onBack={backFromReader} onAsk={ask} onUpdateDocument={store.updateDocument} onAddNote={store.addNote} onSaveEntry={saveEntry} onCreateTask={createTask} onReplaceText={store.replaceText} />
    : <div className={`${styles.shell} ${showDirectory ? styles.withDirectory : ''}`}>
      {showDirectory && <aside className={styles.directory}>{directory}</aside>}
      <section className={styles.main}>
        <header className={styles.baseHeader}><div className={styles.baseTitleRow}>
          <div className={styles.baseTitle}><span className={styles.bookTile}>{knowledgeBase.cover && /^https?:\/\//i.test(knowledgeBase.cover) ? <Image src={knowledgeBase.cover} alt={`${knowledgeBase.name}封面`} width={46} height={46} unoptimized /> : <BookOpenCheck size={24} />}</span><div><h2>{knowledgeBase.name}</h2><p>{knowledgeBase.description || '为课题组织资料与知识证据'}</p></div></div>
          <div className={styles.baseActions}><button aria-label={knowledgeBase.favorite ? '取消收藏知识库' : '收藏知识库'} title="收藏知识库" className={knowledgeBase.favorite ? styles.starActive : ''} onClick={() => run(() => store.updateBase(kbId, { favorite: !knowledgeBase.favorite }))}><Star size={17} fill={knowledgeBase.favorite ? 'currentColor' : 'none'} /></button>
            {knowledgeBase.canEdit && <button className={styles.editButton} onClick={() => setEditOpen(true)}>编辑信息</button>}
            <details className={styles.more}><summary aria-label="知识库更多操作"><MoreHorizontal size={20} /></summary><div><Link href={`${root}/entries`}><BookOpen size={15} />知识条目（{entries.length}）</Link><button onClick={() => setTagsOpen(true)}><Tags size={15} />分类与标签</button><button onClick={() => setEditOpen(true)} disabled={!knowledgeBase.canEdit}><ShieldCheck size={15} />知识范围与配置</button></div></details>
          </div></div>
          <div className={styles.baseMeta}><span className={styles.visibility}><ShieldCheck size={12} />{visibilityLabels[knowledgeBase.visibility]}</span><span>{knowledgeBase.createdBy} 创建</span><span>{documents.length} 份文档</span><span>更新于 {formatDate(knowledgeBase.updatedAt)}</span>{!knowledgeBase.canEdit && <span>只读</span>}</div>
          <div className={styles.tags}>{knowledgeBase.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        </header>

        {view !== 'entries' && <div className={styles.tabRow}><nav aria-label="知识库核心视图" role="tablist" className={styles.tabs}>{coreTabs.map(tab => <Link key={tab.key} href={`${root}/${tab.key}`} role="tab" aria-selected={view === tab.key} className={view === tab.key ? styles.activeTab : ''}><tab.icon size={16} />{tab.label}{tab.key === 'documents' && <span>{documents.length}</span>}</Link>)}</nav>
          <div className={styles.viewActions}>{isDocumentList && <><button title={directoryVisible ? '收起知识库目录' : '展开知识库目录'} aria-label={directoryVisible ? '收起知识库目录' : '展开知识库目录'} onClick={() => setDirectoryVisible(v => !v)}>{directoryVisible ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}</button><button title={assistantVisible ? '收起知识助手' : '展开知识助手'} aria-label={assistantVisible ? '收起知识助手' : '展开知识助手'} onClick={() => setAssistantVisible(v => !v)}>{assistantVisible ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}</button></>}</div>
        </div>}

        {isDocumentList && <div className={`${styles.documentsLayout} ${assistantVisible ? styles.withAssistant : ''}`}><div className={styles.documentPane}><KnowledgeDocuments knowledgeBase={knowledgeBase} documents={documents} onOpenDocument={id => router.push(`${root}/documents/${encodeURIComponent(id)}`)} onAsk={ask} onGraph={id => router.push(`${root}/graph?doc=${encodeURIComponent(id)}`)} onRetry={async id => { if (documents.find(d => d.id === id)?.parseStatus === 'upload_failed') { setRetryUploadId(id); setRetryFile(undefined); setRetryError(''); return; } await store.reparse(id); notify('正文索引已更新。'); }} onDelete={store.deleteDocument} onImport={() => setImportOpen(true)} onUpdateDocument={store.updateDocument} /></div>
          {assistantVisible && <aside className={styles.assistant}><KnowledgeChat key={`compact:${kbId}`} knowledgeBase={knowledgeBase} documents={documents} entries={entries} graph={graph} messages={messages} onMessage={store.addMessage} onEvidence={openEvidence} onSaveEntry={saveEntry} compact onExpand={() => router.push(`${root}/chat`)} /></aside>}
        </div>}
        {view === 'graph' && <KnowledgeGraphView key={`${kbId}:${params.get('doc') ?? ''}`} knowledgeBase={knowledgeBase} documents={params.get('doc') ? documents.filter(d => d.id === params.get('doc')) : documents} graph={graph} onEvidence={openEvidence} onAsk={ask} onCreateTask={createTask} onSaveEntry={saveEntry} />}
        {view === 'chat' && <KnowledgeChat key={`full:${kbId}`} knowledgeBase={knowledgeBase} documents={documents} entries={entries} graph={graph} messages={messages} onMessage={store.addMessage} onEvidence={openEvidence} onSaveEntry={saveEntry} initialQuestion={params.get('q') ?? ''} initialDocumentIds={params.has('docs') ? params.get('docs')!.split(',').filter(Boolean) : undefined} />}
        {view === 'entries' && <KnowledgeEntries knowledgeBase={knowledgeBase} entries={entries} documents={documents} initialEntryId={params.get('entry') ?? undefined} initialEvidence={citedEntryEvidence} onSave={saveEntry} onUpdate={store.updateEntry} onDelete={store.deleteEntry} onEvidence={openEvidence} onBack={() => router.push(`${root}/documents`)} />}
      </section>
    </div>}

    <Modal open={directoryModal} onClose={() => setDirectoryModal(false)} title="选择知识库" description="选择当前资料、图谱与问答的共同知识范围。">{directory}</Modal>
    <Modal open={!!retryUploadId} onClose={() => { if (!retrySaving) setRetryUploadId(''); }} title="重新上传文档" description="重新选择原文件。成功后恢复此文档记录，不创建重复文档。">
      <label className="grid gap-2 text-sm">选择文件<input type="file" disabled={retrySaving} onChange={event => setRetryFile(event.target.files?.[0])} /></label>
      {retryError && <p role="alert" className="text-sm text-red-700">{retryError}</p>}
      <button className={styles.primary} disabled={!retryFile || retrySaving} onClick={async () => { if (!retryFile) return; setRetrySaving(true); setRetryError(''); try { await store.replaceFile(retryUploadId, retryFile); setRetryUploadId(''); notify('文件已重新保存。'); } catch (error) { setRetryError(error instanceof Error ? error.message : '重新上传失败'); } finally { setRetrySaving(false); } }}>{retrySaving ? '正在恢复…' : '恢复文档'}</button>
    </Modal>
    <BaseDialog open={createOpen} onClose={() => setCreateOpen(false)} onSave={draft => { const id = store.createBase(draft); setCreateOpen(false); router.push(`/knowledge/${id}/documents`); }} />
    {knowledgeBase && <><BaseDialog open={editOpen} base={knowledgeBase} onClose={() => setEditOpen(false)} onSave={draft => { store.updateBase(kbId, draft); setEditOpen(false); notify('知识库信息已更新。'); }} />
      <ImportDialog open={importOpen} knowledgeBase={knowledgeBase} referenceDocuments={data.documents.filter(d => data.bases.find(b => b.id === d.knowledgeBaseId)?.canRead)} onClose={() => setImportOpen(false)} onFiles={(files, type, tags) => store.importFiles(kbId, files, type, tags)} onReference={(document, source) => store.importReference(kbId, document, source)} onUrl={(url, title, type, text) => store.importUrl(kbId, url, title, type, text)} />
      <TagsDialog open={tagsOpen} tags={data.tags} documents={data.documents.filter(d => data.bases.some(b => b.id === d.knowledgeBaseId && b.canRead && b.canEdit))} canEdit={knowledgeBase.canEdit && knowledgeBase.canRead} onClose={() => setTagsOpen(false)} onSave={store.saveTag} onMerge={store.mergeTags} onDelete={store.deleteTag} />
    </>}
    <footer className={styles.footer}>知识库范围内检索 · 引用可回溯到文档与版本 <span>本地原型</span></footer>
  </div>;
}
