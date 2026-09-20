import { evidenceForSection, type KnowledgeBase, type KnowledgeDocument, type KnowledgeGraph, type KnowledgeState, type DocumentType, type DocumentSection } from './model';

const createdAt = '2026-09-12T09:00:00.000Z';
const updatedAt = '2026-09-20T10:30:00.000Z';
const base = (id: string, name: string, description: string, overrides: Partial<KnowledgeBase> = {}): KnowledgeBase => ({
  id, name, description, domain: ['能源地质'], tags: ['储层机理', '科研资料'], visibility: 'team', createdBy: '王博士',
  createdAt, updatedAt, favorite: false, canRead: true, canEdit: true, autoGraph: true, qaEnabled: true, ...overrides,
});
export const initialBases = [
  base('kb-reservoir', '非常规油气储层机理知识库', '聚焦页岩油气与致密油气的储层发育、孔隙结构和开发机理，组织文献证据与研究方法。', { tags: ['页岩油气', '储层机理', 'CO₂驱替', '地质建模'], favorite: true }),
  base('kb-catalyst', '催化剂与绿色转化', '归纳催化剂结构、反应条件及性能评价方法，支持课题资料研读与证据复用。', { visibility: 'private', createdBy: '张博士', domain: ['催化材料'], tags: ['催化剂', 'CO₂加氢'] }),
  base('kb-standards', '储层评价标准与方法', '课题组共享的方法说明与质量控制记录。本示例知识库可阅读，不可修改。', { visibility: 'shared', canEdit: false, domain: ['标准方法'], tags: ['标准', '质量控制'], allowedMembers: ['张博士', '课题组'] }),
  base('kb-new', '新课题资料库', '为下一项研究准备资料，导入第一份文档后即可建立知识索引。', { visibility: 'private', createdBy: '张博士', domain: ['综合研究'], tags: [] }),
  base('kb-restricted', '联合攻关内部资料', '受限共享知识库，请联系知识库管理员申请访问。', { visibility: 'shared', canRead: false, canEdit: false, tags: ['内部资料'] }),
];

