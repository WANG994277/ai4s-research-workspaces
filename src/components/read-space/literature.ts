export type LiteraturePage = { page: number; section: string; text: string[]; table?: { headers: string[]; rows: string[][] }; figure?: boolean };
export type Literature = { id: string; title: string; english: string; authors: string; institution: string; journal: string; year: number; type: '文献' | '标准'; category: string; keywords: string[]; abstract: string; doi: string; citations: number; language: string; country: string; source: string; open: boolean; status: string; method: string; temperature: string; pressure: string; conclusion: string; limitation: string; pages: LiteraturePage[]; standardStatus?: string; issuer?: string; number?: string; ics?: string; implementDate?: string };

function paper(id: number, title: string, year: number, method: string, temperature: string, pressure: string, conclusion: string, extra: Partial<Literature> = {}): Literature {
  const topic = title.includes('催化') || title.includes('CO₂') ? '催化剂' : '页岩';
  const condition = topic === '催化剂' ? '固定床反应器中设置不同温度与压力，稳定 2 小时后采集产物。采用空白对照和重复实验，记录进料组成与空速。' : '使用 100×100×100 mm 立方体试样。按指定温度恒温 2 小时后施加围压，加载速率为 0.5 MPa/s；每个条件重复 3 次。';
  return { id: `demo-lit-${id}`, title, english: topic === '催化剂' ? 'Experimental study of catalyst performance under coupled conditions' : 'Experimental investigation of shale fracture under thermo-mechanical coupling', authors: id % 2 ? '张明、李研、陈立' : 'Wang L.; Chen Y.; Zhang H.', institution: id % 2 ? '能源研究院 · 岩石力学实验室' : '联合能源研究中心', journal: topic === '催化剂' ? '催化科学研究（演示）' : '能源与岩石力学（演示）', year, type: '文献', category: '实验研究', keywords: [topic, '高温', '高压', method, topic === '催化剂' ? '活性' : '裂缝扩展'], abstract: `本研究采用${method}，分析${topic}在温度 ${temperature}、压力 ${pressure} 条件下的响应。${conclusion}研究结果提示需要区分试验边界条件，仍有待进一步交叉验证。`, doi: `DEMO/ai4s.${year}.${id.toString().padStart(3, '0')}`, citations: 12 + id * 7, language: id % 2 ? '中文' : '英文', country: id % 2 ? '中国' : '国际合作', source: '本地演示资料库', open: true, status: '可研读', method, temperature, pressure, conclusion, limitation: '样本数量有限；实验尺度与真实工况之间的差异尚需验证，不能直接外推工程结论。', pages: [
    { page: 1, section: '摘要与研究问题', text: [title, `研究问题：${topic}在热–力耦合条件下的响应由哪些因素控制？`, `摘要：本研究采用${method}。${conclusion}`, '本文是 AI4S 原型的合成演示文献，作者、期刊、标识符、数值和正文仅用于体验科研工作流，不对应真实出版物。'] },
    { page: 2, section: '1 引言与相关工作', text: [`${topic}的实验响应同时受到材料结构、温度与压力的影响。单因素实验难以完整解释耦合机制。`, '现有研究在样品尺寸、加载路径和测量方法上存在差异。因此，本研究采用明确记录边界条件的对照方法，避免将不同条件下的观察直接等同。', '本文的研究范围限于所列实验窗口；更高温度、动态加载及长期循环效应均不在本次实验范围内。'] },
    { page: 3, section: '2 研究方法与实验条件', text: [`研究方法：${method}。${condition}`, `温度范围为 ${temperature}；压力范围为 ${pressure}。测试前进行标定并记录不确定度，异常样本单独复核。`, '每个样本记录制备、预处理、加载过程与采样时间。以下数值为用于交互演示的合成数据。'], table: { headers: ['参数', '数值', '单位'], rows: [['温度范围', temperature, '℃'], ['围压 / 反应压力', pressure, 'MPa'], ['加载速率', '0.5', 'MPa/s'], ['重复次数', '3', '次']] } },
    { page: 4, section: '3 实验结果 · Table 2', text: [`核心观察：${conclusion}`, '表中结果表示当前实验条件下的代表性响应，不能用于推断未测试的温度–压力组合。', '重复实验趋势基本一致，但不同层理方向之间有离散性，需要扩大样本量并进行统计检验。'], table: { headers: ['温度 (℃)', '压力 (MPa)', '响应值 (演示)', '样本数'], rows: [['25', '10', '210', '3'], ['100', '20', '168', '3'], ['150', '30', '132', '3'], ['200', '30', '98', '3']] } },
    { page: 5, section: '4 图表分析 · Figure 6', text: ['Figure 6 展示不同温度下归一化加载响应。曲线用于演示图表提取、证据定位与人工校正。', '对比时需保持试样几何、边界条件与单位一致。局部峰值位置不能单独证明主导机理。', `本图支持的描述性观察：${conclusion}`], figure: true },
    { page: 6, section: '5 讨论、局限与结论', text: [`主要结论：${conclusion}`, '研究局限：样本数量有限，长期循环与多尺度非均质影响仍需验证。', '候选研究空白：在统一样品与加载路径下补充温度–压力联合实验，并检索与本研究观察相反的证据。', '与当前课题的关系应由研究者确认。本地演示数据不可作为正式报告或计算的科学依据。'] },
  ], ...extra };
}

