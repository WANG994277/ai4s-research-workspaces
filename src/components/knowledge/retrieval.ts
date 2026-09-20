import { evidenceForSection, textToSections, type ChatMode, type DocumentType, type Evidence, type GraphRelation, type KnowledgeDocument, type KnowledgeEntry, type KnowledgeGraph } from './model';

export type RetrievalChannel = '正文片段' | '图谱关系' | '文档元数据';
export interface RetrievalInput {
  query: string;
  knowledgeBaseId: string;
  documents: KnowledgeDocument[];
  entries?: KnowledgeEntry[];
  graph: KnowledgeGraph;
  /** Includes entry:<id> for knowledge entries. Undefined selects all eligible sources; [] selects none. */
  documentIds?: string[];
  documentTypes?: DocumentType[];
  tags?: string[];
  /** Inclusive document updated-at date, YYYY-MM-DD. */
  fromDate?: string;
  toDate?: string;
}
export interface EvidenceMatch {
  evidence: Evidence;
  score: number;
  channels: RetrievalChannel[];
  scores: { text: number; graph: number; metadata: number };
  matchedTerms: string[];
  relationIds: string[];
}
export interface RetrievedRelation {
  relation: GraphRelation;
  sourceName: string;
  targetName: string;
  evidenceIds: string[];
}
export interface RetrievalResult {
  evidence: Evidence[];
  matches: EvidenceMatch[];
  channels: RetrievalChannel[];
  eligibleDocumentIds: string[];
  excludedDocumentCount: number;
  queryTerms: string[];
  relations: RetrievedRelation[];
  overview: boolean;
}

const STOP_WORDS = new Set(['的', '了', '与', '和', '及', '在', '是', '有', '对', '从', '中', '这', '该', '请', '帮我', '一下', '哪些', '什么', '如何', '怎么', '为什么', '是否', '可以', '进行', '相关', '关于', '包含', '这个', '这些', '它们', '文档', '文章', '论文', '资料', '材料', '内容', '主要', '核心', '观点', '要点', '研究', '结论', '总结', '概述', '介绍', '梳理', '证据', '原文', '来源', '依据', '展示', '列出', '查找', '找到', '检索', '回答', '问题', '对比', '比较', '区别', '差异', '冲突', '关系', '空白', '生成', '综述', '当前', '知识库', '继续', '进一步', '详细', '说明', 'the', 'a', 'an', 'and', 'or', 'of', 'in', 'to', 'is', 'are', 'what', 'how', 'why', 'please', 'summarize', 'summary', 'compare', 'evidence', 'document', 'documents']);
for (const word of ['范围', '文献', '全部', '所有', '请问', '要点', '中的', '这篇', '本篇', '本库', '知识', '条目']) STOP_WORDS.add(word);
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase();
const SCIENTIFIC_SINGLE_WORDS = new Set(Array.from('锂钠钾铝铁镍钴锰钛硅硫磷氢氧氮氟氯碳铜锌锡硼钙镁铂金银钨钼钒铬光热磁酶'));

function queryTerms(query: string): string[] {
  const normalized = normalize(query);
  const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
  return [...new Set(Array.from(segmenter.segment(normalized))
    .filter(part => part.isWordLike)
    .map(part => part.segment)
    .filter(word => (word.length > 1 || SCIENTIFIC_SINGLE_WORDS.has(word)) && !STOP_WORDS.has(word)))];
}

function matchesTerms(value: string, terms: string[]) {
  const text = normalize(value);
  return terms.filter(term => text.includes(term));
}

function isOverviewQuery(query: string, terms: string[]) {
  // A deliberate whole-document overview is useful; an unmatched topic must never trigger it.
  if (terms.length > 0) return false;
  return /总结|概述|梳理|主要内容|核心观点|生成综述|summari[sz]e|summary/i.test(query);
}

function evidenceKey(evidence: Evidence) {
  return `${evidence.documentId}@${evidence.version}:${evidence.sectionId}`;
}