function sections(items: [string, number, string][]): DocumentSection[] {
  return items.map(([title, page, text], i) => ({ id: `s${i + 1}`, title, page, paragraph: i + 1, text }));
}
function doc(id: string, title: string, documentType: DocumentType, tags: string[], items: [string, number, string][], overrides: Partial<KnowledgeDocument> = {}): KnowledgeDocument {
  const content = sections(items);
  return { id, knowledgeBaseId: 'kb-reservoir', title, documentType, fileType: 'PDF', sourceType: '课题空间',
    relatedProjectId: 'PROJ-CCUS-01', author: '储层研究课题组', version: 'v1.0', parseStatus: 'ready', graphStatus: 'ready',
    tags, sections: content, createdAt, updatedAt, versions: [{ version: 'v1.0', updatedAt, updatedBy: '王博士', changeNote: '导入演示资料摘录', sections: content }],
    favorite: false, isDemo: true, ...overrides };
}
export const referenceDocuments: KnowledgeDocument[] = [
  doc('doc-shale', '页岩油储层发育机制研究', '论文', ['页岩油气', '储层机理', '孔隙结构'], [
    ['摘要', 1, '本演示资料讨论页岩储层的发育机制。沉积环境决定初始物质组成，成岩作用改变孔隙结构，二者共同控制储层物性。不同尺度的孔隙连通性需要结合岩心观测与实验测试评价。'],
    ['研究方法与条件', 5, '研究方法包括数字岩心分析、核磁共振测试与地质模型对照。对同一批岩心保持相同测试条件，记录孔隙度与渗透率；不同压力条件下的结果分别保存，不直接合并比较。'],
    ['储层发育的控制因素', 12, '沉积环境、成岩作用和构造活动共同影响页岩储层的孔隙结构。黏土矿物含量改变孔喉分布；孔隙连通性降低时，有效渗透率可能下降。评价储层时应同时考虑孔隙度与渗透率，而非仅依据单个参数。'],
    ['结论与局限性', 18, '页岩储层的尺度非均质性使数字岩心与宏观实验测试结果存在差异。当前资料只覆盖一组演示样品，不能据此直接推断其他区块。后续应补充不同尺度的孔隙结构与渗透率交叉验证。'],
  ], { sourceType: '文献检索', favorite: true }),
  doc('doc-co2', 'CO₂驱替效率与孔隙结构关联分析', '论文', ['CO₂驱替', '孔隙结构', '渗透率'], [
    ['摘要与科学问题', 1, 'CO₂驱替效率受到储层渗透率、孔隙结构、温度、压力、原油组分及注入方式等因素影响。低渗透条件下，驱替过程中可能出现局部旁通，需要结合驱替实验分析。'],
    ['方法与实验条件', 6, '驱替实验在固定温度下逐级调整压力，使用相同原油组分和相同岩心进行对照。最小混相压力作为区分混相状态的参考，实验记录同时保留流量、压力与产出数据。'],
    ['孔隙结构与毛细作用', 12, '孔隙结构决定流动通道分布。较高毛细压力可能限制CO₂进入细小孔喉，从而影响CO₂驱替效率。数字岩心可以辅助观察通道连通性，但需要与驱替实验结果共同解释。'],
    ['结论与适用边界', 20, '压力升高后的驱替变化不能简单归因于单一机理。温度、原油组分与最小混相压力的关系需要分别验证。本文为交互演示摘录，未提供可推广的定量结论。'],
  ], { sourceType: '文献检索', author: 'CO₂开发研究小组' }),
  doc('doc-pressure', '最小混相压力的影响因素与评价方法', '报告', ['最小混相压力', '温度', '压力'], [
    ['研究问题', 2, '最小混相压力的评价应同时记录温度与原油组分。不同测试方法与判据可能给出不同结果，比较时需要保留来源和方法条件。'],
    ['评价方法', 8, '采用驱替实验与数值模拟对照分析混相行为。压力、温度及组分模型的选择是主要输入；数值模拟结果依赖地质模型和流体描述，应保留软件版本与模型参数。'],
    ['局限性', 13, '当不同文献使用不同原油组分时，最小混相压力数值不宜直接排序。本报告建议先按实验条件分组，再开展方法对比和证据核验。'],
  ], { sourceType: '科研资产', fileType: 'DOCX' }),
  doc('doc-digital', '数字岩心多尺度建模技术说明', '技术文档', ['数字岩心', '地质建模', 'Petrel'], [
    ['方法说明', 1, '数字岩心通过图像分割提取孔隙结构，构建不同尺度的地质模型。Petrel用于整合地质解释成果，局部流动过程可通过数值模拟进行分析。'],
    ['参数与质量控制', 4, '图像分辨率、孔隙度和渗透率是模型校验的关注项。SEM观察可以提供局部形态依据，但应避免将局部图像直接等同于整个岩心的代表性特征。'],
  ], { fileType: 'PPTX', sourceType: '手动上传', author: '数字岩心实验室' }),
  doc('doc-experiment', '岩心驱替实验记录与条件对照', '实验资料', ['驱替实验', '实验条件', '压力'], [
    ['实验记录', 1, '本演示实验使用同一岩心，固定温度并设置不同压力条件。实验人员记录注入方式、时间、流量及产出。实验编号与原始文件需对应保存，以保证数据来源可追溯。'],
    ['质量核对', 2, '驱替实验结果与数值模拟存在偏差时，应优先检查温度、压力、岩心状态和原油组分是否一致。只有输入条件一致，才能进一步分析模型误差。'],
  ], { fileType: 'CSV', sourceType: '课题空间' }),
  doc('doc-standard', '储层孔隙度与渗透率测试方法说明', '标准', ['质量控制', '渗透率', '标准'], [
    ['适用范围', 1, '本材料是测试方法的演示说明，不是正式标准原文。孔隙度与渗透率测量应记录样品处理、仪器校准、温度、压力与重复测试条件。'],
    ['条款 6.2 · 结果记录', 6, '同一组渗透率测试需要使用一致的单位与样品条件。结果记录应包含原始读数、计算方法、设备标识以及异常处理说明。缺失条件的记录不得直接用于方法对比。'],
  ], { sourceType: '标准来源', author: '课题质量管理组' }),
  doc('doc-patent', '一种岩心驱替实验装置的技术资料', '专利', ['驱替实验', '设备', 'CO₂驱替'], [
    ['技术方案摘录', 1, '该演示技术方案由压力控制、岩心夹持与产出采集三个部分组成。CO₂驱替过程中记录入口压力、出口压力和温度，以便分析流动过程。'],
    ['使用条件与边界', 3, '装置参数和实验方法需匹配样品条件。当前材料仅用于页面演示，不代表已核验的专利权利要求；正式技术判断应回看授权原文。'],
  ], { sourceType: '专利来源' }),
  doc('doc-retry', '储层实验资料索引记录', '实验资料', ['质量控制', '实验条件'], [
    ['可恢复正文', 1, '实验测试记录包含温度、压力和孔隙度数据，当前条目的上次索引过程被中断。重新解析将读取已有正文并重建本地索引，不会改变原始实验数据。'],
  ], { fileType: 'TXT', parseStatus: 'failed', graphStatus: 'pending', error: '上次本地索引被中断，已有正文已保留，可重新解析。', sourceType: '手动上传' }),
  doc('doc-catalyst', 'CO₂加氢催化剂的结构与性能评价', '论文', ['催化剂', 'CO₂加氢', '实验条件'], [
    ['研究摘要', 1, '催化剂的结构、活性组分与反应条件共同影响CO₂加氢过程。比较转化率时需要同时核对温度、压力、进料比例与评价时间。'],
    ['方法与局限', 5, '分子模拟可以辅助提出结构假设，实验测试用于评估实际表现。计算吸附能不能直接替代转化率实测；模型结论需要在一致条件下验证。'],
  ], { knowledgeBaseId: 'kb-catalyst' }),
  doc('doc-catalyst-notes', '催化材料课题研读笔记', '笔记', ['催化剂', '模型', '分子模拟'], [
    ['阶段笔记', 1, '本阶段关注催化剂表面结构和反应条件的关系。对比不同分子模拟模型前，应记录软件、参数和输入结构的版本，结论需引用对应文献与实验结果。'],
  ], { knowledgeBaseId: 'kb-catalyst', fileType: 'MD', sourceType: '课题空间', author: '张博士' }),
  doc('doc-shared-standard', '实验数据质量核对清单', '标准', ['质量控制', '标准'], [
    ['检查清单', 1, '检查孔隙度与渗透率测试记录的单位、仪器、样品编号、温度和压力。文件名与记录编号应一致，重复实验的差异需要说明。'],
  ], { knowledgeBaseId: 'kb-standards', sourceType: '团队共享' }),
];

