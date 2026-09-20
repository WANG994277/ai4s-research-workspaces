import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findGraphPath, graphNeighborhood, scopeKnowledgeGraph } from './graph-utils';
import type { GraphRelation, KnowledgeDocument, KnowledgeGraph } from './model';

const relation = (id: string, from: string, to: string): GraphRelation => ({ id, sourceEntityId: from, targetEntityId: to, relationType: '用于', evidenceIds: ['e1'], confirmed: false, extractedAt: '2026-09-20', extractionMethod: '来源原文' });
const relations = [relation('ab', 'a', 'b'), relation('bc', 'b', 'c'), relation('ad', 'a', 'd'), relation('dc', 'd', 'c'), relation('ce', 'c', 'e')];

test('shortest paths use real edges and respect relationship direction', () => {
  assert.deepEqual(findGraphPath('a', 'e', relations, 'outgoing'), { entityIds: ['a', 'b', 'c', 'e'], relationIds: ['ab', 'bc', 'ce'] });
  assert.equal(findGraphPath('e', 'a', relations, 'outgoing'), null);
  assert.equal(findGraphPath('a', 'missing', relations), null);
  assert.deepEqual(findGraphPath('c', 'a', relations, 'incoming')?.relationIds, ['bc', 'ab']);
});

test('expansion stops at the requested depth and handles cycles', () => {
  assert.deepEqual([...graphNeighborhood('a', relations, 1, 'outgoing')], ['a', 'b', 'd']);
  assert.deepEqual([...graphNeighborhood('a', [...relations, relation('ea', 'e', 'a')], 2, 'outgoing')], ['a', 'b', 'd', 'c']);
  assert.deepEqual([...graphNeighborhood('a', relations, 2, 'incoming')], ['a']);
});

test('co-occurrence relations remain symmetric during directed traversal', () => {
  const coOccurrence = { ...relation('ab', 'a', 'b'), relationType: '共同出现', extractionMethod: '同段共现' };
  assert.deepEqual(findGraphPath('b', 'a', [coOccurrence], 'outgoing'), { entityIds: ['b', 'a'], relationIds: ['ab'] });
  assert.deepEqual([...graphNeighborhood('a', [coOccurrence], 1, 'incoming')], ['a', 'b']);
});

test('graph excludes cross-library, failed, missing-version and fabricated source claims', () => {
  const document: KnowledgeDocument = { id: 'doc', knowledgeBaseId: 'kb', title: '来源', documentType: '论文', fileType: 'txt', sourceType: '上传', relatedProjectId: '', author: '', version: 'v2', parseStatus: 'ready', graphStatus: 'ready', tags: [], sections: [{ id: 's', title: '正文', page: 1, paragraph: 1, text: '有来源的实体及共同出现的概念。' }], createdAt: '', updatedAt: '', versions: [], favorite: false, isDemo: false };
  const valid = { id: 'e1', knowledgeBaseId: 'kb', documentId: 'doc', documentTitle: '来源', version: 'v2', sectionId: 's', page: 1, paragraph: 1, quote: '有来源的实体', section: '正文' };
  const graph: KnowledgeGraph = {
    evidence: [valid, { ...valid, id: 'wrong-version', version: 'v1' }, { ...valid, id: 'fabricated', quote: '来源没有的结论' }, { ...valid, id: 'cross-kb', knowledgeBaseId: 'another' }],
    entities: ['a', 'b'].map(id => ({ id, knowledgeBaseId: 'kb', name: id, type: '概念', description: '', tags: [], evidenceIds: ['e1', 'wrong-version'], confirmed: false })),
    relations: [relation('ab', 'a', 'b'), relation('outside', 'a', 'outside')],
  };
  const scoped = scopeKnowledgeGraph(graph, 'kb', [document]);
  assert.deepEqual(scoped.evidence.map(item => item.id), ['e1']);
  assert.equal(scoped.evidence[0].pageKind, 'logical');
  assert.deepEqual(scoped.entities.map(item => item.evidenceIds), [['e1'], ['e1']]);
  assert.deepEqual(scoped.relations.map(item => item.id), ['ab']);
  assert.equal(scopeKnowledgeGraph(graph, 'kb', [{ ...document, parseStatus: 'failed' }]).entities.length, 0);
  assert.equal(scopeKnowledgeGraph(graph, 'another', [document]).entities.length, 0);
  const history = scopeKnowledgeGraph(graph, 'kb', [{ ...document, pageKind: 'logical', versions: [{ version: 'v1', updatedAt: '', updatedBy: '', changeNote: '', sections: document.sections, pageKind: 'original' }] }]);
  assert.equal(history.evidence.find(item => item.id === 'wrong-version')?.pageKind, 'original');
  assert.equal(history.evidence.find(item => item.id === 'e1')?.pageKind, 'logical');
});
