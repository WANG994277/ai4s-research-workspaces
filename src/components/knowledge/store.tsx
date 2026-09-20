'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { initialKnowledgeState } from './seed';
import { createKnowledgeResearchTask } from './handoff';
import { extensionOf, getFileBlob, putFileBlob, textExtensions, validateFile } from './files';
import { makeId, textToSections, type DocumentNote, type DocumentType, type Evidence, type KnowledgeBase, type KnowledgeChatMessage, type KnowledgeDocument, type KnowledgeEntry, type KnowledgeEntryDraft, type KnowledgeState, type KnowledgeTag } from './model';

export const KNOWLEDGE_STORAGE_KEY = 'ai4s-knowledge-v1';
type BaseDraft = Pick<KnowledgeBase, 'name' | 'description' | 'cover' | 'domain' | 'tags' | 'visibility' | 'autoGraph' | 'qaEnabled' | 'allowedMembers'>;
interface KnowledgeStore {
  data: KnowledgeState; ready: boolean; storageError: string;
  createBase: (draft: BaseDraft) => string; updateBase: (id: string, patch: Partial<KnowledgeBase>) => void;
  updateDocument: (id: string, patch: Partial<KnowledgeDocument>) => void; deleteDocument: (id: string) => void;
  importFiles: (kbId: string, files: File[], type: DocumentType, tags: string[]) => Promise<void>;
  replaceFile: (documentId: string, file: File) => Promise<void>;
  importReference: (kbId: string, document: KnowledgeDocument, sourceType: string) => void;
  importUrl: (kbId: string, url: string, title: string, type: DocumentType, text: string) => void;
  reparse: (id: string) => Promise<void>; replaceText: (id: string, text: string, changeNote: string) => void;
  addMessage: (message: KnowledgeChatMessage) => void; addNote: (note: DocumentNote) => void;
  addEntry: (draft: KnowledgeEntryDraft) => string; updateEntry: (id: string, patch: Partial<KnowledgeEntry>) => void; deleteEntry: (id: string) => void;
  saveTag: (tag: KnowledgeTag) => void; mergeTags: (sourceId: string, targetId: string) => void; deleteTag: (id: string) => void;
  createResearchTask: (kbId: string, title: string, evidence: Evidence[], projectId: string) => Promise<string>;
}
const Context = createContext<KnowledgeStore | null>(null);

function isState(value: unknown): value is KnowledgeState {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<KnowledgeState>;
  return data.schemaVersion === 1 && [data.bases, data.documents, data.entries, data.messages, data.notes, data.tags].every(Array.isArray)
    && data.bases!.every(b => typeof b.id === 'string' && Array.isArray(b.tags) && Array.isArray(b.domain))
    && data.documents!.every(d => typeof d.id === 'string' && Array.isArray(d.sections) && Array.isArray(d.versions) && Array.isArray(d.tags));
}
function now() { return new Date().toISOString(); }

