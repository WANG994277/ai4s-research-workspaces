export const knowledgeView = {
  primaryTabs: ["知识发现", "知识资产"],
  recentSearches: [
    { query: "新能源轮胎用丁苯橡胶的关键性能指标", time: "10 分钟前" },
    { query: "高性能橡胶低滚阻相关专利", time: "昨天" },
    { query: "白炭黑含量对湿滑性能影响", time: "09-24" },
  ],
  recommendations: [
    {
      id: "k-paper",
      type: "文献",
      name: "高性能弹性体结构设计的新方法",
      source: "Nature Materials · 2026",
    },
    {
      id: "k-patent",
      type: "专利",
      name: "一种低滚阻高耐磨丁苯橡胶及其制备方法",
      source: "CNXXXXXXXX · 2026",
    },
  ],
  libraries: [
    { id: "lib-public", name: "能源地学公共知识库", discipline: "地球科学", resources: 12860, scope: "公共知识库", updatedAt: "今天 09:30" },
    { id: "lib-project", name: "页岩气储层评价项目知识库", discipline: "地球科学", resources: 2846, scope: "项目知识库", updatedAt: "今天 09:12" },
    { id: "lib-topic", name: "储层脆性评价课题知识库", discipline: "地球科学", resources: 968, scope: "课题知识库", updatedAt: "昨天 18:20" },
    { id: "lib-mine", name: "林夏的油气研究资料集", discipline: "地球科学", resources: 126, scope: "我的知识库", updatedAt: "09-24" },
  ],
  graphs: [
    { id: "graph-rubber", name: "高性能橡胶配方图谱", discipline: "材料科学", type: "业务图谱", entities: 2846, relations: 7932, scope: "配方优化课题" },
    { id: "graph-shale", name: "页岩气储层评价图谱", discipline: "地球科学", type: "业务图谱", entities: 4218, relations: 12642, scope: "页岩气评价项目" },
    { id: "graph-material", name: "材料结构—性能图谱", discipline: "材料科学", type: "专业图谱", entities: 8150, relations: 24360, scope: "全平台" },
    { id: "graph-reservoir", name: "油气藏知识图谱", discipline: "地球科学", type: "专业图谱", entities: 6920, relations: 18540, scope: "全平台" },
  ],
} as const;