export const LITERATURE: Literature[] = [
  paper(1, '高温高压条件下页岩裂缝扩展的真三轴实验研究', 2025, '真三轴实验', '25–200', '10–30', '温度升高伴随峰值强度降低；高围压下裂缝形态发生变化。'),
  paper(2, '深层页岩热–力耦合破坏机制与参数敏感性', 2024, '热力耦合数值模拟', '25–300', '10–50', '围压抑制张性裂缝扩展，热损伤参数影响局部化位置。', { category: '数值模拟' }),
  paper(3, '层理方向对页岩裂缝扩展路径的影响', 2023, '真三轴实验', '25–150', '5–30', '层理方向与应力差共同控制裂缝转向，温度效应因层理而异。'),
  paper(4, '高温环境下岩石抗压强度实验进展', 2021, '文献综述', '25–600', '0–50', '不同矿物组分和含水状态造成研究结果的差异。', { category: '综述', status: '仅摘要可用', open: false, pages: [] }),
  paper(5, 'CO₂ 加氢制甲醇催化剂活性与稳定性研究', 2026, '固定床实验', '200–280', '3–5', '较高温度提高转化率，同时选择性出现下降趋势。', { institution: '绿色化学研究所', keywords: ['催化剂', 'CO₂', '甲醇', '固定床', '高温', '高压'] }),
  paper(6, '铜基催化剂失活机制及操作窗口对比', 2024, '原位表征', '220–300', '2–6', '粒径增长与活性下降相关，但尚不足以排除表面组分变化的贡献。', { institution: '绿色化学研究所', keywords: ['催化剂', '失活', 'CO₂', '原位表征'] }),
  paper(7, '围压与温度对页岩剪切破坏的协同作用', 2022, '三轴压缩实验', '25–250', '0–40', '在本研究加载路径下，温度对峰值强度的影响弱于围压。', { status: '解析异常', open: true }),
  paper(8, '页岩孔隙结构演化与裂缝连通性', 2026, '微米 CT 扫描', '25–180', '10–35', '孔隙连通性的变化与宏观强度并非一一对应。', { category: '实验研究' }),
  ...['岩石高温高压力学测试方法', '真三轴试验装置与加载要求', '催化剂固定床性能评价规程'].map((title, i): Literature => ({ ...paper(20 + i, title, 2024 + i, i === 2 ? '固定床评价' : '标准化试验', '25–200', '0–50', '测试前应核对仪器校准、样品条件及适用范围。'), id: `demo-std-${i + 1}`, type: '标准', category: i === 1 ? '国际标准' : '行业标准', title: `${i === 1 ? 'ISO DEMO' : 'GB/T DEMO'} ${1001 + i}—${2024 + i} ${title}`, number: `${i === 1 ? 'ISO DEMO' : 'GB/T DEMO'} ${1001 + i}`, standardStatus: i === 2 ? '即将实施' : '演示现行', issuer: i === 1 ? '国际标准组织（模拟）' : '行业标准委员会（模拟）', country: i === 1 ? '国际' : '中国', ics: i === 2 ? '71.100' : '73.020', implementDate: `${2024 + i}-10-01`, journal: '标准演示资料库', citations: 0, doi: '不适用', status: '可研读' })),
];

