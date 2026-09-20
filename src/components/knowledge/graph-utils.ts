import type { Evidence, GraphRelation, KnowledgeDocument, KnowledgeGraph } from './model';

export type GraphDirection = 'both' | 'outgoing' | 'incoming';
export interface GraphPath { entityIds: string[]; relationIds: string[] }

export function isSymmetricGraphRelation(relation: GraphRelation) {
  return /共现|共同出现|同段|co.?occur/i.test(`${relation.relationType} ${relation.extractionMethod}`);
}

/** A graph is only useful when every displayed claim resolves to a readable source. */
export function scopeKnowledgeGraph(graph: KnowledgeGraph, knowledgeBaseId: string, documents: KnowledgeDocument[]): KnowledgeGraph {
  const readyDocuments = new Map(documents.filter(document => document.knowledgeBaseId === knowledgeBaseId && document.parseStatus === 'ready').map(document => [document.id, document]));
  const evidence = graph.evidence.filter(item => {
    const document = readyDocuments.get(item.documentId);
    if (!document || item.knowledgeBaseId !== knowledgeBaseId) return false;
    const sections = item.version === document.version ? document.sections : document.versions.find(version => version.version === item.version)?.sections;
    const section = sections?.find(value => value.id === item.sectionId);
    return Boolean(section && item.quote.trim() && section.text.includes(item.quote) && section.page === item.page && section.paragraph === item.paragraph);
  }).map(item => {
    const document = readyDocuments.get(item.documentId)!;
    const version = document.versions.find(value => value.version === item.version);
    const pageKind = item.pageKind ?? (item.version === document.version ? document.pageKind : version?.pageKind) ?? (/^(txt|md|markdown|csv|url)$/i.test(document.fileType) ? 'logical' : 'original');
    return { ...item, pageKind };
  });
  const evidenceIds = new Set(evidence.map(item => item.id));
  const entities = graph.entities.filter(entity => entity.knowledgeBaseId === knowledgeBaseId).map(entity => ({ ...entity, evidenceIds: entity.evidenceIds.filter(id => evidenceIds.has(id)) })).filter(entity => entity.evidenceIds.length > 0);
  const entityIds = new Set(entities.map(entity => entity.id));
  const relations = graph.relations.filter(relation => entityIds.has(relation.sourceEntityId) && entityIds.has(relation.targetEntityId)).map(relation => ({ ...relation, evidenceIds: relation.evidenceIds.filter(id => evidenceIds.has(id)) })).filter(relation => relation.evidenceIds.length > 0);
  return { entities, relations, evidence };
}

function adjacent(entityId: string, relations: GraphRelation[], direction: GraphDirection) {
  return relations.flatMap(relation => {
    const symmetric = isSymmetricGraphRelation(relation);
    if (relation.sourceEntityId === entityId && (symmetric || direction !== 'incoming')) return [{ entityId: relation.targetEntityId, relationId: relation.id }];
    if (relation.targetEntityId === entityId && (symmetric || direction !== 'outgoing')) return [{ entityId: relation.sourceEntityId, relationId: relation.id }];
    return [];
  });
}

/** Breadth-first traversal returns an actual shortest path, never an inferred relation. */
export function findGraphPath(start: string, end: string, relations: GraphRelation[], direction: GraphDirection = 'both'): GraphPath | null {
  if (start === end) return { entityIds: [start], relationIds: [] };
  const queue = [start];
  const previous = new Map<string, { entityId: string; relationId: string }>();
  const visited = new Set([start]);
  for (let index = 0; index < queue.length; index += 1) {
    for (const next of adjacent(queue[index], relations, direction)) {
      if (visited.has(next.entityId)) continue;
      visited.add(next.entityId);
      previous.set(next.entityId, { entityId: queue[index], relationId: next.relationId });
      if (next.entityId === end) {
        const entityIds = [end];
        const relationIds: string[] = [];
        let current = end;
        while (current !== start) {
          const step = previous.get(current)!;
          entityIds.unshift(step.entityId);
          relationIds.unshift(step.relationId);
          current = step.entityId;
        }
        return { entityIds, relationIds };
      }
      queue.push(next.entityId);
    }
  }
  return null;
}

export function graphNeighborhood(start: string, relations: GraphRelation[], depth: number, direction: GraphDirection = 'both') {
  const included = new Set([start]);
  let frontier = [start];
  for (let layer = 0; layer < depth; layer += 1) {
    const next: string[] = [];
    for (const current of frontier) for (const neighbor of adjacent(current, relations, direction)) {
      if (included.has(neighbor.entityId)) continue;
      included.add(neighbor.entityId);
      next.push(neighbor.entityId);
    }
    frontier = next;
  }
  return included;
}

export function uniqueEvidence(ids: string[], evidence: Evidence[]) {
  const included = new Set(ids);
  return evidence.filter(item => included.has(item.id));
}
