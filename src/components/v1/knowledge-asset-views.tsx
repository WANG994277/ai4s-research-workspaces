"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  Database,
  FileText,
  FolderOpen,
  Layers3,
  LayoutGrid,
  LibraryBig,
  List,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { knowledgeView } from "./knowledge-view";
import type { Knowledge } from "./types";
import "./knowledge-asset-views.css";

export type KnowledgeAssetTab = "知识库" | "知识图谱";

type KnowledgeAssetTabsProps = {
  value: KnowledgeAssetTab;
  onChange: (value: KnowledgeAssetTab) => void;
};

export function KnowledgeAssetTabs({ value, onChange }: KnowledgeAssetTabsProps) {
  return (
    <section className="v-knowledge-asset-heading">
      <div>
        <span>知识中心</span>
        <h1>知识资产</h1>
        <p>统一管理可追溯科研知识库与领域概念关系。</p>
      </div>
      <nav className="v-knowledge-asset-tabs" role="tablist" aria-label="知识资产类型">
        {(["知识库", "知识图谱"] as const).map((tab) => {
          const Icon = tab === "知识库" ? Layers3 : Network;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={value === tab}
              className={value === tab ? "selected" : ""}
              onClick={() => onChange(tab)}
              key={tab}
            >
              <Icon size={17} />
              {tab}
            </button>
          );
        })}
      </nav>
    </section>
  );
}

const libraryProfiles: Record<string, {
  description: string;
  owner: string;
  permission: string;
  tags: string[];
}> = {
  "lib-public": {
    description: "汇聚能源地学与油气工程领域的公开论文、专利、标准与数据集。",
    owner: "AI4S 知识运营中心",
    permission: "平台全员可读",
    tags: ["页岩气", "储层评价", "公开资源"],
  },
  "lib-project": {
    description: "围绕页岩气储层评价项目累积的文献、专利、实验记录与阶段成果。",
    owner: "页岩气储层评价项目组",
    permission: "项目成员可读",
    tags: ["储层评价", "岩石力学", "实验证据"],
  },
  "lib-topic": {
    description: "聚焦储层脆性评价课题的指标模型、实验参数、验证记录与决策依据。",
    owner: "储层脆性评价课题组",
    permission: "课题成员可读",
    tags: ["脆性指数", "孔隙度", "渗透率"],
  },
  "lib-mine": {
    description: "个人收藏和整理的油气地学文献、标注、快照与临时研究资料。",
    owner: "林夏",
    permission: "仅本人可读",
    tags: ["油气地学", "个人收藏", "阅读笔记"],
  },
};

const libraryResourceIds: Record<string, string[]> = {
  "lib-public": ["k-paper", "k-patent", "k-standard", "k-dataset"],
  "lib-project": ["k-paper", "k-patent", "k-standard", "k-internal", "k-dataset"],
  "lib-topic": ["k-paper", "k-standard", "k-internal", "k-dataset"],
  "lib-mine": ["k-paper", "k-patent"],
};

const typeIcons: Record<string, ComponentType<{ size?: number }>> = {
  文献: FileText,
  专利: ShieldCheck,
  标准: BookOpenCheck,
  数据集: Database,
  内部资料: FolderOpen,
};

type KnowledgeLibraryViewProps = {
  resources: Knowledge[];
  selectedLibraryId: string;
  onSelectLibrary: (id: string) => void;
  onBack: () => void;
  onOpenResource: (id: string) => void;
  onAddResources: (ids: string[]) => void;
};

