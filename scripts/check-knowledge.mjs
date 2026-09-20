import assert from 'node:assert/strict';
import seedModule from '../src/components/knowledge/seed.ts';
import modelModule from '../src/components/knowledge/model.ts';
import retrievalModule from '../src/components/knowledge/retrieval.ts';
import filesModule from '../src/components/knowledge/files.ts';
import capabilitiesModule from '../src/lib/capabilities.ts';

const { initialKnowledgeState, buildKnowledgeGraph } = seedModule;
const { evidenceForSection, textToSections } = modelModule;
const { retrieveEvidence } = retrievalModule;
const { validateFile } = filesModule;
const { visibleGroups, isCurrentCapability, getCapability } = capabilitiesModule;
const state = initialKnowledgeState();
assert.equal(new Set(state.bases.map(b => b.id)).size, state.bases.length);
assert.equal(new Set(state.documents.map(d => d.id)).size, state.documents.length);
for (const base of state.bases) {
  const graph = buildKnowledgeGraph(state.documents, base.id);
  for (const evidence of graph.evidence) {
    const doc = state.documents.find(d => d.id === evidence.documentId);
    assert.equal(doc.knowledgeBaseId, base.id);
    assert.equal(doc.parseStatus, 'ready');
    assert.equal(doc.version, evidence.version);
    assert.equal(doc.sections.find(s => s.id === evidence.sectionId)?.text, evidence.quote);
  }
  const ids = new Set(graph.evidence.map(e => e.id));
  const entityIds = new Set(graph.entities.map(e => e.id));
  for (const entity of graph.entities) assert.ok(entity.evidenceIds.length && entity.evidenceIds.every(id => ids.has(id)));
  for (const relation of graph.relations) {
    assert.ok(entityIds.has(relation.sourceEntityId) && entityIds.has(relation.targetEntityId));
    assert.ok(relation.evidenceIds.length && relation.evidenceIds.every(id => ids.has(id)));
    if (relation.relationType === '同段共现') assert.equal(relation.confirmed, false);
  }
}
const graph = buildKnowledgeGraph(state.documents, 'kb-reservoir');
const result = retrieveEvidence({ query: 'CO₂驱替效率受到哪些因素影响', knowledgeBaseId: 'kb-reservoir', documents: state.documents, graph });
assert.ok(result.evidence.length > 0);
assert.ok(result.evidence.every(e => e.knowledgeBaseId === 'kb-reservoir' && e.documentId !== 'doc-retry'));
assert.equal(retrieveEvidence({ query: '量子纠缠光子传输', knowledgeBaseId: 'kb-new', documents: state.documents, graph }).evidence.length, 0);
const sections = textToSections('# 标题\n\n第一段\n\n第二段');
assert.equal(sections.length, 3);
const original = state.documents[0];
const revised = { ...original, version: 'v1.1', pageKind: 'logical', sections,
  versions: [...original.versions, { version: 'v1.1', updatedAt: original.updatedAt, updatedBy: '测试', changeNote: '正文更新', sections, pageKind: 'logical' }] };
assert.equal(evidenceForSection(revised, sections[0]).pageKind, 'logical');
assert.equal(evidenceForSection(revised, original.sections[0], original.version).pageKind, 'original');
assert.equal(original.sections[0].text, revised.versions[0].sections[0].text);
assert.throws(() => validateFile(new File([], 'empty.txt')), /为空/);
assert.throws(() => validateFile(new File(['x'], 'unsafe.exe')), /不支持/);
validateFile(new File(['知识库检索测试'], 'notes.md'));
for (const role of ['researcher', 'lead', 'manager']) {
  const groups = visibleGroups(role);
  assert.equal(groups.indexOf('知识库'), groups.indexOf('读空间') + 1);
  assert.ok(groups.includes('做空间'));
}
for (const path of ['/knowledge', '/knowledge/kb-reservoir/documents', '/knowledge/kb-reservoir/documents/doc-co2', '/knowledge/kb-reservoir/graph', '/knowledge/kb-reservoir/chat', '/knowledge/kb-reservoir/entries']) {
  assert.equal(isCurrentCapability(path, '/knowledge'), true);
  assert.equal(getCapability(path)?.pageId, 'KB-01');
}
assert.equal(isCurrentCapability('/knowledge-graph', '/knowledge'), false);
console.log(`Knowledge integration checks passed: ${state.bases.length} bases, ${state.documents.length} documents; evidence/graph integrity, scope, versions, import validation and navigation.`);
