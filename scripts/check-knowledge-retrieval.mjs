import assert from 'node:assert/strict';
import retrieval from '../src/components/knowledge/retrieval.ts';
import model from '../src/components/knowledge/model.ts';
const { buildGroundedAnswer, projectKnowledgeEntries, resolveQuestionContext, retrieveEvidence } = retrieval;
const { chatModes, evidenceForSection } = model;

const section = (id, text) => ({ id, title: `段落 ${id}`, page: 1, paragraph: 1, text });
function document(id, overrides = {}) {
  return {
    id, knowledgeBaseId: 'kb-a', title: `实验资料 ${id}`, documentType: '论文', fileType: 'txt', sourceType: 'local', relatedProjectId: '', author: '甲',
    version: 'v2', parseStatus: 'ready', graphStatus: 'ready', tags: [], createdAt: '2026-08-01', updatedAt: '2026-09-15', versions: [], favorite: false, isDemo: true,
    sections: [section('current', '多孔碳骨架改善锂硫电池的循环性能。')], ...overrides,
  };
}
const primary = document('primary', {
  title: '锂硫电池测试记录', tags: ['电池'],
  versions: [{ version: 'v1', updatedAt: '2026-08-01', updatedBy: '甲', changeNote: '旧版', sections: [section('history', '早期观察到硫物种迁移。')] }],
});
const metadata = document('metadata', { title: '界面阻抗', documentType: '标准', tags: ['测试'], sections: [section('current', '仪器校准后开始测量。')], updatedAt: '2026-07-01' });
const unrelated = document('unrelated', { sections: [section('current', '记录环境的湿度和温度。')] });
const nonReady = document('pending', { parseStatus: 'index_failed' });
const otherBase = document('other-base', { knowledgeBaseId: 'kb-b', title: '禁止跨库的锂硫电池证据' });
const documents = [primary, metadata, unrelated, nonReady, otherBase];
const current = evidenceForSection(primary, primary.sections[0]);
const historical = evidenceForSection(primary, primary.versions[0].sections[0], 'v1');
const excluded = evidenceForSection(otherBase, otherBase.sections[0]);
const metadataEvidence = evidenceForSection(metadata, metadata.sections[0]);
const graph = {
  entities: [
    { id: 'sulfur', knowledgeBaseId: 'kb-a', name: '锂硫电池', description: 'Catalysis', type: '材料', tags: [], evidenceIds: [current.id], confirmed: true },
    { id: 'carbon', knowledgeBaseId: 'kb-a', name: '多孔碳', description: '', type: '材料', tags: [], evidenceIds: [current.id], confirmed: true },
    { id: 'foreign', knowledgeBaseId: 'kb-b', name: '锂硫电池', description: '', type: '材料', tags: [], evidenceIds: [excluded.id], confirmed: true },
  ],
  relations: [
    { id: 'good', sourceEntityId: 'sulfur', targetEntityId: 'carbon', relationType: '使用', evidenceIds: [current.id], confirmed: false, extractedAt: '2026-09-15', extractionMethod: 'local' },
    { id: 'old', sourceEntityId: 'sulfur', targetEntityId: 'carbon', relationType: '观察', evidenceIds: [historical.id], confirmed: true, extractedAt: '2026-09-15', extractionMethod: 'local' },
    { id: 'metadata-link', sourceEntityId: 'sulfur', targetEntityId: 'carbon', relationType: '参照', evidenceIds: [metadataEvidence.id], confirmed: false, extractedAt: '2026-09-15', extractionMethod: 'local' },
    { id: 'invalid', sourceEntityId: 'sulfur', targetEntityId: 'carbon', relationType: '伪造', evidenceIds: ['missing', 'wrong-quote', 'wrong-page', 'unknown-version', excluded.id], confirmed: true, extractedAt: '2026-09-15', extractionMethod: 'local' },
    { id: 'foreign-link', sourceEntityId: 'foreign', targetEntityId: 'carbon', relationType: '禁止跨库', evidenceIds: [current.id], confirmed: true, extractedAt: '2026-09-15', extractionMethod: 'local' },
  ],
  evidence: [current, historical, excluded, metadataEvidence,
    { ...current, id: 'wrong-quote', quote: 'This text does not occur in the document.' },
    { ...current, id: 'wrong-page', page: 99 },
    { ...current, id: 'unknown-version', version: 'v404' },
  ],
};
const retrieve = (query, filters = {}) => retrieveEvidence({ query, knowledgeBaseId: 'kb-a', documents, graph, ...filters });