export function KnowledgeLibraryView({
  resources,
  selectedLibraryId,
  onSelectLibrary,
  onBack,
  onOpenResource,
  onAddResources,
}: KnowledgeLibraryViewProps) {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("全部");
  const [detailTab, setDetailTab] = useState<"资源内容" | "概览与权限" | "更新记录">("资源内容");
  const libraries = knowledgeView.libraries;
  const selectedLibrary = libraries.find((library) => library.id === selectedLibraryId);
  const selectedProfile = selectedLibrary ? libraryProfiles[selectedLibrary.id] : undefined;
  const filteredLibraries = useMemo(() => libraries.filter((library) => {
    const matchesScope = scope === "全部" || library.scope === scope;
    const text = `${library.name} ${library.discipline} ${library.scope}`.toLowerCase();
    return matchesScope && text.includes(search.trim().toLowerCase());
  }), [libraries, scope, search]);
  const allowedResourceIds = new Set(libraryResourceIds[selectedLibraryId] ?? []);
  const previewResources = resources.filter((resource) => allowedResourceIds.has(resource.id));

  if (selectedLibrary && selectedProfile) {
    return (
      <section className="v-knowledge-library-detail" aria-labelledby="knowledge-library-detail-title">
        <button type="button" className="v-knowledge-library-back" onClick={onBack}>
          <ArrowLeft size={15} />返回知识库列表
        </button>
        <header className="v-knowledge-library-detail-hero">
          <div className="v-knowledge-library-icon"><LibraryBig size={28} /></div>
          <div>
            <span>{selectedLibrary.scope}</span>
            <h2 id="knowledge-library-detail-title">{selectedLibrary.name}</h2>
            <p>{selectedProfile.description}</p>
            <div className="v-knowledge-library-tags">
              {selectedProfile.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </div>
          <button type="button" className="primary" onClick={() => onAddResources(previewResources.map((resource) => resource.id))}>
            <Sparkles size={16} />加入 Research Agent
          </button>
        </header>

        <div className="v-knowledge-library-metrics">
          <article><Layers3 size={19} /><span><strong>{selectedLibrary.resources.toLocaleString()}</strong><small>资源总量</small></span></article>
          <article><Building2 size={19} /><span><strong>{selectedProfile.owner}</strong><small>所属组织</small></span></article>
          <article><ShieldCheck size={19} /><span><strong>{selectedProfile.permission}</strong><small>权限范围</small></span></article>
          <article><CalendarDays size={19} /><span><strong>{selectedLibrary.updatedAt}</strong><small>最近更新</small></span></article>
        </div>

        <div className="v-knowledge-library-content">
          <nav role="tablist" aria-label="知识库详情">
            {(["资源内容", "概览与权限", "更新记录"] as const).map((value) => (
              <button type="button" role="tab" aria-selected={detailTab === value} className={detailTab === value ? "selected" : ""} onClick={() => setDetailTab(value)} key={value}>{value}</button>
            ))}
          </nav>
          {detailTab === "资源内容" ? (
            <div className="v-knowledge-library-resource-list">
              <header><h3>最近收录</h3><span>展示当前账号可读的 {previewResources.length} 项样例资源</span></header>
              {previewResources.map((resource) => {
                const Icon = typeIcons[resource.type] ?? FileText;
                return (
                  <button type="button" onClick={() => onOpenResource(resource.id)} key={resource.id}>
                    <i><Icon size={18} /></i>
                    <span><strong>{resource.name}</strong><small>{resource.description}</small></span>
                    <em>{resource.type}</em>
                    <time>{resource.date}</time>
                    <ChevronRight size={15} />
                  </button>
                );
              })}
            </div>
          ) : detailTab === "概览与权限" ? (
            <div className="v-knowledge-library-info-grid">
              <article><h3>建库目标</h3><p>{selectedProfile.description}</p></article>
              <article><h3>质量规则</h3><p>资源入库时记录来源、版本、可读范围与引用信息，并定期检查失效链接。</p></article>
              <article><h3>访问范围</h3><p>{selectedProfile.permission}。单条资源仍按 Project / Space / ACL 独立校验。</p></article>
            </div>
          ) : (
            <ol className="v-knowledge-library-timeline">
              <li><time>2026-09-29</time><span>完成库内资源来源与权限校验。</span></li>
              <li><time>2026-09-26</time><span>补充实验数据集与标准方法的双向引用。</span></li>
              <li><time>2026-09-24</time><span>初始化知识库结构和学科标签。</span></li>
            </ol>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="v-knowledge-library-view" aria-labelledby="knowledge-library-title">
      <header className="v-knowledge-library-overview">
        <div>
          <span>知识库总览</span>
          <h2 id="knowledge-library-title">让可追溯的科研知识持续沉淀</h2>
          <p>统一管理公共、项目、课题与个人知识，支持文献、专利、标准、数据和内部资料联合组织。</p>
        </div>
        <div className="v-knowledge-library-summary">
          <span><strong>{libraries.length}</strong>个知识库</span>
          <span><strong>{libraries.reduce((total, library) => total + library.resources, 0).toLocaleString()}</strong>项资源</span>
        </div>
      </header>

      <div className="v-knowledge-library-toolbar">
        <label><Search size={17} /><input aria-label="搜索知识库" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索知识库名称、学科或范围" /></label>
        <div role="group" aria-label="知识库范围筛选">
          {["全部", "公共知识库", "项目知识库", "课题知识库", "我的知识库"].map((value) => (
            <button type="button" aria-pressed={scope === value} className={scope === value ? "selected" : ""} onClick={() => setScope(value)} key={value}>{value}</button>
          ))}
        </div>
      </div>

      <div className="v-knowledge-library-grid">
        {filteredLibraries.map((library) => {
          const profile = libraryProfiles[library.id];
          return (
            <article key={library.id}>
              <header><span><BookOpen size={20} /></span><em>{library.scope}</em></header>
              <h3>{library.name}</h3>
              <p>{profile.description}</p>
              <div className="v-knowledge-library-card-tags">{profile.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
              <dl>
                <div><dt>学科</dt><dd>{library.discipline}</dd></div>
                <div><dt>资源数</dt><dd>{library.resources.toLocaleString()}</dd></div>
                <div><dt>更新</dt><dd>{library.updatedAt}</dd></div>
              </dl>
              <button type="button" className="v-knowledge-library-open" onClick={() => onSelectLibrary(library.id)}>
                打开知识库<ChevronRight size={15} />
              </button>
            </article>
          );
        })}
      </div>
      {!filteredLibraries.length && <div className="v-knowledge-library-empty">没有找到匹配的知识库，请调整搜索或范围。</div>}
    </section>
  );
}

export type KnowledgeGraphCatalogItem = {
  id: string;
  name: string;
  description: string;
  discipline: string;
  type: string;
  entities: number;
  relations: number;
  sources: string;
  creator: string;
  updatedAt: string;
  tags: string[];
  tone: string;
};

const graphSeeds = new Map(knowledgeView.graphs.map((graph) => [graph.id, graph]));

export const knowledgeGraphCatalog: KnowledgeGraphCatalogItem[] = [
  {
    id: "graph-shale",
    name: "油气化工领域知识图谱",
    description: "覆盖油气勘探、开发、炼化全产业链的知识体系。",
    discipline: "化学化工",
    type: "行业图谱",
    entities: graphSeeds.get("graph-reservoir")?.entities ?? 128430,
    relations: graphSeeds.get("graph-reservoir")?.relations ?? 356921,
    sources: "论文 · 标准 · 专利",
    creator: "林夏",
    updatedAt: "2026-09-29 14:30",
    tags: ["石油化工", "工艺技术", "设备"],
    tone: "blue",
  },
  {
    id: "graph-catalyst",
    name: "催化材料知识图谱",
    description: "面向催化材料的组成、结构、性能关系知识图谱。",
    discipline: "材料科学",
    type: "专业图谱",
    entities: 98420,
    relations: 212560,
    sources: "论文 · 数据集",
    creator: "王明",
    updatedAt: "2026-09-28 10:12",
    tags: ["催化材料", "纳米材料", "性能"],
    tone: "green",
  },
  {
    id: "graph-material",
    name: "高分子材料知识图谱",
    description: "整合高分子材料的结构、合成方法与应用场景。",
    discipline: "材料科学",
    type: "专业图谱",
    entities: graphSeeds.get("graph-material")?.entities ?? 76312,
    relations: graphSeeds.get("graph-material")?.relations ?? 168905,
    sources: "论文 · 专利 · 标准",
    creator: "张华",
    updatedAt: "2026-09-27 16:18",
    tags: ["高分子", "合成工艺", "应用"],
    tone: "orange",
  },
  {
    id: "graph-process",
    name: "化工工艺知识图谱",
    description: "涵盖化工工艺单元、工艺参数、设备与安全知识。",
    discipline: "化学化工",
    type: "行业图谱",
    entities: 62108,
    relations: 143670,
    sources: "标准 · 文献 · 行业数据",
    creator: "李娜",
    updatedAt: "2026-09-26 11:05",
    tags: ["化工工艺", "工艺参数", "设备"],
    tone: "teal",
  },
  {
    id: "graph-carbon",
    name: "碳中和技术知识图谱",
    description: "围绕碳捕集、利用与封存（CCUS）的技术与应用。",
    discipline: "环境科学",
    type: "专题图谱",
    entities: 54321,
    relations: 129340,
    sources: "论文 · 标准 · 政策",
    creator: "陈强",
    updatedAt: "2026-09-25 09:40",
    tags: ["碳中和", "CCUS", "低碳技术"],
    tone: "indigo",
  },
  {
    id: "graph-energy",
    name: "新能源材料知识图谱",
    description: "覆盖电池材料、氢能材料等新能源领域知识。",
    discipline: "能源科学",
    type: "专业图谱",
    entities: 48906,
    relations: 102330,
    sources: "论文 · 专利 · 数据集",
    creator: "刘洋",
    updatedAt: "2026-09-24 15:26",
    tags: ["新能源", "电池材料", "氢能"],
    tone: "purple",
  },
];

function GraphIdentity({ graph }: { graph: KnowledgeGraphCatalogItem }) {
  return (
    <div className="v-knowledge-graph-identity">
      <i className={`tone-${graph.tone}`}><Network size={22} /></i>
      <span><strong>{graph.name}</strong><small>{graph.description}</small><em>{graph.tags.map((tag) => <b key={tag}>{tag}</b>)}</em></span>
    </div>
  );
}

type KnowledgeGraphCatalogProps = {
  onOpenGraph: (id: string) => void;
  onCreateGraph: () => void;
};

export function KnowledgeGraphCatalog({ onOpenGraph, onCreateGraph }: KnowledgeGraphCatalogProps) {
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("全部");
  const [source, setSource] = useState("全部");
  const [creator, setCreator] = useState("全部");
  const [updated, setUpdated] = useState("全部");
  const [view, setView] = useState<"list" | "cards">("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const filtered = knowledgeGraphCatalog.filter((graph) => {
    const query = search.trim().toLowerCase();
    return (!query || `${graph.name} ${graph.description} ${graph.tags.join(" ")}`.toLowerCase().includes(query))
      && (discipline === "全部" || graph.discipline === discipline)
      && (source === "全部" || graph.sources.includes(source))
      && (creator === "全部" || graph.creator === creator)
      && (updated === "全部" || (updated === "近7天" && graph.updatedAt >= "2026-09-23"));
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="v-knowledge-graph-catalog" aria-labelledby="knowledge-graph-catalog-title">
      <header>
        <div><span>知识图谱</span><h2 id="knowledge-graph-catalog-title">领域知识图谱目录</h2><p>检索、筛选并进入当前权限范围内的行业、专业与专题图谱。</p></div>
        <button type="button" className="v-knowledge-graph-create" onClick={onCreateGraph}><Plus size={17} />新建知识图谱</button>
      </header>
      <div className="v-knowledge-graph-toolbar">
        <label><Search size={17} /><input aria-label="搜索知识图谱" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="搜索知识图谱名称、描述、标签…" /></label>
        <div className="v-knowledge-graph-filters">
          <label><span>学科领域</span><select value={discipline} onChange={(event) => { setDiscipline(event.target.value); setPage(1); }}><option>全部</option>{[...new Set(knowledgeGraphCatalog.map((graph) => graph.discipline))].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>数据来源</span><select value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }}><option>全部</option>{["论文", "专利", "标准", "数据集"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>创建者</span><select value={creator} onChange={(event) => { setCreator(event.target.value); setPage(1); }}><option>全部</option>{knowledgeGraphCatalog.map((graph) => <option key={graph.creator}>{graph.creator}</option>)}</select></label>
          <label><span>更新时间</span><select value={updated} onChange={(event) => { setUpdated(event.target.value); setPage(1); }}><option>全部</option><option>近7天</option></select></label>
        </div>
      </div>
      <div className="v-knowledge-graph-view-switch" role="group" aria-label="图谱展示方式">
        <button type="button" aria-pressed={view === "list"} className={view === "list" ? "selected" : ""} onClick={() => setView("list")}><List size={15} />列表</button>
        <button type="button" aria-pressed={view === "cards"} className={view === "cards" ? "selected" : ""} onClick={() => setView("cards")}><LayoutGrid size={15} />卡片</button>
      </div>
      {view === "list" ? (
        <div className="v-knowledge-graph-table" role="table" aria-label="知识图谱目录" aria-rowcount={filtered.length + 1}>
          <div className="head" role="row"><span role="columnheader">知识图谱名称</span><span role="columnheader">学科领域</span><span role="columnheader">实体数量</span><span role="columnheader">关系数量</span><span role="columnheader">数据来源</span><span role="columnheader">创建者</span><span role="columnheader">更新时间</span><span role="columnheader">操作</span></div>
          {pageItems.map((graph) => (
            <article role="row" key={graph.id}>
              <div role="cell"><GraphIdentity graph={graph} /></div>
              <span role="cell">{graph.discipline}</span><span role="cell">{graph.entities.toLocaleString()}</span><span role="cell">{graph.relations.toLocaleString()}</span><span role="cell">{graph.sources}</span><span role="cell">{graph.creator}</span><time role="cell">{graph.updatedAt}</time>
              <div role="cell"><button type="button" onClick={() => onOpenGraph(graph.id)}>查看</button></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="v-knowledge-graph-card-grid">
          {pageItems.map((graph) => <article key={graph.id}><GraphIdentity graph={graph} /><dl><div><dt>实体</dt><dd>{graph.entities.toLocaleString()}</dd></div><div><dt>关系</dt><dd>{graph.relations.toLocaleString()}</dd></div><div><dt>学科</dt><dd>{graph.discipline}</dd></div></dl><button type="button" onClick={() => onOpenGraph(graph.id)}>查看图谱</button></article>)}
        </div>
      )}
      {!filtered.length && <div className="v-knowledge-library-empty">没有找到匹配的知识图谱。</div>}
      <footer><span>共 {filtered.length} 条记录</span><div><button type="button" aria-label="上一页" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => <button type="button" className={safePage === value ? "selected" : ""} onClick={() => setPage(value)} key={value}>{value}</button>)}<button type="button" aria-label="下一页" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>›</button><select aria-label="每页条数" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={3}>3 条/页</option><option value={6}>6 条/页</option></select></div></footer>
    </section>
  );
}