const entityLexicon: [string, string, string][] = [
  ['CO₂驱替', '技术方向', '使用CO₂开展流体驱替的研究方向。'], ['页岩储层', '材料', '以页岩为主要研究对象的储层体系。'],
  ['孔隙结构', '机理', '孔隙与孔喉的形态、分布及连通特征。'], ['渗透率', '参数', '反映流体通过介质能力的评价参数。'],
  ['孔隙度', '参数', '描述孔隙空间比例的参数。'], ['沉积环境', '机理', '控制初始物质组成与沉积特征的环境条件。'],
  ['成岩作用', '机理', '沉积后影响岩石结构与性质的过程。'], ['温度', '参数', '研究条件中的温度参数。'],
  ['压力', '参数', '实验或模型中的压力条件。'], ['最小混相压力', '参数', '混相评价中的参考压力参数。'],
  ['原油组分', '材料', '流体组分描述，需与来源及方法对应。'], ['注入方式', '方法', '驱替过程中流体的注入策略。'],
  ['毛细压力', '机理', '不同流体相界面与孔喉相关的压力作用。'], ['数字岩心', '技术方向', '基于岩心图像与数据构建的数字研究对象。'],
  ['地质模型', '模型', '对地质结构和属性的形式化描述。'], ['数值模拟', '方法', '使用计算方法模拟研究对象的行为。'],
  ['驱替实验', '实验', '用于观察流动与驱替行为的实验。'], ['实验测试', '方法', '在明确条件下获得观测数据的方法。'],
  ['分子模拟', '方法', '在分子尺度建立模型并开展计算的方法。'], ['Petrel', '软件', '地质解释与建模软件。'],
  ['核磁共振', '设备', '用于样品与孔隙研究的一种表征手段。'], ['SEM', '设备', '扫描电子显微表征设备。'],
  ['催化剂', '材料', '研究反应性能的催化材料。'], ['CO₂加氢', '技术方向', '以CO₂加氢过程为对象的研究方向。'],
];