/** A retrieval-only projection. The entry remains an authored note, never a verified external source. */
export function projectKnowledgeEntries(entries: KnowledgeEntry[]): KnowledgeDocument[] {
  return entries.map(entry => {
    const sections = textToSections(entry.body);
    return {
      id: `entry:${entry.id}`, knowledgeBaseId: entry.knowledgeBaseId, title: `知识条目（人工整理）· ${entry.title}`,
      documentType: '知识条目', fileType: 'ENTRY', sourceType: '人工或检索整理的知识条目', sourceId: entry.id,
      relatedProjectId: entry.relatedProjectId, author: entry.createdBy, version: entry.version,
      parseStatus: sections.length ? 'ready' : 'pending', graphStatus: 'pending', tags: entry.tags, sections,
      createdAt: entry.createdAt, updatedAt: entry.updatedAt, favorite: false, isDemo: false, pageKind: 'logical',
      versions: (entry.history ?? []).map(version => ({ version: version.version, updatedAt: version.updatedAt,
        updatedBy: '', changeNote: '知识条目历史快照', sections: textToSections(version.body), pageKind: 'logical' })),
    };
  });
}

/** Local lexical + graph + metadata retrieval. No embedding or remote model is used. */
export function retrieveEvidence(input: RetrievalInput): RetrievalResult {
  const { knowledgeBaseId, query, graph } = input;
  const baseDocuments = [...input.documents, ...projectKnowledgeEntries(input.entries ?? [])]
    .filter(document => document.knowledgeBaseId === knowledgeBaseId);
  const datesValid = !(input.fromDate && input.toDate && input.fromDate > input.toDate);
  const eligible = baseDocuments.filter(document => document.parseStatus === 'ready'
    && datesValid
    && (input.documentIds === undefined || input.documentIds.includes(document.id))
    && (!input.documentTypes?.length || input.documentTypes.includes(document.documentType))
    && (!input.tags?.length || input.tags.some(tag => document.tags.includes(tag)))
    && (!input.fromDate || document.updatedAt.slice(0, 10) >= input.fromDate)
    && (!input.toDate || document.updatedAt.slice(0, 10) <= input.toDate));
  const terms = queryTerms(query);
  const overview = isOverviewQuery(query.trim(), terms);
  const documentsById = new Map(eligible.map(document => [document.id, document]));
  const candidates = new Map<string, EvidenceMatch>();
  const add = (evidence: Evidence, text: number, graphScore: number, metadata: number, matched: string[], relationId?: string) => {
    const key = evidenceKey(evidence);
    const previous = candidates.get(key);
    const scores = {
      text: Math.max(previous?.scores.text ?? 0, text),
      graph: Math.max(previous?.scores.graph ?? 0, graphScore),
      metadata: Math.max(previous?.scores.metadata ?? 0, metadata),
    };
    const channels: RetrievalChannel[] = [];
    if (scores.text) channels.push('正文片段');
    if (scores.graph) channels.push('图谱关系');
    if (scores.metadata) channels.push('文档元数据');
    candidates.set(key, {
      evidence: previous?.evidence ?? evidence,
      score: scores.text + scores.graph + scores.metadata,
      scores, channels,
      matchedTerms: [...new Set([...(previous?.matchedTerms ?? []), ...matched])],
      relationIds: [...new Set([...(previous?.relationIds ?? []), ...(relationId ? [relationId] : [])])],
    });
  };

  for (const document of eligible) {
    const titleTerms = matchesTerms(document.title, terms);
    const metadataTerms = matchesTerms([document.author, document.documentType, ...document.tags].join(' '), terms);
    const metadataScore = titleTerms.length * 2.5 + metadataTerms.length * 2;
    for (const [index, section] of document.sections.entries()) {
      if (!section.text.trim()) continue;
      const textTerms = matchesTerms(section.text, terms);
      const headingTerms = matchesTerms(section.title, terms);
      const textScore = textTerms.length * 4 + headingTerms.length * 2;
      if (!textScore && !metadataScore && !overview) continue;
      add(evidenceForSection(document, section), textScore || (overview ? 1 / (index + 1) : 0), 0, metadataScore,
        [...textTerms, ...headingTerms, ...titleTerms, ...metadataTerms]);
    }
  }

  // Validate every graph citation against its source version before it can affect retrieval.
  const validEvidence = new Map<string, Evidence>();
  for (const evidence of graph.evidence) {
    if (evidence.knowledgeBaseId !== knowledgeBaseId || evidence.documentId.startsWith('entry:')) continue;
    const document = documentsById.get(evidence.documentId);
    if (!document) continue;
    const sourceVersion = document.versions.find(version => version.version === evidence.version);
    const sections = evidence.version === document.version ? document.sections : sourceVersion?.sections;
    const section = sections?.find(item => item.id === evidence.sectionId);
    if (!section || !evidence.quote.trim() || !section.text.includes(evidence.quote)
      || section.page !== evidence.page || section.paragraph !== evidence.paragraph) continue;
    const sourcePageKind = evidence.version === document.version ? document.pageKind : sourceVersion?.pageKind;
    validEvidence.set(evidence.id, { ...evidence, documentTitle: document.title, section: section.title,
      pageKind: sourcePageKind ?? evidence.pageKind ?? evidenceForSection(document, section, evidence.version).pageKind });
  }
  const entities = graph.entities.filter(entity => entity.knowledgeBaseId === knowledgeBaseId);
  const entitiesById = new Map(entities.map(entity => [entity.id, entity]));
  const directEntityMatches = new Map(entities.map(entity => [entity.id,
    matchesTerms(`${entity.name} ${entity.description} ${entity.tags.join(' ')}`, terms)]));
  const candidateRelations: RetrievedRelation[] = [];
  for (const relation of graph.relations) {
    const source = entitiesById.get(relation.sourceEntityId);
    const target = entitiesById.get(relation.targetEntityId);
    if (!source || !target) continue;
    const matched = [...new Set([...(directEntityMatches.get(source.id) ?? []), ...(directEntityMatches.get(target.id) ?? []), ...matchesTerms(relation.relationType, terms)])];
    if (!matched.length && !overview) continue;
    const references = relation.evidenceIds.map(id => validEvidence.get(id)).filter((item): item is Evidence => Boolean(item));
    if (!references.length) continue;
    for (const evidence of references) add(evidence, 0, 3 + matched.length * 2, 0, matched, relation.id);
    candidateRelations.push({ relation, sourceName: source.name, targetName: target.name, evidenceIds: references.map(evidence => evidence.id) });
  }

  const perDocument = new Map<string, number>();
  const matches = [...candidates.values()].sort((a, b) => b.score - a.score || a.evidence.documentId.localeCompare(b.evidence.documentId)
    || a.evidence.page - b.evidence.page || a.evidence.paragraph - b.evidence.paragraph)
    .filter(match => {
      const count = perDocument.get(match.evidence.documentId) ?? 0;
      if (count >= 3) return false;
      perDocument.set(match.evidence.documentId, count + 1);
      return true;
    }).slice(0, 8);
  const selectedKeys = new Map(matches.map(match => [evidenceKey(match.evidence), match.evidence.id]));
  const relations = candidateRelations.map(relation => ({ ...relation, evidenceIds: [...new Set(relation.evidenceIds
    .map(id => validEvidence.get(id)).filter((item): item is Evidence => Boolean(item))
    .map(evidence => selectedKeys.get(evidenceKey(evidence))).filter((id): id is string => Boolean(id)))] }))
    .filter(relation => relation.evidenceIds.length > 0);
  return {
    evidence: matches.map(match => match.evidence), matches,
    channels: [...new Set(matches.flatMap(match => match.channels))],
    eligibleDocumentIds: eligible.map(document => document.id),
    excludedDocumentCount: baseDocuments.length - eligible.length,
    queryTerms: terms, relations, overview,
  };
}