export function KnowledgeProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<KnowledgeState>(initialKnowledgeState);
  const state = useRef(data);
  const storedSnapshot = useRef<string | null>(null);
  const writable = useRef(true);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
      storedSnapshot.current = saved;
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!isState(parsed)) throw new Error('缓存格式不兼容');
        const interrupted = ['uploading', 'parsing', 'indexing', 'graph_extracting'];
        const restored = { ...parsed, documents: parsed.documents.map(d => interrupted.includes(d.parseStatus)
          ? { ...d, parseStatus: 'failed' as const, graphStatus: 'pending' as const, error: '上次处理被中断，原文件与已保存正文保留，请重新解析。' } : d) };
        state.current = restored; setData(restored);
      }
    } catch {
      writable.current = false;
      setStorageError('本地缓存无法读取。为保护原数据，当前只显示示例；请备份浏览器中的 ai4s-knowledge-v1 数据后恢复存储。');
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== KNOWLEDGE_STORAGE_KEY) return;
      try {
        const incoming: unknown = event.newValue ? JSON.parse(event.newValue) : initialKnowledgeState();
        if (!isState(incoming)) throw new Error('无效缓存');
        storedSnapshot.current = event.newValue; state.current = incoming; setData(incoming);
        writable.current = true; setStorageError('');
      } catch { writable.current = false; setStorageError('其他窗口写入的资料格式无法读取，已停止覆盖。请恢复存储后重试。'); }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  function commit(change: (current: KnowledgeState) => KnowledgeState) {
    if (!writable.current) throw new Error('本地存储暂不可写，原数据未覆盖。');
    const latest = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (latest !== storedSnapshot.current) {
      const incoming: unknown = latest ? JSON.parse(latest) : initialKnowledgeState();
      if (!isState(incoming)) throw new Error('其他窗口的数据格式无法读取，本次操作未覆盖原数据。');
      storedSnapshot.current = latest; state.current = incoming; setData(incoming);
      throw new Error('资料已在其他窗口更新，当前列表已同步。请检查后重试本次操作。');
    }
    const next = change(state.current);
    const serialized = JSON.stringify(next);
    try { localStorage.setItem(KNOWLEDGE_STORAGE_KEY, serialized); }
    catch { setStorageError('本地保存失败，可能是存储空间不足。请导出资料或清理浏览器存储后重试；本次操作未保存。'); throw new Error('本地保存失败，本次操作未保存。'); }
    storedSnapshot.current = serialized; state.current = next; setData(next); setStorageError('');
  }
  function baseFor(id: string, edit = true) {
    const kb = state.current.bases.find(b => b.id === id);
    if (!kb?.canRead || (edit && !kb.canEdit)) throw new Error('没有此知识库的操作权限。');
    return kb;
  }
  function documentFor(id: string) {
    const document = state.current.documents.find(d => d.id === id);
    if (!document) throw new Error('文档不存在或已删除。');
    baseFor(document.knowledgeBaseId);
    return document;
  }
  function updateDocument(id: string, patch: Partial<KnowledgeDocument>) {
    const document = documentFor(id);
    commit(s => ({ ...s, documents: s.documents.map(d => d.id === id ? { ...d, ...patch, id: d.id, knowledgeBaseId: d.knowledgeBaseId, updatedAt: now() } : d),
      bases: s.bases.map(b => b.id === document.knowledgeBaseId ? { ...b, updatedAt: now() } : b) }));
  }
  function addDocument(document: KnowledgeDocument) {
    baseFor(document.knowledgeBaseId);
    commit(s => ({ ...s, documents: [document, ...s.documents], bases: s.bases.map(b => b.id === document.knowledgeBaseId ? { ...b, updatedAt: now() } : b) }));
  }
  function makeDocument(kbId: string, title: string, type: DocumentType, sourceType: string, tags: string[]): KnowledgeDocument {
    return { id: makeId('doc'), knowledgeBaseId: kbId, title, documentType: type, fileType: 'TXT', sourceType,
      relatedProjectId: '', author: '作者未提供', version: 'v1.0', parseStatus: 'pending', graphStatus: 'pending',
      tags, sections: [], versions: [], favorite: false, isDemo: false, createdAt: now(), updatedAt: now() };
  }
  function indexText(id: string, text: string) {
    const document = documentFor(id);
    if (!text.trim()) throw new Error('正文为空，请补充可检索文本。');
    if (text.length > 300_000) throw new Error('本地原型单份正文最多 30 万字符，请拆分后导入。');
    const sections = textToSections(text);
    const kb = baseFor(document.knowledgeBaseId);
    updateDocument(id, { sections, pageKind: 'logical', parseStatus: 'ready', graphStatus: kb.autoGraph ? 'ready' : 'pending', error: undefined,
      versions: [{ version: document.version, updatedAt: now(), updatedBy: '张博士', changeNote: '建立本地正文索引', sections, fileId: document.fileId, pageKind: 'logical' }] });
  }
  async function importFiles(kbId: string, files: File[], type: DocumentType, tags: string[]) {
    baseFor(kbId);
    if (!files.length) throw new Error('请选择文件。');
    if (files.length > 50) throw new Error('每次最多导入 50 个文件。');
    files.forEach(validateFile);
    const failures: string[] = [];
    for (const file of files) {
      const sourceId = `local-file:${file.name}:${file.size}:${file.lastModified}`;
      const previous = state.current.documents.find(d => d.knowledgeBaseId === kbId && d.sourceId === sourceId && ['upload_failed', 'failed', 'index_failed', 'graph_failed'].includes(d.parseStatus));
      if (previous) {
        try { await replaceFile(previous.id, file); }
        catch (error) { failures.push(`${file.name}：${error instanceof Error ? error.message : '重试失败'}`); }
        continue;
      }
      const document = makeDocument(kbId, file.name.replace(/\.[^.]+$/, ''), type, '手动上传', tags);
      document.sourceId = sourceId;
      document.fileId = makeId('file'); document.fileName = file.name; document.fileSize = file.size;
      document.mimeType = file.type; document.fileType = extensionOf(file.name).toUpperCase(); document.parseStatus = 'uploading';
      addDocument(document);
      let blobSaved = false;
      try {
        await putFileBlob(document.fileId, file);
        blobSaved = true;
        if (textExtensions.has(extensionOf(file.name))) {
          updateDocument(document.id, { parseStatus: 'parsing' });
          const text = await file.text();
          indexText(document.id, text);
        } else {
          updateDocument(document.id, { parseStatus: 'pending', error: '原文件已保存在本机。此格式需要解析服务；可在阅读器补充可检索正文。' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '导入失败';
        updateDocument(document.id, { parseStatus: blobSaved ? 'failed' : 'upload_failed', error: message });
        failures.push(`${file.name}：${message}`);
      }
    }
    if (failures.length) throw new Error(`${files.length - failures.length} 个文件已导入。${failures.join('；')}`);
  }
  async function replaceFile(id: string, file: File) {
    validateFile(file); const document = documentFor(id);
    if (!['upload_failed', 'failed', 'index_failed', 'graph_failed'].includes(document.parseStatus)) throw new Error('仅处理失败的文档可在此重新上传。');
    const fileId = makeId('file'); let blobSaved = false;
    updateDocument(id, { parseStatus: 'uploading', error: undefined });
    try {
      await putFileBlob(fileId, file); blobSaved = true;
      updateDocument(id, { fileId, fileName: file.name, fileType: extensionOf(file.name).toUpperCase(), fileSize: file.size, mimeType: file.type, parseStatus: 'pending' });
      if (textExtensions.has(extensionOf(file.name))) indexText(id, await file.text());
      else updateDocument(id, { error: '原文件已保存。此格式需要解析服务，或在阅读器补充可检索正文。' });
    } catch (error) {
      updateDocument(id, { parseStatus: blobSaved ? 'failed' : 'upload_failed', error: error instanceof Error ? error.message : '重新上传失败' }); throw error;
    }
  }
  async function reparse(id: string) {
    const document = documentFor(id);
    try {
      updateDocument(id, { parseStatus: 'parsing', error: undefined });
      let text = document.sections.map(s => s.text).join('\n\n');
      if (!text && document.fileId && textExtensions.has(document.fileType.toLowerCase())) {
        const blob = await getFileBlob(document.fileId); text = blob ? await blob.text() : '';
      }
      if (!text.trim()) throw new Error('尚未连接此格式的解析服务。原件已保留，请在阅读器补充可检索正文后重试。');
      // Reindex existing sections in place: evidence anchors and historical versions stay stable.
      const kb = baseFor(document.knowledgeBaseId);
      updateDocument(id, { sections: document.sections.length ? document.sections : textToSections(text), parseStatus: 'ready', graphStatus: kb.autoGraph ? 'ready' : 'pending', error: undefined });
    } catch (error) {
      updateDocument(id, { parseStatus: 'failed', graphStatus: 'failed', error: error instanceof Error ? error.message : '解析失败' });
      throw error;
    }
  }
  function replaceText(id: string, text: string, changeNote: string) {
    const document = documentFor(id); const kb = baseFor(document.knowledgeBaseId);
    if (!text.trim() || text.length > 300_000) throw new Error('正文不能为空，且不能超过 30 万字符。');
    const match = /v(\d+)\.(\d+)/.exec(document.version);
    const version = `v${match?.[1] ?? '1'}.${Number(match?.[2] ?? '0') + 1}`;
    const sections = textToSections(text);
    const history = document.versions.some(v => v.version === document.version) ? document.versions
      : [...document.versions, { version: document.version, updatedAt: document.updatedAt, updatedBy: document.author, changeNote: '原始版本', sections: document.sections, fileId: document.fileId, pageKind: document.pageKind }];
    updateDocument(id, { sections, version, pageKind: 'logical', parseStatus: 'ready',
      graphStatus: kb.autoGraph ? 'ready' : 'pending', error: undefined,
      versions: [...history, { version, sections, fileId: document.fileId, pageKind: 'logical', updatedAt: now(), updatedBy: '张博士', changeNote: changeNote.trim() || '人工更新可检索正文（逻辑页，不对应原文件页码）' }] });
  }
  function addEntry(draft: KnowledgeEntryDraft) {
    baseFor(draft.knowledgeBaseId);
    if (!draft.title.trim() || !draft.body.trim()) throw new Error('知识条目需要标题和正文。');
    const id = makeId('entry');
    commit(s => ({ ...s, entries: [{ ...draft, id, createdBy: '张博士', createdAt: now(), updatedAt: now(), version: 'v1.0' }, ...s.entries] }));
    return id;
  }
  function mutateTagNames(source: string, target?: string, aliases: string[] = []) {
    const editable = new Set(state.current.bases.filter(b => b.canEdit && b.canRead).map(b => b.id));
    const names = new Set([source, ...aliases]);
    const translate = (tags: string[]) => [...new Set(tags.flatMap(t => names.has(t) ? target ? [target] : [] : [t]))];
    return { documents: state.current.documents.map(d => editable.has(d.knowledgeBaseId) ? { ...d, tags: translate(d.tags) } : d),
      bases: state.current.bases.map(b => editable.has(b.id) ? { ...b, tags: translate(b.tags) } : b),
      entries: state.current.entries.map(e => editable.has(e.knowledgeBaseId) ? { ...e, tags: translate(e.tags) } : e) };
  }
  const api: KnowledgeStore = {
    data, ready, storageError,
    createBase(draft) {
      if (!draft.name.trim()) throw new Error('请输入知识库名称。');
      const id = makeId('kb');
      commit(s => ({ ...s, bases: [...s.bases, { ...draft, id, name: draft.name.trim(), createdBy: '张博士', createdAt: now(), updatedAt: now(), favorite: false, canRead: true, canEdit: true }] }));
      return id;
    },
    updateBase(id, patch) {
      const favoriteOnly = Object.keys(patch).every(key => key === 'favorite');
      baseFor(id, !favoriteOnly);
      commit(s => ({ ...s, bases: s.bases.map(b => b.id === id ? { ...b, ...patch, id: b.id, updatedAt: now() } : b) }));
    },
    updateDocument, importFiles, replaceFile, reparse, replaceText, addEntry,
    deleteDocument(id) { documentFor(id); commit(s => ({ ...s, documents: s.documents.filter(d => d.id !== id) })); },
    importReference(kbId, original, sourceType) {
      baseFor(kbId); baseFor(original.knowledgeBaseId, false);
      if (state.current.documents.some(d => d.knowledgeBaseId === kbId && d.sourceId === original.id)) throw new Error('这份资料已经引用到当前知识库。');
      const copy = { ...structuredClone(original), id: makeId('doc'), knowledgeBaseId: kbId, sourceType, sourceId: original.id, createdAt: now(), updatedAt: now(), favorite: false };
      addDocument(copy);
    },
    importUrl(kbId, url, title, type, text) {
      const address = new URL(url);
      if (!['https:', 'http:'].includes(address.protocol)) throw new Error('仅支持 http/https 来源链接。');
      if (!title.trim()) throw new Error('请输入资料名称。');
      if (text.length > 300_000) throw new Error('本地原型单份正文最多 30 万字符，请拆分后导入。');
      if (state.current.documents.some(d => d.knowledgeBaseId === kbId && d.sourceUrl === address.href)) throw new Error('此链接已存在于当前知识库，请在文档阅读器更新正文。');
      const document = makeDocument(kbId, title, type, 'URL 导入', []);
      document.sourceUrl = address.href; document.fileType = 'URL';
      document.error = '已保存链接，尚未抓取网页。可补充正文或接入来源解析服务。';
      if (text.trim()) {
        const kb = baseFor(kbId); const sections = textToSections(text);
        Object.assign(document, { sections, pageKind: 'logical', parseStatus: 'ready', graphStatus: kb.autoGraph ? 'ready' : 'pending', error: undefined,
          versions: [{ version: 'v1.0', sections, updatedAt: now(), updatedBy: '张博士', changeNote: '用户提供正文，按逻辑页建立索引', pageKind: 'logical' }] });
      }
      addDocument(document);
    },
    addMessage(message) { baseFor(message.knowledgeBaseId, false); commit(s => ({ ...s, messages: [...s.messages.filter(m => m.id !== message.id), message] })); },
    addNote(note) { baseFor(note.knowledgeBaseId); commit(s => ({ ...s, notes: [...s.notes, note] })); },
    updateEntry(id, patch) {
      const entry = state.current.entries.find(e => e.id === id); if (!entry) throw new Error('条目不存在。'); baseFor(entry.knowledgeBaseId);
      commit(s => ({ ...s, entries: s.entries.map(e => e.id === id ? { ...e, ...patch, id: e.id, knowledgeBaseId: e.knowledgeBaseId, updatedAt: now(), version: `v1.${Number(e.version.split('.')[1] || '0') + 1}`, history: [...(e.history ?? []), { version: e.version, title: e.title, body: e.body, updatedAt: e.updatedAt }] } : e) }));
    },
    deleteEntry(id) { const entry = state.current.entries.find(e => e.id === id); if (entry) baseFor(entry.knowledgeBaseId); commit(s => ({ ...s, entries: s.entries.filter(e => e.id !== id) })); },
    saveTag(tag) {
      if (!tag.name.trim()) throw new Error('标签名称不能为空。');
      if (state.current.tags.some(t => t.id !== tag.id && t.name === tag.name.trim())) throw new Error('已存在同名标签。');
      const old = state.current.tags.find(t => t.id === tag.id);
      const translated = old && old.name !== tag.name ? mutateTagNames(old.name, tag.name, old.aliases) : {};
      commit(s => ({ ...s, ...translated, tags: [...s.tags.filter(t => t.id !== tag.id), { ...tag, name: tag.name.trim() }] }));
    },
    mergeTags(sourceId, targetId) {
      const source = state.current.tags.find(t => t.id === sourceId), target = state.current.tags.find(t => t.id === targetId);
      if (!source || !target || sourceId === targetId) throw new Error('请选择两个不同的标签。');
      const translated = mutateTagNames(source.name, target.name, source.aliases);
      commit(s => ({ ...s, ...translated, tags: s.tags.filter(t => t.id !== sourceId).map(t => t.id === targetId ? { ...t, aliases: [...new Set([...t.aliases, source.name, ...source.aliases])] } : t) }));
    },
    deleteTag(id) { const tag = state.current.tags.find(t => t.id === id); if (!tag) return; const translated = mutateTagNames(tag.name, undefined, tag.aliases); commit(s => ({ ...s, ...translated, tags: s.tags.filter(t => t.id !== id) })); },
    async createResearchTask(kbId, title, evidence, projectId) {
      const knowledgeBase = baseFor(kbId, false);
      return createKnowledgeResearchTask({ knowledgeBase, title, evidence, projectId });
    },
  };
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export function useKnowledge() { const value = useContext(Context); if (!value) throw new Error('KnowledgeProvider is required'); return value; }