/** Local, reproducible keyword/co-occurrence graph. An edge is never a causal inference. */
export function buildKnowledgeGraph(documents: KnowledgeDocument[], knowledgeBaseId: string): KnowledgeGraph {
  const available = documents.filter(d => d.knowledgeBaseId === knowledgeBaseId && d.parseStatus === 'ready' && d.graphStatus === 'ready');
  const graph: KnowledgeGraph = { entities: [], relations: [], evidence: [] };
  const entityMap = new Map<string, KnowledgeGraph['entities'][number]>();
  const relationMap = new Map<string, KnowledgeGraph['relations'][number]>();
  for (const document of available) {
    for (const section of document.sections) {
      const evidence = evidenceForSection(document, section);
      graph.evidence.push(evidence);
      const matches = entityLexicon.filter(([name]) => section.text.toLowerCase().includes(name.toLowerCase())).slice(0, 8);
      if (!matches.length) continue;
      const docEntityId = `${knowledgeBaseId}:${document.id}`;
      if (!entityMap.has(docEntityId)) entityMap.set(docEntityId, { id: docEntityId, knowledgeBaseId, name: document.title, type: '文献', description: `${document.documentType} · ${document.author}`, tags: document.tags, evidenceIds: [], confirmed: false });
      entityMap.get(docEntityId)!.evidenceIds.push(evidence.id);
      for (const [name, type, description] of matches) {
        const entityId = `${knowledgeBaseId}:entity:${name}`;
        if (!entityMap.has(entityId)) entityMap.set(entityId, { id: entityId, knowledgeBaseId, name, type, description, tags: [type], evidenceIds: [], confirmed: false });
        entityMap.get(entityId)!.evidenceIds.push(evidence.id);
        const relationId = `${docEntityId}->${entityId}`;
        if (!relationMap.has(relationId)) relationMap.set(relationId, { id: relationId, sourceEntityId: docEntityId, targetEntityId: entityId, relationType: '提及', evidenceIds: [], confirmed: false, extractedAt: document.updatedAt, extractionMethod: '本地词项匹配 · 待人工核验' });
        relationMap.get(relationId)!.evidenceIds.push(evidence.id);
      }
      const first = matches[0];
      for (const next of matches.slice(1)) {
        const ids = [first[0], next[0]].sort();
        const id = `${knowledgeBaseId}:co:${ids.join('|')}`;
        if (!relationMap.has(id)) relationMap.set(id, { id, sourceEntityId: `${knowledgeBaseId}:entity:${ids[0]}`, targetEntityId: `${knowledgeBaseId}:entity:${ids[1]}`, relationType: '同段共现', evidenceIds: [], confirmed: false, extractedAt: document.updatedAt, extractionMethod: '本地同段共现 · 不代表因果关系' });
        relationMap.get(id)!.evidenceIds.push(evidence.id);
      }
    }
  }
  graph.entities = [...entityMap.values()].map(e => ({ ...e, evidenceIds: [...new Set(e.evidenceIds)] }));
  graph.relations = [...relationMap.values()].map(r => ({ ...r, evidenceIds: [...new Set(r.evidenceIds)] }));
  return graph;
}

export function initialKnowledgeState(): KnowledgeState {
  return { schemaVersion: 1, bases: structuredClone(initialBases), documents: structuredClone(referenceDocuments), messages: [], notes: [], entries: [],
    tags: [
      { id: 'tag-shale', name: '页岩油气', category: '专业领域', aliases: ['页岩'] },
      { id: 'tag-reservoir', name: '储层机理', category: '技术方向', aliases: ['储层发育'] },
      { id: 'tag-co2', name: 'CO₂驱替', category: '技术方向', aliases: ['二氧化碳驱替', 'CO2驱替'] },
      { id: 'tag-porosity', name: '孔隙结构', category: '知识类型', aliases: ['孔喉结构'] },
      { id: 'tag-standard', name: '质量控制', category: '科研方法', aliases: ['质控'] },
    ] };
}