const combined = retrieve('锂硫电池');
assert.ok(combined.channels.includes('正文片段'));
assert.ok(combined.channels.includes('图谱关系'));
assert.ok(combined.channels.includes('文档元数据'));
assert.ok(combined.evidence.length > 0);
assert.ok(combined.evidence.every(evidence => evidence.knowledgeBaseId === 'kb-a'));
assert.ok(combined.evidence.every(evidence => !['pending', 'other-base'].includes(evidence.documentId)));
assert.ok(combined.relations.every(item => !['invalid', 'foreign-link'].includes(item.relation.id)));
assert.ok(combined.evidence.some(evidence => evidence.version === 'v1'));
assert.deepEqual(new Set(retrieve('锂硫电池', { documentIds: ['primary'] }).evidence.map(evidence => evidence.documentId)), new Set(['primary']));
assert.equal(retrieve('锂硫电池', { documentIds: [] }).evidence.length, 0);
assert.equal(retrieve('锂硫电池', { documentIds: ['other-base'] }).evidence.length, 0);
assert.ok(retrieve('Catalysis').matches.every(match => match.channels.includes('图谱关系')));
assert.deepEqual(new Set(retrieve('界面阻抗').evidence.map(evidence => evidence.documentId)), new Set(['metadata']));
assert.deepEqual(retrieve('界面阻抗', { tags: ['电池'] }).evidence, []);
assert.deepEqual(retrieve('锂硫电池', { documentTypes: ['标准'], tags: ['电池'] }).eligibleDocumentIds, []);
assert.deepEqual(retrieve('总结当前范围的主要内容', { fromDate: '2026-09-15', toDate: '2026-09-15' }).eligibleDocumentIds, ['primary', 'unrelated']);
assert.deepEqual(retrieve('锂硫电池', { fromDate: '2026-09-16', toDate: '2026-09-15' }).evidence, []);
assert.equal(retrieve('怎样折叠千纸鹤').evidence.length, 0);
assert.equal(retrieve('总结木星大气层的化学组成').evidence.length, 0);
assert.ok(retrieve('硫').evidence.length > 0, 'Single-character material names remain searchable');
assert.ok(retrieve('总结当前范围的主要内容').overview);
assert.equal(retrieve('').evidence.length, 0);
assert.match(buildGroundedAnswer('问知识', retrieve('怎样折叠千纸鹤')), /证据不足/);
for (const mode of chatModes) {
  const content = buildGroundedAnswer(mode, combined);
  assert.ok(content.length > 0, `${mode}: empty output`);
  for (const marker of content.matchAll(/\[(\d+)\]/g)) assert.ok(combined.evidence[Number(marker[1]) - 1], `${mode}: invalid citation ${marker[0]}`);
}
assert.match(buildGroundedAnswer('做对比', combined), /需人工判断/);
assert.match(buildGroundedAnswer('找空白', combined), /不能证明/);
assert.match(buildGroundedAnswer('找冲突', combined), /不能据此认定/);
assert.equal(resolveQuestionContext('新问题', '锂硫电池'), '新问题');
const followup = resolveQuestionContext('继续比较它们', '锂硫电池');
assert.match(followup, /锂硫电池/);
assert.ok(retrieve(followup, { documentIds: ['primary'] }).evidence.every(evidence => evidence.documentId === 'primary'));
for (const evidence of combined.evidence) {
  const source = documents.find(document => document.id === evidence.documentId);
  const sections = source.version === evidence.version ? source.sections : source.versions.find(version => version.version === evidence.version)?.sections;
  const original = sections?.find(section => section.id === evidence.sectionId);
  assert.ok(original?.text.includes(evidence.quote));
  assert.equal(original.page, evidence.page);
  assert.equal(original.paragraph, evidence.paragraph);
}
const versionedPages = document('versioned-pages', {
  fileType: 'PDF', pageKind: 'logical',
  versions: [{ version: 'v1', pageKind: 'original', updatedAt: '2026-08-01', updatedBy: '甲', changeNote: '原始分页', sections: [section('historical-page', '原始 PDF 中的实验记录。')] }],
});
const logicalEvidence = { ...evidenceForSection(versionedPages, versionedPages.sections[0]), pageKind: 'original' };
const originalEvidence = { ...evidenceForSection(versionedPages, versionedPages.versions[0].sections[0], 'v1'), pageKind: undefined };
const versionedResult = retrieveEvidence({
  query: 'Catalysis', knowledgeBaseId: 'kb-a', documents: [versionedPages],
  graph: { entities: graph.entities, evidence: [logicalEvidence, originalEvidence], relations: [{ ...graph.relations[0], evidenceIds: [logicalEvidence.id, originalEvidence.id] }] },
});
assert.equal(versionedResult.evidence.find(evidence => evidence.version === 'v2')?.pageKind, 'logical', 'Current source pagination overrides stale graph metadata');
assert.equal(versionedResult.evidence.find(evidence => evidence.version === 'v1')?.pageKind, 'original', 'Historical citations retain their own version pagination');
const textPages = retrieveEvidence({ query: '锂硫电池', knowledgeBaseId: 'kb-a', documents: [versionedPages], graph: { entities: [], relations: [], evidence: [] } });
assert.ok(textPages.evidence.every(evidence => evidence.pageKind === 'logical'), 'Text-supplemented PDF citations use logical pages');
const manualEntry = {
  id: 'manual-note', knowledgeBaseId: 'kb-a', title: '人工测试记录', type: '研究笔记', body: 'AlphaCriterion 是本次试验的人工记录代号。\n\n第二段记录实验条件。', summary: '人工记录',
  tags: ['实验记录'], domain: '材料科学', sourceLabel: '手工录入', documentIds: [], entityIds: [], relatedProjectId: '',
  version: 'v1.0', createdBy: '测试用户', createdAt: '2026-09-01', updatedAt: '2026-09-10', evidence: [],
};
const emptyGraph = { entities: [], relations: [], evidence: [] };
const queryEntries = (query, entries = [manualEntry], filters = {}) => retrieveEvidence({ query, knowledgeBaseId: 'kb-a', documents: [], entries, graph: emptyGraph, ...filters });
const entryResult = queryEntries('AlphaCriterion');
assert.deepEqual(entryResult.eligibleDocumentIds, ['entry:manual-note'], 'Entry-only libraries remain queryable');
assert.equal(entryResult.evidence[0]?.documentId, 'entry:manual-note');
assert.equal(entryResult.evidence[0]?.pageKind, 'logical');
assert.equal(entryResult.evidence[0]?.sectionId, 'section-1');
assert.match(entryResult.evidence[0]?.documentTitle, /人工整理/);
assert.equal(queryEntries('AlphaCriterion', [{ ...manualEntry, knowledgeBaseId: 'kb-b' }]).evidence.length, 0, 'Entry scope cannot cross knowledge bases');
assert.equal(queryEntries('AlphaCriterion', [manualEntry], { documentIds: [] }).evidence.length, 0);
assert.ok(queryEntries('AlphaCriterion', [manualEntry], { documentIds: ['entry:manual-note'], documentTypes: ['知识条目'], tags: ['实验记录'], fromDate: '2026-09-10', toDate: '2026-09-10' }).evidence.length > 0);
assert.equal(queryEntries('AlphaCriterion', [manualEntry], { documentTypes: ['论文'] }).evidence.length, 0);
assert.equal(queryEntries('AlphaCriterion', [manualEntry], { tags: ['不存在的标签'] }).evidence.length, 0);
assert.equal(queryEntries('AlphaCriterion', [manualEntry], { fromDate: '2026-09-11' }).evidence.length, 0);
assert.equal(queryEntries('总结当前知识条目', [{ ...manualEntry, body: '' }]).eligibleDocumentIds.length, 0, 'Body-less entries are excluded');
for (const mode of chatModes) assert.match(buildGroundedAnswer(mode, entryResult), /不构成已外部核验的事实/, `${mode} must qualify authored entries`);
const savedEntryCitation = entryResult.evidence[0];
const updatedEntry = { ...manualEntry, version: 'v1.1', body: 'BetaCriterion 是更新后的人工记录代号。', updatedAt: '2026-09-20',
  history: [{ version: manualEntry.version, title: manualEntry.title, body: manualEntry.body, updatedAt: manualEntry.updatedAt }] };
assert.equal(queryEntries('AlphaCriterion', [updatedEntry]).evidence.length, 0, 'Default queries use current entry body');
assert.equal(queryEntries('BetaCriterion', [updatedEntry]).evidence[0]?.version, 'v1.1');
const projectedUpdatedEntry = projectKnowledgeEntries([updatedEntry])[0];
const oldEntrySection = projectedUpdatedEntry.versions.find(version => version.version === savedEntryCitation.version)?.sections.find(section => section.id === savedEntryCitation.sectionId);
assert.equal(oldEntrySection?.text, savedEntryCitation.quote, 'A previous entry citation resolves to its immutable historical snapshot');
assert.equal(projectedUpdatedEntry.versions[0].pageKind, 'logical');
console.log('Knowledge retrieval checks passed: hybrid channels, scoped documents and entries, current/historical version and pagination integrity, grounded modes, and follow-ups.');