export function findLiterature(id: string) { return LITERATURE.find(item => item.id === id); }
export const SEARCH_FIELDS = ['主题', '标题', '摘要', '关键词', '作者', '机构', 'DOI', '期刊', '基金', '全文'];
export function fieldText(item: Literature, field: string): string {
  const fields: Record<string, string> = { 标题: `${item.title} ${item.english}`, 摘要: item.abstract, 关键词: item.keywords.join(' '), 作者: item.authors, 机构: item.institution, DOI: item.doi, 期刊: item.journal, 基金: '能源科技研究示范项目', 全文: item.pages.map(p => p.text.join(' ')).join(' ') };
  return (fields[field] ?? `${item.title} ${item.english} ${item.abstract} ${item.keywords.join(' ')} ${item.number ?? ''}`).toLowerCase();
}
export function matchesTerm(item: Literature, field: string, term: string) {
  const synonyms: Record<string, string> = { shale: '页岩', 'fracture propagation': '裂缝扩展', 'high temperature': '高温', 'confining pressure': '围压', 'true triaxial': '真三轴', catalyst: '催化剂' };
  const normalized = term.trim().toLowerCase().replace(/^['"]|['"]$/g, '');
  return !normalized || fieldText(item, field).includes(synonyms[normalized] ?? normalized);
}
export type QueryRow = { field: string; operator: 'AND' | 'OR' | 'NOT'; value: string };
export function matchesAdvanced(item: Literature, rows: QueryRow[]) {
  const filled = rows.filter(row => row.value.trim());
  if (!filled.length) return true;
  const initial = matchesTerm(item, filled[0].field, filled[0].value);
  return filled.slice(1).reduce((result, row) => { const match = matchesTerm(item, row.field, row.value); return row.operator === 'OR' ? result || match : row.operator === 'NOT' ? result && !match : result && match; }, filled[0].operator === 'NOT' ? !initial : initial);
}
export function parseExpression(expression: string): QueryRow[] {
  const tokens = expression.match(/(?:"[^"]+"|[^\s"])+/g) ?? [];
  let operator: QueryRow['operator'] = 'AND';
  return tokens.flatMap(token => { if (['AND', 'OR', 'NOT'].includes(token.toUpperCase())) { operator = token.toUpperCase() as QueryRow['operator']; return []; } const colon = token.indexOf(':'); const row = { operator, field: colon > 0 ? token.slice(0, colon) : '主题', value: colon > 0 ? token.slice(colon + 1) : token }; operator = 'AND'; return [row]; });
}
export function buildLiteratureArtifact(kind: string, items: Literature[], projectName: string): string {
  const heading = `# ${kind}\n\n所属课题：${projectName}\n资料范围：${items.length} 篇 / 项本地演示资料。以下为模拟研究产物，需人工核对。\n\n`;
  if (kind.includes('空白')) return heading + `## 研究空白候选：统一边界下的多因素耦合验证\n现有研究：所选资料采用 ${[...new Set(items.map(item => item.method))].join('、')}，温度与压力窗口并不完全一致。\n缺失证据：同一样品、相同加载路径下的温度–压力联合对照数据。\n现有争议：不同条件下的响应差异尚不能归因于单一因素。\n潜在价值：识别主导因素与模型适用边界。\n验证建议：补充同条件实验，检索反向结论后再形成正式假设。\n\n关联证据：\n${items.map(item => `- ${item.title}：${item.limitation}（${item.status === '仅摘要可用' ? '仅摘要' : 'P6'}）`).join('\n')}\n\n状态：候选 · 证据有限 · 待人工确认`;
  if (kind.includes('重点')) return heading + items.slice().sort((a, b) => b.year - a.year).map((item, index) => `${index + 1}. ${item.title}\n推荐理由：可用于比较${item.method}的条件和结论，发表时间 ${item.year}。\n优先阅读：${item.status === '仅摘要可用' ? '摘要；全文可得性需要核查' : 'P3 方法与 P6 局限'}。`).join('\n\n');
  if (kind.includes('趋势') || kind === '共同结论' || kind.includes('综述')) return heading + `## 研究脉络\n所选资料覆盖 ${Math.min(...items.map(item => item.year))}—${Math.max(...items.map(item => item.year))} 年。研究方法包括 ${[...new Set(items.map(item => item.method))].join('、')}。\n\n## 共同关注\n各资料均强调明确记录实验窗口与边界条件，避免将不同条件下的结果直接合并。\n\n## 观点与差异\n${items.map(item => `- ${item.title}：${item.conclusion}（${item.status === '仅摘要可用' ? '仅摘要' : 'P4'}）`).join('\n')}\n\n## 可继续研究的问题\n现有方法与样品差异可能影响结论。需补充同条件下的对照研究与反向证据；所选少量资料不足以代表全领域发展趋势。`;
  if (kind.includes('参数') || kind.includes('对比') || kind.includes('证据矩阵')) return heading + '| 来源 | 方法 | 温度 (℃) | 压力 (MPa) | 主要观察 | 证据 |\n|---|---|---|---|---|---|\n' + items.map(item => `| ${item.title} | ${item.method} | ${item.status === '仅摘要可用' ? '全文待核验' : item.temperature} | ${item.status === '仅摘要可用' ? '全文待核验' : item.pressure} | ${item.conclusion} | ${item.status === '仅摘要可用' ? '仅摘要' : 'P3 / P4'} |`).join('\n') + '\n\n存在争议：不同方法和边界条件下的结果不可直接合并。研究空白候选：缺少同一样品条件下的耦合对照研究。建议补充反向证据。';
  return heading + items.map(item => `## ${item.title}\n研究问题：热–力 / 反应条件如何影响响应？\n研究对象：${item.keywords[0]}\n研究方法：${item.method}\n实验条件：温度 ${item.temperature} ℃；压力 ${item.pressure} MPa（${item.status === '仅摘要可用' ? '根据摘要，详细条件待核验' : 'P3'}）。\n主要结果与结论：${item.conclusion}（${item.status === '仅摘要可用' ? '仅摘要' : 'P4'}）\n创新点：对指定边界条件下的耦合响应进行对照观察。\n研究局限：${item.limitation}（P6）\n与当前课题关系：可供方法和条件设计参考，相关性需人工确认。\n关键证据：${item.status === '仅摘要可用' ? '仅摘要，不能代表全文结论' : 'P3 研究方法；P4 Table 2；P6 研究局限'}。`).join('\n\n');
}