/** Carry an explicit follow-up's topic forward without modifying any retrieval filter. */
export function resolveQuestionContext(question: string, previousQuestion?: string) {
  if (!previousQuestion || !/(这些|这两|这篇|该文|上述|刚才|继续|它|前面|进一步|再详细)/.test(question)) return question;
  return `${previousQuestion}\n追问：${question}`;
}

function excerpt(text: string, limit = 360) {
  const plain = text.replace(/\s+/g, ' ').trim();
  return plain.length <= limit ? plain : `${plain.slice(0, limit)}…`;
}

/** Extractive, source-linked mode formatting; never represents generated conclusions. */
export function buildGroundedAnswer(mode: ChatMode, result: RetrievalResult): string {
  if (!result.evidence.length) return '证据不足。当前检索范围内没有找到与问题匹配的可用原文。请补充具体关键词，或调整资料、类型、标签和更新时间范围后重试。尚未解析完成的文档与没有正文的条目不会参与回答。';
  const entryNote = result.evidence.some(evidence => evidence.documentId.startsWith('entry:'))
    ? '本次包含人工或检索整理的知识条目，其原文仅代表条目内容，不构成已外部核验的事实。\n\n' : '';
  const numbered = result.evidence.map((evidence, index) => ({ evidence, index: index + 1 }));
  const quotes = numbered.map(({ evidence, index }) => `[${index}] ${evidence.documentTitle} · ${evidence.section}\n“${excerpt(evidence.quote, mode === '找证据' ? 640 : 360)}”`).join('\n\n');
  const grouped = [...new Set(result.evidence.map(evidence => evidence.documentId))].map(documentId => {
    const items = numbered.filter(item => item.evidence.documentId === documentId);
    return `${items[0].evidence.documentTitle}\n${items.map(({ evidence, index }) => `[${index}] ${evidence.section}：“${excerpt(evidence.quote, 250)}”`).join('\n')}`;
  }).join('\n\n');
  switch (mode) {
    case '做总结': return `${entryNote}相关内容摘录\n\n${grouped}\n\n以上按来源整理原文要点，未对未引用的内容作概括。`;
    case '做对比': return `${entryNote}来源对照\n\n${grouped}\n\n${new Set(result.evidence.map(item => item.documentId)).size < 2 ? '当前仅命中一项资料，跨来源对比证据不足。' : '以上为不同来源的并列原文。'}差异、优劣、实验条件是否可比，需人工判断。`;
    case '找证据': return `${entryNote}匹配到的原文证据\n\n${quotes}\n\n可通过下方引用定位来源版本、页码和段落。原文相关性不等同于结论已得到验证。`;
    case '找冲突': return `${entryNote}待核对的来源陈述\n\n${grouped}\n\n当前检索只能提供原文，不能据此认定存在或不存在冲突。请核对研究对象、实验条件和测量口径；冲突判断需人工确认。`;
    case '找关系': {
      const relations = result.relations.map(item => {
        const citations = item.evidenceIds.map(id => numbered.find(entry => entry.evidence.id === id)?.index).filter((value): value is number => Boolean(value));
        return `${item.sourceName} — ${item.relation.relationType} — ${item.targetName} ${citations.map(index => `[${index}]`).join(' ')}（${item.relation.confirmed ? '已确认关系' : '待核验关系'}）`;
      });
      return `${entryNote}${relations.length ? `有来源的图谱关系\n\n${relations.join('\n')}` : '关系证据不足：当前命中内容未关联到有有效引用的图谱关系。'}\n\n相关原文\n\n${quotes}\n\n关系以知识图谱记录为准；待核验关系需人工确认。`;
    }
    case '找空白': return `${entryNote}现有材料覆盖的内容\n\n${grouped}\n\n现有资料不能证明某方向尚无人研究。样本覆盖、缺少的实验与研究机会需人工判断；未检索到内容不等于研究空白。`;
    case '生成综述': return `${entryNote}综述素材（按来源整理）\n\n${grouped}\n\n可据此核对各来源的研究方法与结论，进一步撰写综述。当前输出为原文素材，研究脉络、评价和综合结论尚需人工撰写。`;
    default: return `${entryNote}与问题相关的原文\n\n${quotes}\n\n以上内容来自当前范围内的原文摘录，请结合引用上下文核实。`;
  }
}
