export type Visibility = 'private' | 'team' | 'shared';
export type DocumentType = '论文' | '标准' | '专利' | '报告' | '实验资料' | '技术文档' | '笔记' | '知识条目';
export type ParseStatus = 'uploading' | 'pending' | 'parsing' | 'indexing' | 'graph_extracting' | 'ready' | 'upload_failed' | 'failed' | 'index_failed' | 'graph_failed';
export type GraphStatus = 'pending' | 'extracting' | 'ready' | 'failed';
export type ChatMode = '问知识' | '做总结' | '做对比' | '找证据' | '找冲突' | '找关系' | '找空白' | '生成综述';

export interface KnowledgeBase {
  id: string; name: string; description: string; cover?: string; domain: string[]; tags: string[];
  visibility: Visibility; createdBy: string; createdAt: string; updatedAt: string;
  favorite: boolean; canRead: boolean; canEdit: boolean; autoGraph: boolean; qaEnabled: boolean;
  allowedMembers?: string[];
}

export interface DocumentSection {
  id: string; title: string; page: number; paragraph: number; text: string;
}

export interface DocumentVersion {
  version: string; updatedAt: string; updatedBy: string; changeNote: string; sections: DocumentSection[]; fileId?: string;
  pageKind?: 'logical' | 'original';
}

export interface KnowledgeDocument {
  id: string; knowledgeBaseId: string; title: string; documentType: DocumentType; fileType: string;
  fileName?: string; fileId?: string; fileSize?: number; mimeType?: string; sourceUrl?: string;
  sourceType: string; sourceId?: string; relatedProjectId: string; author: string; version: string;
  parseStatus: ParseStatus; graphStatus: GraphStatus; tags: string[]; sections: DocumentSection[];
  createdAt: string; updatedAt: string; versions: DocumentVersion[]; favorite: boolean;
  isDemo: boolean; error?: string;
  pageKind?: 'logical' | 'original';
}

export interface Evidence {
  id: string; knowledgeBaseId: string; documentId: string; documentTitle: string;
  version: string; sectionId: string; page: number; paragraph: number; quote: string; section: string;
  pageKind?: 'logical' | 'original';
}

export interface GraphEntity {
  id: string; knowledgeBaseId: string; name: string; type: string; description: string;
  tags: string[]; evidenceIds: string[]; confirmed: boolean;
}

export interface GraphRelation {
  id: string; sourceEntityId: string; targetEntityId: string; relationType: string;
  evidenceIds: string[]; confirmed: boolean; extractedAt: string; extractionMethod: string;
}

export interface KnowledgeGraph { entities: GraphEntity[]; relations: GraphRelation[]; evidence: Evidence[] }

export interface KnowledgeChatMessage {
  id: string; knowledgeBaseId: string; role: 'user' | 'assistant'; content: string;
  mode: ChatMode; citations: Evidence[]; createdAt: string; documentIds?: string[];
  channels?: string[];
}

export interface KnowledgeEntry {
  id: string; knowledgeBaseId: string; title: string; type: string; body: string; summary: string;
  tags: string[]; domain: string; sourceLabel: string; documentIds: string[]; entityIds: string[];
  relatedProjectId: string; version: string; createdBy: string; createdAt: string; updatedAt: string;
  evidence: Evidence[];
  history?: { version: string; title: string; body: string; updatedAt: string }[];
}
export type KnowledgeEntryDraft = Omit<KnowledgeEntry, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'version'>;

export interface DocumentNote {
  id: string; documentId: string; knowledgeBaseId: string; sectionId: string; version: string;
  text: string; createdAt: string;
}
export interface KnowledgeTag { id: string; name: string; category: string; aliases: string[] }
export interface KnowledgeState {
  schemaVersion: 1; bases: KnowledgeBase[]; documents: KnowledgeDocument[];
  entries: KnowledgeEntry[]; messages: KnowledgeChatMessage[]; notes: DocumentNote[]; tags: KnowledgeTag[];
}

export const documentTypes: DocumentType[] = ['论文', '标准', '专利', '报告', '实验资料', '技术文档', '笔记'];
export const chatModes: ChatMode[] = ['问知识', '做总结', '做对比', '找证据', '找冲突', '找关系', '找空白', '生成综述'];
export const visibilityLabels: Record<Visibility, string> = { private: '私有', team: '团队', shared: '共享' };
export const statusLabels: Record<ParseStatus, string> = {
  uploading: '上传中', pending: '待解析', parsing: '解析中', indexing: '索引中', graph_extracting: '图谱抽取中',
  ready: '可用', upload_failed: '上传失败', failed: '解析失败', index_failed: '索引失败', graph_failed: '图谱抽取失败',
};
export const graphStatusLabels: Record<GraphStatus, string> = { pending: '待抽取', extracting: '抽取中', ready: '已完成', failed: '抽取失败' };
export const tagCategories = ['专业领域', '技术方向', '知识类型', '科研方法', '数据类型', '材料', '模型', '软件', '设备', '实验类型', '成果类型'];
export const entityTypes = ['技术方向', '科学问题', '机理', '材料', '方法', '模型', '软件', '参数', '设备', '实验', '文献', '作者 / 专家', '成果'];

export function makeId(prefix: string) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
export function evidenceForSection(document: KnowledgeDocument, section: DocumentSection, version = document.version): Evidence {
  const recordedKind = version === document.version ? document.pageKind : document.versions.find(v => v.version === version)?.pageKind;
  return { id: `${document.id}@${version}:${section.id}`, knowledgeBaseId: document.knowledgeBaseId, documentId: document.id,
    documentTitle: document.title, version, sectionId: section.id, page: section.page, paragraph: section.paragraph,
    quote: section.text, section: section.title, pageKind: recordedKind ?? (['TXT', 'MD', 'MARKDOWN', 'CSV', 'URL'].includes(document.fileType.toUpperCase()) ? 'logical' : 'original') };
}
export function documentText(document: KnowledgeDocument) { return document.sections.map(s => s.text).join('\n'); }
export function textToSections(text: string): DocumentSection[] {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const parts = blocks.flatMap(block => block.length > 1500 ? block.match(/[\s\S]{1,1200}/g) ?? [] : [block]);
  return parts.map((part, i) => ({ id: `section-${i + 1}`, title: part.startsWith('#') ? part.split('\n')[0].replace(/^#+\s*/, '') : `正文段落 ${i + 1}`,
    page: Math.floor(i / 5) + 1, paragraph: i % 5 + 1, text: part.replace(/^#+\s*/, '') }));
}
export function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(date);
}
